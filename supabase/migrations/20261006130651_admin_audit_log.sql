-- Admin audit trail + last-admin guard.
--
-- Before this, role changes, approvals, restaurant edits and account
-- disable/delete left no record of who did them. admin_audit_log is written
-- by:
--   * log_admin_change() triggers -- every admin write made from the browser
--     (direct table writes and the admin_* RPCs, which run with the admin's
--     JWT so auth.uid() / is_admin() still identify them),
--   * API routes (lib/auth/admin.js logAdminAction) for service-role actions
--     that the triggers can't attribute (disable/enable, delete user).
-- Admins can read it; nobody can edit or delete it through the API.

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_actor_id_idx on public.admin_audit_log (actor_id);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_type, target_id);

alter table public.admin_audit_log enable row level security;

revoke all on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;

drop policy if exists admin_audit_log_admin_read on public.admin_audit_log;
create policy admin_audit_log_admin_read on public.admin_audit_log
  for select to authenticated
  using (public.is_admin());

-- Generic AFTER trigger: records the row on insert/delete and only the
-- changed columns ({col: {from, to}}) on update. Non-admin writes (owners
-- editing their own restaurant, service-role routes) are skipped.
-- SECURITY DEFINER so it can insert past the revoked grants.
create or replace function public.log_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_details jsonb;
begin
  if auth.uid() is null or not public.is_admin() then
    return null;
  end if;

  if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new); end if;

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(n.key, jsonb_build_object('from', v_old -> n.key, 'to', n.value)), '{}'::jsonb)
      into v_details
      from jsonb_each(v_new) n
     where n.value is distinct from v_old -> n.key
       and n.key <> 'updated_at';

    if v_details = '{}'::jsonb then
      return null;
    end if;
  else
    v_details := coalesce(v_new, v_old);
  end if;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id, details)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    (coalesce(v_new, v_old) ->> 'id')::uuid,
    v_details
  );

  return null;
end;
$$;

revoke execute on function public.log_admin_change() from public, anon, authenticated;

drop trigger if exists user_profiles_audit on public.user_profiles;
create trigger user_profiles_audit
  after update on public.user_profiles
  for each row execute function public.log_admin_change();

drop trigger if exists restaurants_audit on public.restaurants;
create trigger restaurants_audit
  after insert or update or delete on public.restaurants
  for each row execute function public.log_admin_change();

drop trigger if exists restaurant_requests_audit on public.restaurant_requests;
create trigger restaurant_requests_audit
  after update or delete on public.restaurant_requests
  for each row execute function public.log_admin_change();

drop trigger if exists cuisines_audit on public.cuisines;
create trigger cuisines_audit
  after insert or update or delete on public.cuisines
  for each row execute function public.log_admin_change();

-- user_profiles_guard: same as 20260926162122, plus a check that runs for
-- every writer (service role included) so the last active admin can't be
-- demoted or deactivated -- by mistake, or by someone who got into it.
create or replace function public.user_profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'admin'
     and coalesce(old.is_active, true)
     and (new.role is distinct from 'admin' or new.is_active is false)
     and not exists (
       select 1
         from public.user_profiles p
        where p.id <> old.id
          and p.role = 'admin'
          and coalesce(p.is_active, true)
     ) then
    raise exception 'Cannot demote or deactivate the last active admin'
      using errcode = '42501';
  end if;

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
