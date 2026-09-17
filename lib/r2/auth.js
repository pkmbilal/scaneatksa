import { createClient } from "@supabase/supabase-js";

// Shared by every /api/uploads/* route -- resolves the caller's Supabase user
// id from the request's Authorization header. Server-only.
export async function getAuthedUserId(req) {
  const authHeader = req.headers.get("authorization") || "";
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error } = await supabaseUser.auth.getUser();
  return { userId: userData?.user?.id || null, error };
}
