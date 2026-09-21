import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Sign In — Python Learning Platform",
  description: "Sign in to your Python Learning Platform account.",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  
  if (user && user.activeRole) {
    switch(user.activeRole) {
      case "ADMIN": redirect("/admin"); break;
      case "TEACHER": redirect("/teacher"); break;
      default: redirect("/student"); break;
    }
  }

  if (user && !user.activeRole && user.roleAssignments.length > 1) {
    return <LoginPageClient defaultRoleSelection={{ availableRoles: user.roleAssignments }} />;
  }

  return <LoginPageClient />;
}
