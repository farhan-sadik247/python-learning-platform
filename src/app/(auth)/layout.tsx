import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "codeWithFarhan — Sign In",
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
