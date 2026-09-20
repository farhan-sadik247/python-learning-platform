"use client";

import { useActionState } from "react";
import { signInAction } from "@/app/actions/auth";
import { AuthToggle } from "@/components/auth/auth-toggle";
import Image from "next/image";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useState } from "react";

export default function LoginPageClient() {
  const [state, action, pending] = useActionState(signInAction, null);
  const [showPassword, setShowPassword] = useState(false);

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
