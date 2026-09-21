"use client";

import { useActionState } from "react";
import { signInAction } from "@/app/actions/auth";
import { selectRoleAction } from "@/app/actions/role";
import { AuthToggle } from "@/components/auth/auth-toggle";
import Image from "next/image";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";

import type { AuthActionState } from "@/app/actions/auth";

interface LoginPageClientProps {
  initialState?: AuthActionState;
  defaultRoleSelection?: {
    availableRoles: UserRole[];
  } | null;
}

export default function LoginPageClient({ initialState = null, defaultRoleSelection = null }: LoginPageClientProps = {}) {
  const [state, action, pending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [isPendingRole, startTransition] = useTransition();
  const router = useRouter();

  const handleRoleSelect = (role: UserRole) => {
    startTransition(async () => {
      const res = await selectRoleAction(role);
      if (res.success) {
        router.push(res.redirectTo);
      }
    });
  };

  const needsRoleSelection = state?.requiresRoleSelection || defaultRoleSelection !== null;
  const availableRoles = state?.availableRoles || defaultRoleSelection?.availableRoles;

  if (needsRoleSelection && availableRoles) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="w-full max-w-5xl space-y-8 bg-card p-8 md:p-12 rounded-2xl border border-border shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Choose your role
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Select how you want to continue to the platform.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableRoles.includes("ADMIN") && (
              <button
                type="button"
                onClick={() => handleRoleSelect("ADMIN")}
                disabled={isPendingRole}
                className="w-full h-full group flex flex-col items-center p-6 border border-border rounded-2xl bg-background hover:bg-muted hover:border-[#00A8E8] transition-all disabled:opacity-50"
              >
                <div className="relative w-32 h-32 md:w-40 md:h-40 mb-6 overflow-hidden rounded-full border-4 border-border group-hover:border-[#00A8E8] transition-all bg-card">
                  <Image src="/assets/admin-role.png" alt="Admin Role" fill sizes="(max-width: 768px) 128px, 160px" className="object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-foreground group-hover:text-[#00A8E8] transition-colors">Administrator</h3>
                <p className="text-sm text-muted-foreground mt-2 text-center">Manage the platform.</p>
              </button>
            )}

            {availableRoles.includes("TEACHER") && (
              <button
                type="button"
                onClick={() => handleRoleSelect("TEACHER")}
                disabled={isPendingRole}
                className="w-full h-full group flex flex-col items-center p-6 border border-border rounded-2xl bg-background hover:bg-muted hover:border-[#F4B400] transition-all disabled:opacity-50"
              >
                <div className="relative w-32 h-32 md:w-40 md:h-40 mb-6 overflow-hidden rounded-full border-4 border-border group-hover:border-[#F4B400] transition-all bg-card">
                  <Image src="/assets/teacher-role.png" alt="Teacher Role" fill sizes="(max-width: 768px) 128px, 160px" className="object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-foreground group-hover:text-[#F4B400] transition-colors">Teacher</h3>
                <p className="text-sm text-muted-foreground mt-2 text-center">Create courses & lessons.</p>
              </button>
            )}

            {availableRoles.includes("STUDENT") && (
              <button
                type="button"
                onClick={() => handleRoleSelect("STUDENT")}
                disabled={isPendingRole}
                className="w-full h-full group flex flex-col items-center p-6 border border-border rounded-2xl bg-background hover:bg-muted hover:border-[#0077B6] transition-all disabled:opacity-50"
              >
                <div className="relative w-32 h-32 md:w-40 md:h-40 mb-6 overflow-hidden rounded-full border-4 border-border group-hover:border-[#0077B6] transition-all bg-card">
                  <Image src="/assets/student-role.png" alt="Student Role" fill sizes="(max-width: 768px) 128px, 160px" className="object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-foreground group-hover:text-[#0077B6] transition-colors">Student</h3>
                <p className="text-sm text-muted-foreground mt-2 text-center">Learn Python & practice.</p>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page login-page">
      {/* ── Toggle ── */}
      <div className="auth-toggle-row">
        <AuthToggle active="login" />
      </div>

      {/* ── Split Layout ── */}
      <div className="auth-split">
        {/* Left panel — Logo / Branding */}
        <div className="auth-brand-panel left">
          <div className="auth-brand-inner">
            <div className="auth-logo-wrap">
              <Image
                src="/assets/authentication-page-logo.png"
                alt="Python Learning Platform"
                width={320}
                height={320}
                className="auth-logo-img"
                priority
              />
            </div>
            <h1 className="auth-brand-title">Python Learning Platform</h1>
            <p className="auth-brand-tagline">
              Learn Python. Practice. Build.
            </p>
            <div className="auth-brand-features">
              <div className="auth-feature">
                <span className="auth-feature-dot" />
                Interactive lessons by expert teachers
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot" />
                Hands-on coding challenges
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot" />
                Track your progress &amp; earn XP
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — Form */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-form-header">
              <h2 className="auth-form-title">Welcome back</h2>
              <p className="auth-form-subtitle">
                Sign in to continue your Python journey
              </p>
            </div>

            <form action={action} className="auth-form" noValidate>
              {/* General error */}
              {state?.errors?.general && (
                <div className="auth-error-banner" role="alert">
                  {state.errors.general[0]}
                </div>
              )}

              {/* Email */}
              <div className="auth-field">
                <label htmlFor="login-email" className="auth-label">
                  Email address
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`auth-input${state?.errors?.email ? " error" : ""}`}
                  disabled={pending}
                  aria-describedby={
                    state?.errors?.email ? "login-email-error" : undefined
                  }
                />
                {state?.errors?.email && (
                  <span id="login-email-error" className="auth-field-error">
                    {state.errors.email[0]}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="auth-field">
                <label htmlFor="login-password" className="auth-label">
                  Password
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`auth-input password-input${state?.errors?.password ? " error" : ""}`}
                    disabled={pending}
                    aria-describedby={
                      state?.errors?.password
                        ? "login-password-error"
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="auth-eye-icon" />
                    ) : (
                      <Eye className="auth-eye-icon" />
                    )}
                  </button>
                </div>
                {state?.errors?.password && (
                  <span
                    id="login-password-error"
                    className="auth-field-error"
                  >
                    {state.errors.password[0]}
                  </span>
                )}
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={pending}
                className="auth-submit-btn"
              >
                {pending ? (
                  <>
                    <Loader2 className="auth-btn-icon spinning" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="auth-btn-icon" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <p className="auth-switch-hint">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="auth-switch-link">
                Sign up for free
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
