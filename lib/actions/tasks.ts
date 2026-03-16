"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { TaskStatus, TaskPriority, TaskLabel } from "@/lib/types";

export async function getTasks(): Promise<
  (typeof tasks.$inferSelect)[]
> {
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
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
    status: (status as TaskStatus) || "todo",
    priority: (priority as TaskPriority) || "medium",
    label: (label as TaskLabel) || "personal",
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
