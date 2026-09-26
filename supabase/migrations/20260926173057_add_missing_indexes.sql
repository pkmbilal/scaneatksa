-- Fix 7 of the 2026-09-26 production audit (Phase 3 indexes).
--
-- orders / order_items had only primary keys, so every dashboard query,
-- realtime RLS check and order_items embed seq-scanned the platform-wide
-- tables. Plain CREATE INDEX (not CONCURRENTLY) because apply_migration runs
-- in a transaction and the tables were tiny when this ran; at scale, build
-- new indexes CONCURRENTLY outside a transaction instead.

-- Query-driven:
-- owner orders list / kitchen+waiter queues / analytics ranges, the
-- orders_owner_read + orders_staff_read RLS, realtime restaurant_id filter
create index if not exists orders_restaurant_id_created_at_idx on public.orders (restaurant_id, created_at desc);
-- customer orders list, orders_read_own RLS, realtime user_id filter,
-- reviews_insert_own purchase check
create index if not exists orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
-- table delete "has orders?" count + FK
create index if not exists orders_table_id_idx on public.orders (table_id);
-- every order_items embed, order_items_*_read RLS EXISTS, submit_review, FK cascade
create index if not exists order_items_order_id_idx on public.order_items (order_id);
-- /api/staff list, orders_staff_read subquery, FK
create index if not exists user_profiles_restaurant_id_idx on public.user_profiles (restaurant_id);

-- Remaining unindexed foreign keys (advisor 0001): without these, deleting
-- the parent row (menu item, category, restaurant, order, user) scans the
-- child table.
create index if not exists order_items_menu_item_id_idx on public.order_items (menu_item_id);
create index if not exists menu_items_category_id_idx on public.menu_items (category_id);
create index if not exists favorite_restaurants_restaurant_id_idx on public.favorite_restaurants (restaurant_id);
create index if not exists reviews_order_id_idx on public.reviews (order_id);
create index if not exists reviews_menu_item_id_idx on public.reviews (menu_item_id);
create index if not exists review_replies_owner_id_idx on public.review_replies (owner_id);
create index if not exists subscription_events_actor_id_idx on public.subscription_events (actor_id);
create index if not exists restaurant_requests_reviewed_by_idx on public.restaurant_requests (reviewed_by);
