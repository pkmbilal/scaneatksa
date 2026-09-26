-- Fix 6 of the 2026-09-26 production audit (REL-3).
--
-- lib/rateLimit.js used an in-memory Map, which on Vercel is per function
-- instance and resets on every cold start -- effectively no limit. Counters
-- now live here so every instance shares them. Fixed-window: one row per key,
-- reset when its window expires.
--
-- Service-role only (API routes): RLS on with no policies, and no grants to
-- anon/authenticated on either the table or the function.

create table if not exists public.rate_limits (
  key text primary key,
  count int not null,
  reset_at timestamptz not null
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Atomically counts one hit against p_key. The upsert's row lock makes
-- concurrent calls from different instances count correctly.
create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns table (allowed boolean, retry_after_ms int)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_count int;
  v_reset_at timestamptz;
begin
  insert into public.rate_limits as rl (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
    set count = case when rl.reset_at <= now() then 1 else rl.count + 1 end,
        reset_at = case when rl.reset_at <= now()
                        then now() + make_interval(secs => p_window_seconds)
                        else rl.reset_at end
  returning rl.count, rl.reset_at into v_count, v_reset_at;

  -- Occasional housekeeping instead of a cron job: drop long-expired keys.
  if random() < 0.01 then
    delete from public.rate_limits where reset_at < now() - interval '1 hour';
  end if;

  return query select
    v_count <= p_limit,
    greatest(0, ceil(extract(epoch from (v_reset_at - now())) * 1000))::int;
end;
$$;

revoke execute on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;
