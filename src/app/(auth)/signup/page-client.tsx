"use client";

import { useActionState } from "react";
import { signUpAction } from "@/app/actions/auth";
import { AuthToggle } from "@/components/auth/auth-toggle";
import Image from "next/image";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";

export default function SignupPageClient() {
  const [state, action, pending] = useActionState(signUpAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="auth-page signup-page">
      {/* ── Toggle ── */}
      <div className="auth-toggle-row">
        <AuthToggle active="signup" />
      </div>

      {/* ── Split Layout ── */}
      <div className="auth-split">
        {/* Left panel — Form */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-form-header">
              <h2 className="auth-form-title">Create your account</h2>
              <p className="auth-form-subtitle">
                Start your Python learning journey today
              </p>
            </div>

            <form action={action} className="auth-form" noValidate>
              {/* Email confirmation required - success message */}
              {state?.message && (
                <div className="auth-success-banner" role="status">
                  ✅ {state.message}
                </div>
              )}

              {/* General error */}
              {state?.errors?.general && (
                <div className="auth-error-banner" role="alert">
                  {state.errors.general[0]}
                </div>
              )}

              {/* Full Name */}
              <div className="auth-field">
                <label htmlFor="signup-name" className="auth-label">
                  Full name
                </label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Smith"
                  className={`auth-input${state?.errors?.name ? " error" : ""}`}
                  disabled={pending}
                  aria-describedby={
                    state?.errors?.name ? "signup-name-error" : undefined
                  }
                />
                {state?.errors?.name && (
                  <span id="signup-name-error" className="auth-field-error">
                    {state.errors.name[0]}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="auth-field">
                <label htmlFor="signup-email" className="auth-label">
                  Email address
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`auth-input${state?.errors?.email ? " error" : ""}`}
                  disabled={pending}
                  aria-describedby={
                    state?.errors?.email ? "signup-email-error" : undefined
                  }
                />
                {state?.errors?.email && (
                  <span id="signup-email-error" className="auth-field-error">
                    {state.errors.email[0]}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="auth-field">
                <label htmlFor="signup-password" className="auth-label">
                  Password
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className={`auth-input password-input${state?.errors?.password ? " error" : ""}`}
                    disabled={pending}
                    aria-describedby={
                      state?.errors?.password
                        ? "signup-password-error"
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
                    id="signup-password-error"
                    className="auth-field-error"
                  >
                    {state.errors.password[0]}
                  </span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="auth-field">
                <label
                  htmlFor="signup-confirm-password"
                  className="auth-label"
                >
                  Confirm password
                </label>
                <div className="auth-input-wrapper">
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    className={`auth-input password-input${state?.errors?.confirmPassword ? " error" : ""}`}
                    disabled={pending}
                    aria-describedby={
                      state?.errors?.confirmPassword
                        ? "signup-confirm-error"
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={
                      showConfirm ? "Hide password" : "Show password"
                    }
                    tabIndex={-1}
                  >
                    {showConfirm ? (
                      <EyeOff className="auth-eye-icon" />
                    ) : (
                      <Eye className="auth-eye-icon" />
                    )}
                  </button>
                </div>
                {state?.errors?.confirmPassword && (
                  <span id="signup-confirm-error" className="auth-field-error">
                    {state.errors.confirmPassword[0]}
                  </span>
                )}
              </div>

              {/* Submit */}
              <button
                id="signup-submit"
                type="submit"
                disabled={pending}
                className="auth-submit-btn"
              >
                {pending ? (
                  <>
                    <Loader2 className="auth-btn-icon spinning" />
                    Creating account…
                  </>
                ) : (
                  <>
                    <UserPlus className="auth-btn-icon" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <p className="auth-switch-hint">
              Already have an account?{" "}
              <a href="/login" className="auth-switch-link">
                Sign in
              </a>
            </p>
          </div>
        </div>

        {/* Right panel — Logo / Branding */}
        <div className="auth-brand-panel right">
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
                Structured curriculum for all levels
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot" />
                Real-world programming challenges
              </div>
              <div className="auth-feature">
                <span className="auth-feature-dot" />
                Instant feedback &amp; progress tracking
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
