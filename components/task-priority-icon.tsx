import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  type LucideProps,
} from "lucide-react";
import type { TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITY_ICON_MAP: Record<
  TaskPriority,
  { icon: React.ComponentType<LucideProps>; className: string }
> = {
  low: { icon: ArrowDown, className: "text-blue-500" },
  medium: { icon: ArrowRight, className: "text-amber-500" },
  high: { icon: ArrowUp, className: "text-red-500" },
};

interface TaskPriorityIconProps {
  priority: TaskPriority;
  className?: string;
}

export function TaskPriorityIcon({
  priority,
  className,
}: TaskPriorityIconProps) {
  const config = PRIORITY_ICON_MAP[priority];
  const Icon = config.icon;
  return <Icon className={cn("h-4 w-4", config.className, className)} />;
}
