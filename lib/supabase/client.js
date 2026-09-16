"use client";

import { createBrowserClient } from "@supabase/ssr";

// Memoized so every caller shares one GoTrueClient -- creating a fresh
// instance per call site (as this used to do) means each one runs its own
// independent token-refresh timer/lock against the same session cookies.
// When several of those instances race to refresh a near-expiry token
// concurrently, Supabase's refresh-token rotation lets only the first
// succeed; the rest get "Invalid Refresh Token: Already Used" and clear
// their session, which reads as a spurious logout on the next auth check.
let client;

export function supabaseBrowser() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return client;
}