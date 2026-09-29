-- Proof-of-business for restaurant owner requests.
--
-- Applicants must supply a Saudi Commercial Registration (CR) number, a CR
-- certificate (uploaded to the private R2 bucket, see
-- app/api/uploads/presign/route.js kind "restaurant-request-doc"), a Google
-- Maps link and optionally a ZATCA VAT number. An admin checks these and marks
-- the request verified; only then can it be approved, and approval is one
-- atomic RPC instead of three client-side writes.

-- ---------------------------------------------------------------------------
-- Columns + format checks (keep regexes in sync with lib/restaurantVerification.js)
-- ---------------------------------------------------------------------------
alter table public.restaurant_requests
  add column if not exists cr_number text,
  add column if not exists vat_number text,
  add column if not exists maps_url text,
  add column if not exists cr_document_path text,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null;

alter table public.restaurant_requests
  add constraint restaurant_requests_cr_number_format
    check (cr_number ~ '^[0-9]{10}$'),
  add constraint restaurant_requests_vat_number_format
    check (vat_number ~ '^3[0-9]{13}3$'),
  add constraint restaurant_requests_maps_url_format
    check (maps_url ~* '^https://(www\.)?(google\.[a-z.]+/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl/maps)');

create index if not exists restaurant_requests_verified_by_idx
  on public.restaurant_requests (verified_by);

-- One open request per user (was only enforced in the UI).
create unique index if not exists restaurant_requests_one_pending_per_user
  on public.restaurant_requests (user_id) where status = 'pending';

-- A CR can back at most one open/approved request...
create unique index if not exists restaurant_requests_cr_number_active
  on public.restaurant_requests (cr_number) where status in ('pending', 'approved');

-- ...and at most one restaurant.
alter table public.restaurants
  add column if not exists cr_number text;

create unique index if not exists restaurants_cr_number_key
  on public.restaurants (cr_number) where cr_number is not null;

-- ---------------------------------------------------------------------------
-- Guard trigger
-- ---------------------------------------------------------------------------

-- auth.users isn't readable by `authenticated`; this exposes only the
-- caller's own confirmation state.
create or replace function public.current_user_email_confirmed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select u.email_confirmed_at is not null from auth.users u where u.id = auth.uid()),
    false
  );
$$;

revoke execute on function public.current_user_email_confirmed() from public, anon;
grant execute on function public.current_user_email_confirmed() to authenticated;

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

  if new.cr_number is null or new.maps_url is null or new.cr_document_path is null then
    raise exception 'verification_fields_required' using errcode = '23502';
  end if;

  -- Must point into the caller's own folder in the private bucket.
  if new.cr_document_path !~ (
    '^restaurant-requests/' || auth.uid()::text || '/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$'
  ) then
    raise exception 'invalid_document_path' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists restaurant_requests_guard on public.restaurant_requests;
create trigger restaurant_requests_guard
  before insert or update on public.restaurant_requests
  for each row execute function public.restaurant_requests_guard();

-- ---------------------------------------------------------------------------
-- Admin RPCs
-- ---------------------------------------------------------------------------
create or replace function public.admin_verify_restaurant_request(
  p_request_id uuid,
  p_verified boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.restaurant_requests
     set verified_at = case when p_verified then now() end,
         verified_by = case when p_verified then auth.uid() end
   where id = p_request_id
     and status = 'pending';

  if not found then
    raise exception 'request_not_pending' using errcode = 'P0002';
  end if;
end;
$$;

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
    name, slug, phone, address, city, owner_id, cr_number,
    is_active, approved_at,
    subscription_status, subscription_started_at, subscription_expires_at, trial_used
  ) values (
    v_req.restaurant_name, v_slug, v_req.phone, v_req.address, v_req.city, v_req.user_id, v_req.cr_number,
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

revoke execute on function public.admin_verify_restaurant_request(uuid, boolean) from public, anon;
revoke execute on function public.admin_approve_restaurant_request(uuid) from public, anon;
grant execute on function public.admin_verify_restaurant_request(uuid, boolean) to authenticated;
grant execute on function public.admin_approve_restaurant_request(uuid) to authenticated;
