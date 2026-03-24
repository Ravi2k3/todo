"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "./session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export interface LoginState {
  error: string;
}

export async function login(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState | null> {
  const username = formData.get("username");
  const password = formData.get("password");

  if (typeof username !== "string" || username.trim().length === 0) {
    return { error: "Username is required" };
  }

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Password is required" };
  }

  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);

  if (!user) {
    return { error: "Invalid username or password" };
  }

  const isValid: boolean = await compare(password, user.passwordHash);

  if (!isValid) {
    return { error: "Invalid username or password" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.mustChangePassword = user.mustChangePassword;
  await session.save();

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  redirect("/");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  await session.destroy();
  redirect("/login");
}
