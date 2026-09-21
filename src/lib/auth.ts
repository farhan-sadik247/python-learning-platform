import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppUser = {
  id: string;
  supabaseId: string;
  name: string;
  email: string;
  roleAssignments: UserRole[];
  activeRole: UserRole | null;
  createdAt: Date;
  updatedAt: Date;
};

// ─── getCurrentUser ───────────────────────────────────────────────────────────

/**
 * Returns the current authenticated application user (Supabase Auth + Prisma profile),
 * or null if the user is unauthenticated or has no profile record.
 *
 * This is the foundation for all authorization checks. Always reads from
 * the database — never trusts client-supplied role values.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();

  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !supabaseUser) {
    return null;
  }

  const appUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { roleAssignments: true },
  });

  if (!appUser) {
    return null;
  }

  const roleAssignments = appUser.roleAssignments.map(ra => ra.role);
  
  const cookieStore = await cookies();
  const activeRoleCookie = cookieStore.get("active_role")?.value as UserRole | undefined;
  
  let activeRole: UserRole | null = null;
  if (activeRoleCookie && roleAssignments.includes(activeRoleCookie)) {
    activeRole = activeRoleCookie;
  } else if (activeRoleCookie) {
    try {
      cookieStore.delete("active_role");
    } catch {
      // Ignore in server components where mutation is not allowed
    }
  }

  return {
    id: appUser.id,
    supabaseId: appUser.supabaseId,
    name: appUser.name,
    email: appUser.email,
    roleAssignments,
    activeRole,
    createdAt: appUser.createdAt,
    updatedAt: appUser.updatedAt,
  };
}

// ─── requireAuth ──────────────────────────────────────────────────────────────

/**
 * Requires the user to be authenticated.
 * Redirects to /login if not authenticated.
 * Returns the AppUser if authenticated.
 */
export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

// ─── requireRole ─────────────────────────────────────────────────────────────

/**
 * Requires the authenticated user to have one of the specified roles.
 * Redirects to /login if unauthenticated.
 * Redirects to their own dashboard if authenticated but unauthorized for this role area.
 *
 * Usage:
 *   await requireRole(["ADMIN"])                    // admin-only
 *   await requireRole(["TEACHER", "ADMIN"])         // teacher or admin
 *   await requireRole(["STUDENT", "TEACHER", "ADMIN"]) // any authenticated user
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AppUser> {
  const user = await requireAuth();

  if (!user.activeRole) {
    if (user.roleAssignments.length > 1) {
      redirect("/login");
    } else if (user.roleAssignments.length === 1) {
      redirect("/login");
    } else {
      redirect("/login");
    }
  }

  if (!allowedRoles.includes(user.activeRole)) {
    // Redirect to the user's active dashboard instead of a generic 403
    switch (user.activeRole) {
      case "ADMIN":
        redirect("/admin");
      case "TEACHER":
        redirect("/teacher");
      case "STUDENT":
      default:
        redirect("/student");
    }
  }

  return user;
}
