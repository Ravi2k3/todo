import { NextRequest, NextResponse } from "next/server";
import { webpush } from "@/lib/push";
import { WebPushError } from "web-push";
import { db } from "@/lib/db";
import { tasks, pushSubscriptions, users } from "@/lib/db/schema";
import { and, eq, lte, isNull, isNotNull, or } from "drizzle-orm";
import { startOfDay, endOfDay, format } from "date-fns";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];

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

  // Get all users
  const allUsers = await db.select({ id: users.id }).from(users);

  let totalSent = 0;
  let totalCleaned = 0;

  for (const user of allUsers) {
    // Fetch active tasks with due dates for this user
    const activeTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, user.id),
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

    if (dueTodayTasks.length === 0 && overdueTasks.length === 0) {
      continue;
    }

    // Build per-user notification
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

    const payload = JSON.stringify({
      title: `Tasks — ${format(now, "MMM d")}`,
      body: parts.join(" · "),
      url: "/",
    });

    // Send to this user's subscriptions
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, user.id));

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

    const staleEndpoints: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        totalSent++;
      } else if (
        result.reason instanceof WebPushError &&
        (result.reason.statusCode === 404 ||
          result.reason.statusCode === 410)
      ) {
        staleEndpoints.push(subscriptions[index].endpoint);
      }
    });

    for (const endpoint of staleEndpoints) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint));
    }

    totalCleaned += staleEndpoints.length;
  }

  return NextResponse.json({
    sent: totalSent,
    cleaned: totalCleaned,
    usersProcessed: allUsers.length,
  });
}
