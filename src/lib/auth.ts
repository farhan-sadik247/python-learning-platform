import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppUser = {
  id: string;
  supabaseId: string;
  name: string;
  email: string;
  role: UserRole;
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
  });

  if (!appUser) {
    return null;
  }

  return appUser;
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

  if (!allowedRoles.includes(user.role)) {
    // Redirect to the user's own dashboard instead of a generic 403
    switch (user.role) {
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
