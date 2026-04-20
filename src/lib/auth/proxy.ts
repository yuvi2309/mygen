import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthConfig, hasSupabaseAuthConfig } from "./config";

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseAuthConfig()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseAuthConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const pathname = request.nextUrl.pathname;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (pathname === "/auth" && user) {
      const requestedNext = request.nextUrl.searchParams.get("next");
      const safeNext = requestedNext?.startsWith("/") ? requestedNext : "/chat";
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
  } catch {
    return NextResponse.next({ request });
  }

  return response;
}
