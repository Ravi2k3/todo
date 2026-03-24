"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUserId } from "./require-user";
import { getSession } from "./session";

const BCRYPT_ROUNDS = 12;

export interface ChangePasswordState {
  error?: string;
  success?: boolean;
}

export async function changePassword(
  _prevState: ChangePasswordState | null,
  formData: FormData,
): Promise<ChangePasswordState> {
  const userId: number = await requireUserId();

  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    return { error: "Current password is required" };
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { error: "User not found" };
  }

  const isValid: boolean = await compare(currentPassword, user.passwordHash);

  if (!isValid) {
    return { error: "Current password is incorrect" };
  }

  const newHash: string = await hash(newPassword, BCRYPT_ROUNDS);

  await db
    .update(users)
    .set({ passwordHash: newHash, mustChangePassword: false })
    .where(eq(users.id, userId));

  const session = await getSession();
  session.mustChangePassword = false;
  await session.save();

  return { success: true };
}
