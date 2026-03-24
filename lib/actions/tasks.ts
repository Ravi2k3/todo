"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, inArray, desc, and, or, lt, isNull, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/require-user";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_LABELS,
  type TaskStatus,
  type TaskPriority,
  type TaskLabel,
} from "@/lib/types";

const ARCHIVE_AFTER_MS: number = 1 * 24 * 60 * 60 * 1000; // 1 day

/** Soft-archive done/cancelled tasks that haven't been updated in 1 day. */
async function archiveStaleTasks(userId: number): Promise<void> {
  const cutoff: Date = new Date(Date.now() - ARCHIVE_AFTER_MS);
  await db
    .update(tasks)
    .set({ archivedAt: new Date() })
    .where(
      and(
        eq(tasks.userId, userId),
        or(eq(tasks.status, "done"), eq(tasks.status, "cancelled")),
        lt(tasks.updatedAt, cutoff),
        isNull(tasks.archivedAt),
      ),
    );
}

export async function getTasks(): Promise<
  (typeof tasks.$inferSelect)[]
> {
  const userId: number = await requireUserId();
  await archiveStaleTasks(userId);
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.archivedAt)))
    .orderBy(desc(tasks.createdAt));
}

export async function getArchivedTasks(): Promise<
  (typeof tasks.$inferSelect)[]
> {
  const userId: number = await requireUserId();
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNotNull(tasks.archivedAt)))
    .orderBy(desc(tasks.archivedAt));
}

export async function archiveTask(id: number): Promise<void> {
  const userId: number = await requireUserId();
  await db
    .update(tasks)
    .set({ archivedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  revalidatePath("/");
}

export async function restoreTask(id: number): Promise<void> {
  const userId: number = await requireUserId();
  await db
    .update(tasks)
    .set({ archivedAt: null, status: "todo", updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  revalidatePath("/");
}

export interface CreateTaskState {
  error?: string;
  success?: boolean;
}

export async function createTask(
  _prevState: CreateTaskState | null,
  formData: FormData,
): Promise<CreateTaskState> {
  const userId: number = await requireUserId();
  const title = formData.get("title");

  if (typeof title !== "string" || title.trim().length === 0) {
    return { error: "Title is required" };
  }

  const description = formData.get("description");
  const status = formData.get("status");
  const priority = formData.get("priority");
  const label = formData.get("label");
  const dueAt = formData.get("dueAt");

  let parsedDueAt: Date | null = null;
  if (typeof dueAt === "string" && dueAt.length > 0) {
    const candidate = new Date(dueAt);
    if (isNaN(candidate.getTime())) {
      return { error: "Invalid due date" };
    }
    parsedDueAt = candidate;
  }

  await db.insert(tasks).values({
    userId,
    title: title.trim(),
    description:
      typeof description === "string" && description.trim().length > 0
        ? description.trim()
        : null,
    status: TASK_STATUSES.includes(status as TaskStatus)
      ? (status as TaskStatus)
      : "todo",
    priority: TASK_PRIORITIES.includes(priority as TaskPriority)
      ? (priority as TaskPriority)
      : "medium",
    label: TASK_LABELS.includes(label as TaskLabel)
      ? (label as TaskLabel)
      : "personal",
    dueAt: parsedDueAt,
  });

  revalidatePath("/");
  return { success: true };
}

export async function updateTask(
  id: number,
  data: Partial<{
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    label: TaskLabel;
    dueAt: Date | null;
  }>,
): Promise<void> {
  const userId: number = await requireUserId();
  await db
    .update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

  revalidatePath("/");
}

export async function deleteTask(id: number): Promise<void> {
  const userId: number = await requireUserId();
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  revalidatePath("/");
}

export async function deleteTasks(ids: number[]): Promise<void> {
  const userId: number = await requireUserId();
  if (ids.length === 0) return;
  await db.delete(tasks).where(and(inArray(tasks.id, ids), eq(tasks.userId, userId)));
  revalidatePath("/");
}
