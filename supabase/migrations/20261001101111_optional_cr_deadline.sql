-- CR number + CR certificate become optional on owner requests.
--
-- A restaurant approved without both gets cr_deadline_at = approval + 7 days
-- (CR_DEADLINE_DAYS in lib/restaurantVerification.js). The owner submits them
-- later from the dashboard (owner_submit_cr); an admin then verifies them
-- (admin_verify_restaurant_cr). Past the deadline without a verified CR, the
-- restaurant goes dark to the public exactly like a lapsed subscription
-- (is_restaurant_published + restaurants_read_published) -- the owner keeps
-- dashboard access. Restaurants with cr_deadline_at NULL are unaffected.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------
alter table public.restaurants
  add column if not exists cr_document_path text,
  add column if not exists cr_deadline_at timestamptz,
  add column if not exists cr_submitted_at timestamptz,
  add column if not exists cr_verified_at timestamptz,
  add column if not exists cr_verified_by uuid references auth.users(id) on delete set null;

alter table public.restaurants
  add constraint restaurants_cr_number_format
    check (cr_number ~ '^[0-9]{10}$') not valid;

create index if not exists restaurants_cr_verified_by_idx
  on public.restaurants (cr_verified_by);

-- ---------------------------------------------------------------------------
-- Request guard: CR number + document no longer required
-- ---------------------------------------------------------------------------
create or replace function public.restaurant_requests_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    raise exception 'Not allowed to modify restaurant requests'
      using errcode = '42501';
  end if;

  -- INSERT by an applicant: review/verification fields are admin-only.
  new.status := 'pending';
  new.reviewed_at := null;
  new.reviewed_by := null;
  new.rejection_reason := null;
  new.verified_at := null;
  new.verified_by := null;

  if not public.current_user_email_confirmed() then
    raise exception 'email_not_verified' using errcode = '42501';
  end if;

  if new.maps_url is null then
    raise exception 'verification_fields_required' using errcode = '23502';
  end if;

  -- Optional, but when present must point into the caller's own folder in
  -- the private bucket.
  if new.cr_document_path is not null and new.cr_document_path !~ (
    '^restaurant-requests/' || auth.uid()::text || '/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$'
  ) then
    raise exception 'invalid_document_path' using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Restaurant guard: CR fields are admin/RPC-only
-- ---------------------------------------------------------------------------
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
     or new.trial_used is distinct from old.trial_used
     or new.cr_number is distinct from old.cr_number
     or new.cr_document_path is distinct from old.cr_document_path
     or new.cr_deadline_at is distinct from old.cr_deadline_at
     or new.cr_submitted_at is distinct from old.cr_submitted_at
     or new.cr_verified_at is distinct from old.cr_verified_at
     or new.cr_verified_by is distinct from old.cr_verified_by then
    raise exception 'Not allowed to change ownership, approval, subscription or CR fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Publish rule: + CR deadline clause
-- ---------------------------------------------------------------------------
create or replace function public.is_restaurant_published(rid uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = rid
      and r.approved_at is not null
      and coalesce(r.is_active, false) = true
      and coalesce(r.subscription_status, 'trial') <> 'suspended'
      and (r.subscription_expires_at is null or r.subscription_expires_at > now() - interval '7 days')
      and (r.cr_verified_at is not null or r.cr_deadline_at is null or r.cr_deadline_at > now())
  );
$$;

drop policy if exists restaurants_read_published on public.restaurants;
create policy restaurants_read_published on public.restaurants
  for select to anon, authenticated
  using (
    approved_at is not null
    and coalesce(is_active, false)
    and coalesce(subscription_status, 'trial') <> 'suspended'
    and (subscription_expires_at is null or subscription_expires_at > now() - interval '7 days')
    and (cr_verified_at is not null or cr_deadline_at is null or cr_deadline_at > now())
  );

