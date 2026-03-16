"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Archive, Loader2, Trash2, RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { restoreTask, deleteTask } from "@/lib/actions/tasks";
import { toast } from "sonner";
import type { Task } from "@/lib/types";

interface ArchiveSheetProps {
  tasks: Task[];
}

export function ArchiveSheet({ tasks }: ArchiveSheetProps) {
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function handleRestore(task: Task): void {
    setRestoringId(task.id);
    startTransition(async () => {
      await restoreTask(task.id);
      setRestoringId(null);
      toast.success(`"${task.title}" restored`);
    });
  }

  function handleDelete(): void {
    if (!deleteTarget) return;
    setIsDeleting(true);
    startTransition(async () => {
      await deleteTask(deleteTarget.id);
      setIsDeleting(false);
      setDeleteTarget(null);
      toast.success("Task permanently deleted");
    });
  }

  return (
    <>
      <Sheet>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8"
              >
                <Archive className="h-4 w-4" />
                {tasks.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -right-1.5 -top-1.5 h-4 min-w-4 justify-center px-1 text-[10px] leading-none"
                  >
                    {tasks.length}
                  </Badge>
                )}
                <span className="sr-only">Archived tasks</span>
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>Archived tasks</TooltipContent>
        </Tooltip>

        <SheetContent className="flex flex-col sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archive
            </SheetTitle>
            <SheetDescription>
              {tasks.length === 0
                ? "No archived tasks."
                : `${tasks.length} archived task${tasks.length === 1 ? "" : "s"}.`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {tasks.length > 0 ? (
              <div className="divide-y divide-border">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-muted-foreground line-through">
                        {task.title}
                      </p>
                      {task.archivedAt && (
                        <p className="text-xs text-muted-foreground/60">
                          {formatDistanceToNow(task.archivedAt, {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleRestore(task)}
                        disabled={restoringId === task.id}
                      >
                        {restoringId === task.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
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
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 rounded-full bg-muted p-3">
                  <Archive className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Archive is empty
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

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
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
