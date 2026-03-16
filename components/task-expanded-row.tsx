"use client";

import { useState } from "react";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";
import type { Task, TaskStatus, TaskPriority } from "@/lib/types";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  LABEL_CONFIG,
} from "@/lib/types";
import { TaskStatusIcon } from "@/components/task-status-icon";
import { TaskPriorityIcon } from "@/components/task-priority-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateTask, deleteTask } from "@/lib/actions/tasks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskExpandedRowProps {
  task: Task;
  colSpan: number;
}

export function TaskExpandedRow({ task, colSpan }: TaskExpandedRowProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  async function handleStatusChange(status: TaskStatus): Promise<void> {
    await updateTask(task.id, { status });
    toast.success(`Status → ${STATUS_CONFIG[status].label}`);
  }

  async function handlePriorityChange(priority: TaskPriority): Promise<void> {
    await updateTask(task.id, { priority });
    toast.success(`Priority → ${PRIORITY_CONFIG[priority].label}`);
  }

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);
    await deleteTask(task.id);
    setDeleteDialogOpen(false);
    setIsDeleting(false);
    toast.success("Task deleted");
  }

  const isDone = task.status === "done" || task.status === "cancelled";
  const overdue =
    task.dueAt && isPast(task.dueAt) && !isToday(task.dueAt) && !isDone;
  const dueToday = task.dueAt && isToday(task.dueAt) && !isDone;

  return (
    <td colSpan={colSpan} className="p-0">
      <div className="border-t bg-card/50 px-6 py-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          {/* Left — read-only details */}
          <div className="space-y-3">
            <h3 className="text-base font-medium">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="outline">{LABEL_CONFIG[task.label].label}</Badge>
              {task.dueAt && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-muted-foreground",
                    overdue && "text-red-500 font-medium",
                    dueToday && "text-amber-500 font-medium",
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {format(task.dueAt, "MMM d, yyyy")}
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                Created{" "}
                {formatDistanceToNow(task.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Right — status, priority, delete */}
          <div className="flex min-w-[220px] flex-col gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Status
              </p>
              <Select
                value={task.status}
                onValueChange={(v) => handleStatusChange(v as TaskStatus)}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <TaskStatusIcon
                      status={task.status}
                      className="h-3.5 w-3.5"
                    />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <TaskStatusIcon status={s} className="h-3.5 w-3.5" />
                        {STATUS_CONFIG[s].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Priority
              </p>
              <Select
                value={task.priority}
                onValueChange={(v) =>
                  handlePriorityChange(v as TaskPriority)
                }
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <TaskPriorityIcon
                      priority={task.priority}
                      className="h-3.5 w-3.5"
                    />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-2">
                        <TaskPriorityIcon
                          priority={p}
                          className="h-3.5 w-3.5"
                        />
                        {PRIORITY_CONFIG[p].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-7 w-fit text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{task.title}&rdquo;. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </td>
  );
}
