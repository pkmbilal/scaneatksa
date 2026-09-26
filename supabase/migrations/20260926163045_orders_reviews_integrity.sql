-- Fix 2 of the 2026-09-26 production audit (SEC-4).
--
-- * orders_insert_auth let any signed-in user insert an order straight
--   through PostgREST with a client-chosen total/status (e.g. 'completed'),
--   which reviews_insert_own then accepted as a verified purchase.
-- * reviews_insert_own also accepted order_id IS NULL (no purchase at all).
-- * reviews_update_own only pinned user_id, so reviewer_name / restaurant_id /
--   order_id / menu_item_id could be rewritten after the fact.
--
-- Orders are created only by /api/orders (service role). Reviews are written
-- only through submit_review() (SECURITY INVOKER, so these policies and the
-- guard trigger still apply to it).

drop policy if exists orders_insert_auth on public.orders;

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.can_view_restaurant(restaurant_id)
    and order_id is not null
    and exists (
      select 1 from public.orders o
      where o.id = reviews.order_id
        and o.user_id = (select auth.uid())
        and o.restaurant_id = reviews.restaurant_id
        and o.status in ('delivered', 'completed')
    )
  );

drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own on public.reviews
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- End users can't choose reviewer_name (it's snapshotted from their own
-- profile, as submit_review already does) and can only change rating/comment
-- on an existing review -- never which restaurant/order/item it's about.
create or replace function public.reviews_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'UPDATE' and (
       new.user_id is distinct from old.user_id
       or new.restaurant_id is distinct from old.restaurant_id
       or new.order_id is distinct from old.order_id
       or new.menu_item_id is distinct from old.menu_item_id
     ) then
    raise exception 'Only rating and comment can be changed on a review'
      using errcode = '42501';
  end if;

  select up.full_name into new.reviewer_name
  from public.user_profiles up
  where up.id = (select auth.uid());

  return new;
end;
$$;

drop trigger if exists reviews_guard on public.reviews;
create trigger reviews_guard
  before insert or update on public.reviews
  for each row execute function public.reviews_guard();
