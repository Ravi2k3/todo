import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/lib/db";
import { tasks, pushSubscriptions } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { and, eq, lt, isNull, or } from "drizzle-orm";
import { startOfDay, endOfDay, format } from "date-fns";

webpush.setVapidDetails(
  "mailto:ravi@tasks.app",
  env.vapidPublicKey,
  env.vapidPrivateKey,
);

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify the request is from Vercel Cron (or allow in dev)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Find tasks due today (not archived, not done/cancelled)
  const dueToday = await db
    .select()
    .from(tasks)
    .where(
      and(
        isNull(tasks.archivedAt),
        or(eq(tasks.status, "todo"), eq(tasks.status, "in_progress")),
        // dueAt falls within today
        and(
          isNull(tasks.archivedAt),
          // gte equivalent: dueAt >= todayStart
          // We need to check dueAt is not null and within today
        ),
      ),
    );

  // Filter in JS for date range (drizzle's date comparison is cleaner this way)
  const dueTodayTasks = dueToday.filter((t) => {
    if (!t.dueAt) return false;
    return t.dueAt >= todayStart && t.dueAt <= todayEnd;
  });

  // Find overdue tasks (due before today, still active)
  const overdueTasks = dueToday.filter((t) => {
    if (!t.dueAt) return false;
    return t.dueAt < todayStart;
  });

  // Build notification message
  const parts: string[] = [];

  if (dueTodayTasks.length > 0) {
    const titles = dueTodayTasks
      .slice(0, 3)
      .map((t) => t.title)
      .join(", ");
    const extra =
      dueTodayTasks.length > 3
        ? ` +${dueTodayTasks.length - 3} more`
        : "";
    parts.push(`Due today: ${titles}${extra}`);
  }

  if (overdueTasks.length > 0) {
    parts.push(
      `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? "" : "s"}`,
    );
  }

  // Nothing to notify about
  if (parts.length === 0) {
    return NextResponse.json({
      sent: 0,
      reason: "No tasks due today or overdue",
    });
  }

  const payload = JSON.stringify({
    title: `Tasks — ${format(now, "MMM d")}`,
    body: parts.join(" · "),
    url: "/",
  });

  // Get all subscriptions and send
  const subscriptions = await db.select().from(pushSubscriptions);
  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      );
      sent++;
    } catch (err: unknown) {
      // Remove expired/unsubscribed subscriptions
      if (
        err instanceof webpush.WebPushError &&
        (err.statusCode === 404 || err.statusCode === 410)
      ) {
        staleEndpoints.push(sub.endpoint);
      }
    }
  }

  // Clean up stale subscriptions
  for (const endpoint of staleEndpoints) {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }

  return NextResponse.json({
    sent,
    cleaned: staleEndpoints.length,
    dueTodayCount: dueTodayTasks.length,
    overdueCount: overdueTasks.length,
  });
}
