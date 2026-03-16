"use server";

import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";

interface PushKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: PushKeys;
}

webpush.setVapidDetails(
  "mailto:ravi@tasks.app",
  env.vapidPublicKey,
  env.vapidPrivateKey,
);

export async function subscribePush(
  subscription: PushSubscriptionData,
): Promise<{ success: boolean }> {
  await db
    .insert(pushSubscriptions)
    .values({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

  return { success: true };
}

export async function unsubscribePush(
  endpoint: string,
): Promise<{ success: boolean }> {
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));

  return { success: true };
}

export async function sendTestNotification(
  endpoint: string,
): Promise<{ success: boolean; error?: string }> {
  const rows = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
    .limit(1);

  if (rows.length === 0) {
    return { success: false, error: "Subscription not found" };
  }

  const sub = rows[0];

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({
        title: "Tasks",
        body: "Notifications are working! You'll get daily reminders for due tasks.",
        url: "/",
      }),
    );
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to send notification";
    // Remove stale subscriptions (browser unsubscribed)
    if (
      err instanceof webpush.WebPushError &&
      (err.statusCode === 404 || err.statusCode === 410)
    ) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, sub.endpoint));
    }
    return { success: false, error: message };
  }
}
