import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.activeRole) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AppSidebar role={user.activeRole} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader user={user} />
        
        <main className="flex-1 overflow-y-auto bg-background text-muted-foreground">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
