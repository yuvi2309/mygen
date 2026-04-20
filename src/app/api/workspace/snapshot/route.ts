import { createSupabaseAdminClient } from "@/lib/auth/admin";
import { getAuthenticatedUser } from "@/lib/auth/supabase-server";

async function clearLegacyWorkspaceMetadata(userId: string, userMetadata: Record<string, unknown> | null | undefined) {
  if (!userMetadata || !("mygenWorkspace" in userMetadata)) {
    return;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  const rest = { ...userMetadata };
  delete rest.mygenWorkspace;

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: rest,
  });
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (user) {
    await clearLegacyWorkspaceMetadata(user.id, (user.user_metadata ?? {}) as Record<string, unknown>);
  }

  return Response.json({ snapshot: null, mode: "local-only" });
}

export async function POST() {
  const user = await getAuthenticatedUser();
  if (user) {
    await clearLegacyWorkspaceMetadata(user.id, (user.user_metadata ?? {}) as Record<string, unknown>);
  }

  return Response.json({ ok: true, mode: "local-only" });
}
