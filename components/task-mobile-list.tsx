"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow, format, isPast, isToday } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, CalendarIcon } from "lucide-react";
import { updateTask, deleteTask } from "@/lib/actions/tasks";
import { toast } from "sonner";

type FilterTab = "all" | "active" | "done";

interface TaskMobileListProps {
  tasks: Task[];
}

export function TaskMobileList({ tasks }: TaskMobileListProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filtered = tasks.filter((task) => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filter === "active") {
      return task.status === "todo" || task.status === "in_progress";
    }
    if (filter === "done") {
      return task.status === "done" || task.status === "cancelled";
    }
    return true;
  });

  const counts = {
    all: tasks.length,
    active: tasks.filter(
      (t) => t.status === "todo" || t.status === "in_progress",
    ).length,
    done: tasks.filter(
      (t) => t.status === "done" || t.status === "cancelled",
    ).length,
  };

  function getDueBadge(task: Task): React.ReactNode {
    if (!task.dueAt) return null;
    const isDone = task.status === "done" || task.status === "cancelled";
    const overdue = isPast(task.dueAt) && !isToday(task.dueAt) && !isDone;
    const dueToday = isToday(task.dueAt) && !isDone;
    return (
      <>
        <span>·</span>
        <span
          className={cn(
            overdue && "text-red-500 font-medium",
            dueToday && "text-amber-500 font-medium",
          )}
        >
          {format(task.dueAt, "MMM d")}
        </span>
      </>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search tasks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-9"
      />

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterTab)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-1">
            Active ({counts.active})
          </TabsTrigger>
          <TabsTrigger value="done" className="flex-1">
            Done ({counts.done})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-1">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tasks found.
          </p>
        ) : (
          filtered.map((task, index) => (
            <motion.button
              key={task.id}
              type="button"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.02,
                duration: 0.15,
                ease: "easeOut",
              }}
              onClick={() => setSelectedTask(task)}
              className={cn(
                "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent",
                task.status === "done" && "opacity-60",
              )}
            >
              <TaskStatusIcon status={task.status} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    task.status === "done" && "line-through",
                  )}
                >
                  {task.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <TaskPriorityIcon
                    priority={task.priority}
                    className="h-3 w-3"
                  />
                  <span>{PRIORITY_CONFIG[task.priority].label}</span>
                  <span>·</span>
                  <Badge
                    variant="outline"
                    className="h-4 px-1 text-[10px] font-normal"
                  >
                    {LABEL_CONFIG[task.label].label}
                  </Badge>
                  {getDueBadge(task)}
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>

      <Sheet
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      >
        <SheetContent className="px-5 pb-8 pt-6 sm:max-w-[400px]">
          {selectedTask && (
            <MobileTaskDetail
              task={selectedTask}
              onUpdate={(updated) => setSelectedTask(updated)}
              onDelete={() => setSelectedTask(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface MobileTaskDetailProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: () => void;
}

function MobileTaskDetail({
  task,
  onUpdate,
  onDelete,
}: MobileTaskDetailProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  async function handleStatusChange(status: TaskStatus): Promise<void> {
    await updateTask(task.id, { status });
    onUpdate({ ...task, status });
    toast.success(`Status → ${STATUS_CONFIG[status].label}`);
  }

  async function handlePriorityChange(priority: TaskPriority): Promise<void> {
    await updateTask(task.id, { priority });
    onUpdate({ ...task, priority });
    toast.success(`Priority → ${PRIORITY_CONFIG[priority].label}`);
  }

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);
    await deleteTask(task.id);
    setIsDeleting(false);
    onDelete();
    toast.success("Task deleted");
  }

  const isDone = task.status === "done" || task.status === "cancelled";
  const overdue =
    task.dueAt && isPast(task.dueAt) && !isToday(task.dueAt) && !isDone;
  const dueToday = task.dueAt && isToday(task.dueAt) && !isDone;

  return (
    <>
      <SheetHeader className="px-0">
        <SheetTitle className="text-left">{task.title}</SheetTitle>
      </SheetHeader>
      <div className="mt-6 space-y-5">
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">{LABEL_CONFIG[task.label].label}</Badge>
          {task.dueAt && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-sm text-muted-foreground",
                overdue && "text-red-500 font-medium",
                dueToday && "text-amber-500 font-medium",
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {format(task.dueAt, "MMM d, yyyy")}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Status
            </p>
            <Select
              value={task.status}
              onValueChange={(v) => handleStatusChange(v as TaskStatus)}
            >
              <SelectTrigger>
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
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Priority
            </p>
            <Select
              value={task.priority}
              onValueChange={(v) =>
                handlePriorityChange(v as TaskPriority)
              }
            >
              <SelectTrigger>
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
                      <TaskPriorityIcon priority={p} className="h-3.5 w-3.5" />
                      {PRIORITY_CONFIG[p].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Created{" "}
          {formatDistanceToNow(task.createdAt, { addSuffix: true })}
        </div>

        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete task
        </Button>
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
    </>
  );
}
