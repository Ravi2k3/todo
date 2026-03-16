"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/types";
import { updateTask, deleteTask } from "@/lib/actions/tasks";
import { TaskStatusIcon } from "@/components/task-status-icon";
import { TaskPriorityIcon } from "@/components/task-priority-icon";
import { toast } from "sonner";

interface TaskRowActionsProps {
  task: Task;
}

export function TaskRowActions({ task }: TaskRowActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  async function handleStatusChange(status: TaskStatus): Promise<void> {
    await updateTask(task.id, { status });
    toast.success(`Status changed to ${STATUS_CONFIG[status].label}`);
  }

  async function handlePriorityChange(priority: TaskPriority): Promise<void> {
    await updateTask(task.id, { priority });
    toast.success(`Priority changed to ${PRIORITY_CONFIG[priority].label}`);
  }

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);
    await deleteTask(task.id);
    setDeleteDialogOpen(false);
    setIsDeleting(false);
    toast.success("Task deleted");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {(
                Object.entries(STATUS_CONFIG) as [
                  TaskStatus,
                  (typeof STATUS_CONFIG)[TaskStatus],
                ][]
              ).map(([value, config]) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => handleStatusChange(value)}
                >
                  <TaskStatusIcon status={value} className="mr-2" />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {(
                Object.entries(PRIORITY_CONFIG) as [
                  TaskPriority,
                  (typeof PRIORITY_CONFIG)[TaskPriority],
                ][]
              ).map(([value, config]) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => handlePriorityChange(value)}
                >
                  <TaskPriorityIcon priority={value} className="mr-2" />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
}
