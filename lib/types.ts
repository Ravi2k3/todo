export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "done",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_LABELS = [
  "bug",
  "feature",
  "docs",
  "personal",
  "infra",
] as const;
export type TaskLabel = (typeof TASK_LABELS)[number];

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  label: TaskLabel;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: string; color: string }
> = {
  todo: { label: "Todo", icon: "circle", color: "text-muted-foreground" },
  in_progress: {
    label: "In Progress",
    icon: "timer",
    color: "text-amber-500",
  },
  done: { label: "Done", icon: "check-circle-2", color: "text-green-500" },
  cancelled: {
    label: "Cancelled",
    icon: "x-circle",
    color: "text-red-500",
  },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; icon: string; color: string }
> = {
  low: { label: "Low", icon: "arrow-down", color: "text-blue-500" },
  medium: { label: "Medium", icon: "arrow-right", color: "text-amber-500" },
  high: { label: "High", icon: "arrow-up", color: "text-red-500" },
};

export const LABEL_CONFIG: Record<TaskLabel, { label: string }> = {
  bug: { label: "Bug" },
  feature: { label: "Feature" },
  docs: { label: "Docs" },
  personal: { label: "Personal" },
  infra: { label: "Infra" },
};
