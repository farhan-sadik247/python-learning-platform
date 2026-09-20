import type { Metadata } from "next";
import SignupPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Create Account — Python Learning Platform",
  description: "Create a free account to start learning Python.",
};

export default function SignupPage() {
  return <SignupPageClient />;
}
