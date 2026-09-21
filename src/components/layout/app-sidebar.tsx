"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma/client";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Settings,
  Code,
  FileCode,
  CheckCircle,
} from "lucide-react";

interface AppSidebarProps {
  role: UserRole;
}

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/courses", label: "Courses", icon: BookOpen },
    { href: "#", label: "Users", icon: Users, disabled: true },
    { href: "#", label: "Teachers", icon: GraduationCap, disabled: true },
    { href: "#", label: "Students", icon: Users, disabled: true },
    { href: "#", label: "Settings", icon: Settings, disabled: true },
  ];

  const teacherLinks = [
    { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teacher/courses", label: "Courses & Lessons", icon: BookOpen },
    { href: "#", label: "Problems", icon: Code, disabled: true },
    { href: "#", label: "Assignments", icon: FileCode, disabled: true },
    { href: "#", label: "Students", icon: Users, disabled: true },
    { href: "#", label: "Progress", icon: CheckCircle, disabled: true },
  ];

  const studentLinks = [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/courses", label: "Available Courses", icon: BookOpen },
    { href: "#", label: "My Learning", icon: BookOpen, disabled: true },
    { href: "#", label: "Practice", icon: Code, disabled: true },
    { href: "#", label: "Assignments", icon: FileCode, disabled: true },
    { href: "#", label: "Progress", icon: CheckCircle, disabled: true },
  ];

  const links =
    role === "ADMIN"
      ? adminLinks
      : role === "TEACHER"
      ? teacherLinks
      : studentLinks;

  return (
    <div className={cn(
      "flex h-full flex-col bg-background border-r border-border text-muted-foreground transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn("flex h-16 items-center border-b border-border transition-all duration-300", isCollapsed ? "justify-center px-0" : "justify-between px-4")}>
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground overflow-hidden whitespace-nowrap">
            <Code className="h-6 w-6 text-primary shrink-0" />
            <span>Python Platform</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/" className="flex items-center justify-center">
            <Code className="h-6 w-6 text-primary shrink-0" />
          </Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
        <ul className="grid gap-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <li key={link.label}>
                {link.disabled ? (
                  <div className={cn(
                    "flex items-center rounded-md py-2 text-sm font-medium text-muted-foreground cursor-not-allowed",
                    isCollapsed ? "justify-center px-0" : "gap-3 px-3"
                  )} title={isCollapsed ? link.label : undefined}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="whitespace-nowrap">{link.label}</span>}
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center rounded-md py-2 text-sm font-medium transition-colors hover:text-foreground hover:bg-card",
                      isActive
                        ? "bg-card text-foreground"
                        : "text-muted-foreground",
                      isCollapsed ? "justify-center px-0" : "gap-3 px-3"
                    )}
                    title={isCollapsed ? link.label : undefined}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "")} />
                    {!isCollapsed && <span className="whitespace-nowrap">{link.label}</span>}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="border-t border-border p-3 flex justify-center">
         <button 
           onClick={() => setIsCollapsed(!isCollapsed)} 
           className="p-2 rounded-md hover:bg-card text-muted-foreground hover:text-foreground transition-colors w-full flex justify-center items-center gap-2"
           title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
         >
           {isCollapsed ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 18 6-6-6-6"/><path d="m5 18 6-6-6-6"/></svg>
           ) : (
             <>
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 18-6-6 6-6"/><path d="m19 18-6-6 6-6"/></svg>
               <span className="text-sm font-medium">Collapse</span>
             </>
           )}
         </button>
      </div>
    </div>
  );
}
