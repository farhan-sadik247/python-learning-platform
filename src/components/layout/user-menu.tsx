"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { AppUser } from "@/lib/auth";

interface UserMenuProps {
  user: AppUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative h-8 w-8 rounded-full border border-border hover:bg-card outline-none flex items-center justify-center"
      >
        <Avatar className="h-8 w-8 bg-background">
          <AvatarFallback className="bg-transparent text-sm text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card border-border text-slate-200" align="end">
        <div className="px-2 py-1.5 font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-[#00A8E8] mt-1 font-semibold">
              {user.activeRole}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-[#263244]" />
        <DropdownMenuItem disabled className="cursor-not-allowed text-muted-foreground focus:bg-muted focus:text-muted-foreground">
          <User className="mr-2 h-4 w-4" />
          <span>Profile (Coming Soon)</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="cursor-not-allowed text-muted-foreground focus:bg-muted focus:text-muted-foreground">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings (Coming Soon)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#263244]" />
        <DropdownMenuItem 
          onClick={() => signOutAction()}
          className="text-destructive focus:bg-red-400/10 focus:text-red-300 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
