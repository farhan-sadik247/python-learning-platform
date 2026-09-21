"use client";

import { useState, useTransition } from "react";
import { updatePasswordAction, verifyPasswordAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function PasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [oldPassword, setOldPassword] = useState("");

  const handleVerify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);
    
    startTransition(async () => {
      try {
        await verifyPasswordAction(oldPassword);
        setStep(2);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Incorrect password");
      }
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    
    startTransition(async () => {
      try {
        await updatePasswordAction(formData);
        setSuccess(true);
        setStep(1);
        setOldPassword("");
        form.reset();
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-md">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex items-start gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3 flex items-start gap-2 text-sm text-green-500">
          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>Password updated successfully!</p>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="oldPassword" className="text-sm font-medium text-foreground">
              Current Password
            </label>
            <input
              id="oldPassword"
              name="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#00A8E8]"
              placeholder="Enter current password"
            />
          </div>
          <Button type="submit" disabled={isPending || !oldPassword} className="bg-foreground text-background hover:bg-foreground/90">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Validate Password
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleUpdate} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#00A8E8]"
              placeholder="Min. 8 characters"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#00A8E8]"
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending} className="bg-[#00A8E8] text-white hover:bg-[#0077B6]">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setStep(1); setOldPassword(""); setError(null); }} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
