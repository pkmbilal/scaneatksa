-- Hotfix for 20260926174654_advisor_hardening.
--
-- Wrapping auth.uid() as (select auth.uid()) in user_profiles_read_own made
-- every UPDATE on user_profiles by a non-admin fail with "infinite recursion
-- detected in policy for relation user_profiles": user_profiles_update_own's
-- WITH CHECK reads user_profiles again (the role-pinning subquery), and with
-- the sub-select form of this SELECT policy Postgres flags that as recursive.
-- Restored to the original bare auth.uid() form, which works. This one policy
-- keeps its auth_rls_initplan advisor warning (single-row lookup by PK -- no
-- practical cost).
drop policy if exists user_profiles_read_own on public.user_profiles;
create policy user_profiles_read_own on public.user_profiles
  for select to authenticated
  using (id = auth.uid());
