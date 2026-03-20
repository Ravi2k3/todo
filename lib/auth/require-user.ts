"use server";

import { redirect } from "next/navigation";
import { getSession } from "./session";

/**
 * Returns the authenticated user's ID or redirects to login.
 * Use in server actions and server components to enforce auth.
 */
export async function requireUserId(): Promise<number> {
  const session = await getSession();

  if (!session.userId) {
    redirect("/login");
  }

  return session.userId;
}
