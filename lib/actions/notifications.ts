"use server";

import { webpush } from "@/lib/push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth/require-user";

interface PushKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: PushKeys;
}

export async function subscribePush(
  subscription: PushSubscriptionData,
): Promise<{ success: boolean }> {
  const userId: number = await requireUserId();

  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

  return { success: true };
}

export async function unsubscribePush(
  endpoint: string,
): Promise<{ success: boolean }> {
  const userId: number = await requireUserId();

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.endpoint, endpoint),
        eq(pushSubscriptions.userId, userId),
      ),
    );

  return { success: true };
}
