// Keeps a dashboard's order list in sync from Supabase Realtime payloads
// instead of refetching the whole list on every change. Shared by the owner,
// kitchen and waiter dashboards (via useRestaurantOrdersRealtime).
//
// Realtime payloads carry the full new row (payload.new) but no embeds
// (restaurant_tables, order_items), so updates merge into the existing entry
// to keep them; only orders that aren't listed yet are fetched, one by one.

export const byCreatedDesc = (a, b) => new Date(b.created_at) - new Date(a.created_at);
export const byCreatedAsc = (a, b) => new Date(a.created_at) - new Date(b.created_at);

// Returns a new list with `order` merged in (or added), or removed if it no
// longer passes `keep` -- e.g. an order leaving the kitchen queue once ready.
export function upsertOrder(list, order, { keep = () => true, compare = byCreatedDesc, limit } = {}) {
  if (!order?.id) return list;

  const index = list.findIndex((o) => o.id === order.id);
  if (!keep(order)) return index === -1 ? list : list.filter((o) => o.id !== order.id);

  const next = index === -1 ? [...list, order] : list.map((o, i) => (i === index ? { ...o, ...order } : o));
  next.sort(compare);
  return limit ? next.slice(0, limit) : next;
}

export function removeOrder(list, id) {
  return list.some((o) => o.id === id) ? list.filter((o) => o.id !== id) : list;
}

// Applies one realtime postgres_changes payload to a page's order list.
// `ordersRef` mirrors the current list (to know whether an order is already
// shown without a stale closure); `fetchOrder(id)` loads one order with the
// page's embeds when it isn't.
export async function applyOrderEvent(payload, { setOrders, ordersRef, fetchOrder, ...opts }) {
  const keep = opts.keep || (() => true);

  if (payload.eventType === "DELETE") {
    const id = payload.old?.id;
    if (id) setOrders((prev) => removeOrder(prev, id));
    return;
  }

  const row = payload.new;
  if (!row?.id) return;

  const listed = ordersRef.current?.some((o) => o.id === row.id);
  if (!listed && keep(row)) {
    const fetched = await fetchOrder(row.id);
    if (fetched) setOrders((prev) => upsertOrder(prev, fetched, opts));
    return;
  }

  setOrders((prev) => upsertOrder(prev, row, opts));
}
