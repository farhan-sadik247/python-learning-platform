"use client";

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

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "#", label: "Users", icon: Users, disabled: true },
    { href: "#", label: "Teachers", icon: GraduationCap, disabled: true },
    { href: "#", label: "Students", icon: Users, disabled: true },
    { href: "#", label: "Courses", icon: BookOpen, disabled: true },
    { href: "#", label: "Settings", icon: Settings, disabled: true },
  ];

  const teacherLinks = [
    { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
    { href: "#", label: "Courses", icon: BookOpen, disabled: true },
    { href: "#", label: "Lessons", icon: FileCode, disabled: true },
    { href: "#", label: "Problems", icon: Code, disabled: true },
    { href: "#", label: "Assignments", icon: FileCode, disabled: true },
    { href: "#", label: "Students", icon: Users, disabled: true },
    { href: "#", label: "Progress", icon: CheckCircle, disabled: true },
  ];

  const studentLinks = [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "#", label: "My Learning", icon: BookOpen, disabled: true },
    { href: "#", label: "Lessons", icon: FileCode, disabled: true },
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
    <div className="flex h-full flex-col bg-[#0B1220] border-r border-[#263244] w-64 text-slate-300">
      <div className="flex h-16 items-center px-6 border-b border-[#263244]">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
          <Code className="h-6 w-6 text-[#00A8E8]" />
          <span>Python Platform</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="grid gap-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <li key={link.label}>
                {link.disabled ? (
                  <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed">
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-white hover:bg-[#111827]",
                      isActive
                        ? "bg-[#111827] text-white"
                        : "text-slate-400"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-[#00A8E8]" : "")} />
                    <span>{link.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
