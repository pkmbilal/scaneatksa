-- Fix 9c follow-up: admins had no read access to menu_items (only the owner
-- policy and an anon-only public policy), so the admin Restaurants tab's
-- per-restaurant menu item count was always 0. Read-only -- admins still
-- can't edit other restaurants' menus.
create policy menu_items_admin_read on public.menu_items
  for select to authenticated
  using (public.is_admin());
