"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;

  if (!name || name.trim() === "") {
    throw new Error("Name is required");
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
    });

    revalidatePath("/profile");
    revalidatePath("/", "layout"); // Revalidate layout to update user menu
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw new Error("An error occurred while updating your profile");
  }
}

import { createClient } from "@/lib/supabase/server";

export async function updatePasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  
  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("Failed to update password:", error);
    throw new Error(error.message || "Failed to update password.");
  }

  return { success: true };
}

export async function verifyPasswordAction(password: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createClient();
  
  // Verify old password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (signInError) {
    throw new Error("Incorrect current password.");
  }

  return { success: true };
}
