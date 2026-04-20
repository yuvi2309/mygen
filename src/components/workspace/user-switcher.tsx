"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, ShieldCheck, UserCircle2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Button } from "@/components/ui/button";
import { clearCurrentUserSelection, syncAuthenticatedWorkspaceUser } from "@/lib/store";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type UserSwitcherProps = {
  userId: string;
  name?: string | null;
  email?: string | null;
};

export function UserSwitcher({ userId, name, email }: UserSwitcherProps) {
  const router = useRouter();
  const displayName = name?.trim() || email || "Account";

  useEffect(() => {
    syncAuthenticatedWorkspaceUser({
      id: userId,
      name: displayName,
      email: email ?? undefined,
    });
  }, [displayName, email, userId]);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    clearCurrentUserSelection();
    router.replace("/auth");
    router.refresh();
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <UserCircle2 className="h-4 w-4" />
          <span className="max-w-[160px] truncate">{displayName}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[220px] rounded-md border bg-popover p-1 shadow-md"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure session active
          </div>
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent"
            onSelect={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
