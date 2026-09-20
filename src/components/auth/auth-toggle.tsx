"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type AuthToggleProps = {
  active: "login" | "signup";
};

/**
 * Animated toggle switch between Login and Sign Up pages.
 * Navigating between routes triggers the page-flip CSS animation.
 */
export function AuthToggle({ active }: AuthToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle(target: "login" | "signup") {
    if (target === active) return;
    startTransition(() => {
      router.push(`/${target}`);
    });
  }

  return (
    <div className="auth-toggle-wrapper" aria-label="Switch between login and signup">
      <button
        id="auth-toggle-login"
        type="button"
        role="tab"
        aria-selected={active === "login"}
        onClick={() => handleToggle("login")}
        disabled={isPending}
        className={`auth-toggle-btn${active === "login" ? " active" : ""}`}
      >
        Sign In
      </button>

      {/* Sliding pill indicator */}
      <span
        className="auth-toggle-pill"
        data-position={active}
        aria-hidden="true"
      />

      <button
        id="auth-toggle-signup"
        type="button"
        role="tab"
        aria-selected={active === "signup"}
        onClick={() => handleToggle("signup")}
        disabled={isPending}
        className={`auth-toggle-btn${active === "signup" ? " active" : ""}`}
      >
        Sign Up
      </button>
    </div>
  );
}
