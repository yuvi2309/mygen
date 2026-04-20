import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { UserSwitcher } from "@/components/workspace/user-switcher";
import { WorkspaceSync } from "@/components/auth/workspace-sync";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAuthenticatedUser } from "@/lib/auth/supabase-server";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  const displayName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user?.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

  return (
    <TooltipProvider>
      <WorkspaceSync userId={user?.id ?? "guest"} name={displayName} email={user?.email ?? null} />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 items-center justify-between gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <UserSwitcher userId={user?.id ?? "guest"} name={displayName} email={user?.email ?? null} />
          </header>
          <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
