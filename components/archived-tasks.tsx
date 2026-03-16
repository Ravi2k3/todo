"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Archive, Trash2, RotateCcw } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { restoreTask, deleteTask } from "@/lib/actions/tasks";
import { toast } from "sonner";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ArchivedTasksProps {
  tasks: Task[];
}

export function ArchivedTasks({ tasks }: ArchivedTasksProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  async function handleRestore(task: Task): Promise<void> {
    await restoreTask(task.id);
    toast.success(`"${task.title}" restored`);
  }

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await deleteTask(deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
    toast.success("Task permanently deleted");
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Archive className="h-4 w-4" />
            <span>Archived ({tasks.length})</span>
            <svg
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                open && "rotate-180",
              )}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 rounded-md border">
            <div className="divide-y">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-muted-foreground line-through">
                      {task.title}
                    </p>
                    {task.archivedAt && (
                      <p className="text-xs text-muted-foreground/60">
                        Archived{" "}
                        {formatDistanceToNow(task.archivedAt, {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => handleRestore(task)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span className="sr-only">Restore</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(task)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete permanently</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete permanently</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.title}&rdquo;.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
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
