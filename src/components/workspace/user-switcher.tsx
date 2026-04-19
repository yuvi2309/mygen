"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, UserCircle2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Button } from "@/components/ui/button";
import {
  createWorkspaceUser,
  getCurrentUser,
  getWorkspaceUsers,
  setCurrentUser,
  type WorkspaceUser,
} from "@/lib/store";

export function UserSwitcher() {
  const router = useRouter();
  const [users, setUsers] = useState<WorkspaceUser[]>(() => getWorkspaceUsers());
  const [currentUserId, setCurrentUserId] = useState(() => getCurrentUser().id);

  useEffect(() => {
    const handler = () => {
      setUsers(getWorkspaceUsers());
      setCurrentUserId(getCurrentUser().id);
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0];

  function handleCreateUser() {
    const name = window.prompt("New workspace user name");
    if (!name?.trim()) return;
    const user = createWorkspaceUser(name);
    setUsers(getWorkspaceUsers());
    setCurrentUserId(user.id);
  }

  function handleSwitchUser(userId: string) {
    const next = setCurrentUser(userId);
    if (!next) return;
    setCurrentUserId(next.id);
    router.replace("/chat");
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <UserCircle2 className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{currentUser?.name ?? "User"}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[200px] rounded-md border bg-popover p-1 shadow-md"
          side="bottom"
          align="start"
          sideOffset={8}
        >
          {users.map((user) => (
            <DropdownMenu.Item
              key={user.id}
              className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent"
              onSelect={() => handleSwitchUser(user.id)}
            >
              <span className="truncate">{user.name}</span>
              {user.id === currentUserId && <span className="ml-auto text-xs text-muted-foreground">Current</span>}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent"
            onSelect={handleCreateUser}
          >
            <Plus className="h-3.5 w-3.5" />
            Add user workspace
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
