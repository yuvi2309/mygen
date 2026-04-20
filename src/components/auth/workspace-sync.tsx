"use client";

import { useEffect } from "react";
import { syncAuthenticatedWorkspaceUser } from "@/lib/store";

type WorkspaceSyncProps = {
  userId: string;
  name?: string | null;
  email?: string | null;
};

export function WorkspaceSync({ userId, name, email }: WorkspaceSyncProps) {
  useEffect(() => {
    syncAuthenticatedWorkspaceUser({
      id: userId,
      name: name ?? undefined,
      email: email ?? undefined,
    });
  }, [email, name, userId]);

  return null;
}
