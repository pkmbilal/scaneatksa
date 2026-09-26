-- Fix 1 of the 2026-09-26 production audit (SEC-1, SEC-2, SEC-3).
--
-- RLS policies scope *which rows* a user may write, but `authenticated` holds
-- UPDATE on every column, so a policy's WITH CHECK was the only thing
-- limiting *which columns* change. That let:
--   * any user set their own user_profiles.restaurant_id / is_active
--     (and, via orders_staff_read, read every order of any restaurant),
--   * owners edit their own subscription / approval columns,
--   * any user insert an already-approved restaurant.
--
-- Guard triggers (rather than column grants) keep the admin dashboard's
-- direct client writes working: admins and server-side service-role writes
-- pass, everyone else can't touch the protected columns.

-- True for writes that are allowed to change protected columns: anything not
-- running as the PostgREST end-user roles (service_role from API routes,
-- postgres / security-definer functions), or an active admin.
create or replace function public.is_privileged_writer()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user not in ('authenticated', 'anon') or public.is_admin();
$$;

-- user_profiles: users may edit their own name/phone/avatar, never their
-- role, restaurant assignment, or active flag.
create or replace function public.user_profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.restaurant_id is distinct from old.restaurant_id
     or new.is_active is distinct from old.is_active then
    raise exception 'Not allowed to change role, restaurant_id or is_active'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists user_profiles_guard on public.user_profiles;
create trigger user_profiles_guard
  before update on public.user_profiles
  for each row execute function public.user_profiles_guard();

-- restaurants: owners may edit their listing details and open/closed
-- (is_active) toggle, never ownership, slug, approval or subscription state.
-- Admin "disable" is subscription_status = 'suspended', which is protected.
create or replace function public.restaurants_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if new.owner_id is distinct from old.owner_id
     or new.owner_email is distinct from old.owner_email
     or new.slug is distinct from old.slug
     or new.approved_at is distinct from old.approved_at
     or new.subscription_status is distinct from old.subscription_status
     or new.subscription_started_at is distinct from old.subscription_started_at
     or new.subscription_expires_at is distinct from old.subscription_expires_at
     or new.subscription_notes is distinct from old.subscription_notes
     or new.trial_used is distinct from old.trial_used then
    raise exception 'Not allowed to change ownership, approval or subscription fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists restaurants_guard on public.restaurants;
create trigger restaurants_guard
  before update on public.restaurants
  for each row execute function public.restaurants_guard();

-- Restaurants are only created by the admin approval flow
-- (restaurants_admin_all); self-service inserts bypassed review and billing.
drop policy if exists restaurants_owner_insert_own on public.restaurants;

-- Staff read of a restaurant's orders now requires an active kitchen/waiter
-- account -- a restaurant_id alone is no longer enough.
drop policy if exists orders_staff_read on public.orders;
create policy orders_staff_read on public.orders
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = (select auth.uid())
        and up.role in ('kitchen', 'waiter')
        and coalesce(up.is_active, true)
        and up.restaurant_id = orders.restaurant_id
    )
  );

-- Same rule as before, with auth.uid() wrapped so it's evaluated once per
-- statement instead of per row (advisor auth_rls_initplan).
drop policy if exists user_profiles_update_own on public.user_profiles;
create policy user_profiles_update_own on public.user_profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (select up2.role from public.user_profiles up2 where up2.id = (select auth.uid()))
  );
