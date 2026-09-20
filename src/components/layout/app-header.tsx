import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import { UserMenu } from "./user-menu";
import { AppUser } from "@/lib/auth";

interface AppHeaderProps {
  user: AppUser;
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#263244] bg-[#0B1220] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile Sidebar Trigger */}
      <Sheet>
        <SheetTrigger
          className="lg:hidden text-slate-300 hover:text-white hover:bg-[#111827] h-10 w-10 flex items-center justify-center rounded-md outline-none"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-[#263244] bg-[#0B1220]">
          <AppSidebar role={user.role} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-sm font-semibold leading-6 text-white lg:hidden">
            Python Platform
          </h1>
          <div className="hidden lg:block flex-1" />
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <UserMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
