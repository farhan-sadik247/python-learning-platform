import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import { UserMenu } from "./user-menu";
import { AppUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

interface AppHeaderProps {
  user: AppUser;
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile Sidebar Trigger */}
      <Sheet>
        <SheetTrigger
          className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-card h-10 w-10 flex items-center justify-center rounded-md outline-none"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-border bg-background">
          <AppSidebar role={user.activeRole!} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <Image src="/assets/python-logo.png" alt="Logo" width={24} height={24} />
            <h1 className="text-sm font-semibold leading-6 text-foreground">
              codeWithFarhan
            </h1>
          </div>
          <div className="hidden lg:block flex-1" />
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
