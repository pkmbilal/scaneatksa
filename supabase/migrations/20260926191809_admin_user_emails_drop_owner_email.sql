-- Owner/requester emails: admin-only lookup instead of a public column.
--
-- restaurants.owner_email was never populated by the approval flow (it read a
-- non-existent user_profiles.email), and populating it would have leaked
-- every owner's email: restaurants_read_published lets anon read all columns
-- of published restaurants, and a table-wide SELECT grant can't hide one
-- column. Emails now stay in auth.users; admins fetch them through
-- admin_user_emails(), and ownership is only ever owner_id.

create or replace function public.admin_user_emails(p_ids uuid[])
returns table (id uuid, email text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can look up user emails' using errcode = '42501';
  end if;

  return query
  select u.id, u.email::text
  from auth.users u
  where u.id = any(p_ids);
end;
$$;

revoke execute on function public.admin_user_emails(uuid[]) from public, anon;
grant execute on function public.admin_user_emails(uuid[]) to authenticated;

-- Same guard as 20260926162122, minus the dropped owner_email column.
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

alter table public.restaurants drop column owner_email;