-- ---------------------------------------------------------------------------
-- Approval: carry CR over, start the 7-day clock when it's missing
-- ---------------------------------------------------------------------------
create or replace function public.admin_approve_restaurant_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.restaurant_requests%rowtype;
  v_base text;
  v_slug text;
  v_n int := 1;
  v_restaurant_id uuid;
  v_has_cr boolean;
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  select * into v_req
    from public.restaurant_requests
   where id = p_request_id
   for update;

  if not found or v_req.status <> 'pending' then
    raise exception 'request_not_pending' using errcode = 'P0002';
  end if;

  if v_req.verified_at is null then
    raise exception 'request_not_verified' using errcode = '42501';
  end if;

  v_has_cr := v_req.cr_number is not null and v_req.cr_document_path is not null;

  v_base := trim(both '-' from regexp_replace(lower(v_req.restaurant_name), '[^a-z0-9]+', '-', 'g'));
  if v_base = '' then
    v_base := 'restaurant';
  end if;

  v_slug := v_base;
  while exists (select 1 from public.restaurants r where r.slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  -- Every newly approved restaurant starts on a 30-day free trial
  -- (mirrors lib/subscription.js freshTrialExpiry).
  insert into public.restaurants (
    name, slug, phone, address, city, owner_id,
    cr_number, cr_document_path, cr_submitted_at, cr_verified_at, cr_verified_by, cr_deadline_at,
    is_active, approved_at,
    subscription_status, subscription_started_at, subscription_expires_at, trial_used
  ) values (
    v_req.restaurant_name, v_slug, v_req.phone, v_req.address, v_req.city, v_req.user_id,
    v_req.cr_number, v_req.cr_document_path,
    case when v_req.cr_document_path is not null then v_req.created_at end,
    case when v_has_cr then now() end,
    case when v_has_cr then auth.uid() end,
    case when v_has_cr then null else now() + interval '7 days' end,
    true, now(),
    'trial', now(), now() + interval '30 days', true
  )
  returning id into v_restaurant_id;

  update public.user_profiles
     set role = 'owner'
   where id = v_req.user_id;

  update public.restaurant_requests
     set status = 'approved',
         reviewed_at = now(),
         reviewed_by = auth.uid()
   where id = p_request_id;

  return v_restaurant_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Owner: submit CR after approval
-- ---------------------------------------------------------------------------
create or replace function public.owner_submit_cr(p_cr_number text, p_document_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if p_cr_number is null or p_cr_number !~ '^[0-9]{10}$' then
    raise exception 'cr_number_format' using errcode = '23514';
  end if;

  if p_document_path is null or p_document_path !~ (
    '^restaurant-requests/' || v_uid::text || '/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$'
  ) then
    raise exception 'invalid_document_path' using errcode = '42501';
  end if;

  update public.restaurants
     set cr_number = p_cr_number,
         cr_document_path = p_document_path,
         cr_submitted_at = now(),
         cr_verified_at = null,
         cr_verified_by = null
   where owner_id = v_uid
     and cr_verified_at is null;

  if not found then
    raise exception 'restaurant_not_found_or_verified' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin: verify / reject a post-approval CR
-- ---------------------------------------------------------------------------
create or replace function public.admin_verify_restaurant_cr(p_restaurant_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if p_verified then
    update public.restaurants
       set cr_verified_at = now(),
           cr_verified_by = auth.uid()
     where id = p_restaurant_id
       and cr_number is not null
       and cr_document_path is not null;
  else
    -- Rejected: clear the submission so the owner re-uploads. The deadline is
    -- left as-is.
    update public.restaurants
       set cr_document_path = null,
           cr_submitted_at = null,
           cr_verified_at = null,
           cr_verified_by = null
     where id = p_restaurant_id;
  end if;

  if not found then
    raise exception 'cr_not_submitted' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.owner_submit_cr(text, text) from public, anon;
revoke execute on function public.admin_verify_restaurant_cr(uuid, boolean) from public, anon;
grant execute on function public.owner_submit_cr(text, text) to authenticated;
grant execute on function public.admin_verify_restaurant_cr(uuid, boolean) to authenticated;
