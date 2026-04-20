"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAuthConfig } from "./config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseAuthConfig();

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
