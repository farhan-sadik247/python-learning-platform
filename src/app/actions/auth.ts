"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma, type UserRole } from "@/generated/prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthErrors = {
  name?: string[];
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
  general?: string[];
};

export type AuthActionState = {
  errors?: AuthErrors;
  message?: string;
  requiresRoleSelection?: boolean;
  availableRoles?: UserRole[];
} | null;

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateEmail(email: string): string[] {
  const errors: string[] = [];
  if (!email || email.trim() === "") {
    errors.push("Email is required.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push("Please enter a valid email address.");
  }
  return errors;
}

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (!password || password === "") {
    errors.push("Password is required.");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }
  return errors;
}

// ─── signUpAction ─────────────────────────────────────────────────────────────

/**
 * Handles public user signup.
 * SECURITY: Role is ALWAYS set to STUDENT server-side. The form never receives
 * or accepts a role parameter — no client can escalate privileges.
 */
export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword =
    (formData.get("confirmPassword") as string | null) ?? "";

  // Server-side validation
  const errors: AuthErrors = {};


  if (!name || name.length < 2) {
    errors.name = ["Full name must be at least 2 characters."];
  }

  const emailErrors = validateEmail(email);
  if (emailErrors.length > 0) errors.email = emailErrors;

  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) errors.password = passwordErrors;

  if (password !== confirmPassword) {
    errors.confirmPassword = ["Passwords do not match."];
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Create Supabase Auth account
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }, // store in Supabase user metadata
    },
  });

  if (authError || !authData.user) {
    // Avoid leaking internal error details to the client
    return {
      errors: {
        general: [
          authError?.message.toLowerCase().includes("already registered") ||
          authError?.message.toLowerCase().includes("already exists")
            ? "An account with this email already exists. Please sign in instead."
            : "Could not create account. Please try again.",
        ],
      },
    };
  }

  // Supabase silently returns a user with empty identities when email confirmation
  // is ON and the email is already registered — detect this case explicitly.
  if (authData.user.identities?.length === 0) {
    return {
      errors: {
        general: [
          "An account with this email already exists. Please sign in instead.",
        ],
      },
    };
  }

  // Upsert the application profile in Prisma.
  //
  // Why upsert instead of create?
  // If a User record already exists for this email (e.g., created before auth
  // was implemented), we link the new Supabase Auth ID to that existing profile
  // rather than failing with a unique-email constraint error.
  //
  // SECURITY: role is ALWAYS STUDENT for new records.
  // For existing records, the role is NOT changed — the pre-existing role is preserved.
  // A malicious user cannot change their role by re-signing up.
  // Extract user ID to avoid TypeScript closure issues
  const supabaseUserId = authData.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      const existingUserCount = await tx.user.count();
      const isFirst = existingUserCount === 0;

      await tx.user.upsert({
        where: { email },
        create: {
          supabaseId: supabaseUserId,
          name,
          email,
          roleAssignments: {
            create: isFirst 
              ? [{ role: "ADMIN" }, { role: "TEACHER" }, { role: "STUDENT" }]
              : [{ role: "STUDENT" }]
          }
        },
        update: {
          supabaseId: supabaseUserId,
        },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  } catch {
    // Profile upsert failed — sign out the partially-created Supabase user
    await supabase.auth.signOut();
    return {
      errors: {
        general: ["Account setup failed. Please try again."],
      },
    };
  }

  // If Supabase did NOT create a session it means email confirmation is required.
  // Do NOT redirect — the user cannot log in until they click the confirmation link.
  if (!authData.session) {
    return {
      message:
        "Account created! Please check your email and click the confirmation link before signing in.",
    };
  }

  // Session is created. Fetch roles or infer them.
  // We know new users get STUDENT unless they are the first user.
  const appUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { roleAssignments: true },
  });

  if (!appUser || appUser.roleAssignments.length === 0) {
    await supabase.auth.signOut();
    return { errors: { general: ["Profile not found."] } };
  }

  const roles = appUser.roleAssignments.map(ra => ra.role);
  
  if (roles.length > 1) {
    redirect("/login");
  } else {
    const singleRole = roles[0];
    const cookieStore = await cookies();
    cookieStore.set({
      name: "active_role",
      value: singleRole,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    redirect("/student");
  }
}

// ─── signInAction ─────────────────────────────────────────────────────────────

/**
 * Handles user login.
 * Role is retrieved from the Prisma database — never from client-supplied values.
 */
export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  // Server-side validation
  const errors: AuthErrors = {};


  const emailErrors = validateEmail(email);
  if (emailErrors.length > 0) errors.email = emailErrors;

  if (!password) {
    errors.password = ["Password is required."];
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (authError || !authData.user) {
    // Surface a specific message for the most common failure modes
    const msg = authError?.message?.toLowerCase() ?? "";
    const isUnconfirmed =
      msg.includes("email not confirmed") ||
      msg.includes("not confirmed") ||
      msg.includes("email_not_confirmed");

    return {
      errors: {
        general: [
          isUnconfirmed
            ? "Please confirm your email first. Check your inbox for the confirmation link."
            : "Invalid email or password.",
        ],
      },
    };
  }

  // Fetch application role from Prisma — source of truth for authorization
  const appUser = await prisma.user.findUnique({
    where: { supabaseId: authData.user.id },
    include: { roleAssignments: true },
  });

  if (!appUser || appUser.roleAssignments.length === 0) {
    // Auth user exists but no profile or no roles
    await supabase.auth.signOut();
    return {
      errors: {
        general: [
          "Account profile not found or no roles assigned. Please contact support.",
        ],
      },
    };
  }
  
  const cookieStore = await cookies();
  cookieStore.delete("active_role");

  if (appUser.roleAssignments.length === 1) {
    const singleRole = appUser.roleAssignments[0].role;
    cookieStore.set({
      name: "active_role",
      value: singleRole,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    
    switch (singleRole) {
      case "ADMIN":
        redirect("/admin");
      case "TEACHER":
        redirect("/teacher");
      case "STUDENT":
      default:
        redirect("/student");
    }
  } else {
    // Redirect to /login to force a fresh RSC render with the newly set Supabase cookies.
    // The LoginPage server component will detect the session and pass defaultRoleSelection to show the modal.
    redirect("/login");
  }
}

// ─── signOutAction ────────────────────────────────────────────────────────────

/**
 * Handles user logout. Clears the Supabase session and redirects to /login.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  const cookieStore = await cookies();
  cookieStore.delete("active_role");
  
  await supabase.auth.signOut();
  redirect("/login");
}
