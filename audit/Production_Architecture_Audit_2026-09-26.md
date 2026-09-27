# ScanEat KSA — Production Architecture Audit

**Date:** 2026-09-26 · **Scope:** full repository (`master` @ `e32f43e`) + live Supabase project `zldcwfextifsbiqtvzpv` (read-only inspection of RLS policies, column grants, triggers, functions, constraints, indexes, advisors, row counts) + `npm audit`.
**Method:** No files were modified and no writes were made against the database. Every finding below cites a file/line or a live database object. Items that could not be verified from the repo are marked **Cannot verify from codebase**.

**Current data volume (live):** 4 restaurants · 12 orders · 15 order_items · 27 menu_items · 23 users · 0 reviews. Nothing below is a *current* performance emergency — the security findings are, because they are exploitable today by any signed-up user.

> **Status update (2026-09-27):**
> - All P0 and P1 findings, and most P2s, have been fixed on branch `audit`. See [Remediation status](#remediation-status-2026-09-27) at the end of this report.
> - The database changes are **already live**. The application code reaches production once `audit` is merged to `master`.
> - The findings below are kept as the original audit record.

---

## Executive summary

The application layer is thoughtfully written in many places (server-side price recomputation, R2 upload namespacing, signed `ContentLength`, a single status-transition gate). The problems are concentrated in **database authorization**: RLS policies check *which row* a user may touch but never *which columns*, and the `authenticated` role has table-wide INSERT/UPDATE grants with no guard triggers. As a result, any signed-up customer can currently:

1. read every order (names, phone numbers, delivery addresses) of any restaurant,
2. — as an owner — extend their own subscription forever / un-suspend themselves,
3. create an already-approved, unlimited-subscription restaurant without admin review,
4. fabricate "completed" orders and post "verified" reviews on any restaurant.

Separately, `POST /api/orders` runs with the service-role key and skips the published/subscription checks that RLS would have enforced, accepts negative quantities, and is not transactional. And `next@16.1.6` has a **critical** advisory set in `npm audit`.

These are all fixable in days, not weeks, and should be fixed before real traffic.

---

# Phase 1 — Architecture

| Aspect | Finding |
|---|---|
| Framework | Next.js **16.1.6** App Router, React 19.2, React Compiler (`next.config.mjs`), plain JavaScript |
| Frontend | Public pages are Server Components (`app/page.js`, `app/menu/[restaurantSlug]/page.js`, `app/restaurants/page.js`); **all dashboards are `"use client"`** pages that query Supabase directly from the browser |
| Backend / API | 9 Route Handlers under `app/api/**`. No Server Actions. No Edge Functions. |
| Middleware | `proxy.js` (Next 16 proxy) — locale rewrite/redirect only, scoped matcher; no auth |
| Database | Supabase Postgres, accessed through `@supabase/supabase-js` / PostgREST. No ORM. |
| Auth | Supabase Auth (email+password). Browser session via `@supabase/ssr` `createBrowserClient` (`lib/supabase/client.js`). Route handlers verify a `Bearer` access token with `auth.getUser()`. **No server-side session/cookie auth** — dashboards gate by role in client code only; RLS is the real boundary. |
| RBAC | `user_profiles.role` ∈ customer/owner/admin/kitchen/waiter; `is_admin()` SECURITY DEFINER helper; `owns_restaurant()`, `can_view_restaurant()` → `is_restaurant_published()` |
| Supabase services | Postgres, Auth, Realtime (`orders`, `subscription_events` in `supabase_realtime`). **Storage not used.** |
| Storage | Cloudflare R2 via presigned PUT (`app/api/uploads/presign/route.js`, `lib/r2/*`), public bucket URL `NEXT_PUBLIC_R2_PUBLIC_URL` |
| External | Google Analytics 4 (`@next/third-parties`, `app/layout.js:114`), WhatsApp `wa.me` deep links (no API) |
| Background jobs / cron | None. Subscription expiry is evaluated live in SQL (`is_restaurant_published`). |
| Caching | Effectively none: `i18n/request.js:54-55` reads `headers()`/`cookies()` → every route is dynamic. Only `app/sitemap.js` sets `revalidate = 3600`. React `cache()` dedupes the menu-page restaurant fetch. |
| State | React state + two contexts (`app/CartContext.js`, `context/*`); cart in localStorage |
| Deployment | Vercel implied (README / `.vercel` in `.gitignore`); **no `vercel.json`**; **no migrations directory** — schema lives only in the live project |
| Env vars | `.env.example`: `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_*`, `NEXT_PUBLIC_R2_PUBLIC_URL`. Prefixing is correct — no secret is `NEXT_PUBLIC_`. |

```
Browser (customer / owner / kitchen / waiter / admin)
  │  ├─ Public pages (RSC, dynamic every request) ──► supabaseServer() anon client ──► Postgres (RLS: anon)
  │  ├─ Dashboards ("use client") ──► supabase-js w/ user JWT ──► PostgREST ──► Postgres (RLS: authenticated)
  │  │                              └─► Realtime websocket (orders, subscription_events)
  │  ├─ fetch /api/* (Bearer JWT) ──► Vercel Node functions ──► supabaseAdmin (SERVICE ROLE, bypasses RLS)
  │  │                                                          └─► auth.admin.createUser (staff)
  │  ├─ fetch /api/uploads/presign ──► presigned URL ──► browser PUT directly to Cloudflare R2
  │  └─ GA4 script, wa.me links (client-only)
  └─ proxy.js (locale only) runs on public routes before the above
```

---

# Phase 2 — Security

## 2.1 Authorization / RLS (the core problem)

Live `information_schema.column_privileges` shows `authenticated` holds **INSERT and UPDATE on every column** of `restaurants`, `user_profiles`, `orders`, `reviews`, `order_items`, `subscription_events`. The only trigger in `public`/`auth` is `on_auth_user_created → handle_new_user()`. So a policy's `WITH CHECK` is the *only* thing constraining what values a user can write.

### SEC-1 (P0) Any user can join any restaurant's staff scope and read all its orders + customer PII
- **Evidence:** policy `user_profiles_update_own`: `USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND role = (select role …))` — `role` is pinned, **`restaurant_id` and `is_active` are not**. Policy `orders_staff_read`: `USING (restaurant_id = (SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()))` — it does **not** check the role.
- **Exploit shape:** a customer runs `supabase.from('user_profiles').update({ restaurant_id: '<target>' }).eq('id', me)` from devtools, then `select * from orders` → every order of that restaurant (customer_name, customer_phone, delivery_address, notes). Realtime postgres_changes delivers new ones live. Restaurant IDs are public (listing pages / menu data).
- **Fix:** restrict the update policy / grants: `REVOKE UPDATE ON user_profiles FROM authenticated; GRANT UPDATE (full_name, phone, avatar_url) ON user_profiles TO authenticated;` and make `orders_staff_read` also require `role IN ('kitchen','waiter') AND coalesce(is_active,true)`.

### SEC-2 (P0) Owners can extend / un-suspend / self-approve their own restaurant
- **Evidence:** `restaurants_owner_update_own`: `USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())`, with UPDATE granted on `subscription_status, subscription_expires_at, approved_at, is_active, trial_used, owner_id…`.
- **Scenario:** an owner whose trial expired runs `update({ subscription_expires_at: null })` → "unlimited", live forever. They can likewise set `subscription_status='active'`, re-enable `is_active` after an admin disable, or set `approved_at`. (`owner_id` itself is pinned to self by WITH CHECK.)
- **Fix:** column-level grants: revoke table UPDATE, grant UPDATE only on owner-editable columns (`name, address, city, phone, image_url, pickup_available, delivery_available, price_level, slug?`). Admin writes continue to work via `restaurants_admin_all` only if admin writes go through a SECURITY DEFINER RPC or a server route with the service role — column grants apply to the `authenticated` role regardless of policy. Recommended: move admin subscription/approval changes to a server route (`/api/admin/restaurants/[id]`) that checks `is_admin` and uses `supabaseAdmin`, or a `BEFORE UPDATE` trigger that rejects changes to protected columns unless `is_admin()`.

### SEC-3 (P0) Any signed-in user can create a live, approved, unlimited restaurant
- **Evidence:** `restaurants_owner_insert_own`: `WITH CHECK (owner_id = auth.uid())` only; INSERT granted on `approved_at`, `subscription_*`, `is_active`. `is_restaurant_published()` treats `subscription_expires_at IS NULL` as unlimited.
- **Scenario:** a customer inserts `{ owner_id: me, name, slug, approved_at: now(), is_active: true }` → appears on `/restaurants`, gets a menu page, accepts orders — bypassing `restaurant_requests` approval and billing.
- **Fix:** drop this policy entirely (restaurants are created by the admin approval flow, `app/dashboard/admin/page.js:~285`), or add `approved_at IS NULL AND subscription_status='trial'` to WITH CHECK plus a trigger to set defaults.

### SEC-4 (P1) Fake orders → fake "verified-purchase" reviews; review impersonation
- **Evidence:**
  - `orders_insert_auth` WITH CHECK validates `user_id`, `can_view_restaurant`, table — but **not `status` or `total`**. A user can insert `{status:'completed', total: 0}` directly via PostgREST.
  - `reviews_insert_own` accepts `order_id IS NULL` (no purchase at all) or any order of theirs with status delivered/completed — which they can fabricate as above.
  - `reviews_insert_own`/`reviews_update_own` allow writing `reviewer_name` directly (bypassing the `submit_review` snapshot) and changing `restaurant_id`/`order_id` on update without re-checking the purchase condition.
  - The fabricated orders also appear in the restaurant's kitchen queue and owner analytics.
- **Fix:** drop `orders_insert_auth` (all order creation already goes through `/api/orders`); require `order_id IS NOT NULL` in `reviews_insert_own`; revoke direct INSERT/UPDATE on `reviews` and route all writes through `submit_review` (make it SECURITY DEFINER with its own checks) — or column-restrict UPDATE to `rating, comment`.

### SEC-5 (P1) "Disabled" accounts are not actually disabled
- **Evidence:** `is_active` is checked only in the browser in `signIn()` (`lib/auth/client.js:38`). A disabled user can call `supabase.auth.signInWithPassword` directly, and existing sessions keep working until expiry. No RLS policy other than `is_admin()` looks at `is_active`. `app/api/orders/[id]/status/route.js` never checks it. `app/api/staff/[id]/route.js` only flips the profile flag. Plus SEC-1 lets a user set `is_active=true` on themselves.
- **Scenario:** an owner disables a fired waiter; the waiter's phone is still logged in and keeps marking orders delivered.
- **Fix:** on disable, call `supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '876000h' })` (and unban on enable); check `is_active` in the status route and in `orders_staff_read`.

### SEC-6 (P1) Admin "Delete user" leaves the auth account alive
- **Evidence:** `app/dashboard/admin/page.js:265` → `supabase.from('user_profiles').delete()` only. `auth.users` row survives; the user can still log in (with no profile). `lib/auth/server.js#deleteUser` does both but is **never imported** (dead code).
- **Fix:** add an admin-only route that calls `auth.admin.deleteUser` (profile cascades via `user_profiles_id_fkey ON DELETE CASCADE`).

### SEC-7 (P2) Other RLS observations
- `restaurants_read_active_public` (anon **and authenticated**) omits `approved_at IS NOT NULL` → any logged-in user can see unapproved restaurants' full rows (phone, owner_email, subscription_notes). `guest_read_published_restaurants` for anon does check it.
- `subscription_events_*` policies are `TO public` (works because `is_admin()` / `owns_restaurant()` return false for anon, but should be `TO authenticated`).
- `restaurant_menu_flags` view is SECURITY DEFINER (advisor ERROR) → exposes veg/non-veg flags for *all* restaurants incl. unapproved. Low data sensitivity; set `security_invoker = true`.
- `handle_new_user()` and `is_admin()` are executable by `anon` via `/rest/v1/rpc/*` (advisor). `handle_new_user` is a trigger function; revoke EXECUTE from anon/authenticated.
- Functions `owns_restaurant`, `can_view_restaurant`, `handle_new_user`, `set_updated_at` have mutable `search_path` (advisor).
- Supabase Auth **leaked-password protection is disabled** (advisor). Staff passwords minimum is 6 chars (`app/api/staff/route.js:63`).

## 2.2 Authentication
- Route handlers verify tokens correctly with `auth.getUser()` (network-validated), not `getSession()`. ✔
- Dashboards gate by role in client code (`app/dashboard/kitchen/page.js:76` etc.) — acceptable only because RLS is the boundary, which is why SEC-1..4 matter.
- Signup `lib/auth/client.js:16` does a client-side `user_profiles.update({full_name})` — relies on the same over-broad grant.
- **Cannot verify from codebase:** email-confirmation requirement, JWT expiry, refresh-token rotation, password-reset redirect allow-list (Supabase Auth dashboard settings).

## 2.3 Secrets
- `.env*` git-ignored except `.env.example` (placeholders only). `git ls-files` shows no committed secrets. ✔
- Service role is only referenced from server files (`lib/supabaseAdmin.js`, `lib/auth/server.js`, API routes). None are imported by `"use client"` files. ✔ Recommend adding `import "server-only"` to `lib/supabaseAdmin.js` and `lib/r2/client.js` to make this a build-time guarantee.
- `lib/supabaseAdmin.js` creates the client with default auth options (`persistSession: true`) — harmless on server but inconsistent with `lib/auth/server.js`.
- `.mcp.json` commits the Supabase project ref (not a secret).
- **Cannot verify from codebase:** Vercel env scoping (Preview vs Production using the same service key).

## 2.4 Injection
- No `dangerouslySetInnerHTML` in `app/` or `components/`; no raw SQL; no shell execution. ✔
- **PostgREST filter injection (P3):** `app/restaurants/page.js:104-108` builds `.or(\`name.ilike.%${safeQ}%,description.ilike.%${safeQ}%\`)` stripping only commas. Parentheses/dots in `q` can alter the filter expression. RLS bounds the impact to anon-visible rows, but sanitize to `[\p{L}\p{N}\s-]` or use two `.ilike` queries.
- Open redirect: none found (no `next`/`redirect` param usage).
- WhatsApp messages are `encodeURIComponent`'d (`lib/whatsapp.js:23`). ✔

## 2.5 File uploads — **well designed**
- Keys are server-generated and namespaced by user/restaurant (`resolveKey`, presign route :28-55); MIME allow-list; `ContentLength` signed into the URL so size is enforced by R2; 60s expiry; delete route checks key ownership and rejects `..`; tests exist. ✔
- Gaps: rate limit is in-memory (see REL-3); `ContentType` is signed so a `.jpg` key cannot be served as HTML — good. Objects are never garbage-collected if a client uploads and never saves (orphan objects; P3).
- **Cannot verify from codebase:** R2 bucket CORS policy, whether the r2.dev public dev URL is used in production (Cloudflare rate-limits r2.dev and recommends a custom domain).

---

# Phase 3 — Supabase usage

### Indexes (P1 before growth)
`pg_indexes` shows **`orders` and `order_items` have only primary keys.** Every hot query filters on columns without an index:

| Query | Location | Needed index |
|---|---|---|
| Owner orders `eq(restaurant_id).order(created_at desc).limit(200)` | `app/dashboard/owner/page.js:224` | `orders (restaurant_id, created_at desc)` |
| Kitchen/waiter `eq(restaurant_id).in(status…).order(created_at)` | `app/dashboard/kitchen/page.js:97`, `waiter/page.js:96` | same, or partial `(restaurant_id, created_at) WHERE status IN ('new','preparing','ready')` |
| Customer orders `eq(user_id)` + Realtime filter `user_id=eq.` | `lib/auth/client.js:93` | `orders (user_id, created_at desc)` |
| Order-items embed / `order_items_*_read` RLS EXISTS | everywhere orders embed items | `order_items (order_id)` |
| Table delete "has orders?" count | `app/api/restaurants/[restaurantId]/tables/[tableId]/route.js:57` | `orders (table_id)` |
| Staff RLS subquery / `/api/staff` list | `orders_staff_read`, `app/api/staff/route.js:39` | `user_profiles (restaurant_id)` |
| Owner reviews / menu embed | `reviews(menu_item_id)`, `menu_items(category_id)` | as advisor lists |

Advisor also reports 13 unindexed FKs and 5 unused indexes (`idx_user_profiles_role`, `idx_user_profiles_is_active`, `idx_restaurant_requests_status`, both trigram indexes — the trigram ones are unused because search uses leading-`%` ilike which *can* use them once tables grow; keep those).

### RLS performance
- 19 policies use bare `auth.uid()` (advisor `auth_rls_initplan`) → re-evaluated per row. Wrap as `(select auth.uid())`.
- `owns_restaurant()` / `is_restaurant_published()` are `STABLE` SQL functions called per row in policies on `menu_items`, `orders`, `order_items`; fine at current size, scales with rows scanned.
- 22 "multiple permissive policies" findings (e.g. `orders` has three SELECT policies for `authenticated`, all ORed per row).

### Query shape
- **Unbounded:** menu-page reviews (`app/menu/[restaurantSlug]/page.js:182-191`, no `.limit`), restaurants listing (`app/restaurants/page.js:130-145`, no limit/pagination), kitchen/waiter queues (no limit — bounded in practice by status), admin users/restaurants/requests (`app/dashboard/admin/page.js:137-203`, `select('*')`, no pagination), owner menu/categories/tables (bounded by restaurant — fine).
- `restaurant_rating_summary` / `menu_item_rating_summary` are plain views that `GROUP BY` the entire `reviews` table on each call (filtered by `restaurant_id` — Postgres can push the filter down since `reviews_restaurant_id_idx` exists; acceptable until reviews are large; later consider a denormalized counter updated by trigger).
- `select('*')`: `lib/auth/client.js:65,70,115`, `app/page.js:103`, `app/dashboard/owner/page.js:192,202`, admin page ×5, menu page restaurant fetch. Mostly small tables; the menu page one is server-side so only column choice matters.
- `app/restaurants/page.js` runs up to 5 sequential queries (cuisines → restaurant_cuisines → menu_items → flags → restaurants → ratings). Cuisines could be fetched in parallel with the rest.
- N+1: none found. Rating summaries are batched with `.in()` (good).

### Realtime
| Subscription | Where | Behaviour |
|---|---|---|
| `orders-restaurant-${id}` event `*` | owner, kitchen, waiter pages via `useRestaurantOrdersRealtime` | **Every** insert/update → full refetch (`onChange`). Cleaned up on unmount ✔ |
| `orders-user-${uid}` event `*` | customer dashboard `useCustomerDashboardData.js:163` | Patches state on UPDATE; refetches on INSERT/DELETE ✔ |
| `subscription-events-renewal-requests` | admin page | fine |

Issues: (a) refetch-per-event: with N staff devices open and M status changes, N×M full list queries (owner list embeds items, 200 rows); (b) the acting client also refetches in `handleAction` / `updateOrderStatus` after the PATCH → double fetch for every click; (c) Postgres-changes RLS is evaluated per subscriber per change — with SEC-1 unfixed, any user can subscribe to any restaurant. Prefer applying `payload.new` to local state and only refetching on INSERT.

### Edge Functions / Storage
Not used. Supabase Storage is not used (R2 instead).

---

# Phase 4 — Vercel usage / cost

- **Everything is dynamic.** `i18n/request.js:54-55` (`headers()`, `cookies()`) runs for every page through next-intl, so the home page, `/restaurants`, `/menu/[slug]`, `/about`, etc. render on a serverless function **per request**, each with 1–6 Supabase queries. Marketing pages (`about`, `how-it-works`, `privacy-policy`, `contact`) have no data and could be fully static. Since `proxy.js` already sets `LOCALE_HEADER` on the rewrite, the locale could instead come from the route (e.g. `/ar` segment via `generateStaticParams`) to enable static/ISR rendering.
- `proxy.js` matcher is narrow (public pages only) and does no I/O. ✔
- No server→internal-API hops. ✔ But the cart does two sequential function calls per checkout (`/api/checkout/validate` then `/api/orders`, `app/cart/page.js:170,211`), and `/api/orders` redoes all the validation — the validate call is pure extra cost.
- Route handlers do sequential DB round-trips (status route: getUser → profile → order → restaurant → update = 5 serial calls; ~5× Supabase latency per click).
- `next/image`: check usage — images come from R2 public URLs; if `next/image` with remote patterns is used, each unique size is an optimization unit. **Cannot verify from codebase** whether Vercel Image Optimization is enabled on the plan.
- No cron, no ISR revalidation churn (only sitemap hourly). ✔

---

# Phase 5 — Performance

**Frontend**
- Large client components: `app/dashboard/admin/page.js` (815 lines), `app/dashboard/owner/page.js` (798), `app/cart/page.js` (752). Whole dashboards are client-rendered after an auth round-trip → `getCurrentUser()` (network) → profile → restaurant → data: a 4-step waterfall before first content.
- `useCustomerDashboardData.js:~145-154` refetches 4 datasets on **every window focus** plus has a realtime channel — redundant.
- `framer-motion` used in `components/PageTransition.js`, `MobileTabBar.js`, `InstallPrompt.js` — shipped on every page for transitions; consider CSS transitions or lazy import.
- `heic2any` is dynamically imported ✔; `html-to-image`/`qrcode` only in `app/qr/...` ✔.
- Client-side image compression before upload (`lib/r2/upload.js`) ✔ — good for bandwidth.
- GA4 loaded conditionally (`loadAnalytics`) ✔.
- React Compiler is enabled, so manual memoization is not needed; no evidence of render loops found. `useRestaurantOrdersRealtime` correctly keeps callbacks in refs.

**Backend**
- Sequential awaits in route handlers (above). `/api/orders` could run restaurant, table, menu items and `getUser` in parallel.
- Owner analytics (`components/dashboard/owner/hooks/useOwnerAnalytics.js`) pulls raw orders for the range and aggregates in JS — fine at hundreds of orders, heavy at tens of thousands (move to an RPC with `GROUP BY date_trunc('day', created_at)`).

---

# Phase 6 — Scalability

| Component | Works at small scale but becomes problematic when… |
|---|---|
| `orders` without indexes | …a platform-wide table reaches ~100k rows: every dashboard load, realtime RLS check and analytics query seq-scans all restaurants' orders. First thing to break. |
| Realtime refetch-per-event | …a busy restaurant has 5 staff screens open at lunch rush: each order status change fans out to 5 full-list refetches (+1 by the actor). |
| In-memory rate limiter | …traffic spreads across multiple Vercel instances — the limit multiplies per instance and resets on cold start; effectively no limit. |
| Dynamic public pages | …a restaurant puts QR codes on 50 tables: every scan is a function invocation + ~5 Supabase queries instead of a CDN hit. |
| Unpaginated restaurants listing / reviews | …there are hundreds of restaurants or thousands of reviews for a popular one: page payload and RSC render time grow linearly. |
| Admin page `select('*')` users/restaurants | …users reach 10k+: the admin dashboard downloads the whole user table on load. |
| Owner analytics in JS | …a restaurant has 10k+ orders in "last30". |
| `/api/orders` without rate limiting | …someone scripts it — unlimited anonymous orders flood a kitchen's realtime queue. |
| Supabase connection usage | Not a concern: all access is via PostgREST (pooled). ✔ |

---

# Phase 7 — Reliability / error handling

- **REL-1 (P0) `/api/orders` non-transactional:** inserts `orders` (:115) then `order_items` (:137). If the second insert fails (e.g. quantity ≤ 0 violates `order_items_quantity_check`), an order with no items is left behind and is broadcast to the kitchen via realtime. Move to a single `create_order(...)` Postgres function (one transaction) — this also fixes the published-restaurant check and validation in one place. *(Live DB currently has 0 orphan orders.)*
- **REL-2 (P2) Status update race:** `app/api/orders/[id]/status/route.js:48-93` reads `order.status`, checks `canTransition`, then updates by id only. Two staff clicking at once both succeed based on stale state. Add `.eq('status', order.status)` to the update and return 409 on 0 rows.
- **REL-3 (P1) Rate limiting** is in-memory (`lib/rateLimit.js`) — per-instance on Vercel; and absent on `/api/orders`, `/api/checkout/validate`, `/api/table/resolve`, `/api/staff`. Use Upstash/Vercel KV or a Postgres-backed limiter; at minimum Vercel WAF rate-limit rules on `/api/orders`.
- **REL-4 (P2) Staff creation is two steps** (`app/api/staff/route.js:70-91`): `auth.admin.createUser` then profile update. If the update fails, a confirmed customer-role account with the owner's chosen password is orphaned. Roll back with `auth.admin.deleteUser` on failure.
- **REL-5 (P2) Table add race:** `tables/add/route.js:55-73` computes `max(table_number)` then inserts; concurrent requests hit `restaurant_tables_restaurant_id_table_number_key` and one fails with a raw DB error. Acceptable (constraint protects integrity) but surface a friendly retry.
- **Error leakage (P3):** most routes return `err.message` / PostgREST `error.message` to the client (e.g. `orders/route.js:132,140,145`). Log server-side, return generic messages.
- **Duplicate submissions:** no idempotency key on `/api/orders`; a double-tap or retry creates two orders. Cart page should disable the button (verify) and the API should accept an idempotency key (client-generated UUID stored with a unique index).
- **Silent failures:** admin subscription audit insert failure is only logged (by design); `menu page` logs `reviewsError` with `console.error` and continues ✔.
- `.single()` used for "maybe missing" lookups (`orders/route.js:18,55`) → error path instead of null; works but noisy.

---

# Phase 8 — Data integrity

| Issue | Evidence | Recommendation |
|---|---|---|
| Client-controlled `total`, `status` on orders | `orders_insert_auth` + full INSERT grant | Remove client INSERT; server/RPC only; `CHECK (total >= 0)` |
| No `CHECK (price >= 0)` on `menu_items`/`order_items`, no upper bound on `quantity` | constraints list | add `price >= 0`, `quantity BETWEEN 1 AND 99` |
| `order_items.menu_item_id` FK has no ON DELETE → deleting a menu item that was ever ordered fails | `order_items_menu_item_id_fkey` | `ON DELETE SET NULL` (name/price are already snapshotted) |
| `orders_table_id_fkey` has no ON DELETE | table delete route guards it in app code ✔ | fine; keep |
| `user_profiles.restaurant_id` FK has no ON DELETE → deleting a restaurant with staff fails | `user_profiles_restaurant_id_fkey` | `ON DELETE SET NULL` |
| `restaurants.owner_id ON DELETE SET NULL` → orphaned restaurants with no owner stay live | FK def | intended? if not, deactivate via trigger |
| `updated_at` never maintained | `set_updated_at()` exists but no trigger attached | attach triggers or drop columns |
| No unique "one restaurant per owner" | code assumes `.maybeSingle()` on `owner_id` everywhere (e.g. `app/api/staff/route.js:21`) | `UNIQUE (owner_id)` if that's the model, else code breaks with 2 restaurants |
| No unique pending request per user | `restaurant_requests` | partial unique `(user_id) WHERE status='pending'` |
| Staff `role` vs `restaurant_id` consistency | nothing enforces kitchen/waiter ⇒ restaurant_id not null, customer ⇒ null | CHECK constraint |
| `orders.channel`, `status`, `table_required` CHECKs | present ✔ | — |

---

# Phase 9 — Dependencies

`npm audit --omit=dev`: **5 vulnerabilities (1 critical, 3 high, 1 moderate)**.
- **`next@16.1.6` — critical (direct).** Advisories include middleware/proxy bypasses, RSC cache poisoning, Server-Component DoS, Image-Optimization DoS/RCE (AVIF), SSRF in rewrites. This app uses a proxy with rewrites and App Router — directly relevant. **Upgrade to the latest 16.x patch before launch** (and `eslint-config-next` to match).
- `postcss`, `sharp`, `ws` (transitive, high) — fixed via `npm audit fix` / Next upgrade.
- `baseline-browser-mapping` (moderate, dev-time).
- Bundle-relevant: `framer-motion` (only for page transitions), `radix-ui` meta-package (tree-shaken), `lucide-react` (tree-shaken per icon). `@aws-sdk/*` is server-only ✔. `heic2any` dynamically imported ✔.
- Unused/dead: `lib/auth/server.js` (never imported).

---

# Phase 10 — Code quality / architecture

- **Auth-token boilerplate duplicated in 7 route handlers** (`createClient(url, anon, {Authorization})` + `getUser`) — `lib/r2/auth.js#getAuthedUserId` already exists; reuse it everywhere, and add a `requireOwnerRestaurant` helper (exists privately in `app/api/staff/route.js`).
- **Two service-role clients** (`lib/supabaseAdmin.js` and one inside `lib/auth/server.js`) with different options.
- **Two validation paths** for checkout (`/api/checkout/validate` strict, `/api/orders` lax) that already drifted (quantity, duplicates, channel, published check).
- Dashboards are 750–800-line client pages mixing data loading, mutations and dialogs; the owner page already started extracting hooks (`useOwnerAnalytics`, `useOwnerReviews`) — continue that pattern.
- `params` await shim `p && typeof p.then === "function" ? await p : p` repeated; in Next 16 params is always a Promise — just `await context.params`.
- Mixed quote/semicolon styles between files (cosmetic).
- Tests: only `lib/rateLimit.test.js` and the two upload route tests. No tests for order creation or status transitions (the most business-critical code).

---

# Phase 11 — Environment / deployment

- **No migrations in the repo (P1).** Schema, RLS, functions and grants exist only in the live Supabase project. There is no way to review a policy change in a PR, recreate the DB for staging, or roll back. Pull the schema (`supabase db pull`) into `supabase/migrations/` and make all future changes through migrations.
- No `vercel.json`; defaults are fine. Functions set `runtime = "nodejs"` ✔.
- No security headers (CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`) in `next.config.mjs`.
- No error monitoring (Sentry etc.); 22 `console.*` calls are the only telemetry.
- No dev-only functionality exposed in production found. ✔
- **Cannot verify from codebase:** Vercel env var scoping per environment; whether Preview deployments point at the production Supabase project (likely — only one project ref exists); Supabase backups / PITR; Supabase plan limits.

---

# Phase 12 — Cost analysis

### HIGH RISK
| Driver | Where | Resource | Why it scales badly | Reduce by |
|---|---|---|---|---|
| Dynamic SSR for every public page | `i18n/request.js:54-55` → all routes | Vercel function invocations + duration; Supabase API requests | Every QR scan / crawler hit = function + 1–6 DB queries; nothing served from CDN | Static/ISR public pages; locale from route segment; `revalidate` on menu pages + on-demand revalidation when owner edits menu |
| Unthrottled `/api/orders` | `app/api/orders/route.js` | Function invocations, DB writes, realtime fan-out | Scriptable spam; each fake order triggers N dashboard refetches | Persistent rate limit / WAF rule; captcha/turnstile for anonymous orders |

### MEDIUM RISK
| Driver | Where | Resource | Why | Reduce by |
|---|---|---|---|---|
| Realtime refetch storms | `useRestaurantOrdersRealtime` + owner/kitchen/waiter `loadOrders` | Supabase egress + DB CPU | Each change × each open screen × full list with items | Apply payloads locally; refetch only on INSERT (single row by id) |
| Seq scans on `orders` | missing indexes | DB CPU (compute tier) | Linear with platform-wide order count | Add indexes (Phase 3) |
| Double API call per checkout | `app/cart/page.js:170,211` | Function invocations | 2× per order | Single endpoint |
| Customer dashboard focus refetch | `useCustomerDashboardData.js` | Supabase requests | 4 queries per tab focus | Rely on realtime; throttle |

### LOW RISK
- R2 storage/egress (client-side compression to ~200 KB; R2 has no egress fees). Orphaned uploads are minor.
- GA4 (free). Sitemap hourly revalidate. Supabase Auth MAUs at current scale.

(No price figures given — they depend on current Vercel/Supabase plan pricing, which wasn't verified.)

---

# Phase 13 — Prioritized findings

| Priority | Category | Finding | Evidence | Impact | Likelihood | Recommended Fix |
|---|---|---|---|---|---|---|
| P0 | Authz / data leak | Customer can set own `restaurant_id` → read all orders & PII of any restaurant (incl. realtime) | `user_profiles_update_own`, `orders_staff_read`, column grants | PII breach (phones, addresses) | High — one devtools call | Column-restrict `user_profiles` UPDATE; require staff role in `orders_staff_read` |
| P0 | Authz / billing | Owner can edit own subscription/approval columns | `restaurants_owner_update_own` + full UPDATE grant | Revenue loss; subscription model void | High | Column grants or guard trigger; admin writes via server |
| P0 | Authz | Any user can insert an approved, unlimited restaurant | `restaurants_owner_insert_own` | Unvetted restaurants go live | Medium–High | Drop policy / constrain WITH CHECK |
| P0 | Security / deps | `next@16.1.6` has critical advisories (proxy bypass, cache poisoning, DoS, RCE in image opt.) | `npm audit`, `package.json` | Varies up to RCE/DoS | Medium | Upgrade Next to latest 16.x patch |
| P0 | Reliability / authz | `/api/orders` uses service role and skips published/subscription/active check; negative/NaN qty; non-transactional | `app/api/orders/route.js:14-145` | Orders to suspended restaurants; corrupt totals; orphan orders | Medium | `create_order` RPC in one transaction reusing `/api/checkout/validate` rules |
| P1 | Integrity / trust | Fake completed orders + reviews without purchase + `reviewer_name` spoofing | `orders_insert_auth`, `reviews_insert_own`, `reviews_update_own` | Review fraud, fake kitchen orders | Medium | Drop client order INSERT; require order_id; restrict review writes to RPC |
| P1 | Auth | Disabled users/staff keep access | `lib/auth/client.js:38`, `app/api/staff/[id]/route.js`, status route | Fired staff keep acting | Medium | Ban via Auth admin API; check `is_active` server-side |
| P1 | Auth | Admin delete leaves auth user | `app/dashboard/admin/page.js:265` | Deleted users can still log in | Medium | Server route with `auth.admin.deleteUser` |
| P1 | Abuse | Rate limiter ineffective on serverless; missing on orders | `lib/rateLimit.js`, `app/api/orders/route.js` | Spam/DoS | Medium | KV/Upstash or WAF |
| P1 | Deployment | No migrations in repo | repo tree | Unreviewable/irreproducible schema & RLS — root cause of P0s going unnoticed | Certain | `supabase db pull` → migrations; PR review of policies |
| P1 | DB perf | No indexes on `orders` / `order_items` FKs & filters | `pg_indexes`, advisor | Slow dashboards at scale | Certain with growth | Add 5–6 targeted indexes |
| P2 | Cost | All pages dynamic (next-intl `headers()/cookies()`) | `i18n/request.js:54` | Function + DB cost per view | Certain | Static/ISR public pages |
| P2 | Realtime | Full refetch per change per screen; double refetch after own action | `useRestaurantOrdersRealtime.js`, owner/kitchen/waiter pages | Egress/DB load at rush hour | High with traffic | Patch state from payload |
| P2 | Reliability | Status update race | `app/api/orders/[id]/status/route.js:86` | Conflicting transitions | Low–Med | Conditional update + 409 |
| P2 | Reliability | Staff create non-atomic | `app/api/staff/route.js:70-91` | Orphan accounts | Low | Rollback on failure |
| P2 | Security | SECURITY DEFINER view; anon-executable definer funcs; mutable search_path; leaked-password protection off | Supabase advisors | Hardening gaps | Low | Apply advisor remediations |
| P2 | Authz | Authenticated users see unapproved restaurants' full rows | `restaurants_read_active_public` | Minor info leak | Medium | Add `approved_at IS NOT NULL` |
| P2 | Perf | Unbounded listing/reviews/admin queries | files in Phase 3 | Slow pages at scale | Med with growth | Pagination/limits |
| P2 | Integrity | Missing CHECKs / FK ON DELETE rules / `updated_at` trigger / one-restaurant-per-owner | Phase 8 table | Failed deletes, bad data | Medium | Constraints |
| P3 | Perf | RLS `auth.uid()` initplan ×19, multiple permissive policies ×22 | advisors | CPU at scale | Certain at scale | `(select auth.uid())`, merge policies |
| P3 | Security | `.or()` filter string interpolation | `app/restaurants/page.js:107` | Filter manipulation within anon RLS | Low | Stricter sanitization |
| P3 | Reliability | Raw DB errors returned to client; no idempotency on orders | route handlers | Info leak, duplicate orders | Medium | Generic errors; idempotency key |
| P3 | Ops | No error monitoring, no security headers | `next.config.mjs` | Blind to prod errors | Certain | Sentry; headers |
| P3 | Quality | Duplicated auth boilerplate; dual validation paths; dead `lib/auth/server.js`; 800-line pages; few tests | Phase 10 | Maintenance drift | Certain | Shared helpers; tests for order flow |
| P4 | Perf | framer-motion for transitions; customer focus refetch | Phase 5 | Minor bundle/requests | — | Optional |

---

# Phase 14 — Top 10 problems

**1. Customers can read any restaurant's orders and customer PII**
- Path: live DB policies `user_profiles_update_own`, `orders_staff_read` (no repo file — see #6)
- Why: `WITH CHECK` pins only `role`; `restaurant_id` is writable by the user; staff read policy trusts `restaurant_id` without checking role.
- Scenario: a competitor signs up, sets `restaurant_id` to a rival's id, exports every customer phone number and address; subscribes to realtime to watch new orders.
- Severity: **P0** · Fix: column-level UPDATE grant on `user_profiles` (`full_name, phone, avatar_url`), and `orders_staff_read` → `EXISTS (select 1 from user_profiles up where up.id = (select auth.uid()) and up.role in ('kitchen','waiter') and coalesce(up.is_active,true) and up.restaurant_id = orders.restaurant_id)`. Same for any other staff-scoped policy. · **Fix before production: Yes.**

**2. Owners control their own subscription and approval**
- Path: `restaurants_owner_update_own`; UI writes from `app/dashboard/owner/restaurant/edit/page.js` use the same grant
- Why: all columns updatable. Scenario: trial ends → owner sets `subscription_expires_at = null` → free forever.
- Severity: **P0** · Fix: `BEFORE UPDATE` trigger raising if `approved_at/subscription_*/is_active/trial_used/owner_id` change and `not is_admin()`; or column grants + admin RPC. · **Yes.**

**3. Self-service approved restaurants**
- Path: `restaurants_owner_insert_own`
- Scenario: spam/scam "restaurants" appear on `/restaurants` and in the sitemap with no admin review.
- Severity: **P0** · Fix: drop the policy (creation happens in the admin approval flow). · **Yes.**

**4. Vulnerable Next.js version**
- Path: `package.json` (`"next": "16.1.6"`)
- Why: critical advisory set incl. proxy bypass and image-optimizer RCE/DoS; this app uses `proxy.js` rewrites.
- Severity: **P0** · Fix: upgrade to latest 16.x patch; rerun `npm audit`. · **Yes.**

**5. `/api/orders` trusts too much and isn't atomic**
- Path: `app/api/orders/route.js` — `POST`
- Why: service role bypasses the published/subscription RLS; quantity unchecked (`:90`); duplicates allowed; order and items inserted separately (`:115`, `:137`); raw errors leaked.
- Scenario: a suspended restaurant (admin cut off for non-payment) still receives orders through its cached menu page; a crafted request with `quantity: -3` produces a negative total or an order with no items in the kitchen queue.
- Severity: **P0** · Fix: a `create_order(p_slug, p_channel, p_table_code, p_items jsonb, p_customer jsonb)` SECURITY DEFINER function that checks `is_restaurant_published`, validates items/quantities (1–99, no dupes, same restaurant, available), computes the total and inserts order + items in one transaction; route becomes a thin wrapper + rate limit. Delete the separate validate call or make it share the same function. · **Yes.**

**6. Schema & RLS live only in the dashboard**
- Path: no `supabase/migrations/`
- Why: the P0s above went unnoticed because policies are never reviewed in code; no staging DB; no rollback.
- Severity: **P1** · Fix: `supabase db pull`, commit, apply future changes as migrations, run `get_advisors` in CI or before each release. · **Yes** (do it first — the P0 fixes should land as migrations).

**7. Fake orders and fake verified reviews**
- Path: `orders_insert_auth`, `reviews_insert_own`, `reviews_update_own`
- Scenario: a user inserts a `completed` order for a rival restaurant and posts a 1-star "verified" review; or edits `reviewer_name` to impersonate someone.
- Severity: **P1** · Fix: drop direct order INSERT; `reviews_insert_own` require `order_id IS NOT NULL`; restrict review UPDATE columns to `rating, comment`; force `reviewer_name` via trigger. · **Yes.**

**8. Disabling / deleting accounts doesn't revoke access**
- Path: `lib/auth/client.js:38`, `app/api/staff/[id]/route.js:53`, `app/dashboard/admin/page.js:265`, `app/api/orders/[id]/status/route.js:38`
- Scenario: a dismissed waiter keeps a logged-in phone and continues changing order states; a "deleted" user logs back in.
- Severity: **P1** · Fix: Auth admin ban/delete from server routes; check `is_active` in the status route and staff RLS. · **Yes.**

**9. No effective rate limiting**
- Path: `lib/rateLimit.js`; absent in `app/api/orders/route.js`, `app/api/checkout/validate/route.js`, `app/api/table/resolve/route.js`
- Scenario: a script submits thousands of orders to a restaurant's kitchen screen during service.
- Severity: **P1** · Fix: Upstash Redis / Vercel KV limiter keyed by IP + restaurant; Vercel WAF rule on `/api/orders`; optional Turnstile for guest checkout. · **Yes** for `/api/orders`.

**10. `orders` has no indexes; realtime triggers full refetches**
- Path: `pg_indexes` (orders/order_items PK only); `components/dashboard/shared/hooks/useRestaurantOrdersRealtime.js`, `app/dashboard/owner/page.js:222-246`
- Scenario: at a few hundred active restaurants, lunch rush → every status change seq-scans the platform-wide `orders` table once per open dashboard.
- Severity: **P1/P2** · Fix: indexes `orders(restaurant_id, created_at desc)`, `orders(user_id, created_at desc)`, `orders(table_id)`, `order_items(order_id)`, `user_profiles(restaurant_id)`; merge realtime payloads into state instead of refetching. · Indexes: yes (cheap). Realtime refactor: before 1,000 users.

---

# Phase 15 — What I would fix first

### Before production
1. Pull schema into `supabase/migrations/` (so every fix below is a reviewed migration).
2. Lock down column writes: `user_profiles` (SEC-1), `restaurants` (SEC-2), drop `restaurants_owner_insert_own` (SEC-3), fix `orders_staff_read`.
3. Drop `orders_insert_auth`; tighten `reviews_*` policies (SEC-4).
4. Replace `/api/orders` body with a transactional `create_order` RPC that enforces `is_restaurant_published` and item/quantity rules.
5. Upgrade Next.js to the latest patched 16.x; `npm audit fix`.
6. Real disable/delete (Auth admin ban/delete) for users and staff; check `is_active` server-side.
7. Persistent rate limit (or WAF rule) on `/api/orders`.
8. Add the orders/order_items indexes.
9. Apply security advisor remediations (definer view → invoker, revoke anon EXECUTE on `handle_new_user`/`is_admin`, set `search_path`, enable leaked-password protection).

### Before first 1,000 users
- Realtime: patch state from payloads; remove the post-action refetch.
- Conditional status update (409 on conflict); rollback in staff create; idempotency key on orders.
- Static/ISR for marketing pages and cached menu pages with on-demand revalidation on menu edits.
- Pagination: restaurants listing, menu reviews, admin tables.
- Error monitoring (Sentry), generic API error messages, security headers.
- Tests for `/api/orders`, status transitions, and RLS (e.g. pgTAP or a script that runs policy checks as test users against a branch DB).

### Before significant scale
- Wrap `auth.uid()` in `(select …)` across policies; merge permissive policies.
- Server-side analytics aggregation RPC; denormalized rating counters if reviews grow large.
- Merge `/api/checkout/validate` + `/api/orders` into one call; parallelize route-handler lookups.
- Separate Supabase project for Preview/staging.

### Optional improvements
- Extract dashboard pages into hooks/components; shared `requireUser`/`requireOwner` helpers; delete `lib/auth/server.js` or wire it in.
- `import "server-only"` in server libs.
- Lighter page transitions than framer-motion; drop focus-refetch in customer dashboard.
- R2 orphan-object cleanup (lifecycle rule on unreferenced keys).

---

# Architecture health

| Area | Rating |
|---|---|
| Security | **Critical** |
| Authentication | Needs Attention |
| Authorization | **Critical** |
| Database | High Risk |
| Supabase Usage | Needs Attention |
| Vercel Usage | Needs Attention |
| Performance | Needs Attention |
| Scalability | Needs Attention |
| Reliability | High Risk |
| Code Quality | Needs Attention |
| Deployment | High Risk |
| Cost Efficiency | Needs Attention |

### Cannot verify from codebase (should be checked manually)
- Supabase Auth settings: email confirmation required, JWT expiry, redirect URL allow-list, rate limits.
- Supabase backups / PITR and plan tier.
- Vercel: env var scoping per environment, Preview deployments pointing at production DB, WAF/firewall rules, Image Optimization usage.
- Cloudflare R2: bucket CORS, public access mode (r2.dev vs custom domain), lifecycle rules.

---

# Remediation status (2026-09-27)

**Where the fixes live:**
- **Code:** branch `audit` (`af67740` … `c50ef73`), not yet merged to `master`.
- **Database:** 9 migrations in `supabase/migrations/`, already applied to the live project `zldcwfextifsbiqtvzpv`. Each file is named with the version Supabase recorded.

Every database change was checked with rolled-back test transactions, run as each role (anon, customer, owner, kitchen/waiter, admin, service_role).

**Deploy compatibility:** the live schema works with both the old `master` code and the new `audit` code, so merging can happen at any time.

## Fixed

| Finding | Fix | Where |
|---|---|---|
| **SEC-1** (P0) customers could set their own `restaurant_id` and read any restaurant's orders and PII | Guard trigger `user_profiles_guard`: only admins and service_role can change `role`, `restaurant_id` or `is_active`. `orders_staff_read` now requires an active kitchen/waiter account | `20260926162122_lockdown_profiles_restaurants.sql` |
| **SEC-2** (P0) owners could edit their own subscription and approval | Guard trigger `restaurants_guard` protects `owner_id`, `slug`, `approved_at`, `subscription_*` and `trial_used`. Admin "disable restaurant" now means suspension (`subscription_status`); owners keep `is_active` as their own open/closed toggle | same migration · `app/dashboard/admin/page.js`, `components/dashboard/admin/tabs/RestaurantsTab.js` |
| **SEC-3** (P0) self-approved restaurant inserts | `restaurants_owner_insert_own` dropped; restaurants are created only by the admin approval flow | same migration |
| **P0 #4 / REL-1** `/api/orders`: no published/suspended check, unchecked quantities, not atomic, raw DB errors returned | `create_order()` RPC (service_role only) validates everything and inserts the order and its items in one transaction. The route is a thin wrapper with friendly error messages | `20260926163612_create_order_function.sql` · `app/api/orders/route.js` (+ tests) |
| **P0** `next@16.1.6` critical advisories | Next 16.3.6, React 19.2.8, `npm audit fix`; 0 vulnerabilities | `package.json` / lockfile |
| **SEC-4** (P1) fake orders, and "verified" reviews without a purchase | `orders_insert_auth` dropped. Reviews require the reviewer's own delivered/completed order. `reviews_guard` fixes `reviewer_name` from the profile and makes a review's target unchangeable | `20260926163045_orders_reviews_integrity.sql` |
| **SEC-5 / SEC-6** (P1) disable and delete didn't revoke access | Disable also bans the account in Supabase Auth; delete removes the login. Both go through admin-only `/api/admin/users/[id]`. The order-status route rejects disabled accounts | `lib/auth/admin.js`, `app/api/admin/users/[id]/route.js`, `app/api/staff/[id]/route.js`, `app/api/orders/[id]/status/route.js` (+ tests) |
| **REL-3** (P1) in-memory rate limiter didn't work on Vercel | Shared Postgres counter (`rate_limits` + `rate_limit_hit()`). If the limiter itself fails, requests are allowed through. `/api/orders` is limited to 10 per 10 minutes per IP | `20260926172453_rate_limits.sql` · `lib/rateLimit.js` (+ tests) |
| **Phase 3** (P1) `orders` / `order_items` had only primary keys; 13 foreign keys had no index | 13 indexes; the advisor's "unindexed foreign keys" finding went from 13 to 0 | `20260926173057_add_missing_indexes.sql` |
| **SEC-7** security advisor findings | View set to `security_invoker`; unapproved restaurants hidden from logged-in users; `handle_new_user()` no longer callable via the API, and `is_admin()` no longer callable by anon; `search_path` pinned; `auth.uid()` evaluated once per query | `20260926174654_advisor_hardening.sql` |
| **REL-2 / REL-4** status race and non-atomic staff creation | Conditional update returns 409, and staff screens refresh with a toast. A staff account is deleted again if assigning it to the restaurant fails | `app/api/orders/[id]/status/route.js`, `app/api/staff/route.js` (+ tests) |
| Realtime refetch storm (P2) | Only the changed order is updated from the live event; new orders are fetched one at a time; no double reload after your own action; full reload only on reconnect | `lib/orderRealtime.js` (+ tests), `useRestaurantOrdersRealtime`, owner/kitchen/waiter pages |
| Unbounded public queries (P2) | `/restaurants` paginated (24 per page; page 2+ `noindex`); menu reviews capped at the newest 20; food search capped | `lib/pagination.js` (+ tests), `app/restaurants/page.js`, `app/menu/[restaurantSlug]/page.js` |
| Every page shipped all translations (found during remediation) | Public pages no longer include dashboard text: 32 KB (en) / 44 KB (ar) less per page | `app/layout.js`, `app/dashboard/layout.js` |
| No security headers (P3) | Enforced: `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS. **CSP is report-only for now** | `lib/securityHeaders.mjs` (+ tests), `next.config.mjs` |
| 6 React lint errors (P3) | 0 errors. The 5 `<img>` warnings are kept on purpose, because images come from arbitrary external hosts | several components |

## Bugs found during remediation (not in the original audit)

- **Admin N+1 queries:** the requests list ran one query per request, and the Restaurants tab one count query per card. Both are now single queries.
- **Admins saw every restaurant's menu-item count as 0,** because they had no read access to `menu_items`. Fixed in `20260926181540_menu_items_admin_read.sql`.
- **`owner_email` was never saved, and filling it would have leaked owner emails.** Approval read a non-existent `user_profiles.email`. Separately, anon can read every column of published restaurants. The column was dropped; admins now fetch emails from `auth.users` through the admin-only `admin_user_emails()`. The QR page's "claim by email" path was removed. See `20260926191809_admin_user_emails_drop_owner_email.sql`.
- **Favorites never worked.** Call sites passed the user id as the restaurant id; the live table had 0 rows ever. Fixed in `components/FavoriteButton.js` and `app/dashboard/customer/page.js`.

## Incident during remediation

**What happened:**
- The Fix 8 migration (`20260926174654`) wrapped `auth.uid()` in `user_profiles_read_own`, following the Supabase performance advisor.
- That made every non-admin `user_profiles` UPDATE fail with "infinite recursion detected in policy". The update policy's role check reads `user_profiles` again.
- Profile edits were broken for about **one minute** (17:46:54–17:47:57 UTC) before the policy was reverted in `20260926174757_revert_user_profiles_read_own_initplan.sql`.

**Lessons:**
- Keep that one policy in its bare `auth.uid()` form and accept the advisor warning.
- After any policy change, test the **write** paths for each role, not only reads.

## Still open

| Item | Needs | Notes |
|---|---|---|
| Merge `audit` → `master` | Owner review and merge | Until then, production runs the old application code on the new, compatible schema |
| Enforce the CSP (switch the report-only header name in `lib/securityHeaders.mjs`) | A logged-in browser pass (owner image upload, including HEIC; kitchen realtime; QR download) with no `[Report Only]` console lines | Public pages already pass: every loaded resource was checked against the served CSP |
| Leaked-password protection | Toggle in the Supabase dashboard (Authentication → Settings) | Advisor WARN |
| Error monitoring (Sentry) | A Sentry project / DSN | Only `console.*` logging today |
| Full schema baseline (`supabase db pull`) | Supabase CLI + DB password | Only migrations from 2026-09-26 onward are in the repo; 18 earlier ones exist only in the live project |
| Static/ISR public pages | A decision once traffic grows | Needs an `app/[locale]/` restructure; deferred |
| Admin table pagination; merging permissive RLS policies; `pg_trgm` schema | Scale | Low priority at current volume |

## Architecture health after remediation

These ratings apply once `audit` is merged. The database-side improvements are already in effect.

| Area | Before | After |
|---|---|---|
| Security | **Critical** | Needs Attention (CSP not yet enforced; leaked-password protection off) |
| Authentication | Needs Attention | Healthy |
| Authorization | **Critical** | Healthy |
| Database | High Risk | Needs Attention (no full schema baseline in the repo) |
| Supabase Usage | Needs Attention | Healthy |
| Vercel Usage | Needs Attention | Needs Attention (public pages still render dynamically) |
| Performance | Needs Attention | Healthy |
| Scalability | Needs Attention | Needs Attention (static/ISR deferred; admin tables unpaginated) |
| Reliability | High Risk | Healthy |
| Code Quality | Needs Attention | Healthy (tests 22 → 71; 0 lint errors) |
| Deployment | High Risk | Needs Attention (unmerged branch; no monitoring; partial migration history) |
| Cost Efficiency | Needs Attention | Needs Attention |
