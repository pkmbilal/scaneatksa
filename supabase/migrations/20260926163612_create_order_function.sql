-- Fix 3 of the 2026-09-26 production audit (P0 #4 / REL-1).
--
-- Order creation in one transaction. /api/orders used to run as service role
-- (bypassing the RLS that hides unpublished/suspended/expired restaurants),
-- trusted client quantities, and inserted orders and order_items in two
-- separate calls -- so a failure could leave an item-less order in the
-- kitchen's realtime queue.
--
-- Only service_role may execute this (the API route), so p_user_id -- resolved
-- by the route from the caller's Bearer token -- can be trusted. Failures
-- raise P0001 with a machine-readable key the route maps to a user message.

create or replace function public.create_order(
  p_restaurant_slug text,
  p_channel text,
  p_table_code text,
  p_items jsonb,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text,
  p_notes text,
  p_user_id uuid
)
returns table (order_id uuid, table_number int)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_restaurant record;
  v_table_id uuid;
  v_table_number int;
  v_item_count int;
  v_bad_name text;
  v_total numeric;
  v_order_id uuid;
begin
  if p_channel is null or p_channel not in ('dine_in', 'pickup', 'delivery') then
    raise exception 'invalid_channel';
  end if;

  select r.id, r.pickup_available, r.delivery_available
    into v_restaurant
  from public.restaurants r
  where r.slug = p_restaurant_slug;

  if v_restaurant.id is null or not public.is_restaurant_published(v_restaurant.id) then
    raise exception 'restaurant_unavailable';
  end if;

  if (p_channel = 'pickup' and not coalesce(v_restaurant.pickup_available, false))
     or (p_channel = 'delivery' and not coalesce(v_restaurant.delivery_available, false)) then
    raise exception 'channel_unavailable';
  end if;

  if p_channel = 'dine_in' then
    select t.id, t.table_number
      into v_table_id, v_table_number
    from public.restaurant_tables t
    where t.restaurant_id = v_restaurant.id
      and t.code = p_table_code
      and t.is_active = true;

    if v_table_id is null then
      raise exception 'invalid_table';
    end if;
  end if;

  -- Items: a 1..100-element array of {id: uuid, quantity: integer 1..99}.
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_cart';
  end if;

  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 100 then
    raise exception 'invalid_cart';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where jsonb_typeof(e) <> 'object'
       or jsonb_typeof(e -> 'id') is distinct from 'string'
       or (e ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) then
    raise exception 'invalid_cart';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) e
    -- CASE (not OR) so the numeric cast only runs on actual JSON numbers.
    where case
      when jsonb_typeof(e -> 'quantity') = 'number' then
        (e ->> 'quantity')::numeric <> trunc((e ->> 'quantity')::numeric)
        or (e ->> 'quantity')::numeric not between 1 and 99
      else true
    end
  ) then
    raise exception 'invalid_quantity';
  end if;

  if (select count(distinct (e ->> 'id')::uuid) from jsonb_array_elements(p_items) e) <> v_item_count then
    raise exception 'duplicate_item';
  end if;

  -- Every item must belong to this restaurant and be orderable right now.
  select coalesce(mi.name, '')
    into v_bad_name
  from jsonb_array_elements(p_items) e
  left join public.menu_items mi
    on mi.id = (e ->> 'id')::uuid
   and mi.restaurant_id = v_restaurant.id
  where mi.id is null
     or mi.is_available is not true
     or mi.is_sold_out is true
  limit 1;

  if found then
    raise exception 'item_unavailable:%', v_bad_name;
  end if;

  select sum(mi.price * (e ->> 'quantity')::int)
    into v_total
  from jsonb_array_elements(p_items) e
  join public.menu_items mi on mi.id = (e ->> 'id')::uuid;

  insert into public.orders (
    restaurant_id, channel, table_id, total,
    customer_name, customer_phone, delivery_address, notes, user_id
  )
  values (
    v_restaurant.id, p_channel, v_table_id, v_total,
    nullif(p_customer_name, ''), nullif(p_customer_phone, ''),
    case when p_channel = 'delivery' then nullif(p_delivery_address, '') end,
    nullif(p_notes, ''), p_user_id
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, menu_item_id, name, price, quantity)
  select v_order_id, mi.id, mi.name, mi.price, (e ->> 'quantity')::int
  from jsonb_array_elements(p_items) e
  join public.menu_items mi on mi.id = (e ->> 'id')::uuid;

  return query select v_order_id, v_table_number;
end;
$$;

revoke execute on function public.create_order(text, text, text, jsonb, text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_order(text, text, text, jsonb, text, text, text, text, uuid)
  to service_role;
