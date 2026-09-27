import { describe, it, expect, vi } from "vitest";
import { applyOrderEvent, byCreatedAsc, byCreatedDesc, removeOrder, upsertOrder } from "./orderRealtime.js";

const o = (id, created_at, extra = {}) => ({ id, created_at, status: "new", ...extra });

describe("upsertOrder", () => {
  it("merges an update into the existing entry, keeping embeds", () => {
    const list = [o("a", "2026-09-26T10:00:00Z", { order_items: [{ id: "i1" }], restaurant_tables: { table_number: 3 } })];

    const next = upsertOrder(list, { id: "a", created_at: "2026-09-26T10:00:00Z", status: "preparing" });

    expect(next[0].status).toBe("preparing");
    expect(next[0].order_items).toEqual([{ id: "i1" }]);
    expect(next[0].restaurant_tables).toEqual({ table_number: 3 });
  });

  it("removes an order that no longer fits the queue", () => {
    const keep = (x) => ["new", "preparing"].includes(x.status);
    const list = [o("a", "2026-09-26T10:00:00Z", { status: "preparing" })];

    expect(upsertOrder(list, { ...list[0], status: "ready" }, { keep })).toEqual([]);
  });

  it("ignores an order the queue never had and doesn't keep", () => {
    const list = [o("a", "2026-09-26T10:00:00Z")];
    const keep = (x) => x.status === "new";

    expect(upsertOrder(list, o("b", "2026-09-26T11:00:00Z", { status: "ready" }), { keep })).toBe(list);
  });

  it("inserts in sort order and respects the limit", () => {
    const list = [o("a", "2026-09-26T10:00:00Z"), o("b", "2026-09-26T09:00:00Z")];

    const desc = upsertOrder(list, o("c", "2026-09-26T11:00:00Z"), { compare: byCreatedDesc, limit: 2 });
    expect(desc.map((x) => x.id)).toEqual(["c", "a"]);

    const asc = upsertOrder(list, o("c", "2026-09-26T09:30:00Z"), { compare: byCreatedAsc });
    expect(asc.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("is idempotent -- the realtime echo of our own update changes nothing", () => {
    const list = [o("a", "2026-09-26T10:00:00Z")];
    const update = { id: "a", created_at: "2026-09-26T10:00:00Z", status: "preparing" };

    const once = upsertOrder(list, update);
    expect(upsertOrder(once, update)).toEqual(once);
  });
});

describe("removeOrder", () => {
  it("removes by id and returns the same list when absent", () => {
    const list = [o("a", "2026-09-26T10:00:00Z")];
    expect(removeOrder(list, "a")).toEqual([]);
    expect(removeOrder(list, "zzz")).toBe(list);
  });
});

describe("applyOrderEvent", () => {
  // Minimal useState stand-in: setOrders(updater) applies to `state.list`.
  function harness(initial) {
    const state = { list: initial };
    const ordersRef = { current: initial };
    const setOrders = (updater) => {
      state.list = updater(state.list);
      ordersRef.current = state.list;
    };
    return { state, ordersRef, setOrders };
  }

  it("fetches only the new order on INSERT", async () => {
    const h = harness([o("a", "2026-09-26T10:00:00Z")]);
    const fetchOrder = vi.fn().mockResolvedValue(o("b", "2026-09-26T11:00:00Z", { order_items: [] }));

    await applyOrderEvent({ eventType: "INSERT", new: o("b", "2026-09-26T11:00:00Z") }, { ...h, fetchOrder });

    expect(fetchOrder).toHaveBeenCalledWith("b");
    expect(h.state.list.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("patches a listed order on UPDATE without fetching", async () => {
    const h = harness([o("a", "2026-09-26T10:00:00Z", { order_items: [{ id: "i1" }] })]);
    const fetchOrder = vi.fn();

    await applyOrderEvent(
      { eventType: "UPDATE", new: { id: "a", created_at: "2026-09-26T10:00:00Z", status: "ready" } },
      { ...h, fetchOrder }
    );

    expect(fetchOrder).not.toHaveBeenCalled();
    expect(h.state.list[0]).toMatchObject({ status: "ready", order_items: [{ id: "i1" }] });
  });

  it("fetches an order that enters the queue via UPDATE (waiter: preparing -> ready)", async () => {
    const keep = (x) => x.status === "ready";
    const h = harness([]);
    const fetchOrder = vi.fn().mockResolvedValue(o("a", "2026-09-26T10:00:00Z", { status: "ready", restaurant_tables: null }));

    await applyOrderEvent(
      { eventType: "UPDATE", new: o("a", "2026-09-26T10:00:00Z", { status: "ready" }) },
      { ...h, fetchOrder, keep, compare: byCreatedAsc }
    );

    expect(fetchOrder).toHaveBeenCalledWith("a");
    expect(h.state.list).toHaveLength(1);
  });

  it("ignores an UPDATE for an order outside the queue", async () => {
    const keep = (x) => x.status === "ready";
    const h = harness([]);
    const fetchOrder = vi.fn();

    await applyOrderEvent({ eventType: "UPDATE", new: o("a", "2026-09-26T10:00:00Z", { status: "new" }) }, { ...h, fetchOrder, keep });

    expect(fetchOrder).not.toHaveBeenCalled();
    expect(h.state.list).toEqual([]);
  });

  it("removes the order on DELETE", async () => {
    const h = harness([o("a", "2026-09-26T10:00:00Z")]);

    await applyOrderEvent({ eventType: "DELETE", old: { id: "a" } }, { ...h, fetchOrder: vi.fn() });

    expect(h.state.list).toEqual([]);
  });
});
