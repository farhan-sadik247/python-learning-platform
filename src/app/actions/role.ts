"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";

/**
 * Validates and sets the active role for the authenticated user.
 */
export async function selectRoleAction(role: UserRole): Promise<{ success: boolean; redirectTo: string }> {
  const supabase = await createClient();
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

  if (error || !supabaseUser) {
    redirect("/login");
  }

  const appUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { roleAssignments: true },
  });

  if (!appUser) {
    redirect("/login");
  }

  const assignedRoles = appUser.roleAssignments.map(ra => ra.role);

  if (!assignedRoles.includes(role)) {
    // If they ask for an unassigned role, just reject and stay/go to login
    redirect("/login");
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: "active_role",
    value: role,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  switch (role) {
    case "ADMIN":
      return { success: true, redirectTo: "/admin" };
    case "TEACHER":
      return { success: true, redirectTo: "/teacher" };
    case "STUDENT":
    default:
      return { success: true, redirectTo: "/student" };
  }
}
