"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { env } from "@/lib/env";

export interface LoginState {
  error: string;
}

export async function login(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState | null> {
  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Password is required" };
  }

  const isValid = await compare(password, env.authPasswordHash);

  if (!isValid) {
    return { error: "Invalid password" };
  }

  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();

  redirect("/");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
