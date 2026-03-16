import {
  Circle,
  Timer,
  CheckCircle2,
  XCircle,
  type LucideProps,
} from "lucide-react";
import type { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_ICON_MAP: Record<
  TaskStatus,
  { icon: React.ComponentType<LucideProps>; className: string }
> = {
  todo: { icon: Circle, className: "text-muted-foreground" },
  in_progress: { icon: Timer, className: "text-amber-500" },
  done: { icon: CheckCircle2, className: "text-green-500" },
  cancelled: { icon: XCircle, className: "text-red-500" },
};

interface TaskStatusIconProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusIcon({ status, className }: TaskStatusIconProps) {
  const config = STATUS_ICON_MAP[status];
  const Icon = config.icon;
  return <Icon className={cn("h-4 w-4", config.className, className)} />;
}
