import type { Metadata } from "next";
import LoginPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Sign In — Python Learning Platform",
  description: "Sign in to your Python Learning Platform account.",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
