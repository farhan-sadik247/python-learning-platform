"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function addRoleAction(userId: string, role: UserRole) {
  await requireRole(["ADMIN"]);

  if (!userId || !role) {
    throw new Error("Missing required fields");
  }

  // Verify user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Add role
  try {
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_role: {
          userId,
          role
        }
      },
      update: {},
      create: {
        userId,
        role
      }
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding role:", error);
    throw new Error("Failed to add role");
  }
}

export async function removeRoleAction(userId: string, role: UserRole) {
  await requireRole(["ADMIN"]);

  if (!userId || !role) {
    throw new Error("Missing required fields");
  }

  // Admin protection
  if (role === "ADMIN") {
    const adminCount = await prisma.userRoleAssignment.count({
      where: { role: "ADMIN" }
    });

    if (adminCount <= 1) {
      throw new Error("Cannot remove the last ADMIN user.");
    }
  }

  try {
    await prisma.userRoleAssignment.delete({
      where: {
        userId_role: {
          userId,
          role
        }
      }
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2025') {
      // Record to delete does not exist. That's fine, consider it a success.
      return { success: true };
    }
    console.error("Error removing role:", error);
    throw new Error("Failed to remove role");
  }
}
