import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { UserSwitcher } from "@/components/workspace/user-switcher";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 items-center justify-between gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <UserSwitcher />
          </header>
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
