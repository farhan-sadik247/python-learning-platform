import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Python Learning Platform — Sign In",
  description: "Sign in or create an account to start learning Python.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-root">
      {children}
    </div>
  );
}
