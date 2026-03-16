"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, inArray, desc, and, or, lt, isNull, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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
async function archiveStaleTasks(): Promise<void> {
  const cutoff: Date = new Date(Date.now() - ARCHIVE_AFTER_MS);
  await db
    .update(tasks)
    .set({ archivedAt: new Date() })
    .where(
      and(
        or(eq(tasks.status, "done"), eq(tasks.status, "cancelled")),
        lt(tasks.updatedAt, cutoff),
        isNull(tasks.archivedAt),
      ),
    );
}

export async function getTasks(): Promise<
  (typeof tasks.$inferSelect)[]
> {
  await archiveStaleTasks();
  return db
    .select()
    .from(tasks)
    .where(isNull(tasks.archivedAt))
    .orderBy(desc(tasks.createdAt));
}

export async function getArchivedTasks(): Promise<
  (typeof tasks.$inferSelect)[]
> {
  return db
    .select()
    .from(tasks)
    .where(isNotNull(tasks.archivedAt))
    .orderBy(desc(tasks.archivedAt));
}

export async function archiveTask(id: number): Promise<void> {
  await db
    .update(tasks)
    .set({ archivedAt: new Date() })
    .where(eq(tasks.id, id));
  revalidatePath("/");
}

export async function restoreTask(id: number): Promise<void> {
  await db
    .update(tasks)
    .set({ archivedAt: null, status: "todo", updatedAt: new Date() })
    .where(eq(tasks.id, id));
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
  const title = formData.get("title");

  if (typeof title !== "string" || title.trim().length === 0) {
    return { error: "Title is required" };
  }

  const description = formData.get("description");
  const status = formData.get("status");
  const priority = formData.get("priority");
  const label = formData.get("label");
  const dueAt = formData.get("dueAt");

  await db.insert(tasks).values({
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
    dueAt: typeof dueAt === "string" && dueAt.length > 0 ? new Date(dueAt) : null,
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
  await db
    .update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, id));

  revalidatePath("/");
}

export async function deleteTask(id: number): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath("/");
}

export async function deleteTasks(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await db.delete(tasks).where(inArray(tasks.id, ids));
  revalidatePath("/");
}
