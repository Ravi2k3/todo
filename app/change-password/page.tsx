"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  changePassword,
  type ChangePasswordState,
} from "@/lib/auth/change-password";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<
    ChangePasswordState | null,
    FormData
  >(changePassword, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Password changed successfully");
      formRef.current?.reset();
      router.push("/");
    }
  }, [state, router]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Change your password
          </h1>
          <p className="text-sm text-muted-foreground">
            You must set a new password before continuing.
          </p>
        </div>

        <form ref={formRef} action={formAction} className="space-y-4">
          <Input
            name="currentPassword"
            type="password"
            placeholder="Current password"
            autoComplete="current-password"
            autoFocus
            required
          />
          <Input
            name="newPassword"
            type="password"
            placeholder="New password (min 6 characters)"
            autoComplete="new-password"
            required
            minLength={6}
          />
          <Input
            name="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
            minLength={6}
          />
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Changing..." : "Change password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
