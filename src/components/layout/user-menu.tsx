"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { LogOut, User } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { AppUser } from "@/lib/auth";
import Link from "next/link";

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
      <DropdownMenuContent className="w-64 p-2 bg-card border-border" align="end" sideOffset={8}>
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 overflow-hidden">
            <p className="text-sm font-semibold leading-none text-foreground truncate">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
            <p className="text-xs font-bold text-[#00A8E8] tracking-wide mt-1">
              {user.activeRole}
            </p>
          </div>
        </div>
        
        <DropdownMenuSeparator className="my-1 bg-border" />
        
        <Link href="/profile" className="w-full block">
          <DropdownMenuItem className="cursor-pointer py-2.5 px-3 rounded-md transition-colors focus:bg-muted focus:text-foreground">
            <User className="mr-2 h-4 w-4" />
            <span className="font-medium">Profile</span>
          </DropdownMenuItem>
        </Link>
        
        <DropdownMenuSeparator className="my-1 bg-border" />
        
        <DropdownMenuItem 
          onClick={() => signOutAction()}
          className="cursor-pointer py-2.5 px-3 rounded-md text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/50 dark:focus:text-red-300 transition-colors mt-1"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
