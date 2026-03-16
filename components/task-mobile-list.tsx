"use client";

import { useState, useTransition } from "react";
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import { Trash2, CalendarIcon, ClipboardList, Tag, Archive, Loader2 } from "lucide-react";
import { updateTask, deleteTask, archiveTask } from "@/lib/actions/tasks";
import { toast } from "sonner";

type FilterTab = "all" | "active" | "done";

interface TaskMobileListProps {
  tasks: Task[];
}

export function TaskMobileList({ tasks }: TaskMobileListProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function handleQuickToggle(task: Task): void {
    const newStatus = task.status === "done" ? "todo" : "done";
    setTogglingId(task.id);
    startTransition(async () => {
      await updateTask(task.id, { status: newStatus });
      setTogglingId(null);
      toast.success(newStatus === "done" ? "Done!" : "Reopened");
    });
  }

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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">
              {tasks.length === 0 ? "No tasks yet" : "No matches"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {tasks.length === 0
                ? "Tap New Task to create your first one."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          filtered.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.02,
                duration: 0.15,
                ease: "easeOut",
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent",
                task.status === "done" && "opacity-60",
              )}
            >
              {/* Tappable status icon — quick-toggle done/todo */}
              <button
                type="button"
                className="mt-0.5 rounded-sm p-0.5 transition-opacity active:opacity-60"
                onClick={() => handleQuickToggle(task)}
                disabled={togglingId === task.id}
              >
                {togglingId === task.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <TaskStatusIcon status={task.status} />
                )}
              </button>
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => setSelectedTask(task)}
              >
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
              </button>
            </motion.div>
          ))
        )}
      </div>

      <Drawer
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      >
        <DrawerContent>
          {selectedTask && (
            <MobileTaskDetail
              task={selectedTask}
              onUpdate={(updated) => setSelectedTask(updated)}
              onClose={() => setSelectedTask(null)}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

interface MobileTaskDetailProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onClose: () => void;
}

function MobileTaskDetail({
  task,
  onUpdate,
  onClose,
}: MobileTaskDetailProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleStatusChange(status: TaskStatus): void {
    startTransition(async () => {
      await updateTask(task.id, { status });
      onUpdate({ ...task, status });
      toast.success(`Status → ${STATUS_CONFIG[status].label}`);
    });
  }

  function handlePriorityChange(priority: TaskPriority): void {
    startTransition(async () => {
      await updateTask(task.id, { priority });
      onUpdate({ ...task, priority });
      toast.success(`Priority → ${PRIORITY_CONFIG[priority].label}`);
    });
  }

  function handleArchive(): void {
    setPendingAction("archive");
    startTransition(async () => {
      await archiveTask(task.id);
      setPendingAction(null);
      onClose();
      toast.success("Task archived");
    });
  }

  function handleDelete(): void {
    setPendingAction("delete");
    startTransition(async () => {
      await deleteTask(task.id);
      setPendingAction(null);
      onClose();
      toast.success("Task deleted");
    });
  }

  const isDone = task.status === "done" || task.status === "cancelled";
  const overdue =
    task.dueAt && isPast(task.dueAt) && !isToday(task.dueAt) && !isDone;
  const dueToday = task.dueAt && isToday(task.dueAt) && !isDone;

  return (
    <div className="mx-auto w-full max-w-sm">
      <DrawerHeader className="text-left">
        <DrawerTitle className="text-lg">{task.title}</DrawerTitle>
        {task.description ? (
          <DrawerDescription>{task.description}</DrawerDescription>
        ) : (
          <DrawerDescription className="sr-only">
            Task details
          </DrawerDescription>
        )}
      </DrawerHeader>

      <div className="space-y-3 px-4">
        {/* Info row — label, due date, created */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Tag className="h-3 w-3" />
            {LABEL_CONFIG[task.label].label}
          </Badge>
          {task.dueAt && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1",
                overdue && "border-red-500/40 text-red-500",
                dueToday && "border-amber-500/40 text-amber-500",
              )}
            >
              <CalendarIcon className="h-3 w-3" />
              {format(task.dueAt, "MMM d, yyyy")}
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(task.createdAt, { addSuffix: true })}
          </span>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Status</p>
          <Select
            value={task.status}
            onValueChange={(v) => handleStatusChange(v as TaskStatus)}
          >
            <SelectTrigger className="h-11 w-full">
              <div className="flex items-center gap-2">
                <TaskStatusIcon
                  status={task.status}
                  className="h-4 w-4"
                />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <div className="flex items-center gap-2">
                    <TaskStatusIcon status={s} className="h-4 w-4" />
                    {STATUS_CONFIG[s].label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Priority</p>
          <Select
            value={task.priority}
            onValueChange={(v) => handlePriorityChange(v as TaskPriority)}
          >
            <SelectTrigger className="h-11 w-full">
              <div className="flex items-center gap-2">
                <TaskPriorityIcon
                  priority={task.priority}
                  className="h-4 w-4"
                />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  <div className="flex items-center gap-2">
                    <TaskPriorityIcon priority={p} className="h-4 w-4" />
                    {PRIORITY_CONFIG[p].label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DrawerFooter>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={handleArchive}
            disabled={pendingAction !== null}
          >
            {pendingAction === "archive" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Archive className="mr-2 h-4 w-4" />
            )}
            Archive
          </Button>
          <Button
            variant="destructive"
            className="h-11 flex-1"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={pendingAction !== null}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
        <DrawerClose asChild>
          <Button variant="outline" className="h-11 w-full">
            Close
          </Button>
        </DrawerClose>
      </DrawerFooter>

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
              disabled={pendingAction === "delete"}
            >
              {pendingAction === "delete" ? (
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
    </div>
  );
}
