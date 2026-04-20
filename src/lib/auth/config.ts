function normalizeSupabaseUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);

    if (
      parsed.hostname === "supabase.com" &&
      parsed.pathname.startsWith("/dashboard/project/")
    ) {
      const projectRef = parsed.pathname.split("/").filter(Boolean).at(-1);
      if (projectRef) {
        return `https://${projectRef}.supabase.co`;
      }
    }

    return parsed.origin;
  } catch {
    return rawUrl;
  }
}

export function hasSupabaseAuthConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseAuthConfig() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || !anonKey) {
    throw new Error(
      "Missing auth configuration. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
    );
  }

  return { url: normalizeSupabaseUrl(rawUrl), anonKey };
}
