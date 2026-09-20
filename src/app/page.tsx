import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Root page — redirects to the appropriate destination based on auth status.
 * Authenticated users go to their role dashboard.
 * Unauthenticated users go to /login.
 */
export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

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