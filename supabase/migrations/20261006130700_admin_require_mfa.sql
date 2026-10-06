-- Admin privileges require a second factor (TOTP).
--
-- Every admin permission in the database -- the *_admin_all RLS policies,
-- the guard triggers (via is_privileged_writer), the admin_* RPCs and the
-- audit log -- goes through is_admin(), so requiring aal2 here means a
-- stolen admin password alone (an aal1 session) gets no admin access.
-- The app routes admins through /auth/mfa after sign-in, and requireAdmin()
-- (lib/auth/admin.js) applies the same check to /api/admin/*.
--
-- ROLLOUT: apply only after the admin has enrolled TOTP at /auth/mfa,
-- otherwise their dashboard writes fail until they do.
--
-- RECOVERY (lost authenticator): remove the factor in the Supabase
-- dashboard (Authentication -> Users -> user -> MFA factors) or run
--   delete from auth.mfa_factors where user_id = '<admin uuid>';
-- then sign in and enroll again at /auth/mfa.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (
       select 1
         from public.user_profiles up
        where up.id = auth.uid()
          and up.role = 'admin'
          and coalesce(up.is_active, true) = true
     );
$$;
