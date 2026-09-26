-- Fix 8 of the 2026-09-26 production audit (SEC-7 + Phase 3 RLS perf):
-- clears the remaining Supabase advisor findings. No behavior change for
-- legitimate use; removes leftover exposure and per-row auth.uid() calls.

-- 1. The veg/non-veg flags view ran as its owner, ignoring RLS -- so it
--    exposed flags for unapproved/suspended restaurants too.
alter view public.restaurant_menu_flags set (security_invoker = true);

-- 2. One public-read policy for restaurants. restaurants_read_active_public
--    (anon + authenticated) didn't require approved_at, so any signed-in user
--    could read an unapproved restaurant's full row. Same rule as
--    is_restaurant_published(), inlined so it stays index-friendly. Owners
--    and admins keep their own policies.
drop policy if exists restaurants_read_active_public on public.restaurants;
drop policy if exists guest_read_published_restaurants on public.restaurants;
create policy restaurants_read_published on public.restaurants
  for select to anon, authenticated
  using (
    approved_at is not null
    and coalesce(is_active, false)
    and coalesce(subscription_status, 'trial') <> 'suspended'
    and (subscription_expires_at is null or subscription_expires_at > now() - interval '7 days')
  );

-- 3. handle_new_user is a trigger function (triggers don't need EXECUTE);
--    it must not be callable via /rest/v1/rpc. is_admin() is needed by every
--    admin policy (authenticated) and by is_privileged_writer() (service_role
--    writes), never by anon.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- 4. subscription_events policies targeted `public` (every role); only
--    signed-in admins/owners ever use them.
drop policy if exists subscription_events_admin_all on public.subscription_events;
create policy subscription_events_admin_all on public.subscription_events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists subscription_events_owner_insert_renewal on public.subscription_events;
create policy subscription_events_owner_insert_renewal on public.subscription_events
  for insert to authenticated
  with check (action = 'renewalRequested' and public.owns_restaurant(restaurant_id));

drop policy if exists subscription_events_owner_read_own on public.subscription_events;
create policy subscription_events_owner_read_own on public.subscription_events
  for select to authenticated
  using (public.owns_restaurant(restaurant_id));

-- 5. Pin search_path on the remaining functions (bodies are already
--    schema-qualified; now() resolves via pg_catalog).
alter function public.set_updated_at() set search_path = '';
alter function public.owns_restaurant(uuid) set search_path = '';
alter function public.can_view_restaurant(uuid) set search_path = '';
alter function public.handle_new_user() set search_path = '';

-- 6. (select auth.uid()) instead of auth.uid(): evaluated once per statement
--    rather than per row (advisor auth_rls_initplan). Logic unchanged.
--    NOTE: the user_profiles_read_own change below broke user_profiles
--    UPDATEs (policy recursion) and was reverted by
--    20260926174757_revert_user_profiles_read_own_initplan.sql.
drop policy if exists user_profiles_read_own on public.user_profiles;
create policy user_profiles_read_own on public.user_profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists favorites_select_own on public.favorite_restaurants;
create policy favorites_select_own on public.favorite_restaurants
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists favorites_insert_own on public.favorite_restaurants;
create policy favorites_insert_own on public.favorite_restaurants
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists favorites_delete_own on public.favorite_restaurants;
create policy favorites_delete_own on public.favorite_restaurants
  for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists orders_read_own on public.orders;
create policy orders_read_own on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists order_items_customer_read on public.order_items;
create policy order_items_customer_read on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));

drop policy if exists restaurant_requests_insert_own on public.restaurant_requests;
create policy restaurant_requests_insert_own on public.restaurant_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists restaurant_requests_read_own on public.restaurant_requests;
create policy restaurant_requests_read_own on public.restaurant_requests
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists restaurants_owner_read_own on public.restaurants;
create policy restaurants_owner_read_own on public.restaurants
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists restaurants_owner_update_own on public.restaurants;
create policy restaurants_owner_update_own on public.restaurants
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists review_replies_owner_insert on public.review_replies;
create policy review_replies_owner_insert on public.review_replies
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.reviews r
      where r.id = review_replies.review_id and public.owns_restaurant(r.restaurant_id)
    )
  );

drop policy if exists review_replies_owner_update on public.review_replies;
create policy review_replies_owner_update on public.review_replies
  for update to authenticated
  using (exists (
    select 1 from public.reviews r
    where r.id = review_replies.review_id and public.owns_restaurant(r.restaurant_id)
  ))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.reviews r
      where r.id = review_replies.review_id and public.owns_restaurant(r.restaurant_id)
    )
  );
