import { NextRequest, NextResponse } from "next/server";
import { webpush } from "@/lib/push";
import { WebPushError } from "web-push";
import { db } from "@/lib/db";
import { tasks, pushSubscriptions } from "@/lib/db/schema";
import { and, eq, lte, isNull, isNotNull, or } from "drizzle-orm";
import { startOfDay, endOfDay, format } from "date-fns";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];

  // Always require CRON_SECRET in production
  if (!cronSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Fetch only active tasks with a due date that is today or earlier
  const activeTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        isNull(tasks.archivedAt),
        or(eq(tasks.status, "todo"), eq(tasks.status, "in_progress")),
        isNotNull(tasks.dueAt),
        lte(tasks.dueAt, todayEnd),
      ),
    );

  const dueTodayTasks = activeTasks.filter(
    (t) => t.dueAt! >= todayStart && t.dueAt! <= todayEnd,
  );
  const overdueTasks = activeTasks.filter((t) => t.dueAt! < todayStart);

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

  // Send to all subscribers in parallel
  const subscriptions = await db.select().from(pushSubscriptions);
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      ),
    ),
  );

  // Collect stale endpoints for cleanup
  const staleEndpoints: string[] = [];
  let sent = 0;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      sent++;
    } else if (
      result.reason instanceof WebPushError &&
      (result.reason.statusCode === 404 || result.reason.statusCode === 410)
    ) {
      staleEndpoints.push(subscriptions[index].endpoint);
    }
  });

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
