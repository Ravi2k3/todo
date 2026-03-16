"use client";

import { useState } from "react";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";
import type { Task, TaskStatus, TaskPriority, TaskLabel } from "@/lib/types";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_LABELS,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
  const [title, setTitle] = useState<string>(task.title);
  const [description, setDescription] = useState<string>(
    task.description ?? "",
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.dueAt ?? undefined,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  async function handleFieldChange(
    field: string,
    value: TaskStatus | TaskPriority | TaskLabel,
  ): Promise<void> {
    await updateTask(task.id, { [field]: value });
    toast.success("Updated");
  }

  async function handleDueDateChange(
    date: Date | undefined,
  ): Promise<void> {
    setDueDate(date);
    await updateTask(task.id, { dueAt: date ?? null });
    toast.success(date ? `Due ${format(date, "MMM d")}` : "Due date removed");
  }

  async function handleSaveText(): Promise<void> {
    const updates: Record<string, string | null> = {};
    if (title.trim() !== task.title) {
      updates.title = title.trim();
    }
    if (description.trim() !== (task.description ?? "")) {
      updates.description = description.trim() || null;
    }
    if (Object.keys(updates).length === 0) return;
    setIsSaving(true);
    await updateTask(task.id, updates);
    setIsSaving(false);
    toast.success("Saved");
  }

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);
    await deleteTask(task.id);
    setDeleteDialogOpen(false);
    setIsDeleting(false);
    toast.success("Task deleted");
  }

  const isDone = task.status === "done" || task.status === "cancelled";
  const overdue = task.dueAt && isPast(task.dueAt) && !isToday(task.dueAt) && !isDone;
  const dueToday = task.dueAt && isToday(task.dueAt) && !isDone;

  return (
    <td colSpan={colSpan} className="p-0">
      <div className="border-t bg-card/50 px-6 py-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          {/* Left — editable fields */}
          <div className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveText}
              className="text-base font-medium"
              placeholder="Task title"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveText}
              placeholder="Add a description..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Right — metadata controls */}
          <div className="flex min-w-[220px] flex-col gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Status
              </p>
              <Select
                value={task.status}
                onValueChange={(v) =>
                  handleFieldChange("status", v as TaskStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <TaskStatusIcon status={task.status} className="h-3.5 w-3.5" />
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
                  handleFieldChange("priority", v as TaskPriority)
                }
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <TaskPriorityIcon priority={task.priority} className="h-3.5 w-3.5" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-2">
                        <TaskPriorityIcon priority={p} className="h-3.5 w-3.5" />
                        {PRIORITY_CONFIG[p].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Label
              </p>
              <Select
                value={task.label}
                onValueChange={(v) =>
                  handleFieldChange("label", v as TaskLabel)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_LABELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {LABEL_CONFIG[l].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Due date
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground",
                      overdue && "border-red-500/50 text-red-500",
                      dueToday && "border-amber-500/50 text-amber-500",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {dueDate ? format(dueDate, "MMM d, yyyy") : "No due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={handleDueDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Created{" "}
                {formatDistanceToNow(task.createdAt, { addSuffix: true })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
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
