import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { hasSupabaseAuthConfig } from "@/lib/auth/config";
import { getAuthenticatedUser } from "@/lib/auth/supabase-server";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getAuthenticatedUser();
  const resolvedSearchParams = await searchParams;
  const nextPath = resolvedSearchParams.next?.startsWith("/")
    ? resolvedSearchParams.next
    : "/chat";

  if (user) {
    redirect(nextPath);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-10">
      <div className="w-full max-w-5xl gap-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="mb-8 space-y-4 lg:mb-0">
          <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            Multi-user access
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Sign in securely to your personal AI workspace.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              This setup supports email and password accounts, verification-ready sign-up, optional Google auth,
              and protected workspace routes so each user gets a separate session.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Protected chat and agent routes</li>
            <li>• Email verification flow through the auth provider</li>
            <li>• Optional Google login once enabled in provider settings</li>
            <li>• Secure cookie-based session handling</li>
          </ul>
        </section>

        <AuthForm configured={hasSupabaseAuthConfig()} nextPath={nextPath} />
      </div>
    </main>
  );
}
