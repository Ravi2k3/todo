"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import type { Task } from "@/lib/types";
import { LABEL_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TaskStatusIcon } from "@/components/task-status-icon";
import { TaskPriorityIcon } from "@/components/task-priority-icon";
import { TaskRowActions } from "@/components/task-row-actions";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        TSK-{String(row.getValue<number>("id")).padStart(3, "0")}
      </span>
    ),
    enableHiding: true,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="max-w-[300px] truncate font-medium">
        {row.getValue<string>("title")}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<Task["status"]>("status");
      const config = STATUS_CONFIG[status];
      return (
        <div className="flex items-center gap-2">
          <TaskStatusIcon status={status} />
          <span className="text-sm">{config.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue<Task["priority"]>("priority");
      const config = PRIORITY_CONFIG[priority];
      return (
        <div className="flex items-center gap-2">
          <TaskPriorityIcon priority={priority} />
          <span className="text-sm">{config.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "label",
    header: "Label",
    cell: ({ row }) => {
      const label = row.getValue<Task["label"]>("label");
      const config = LABEL_CONFIG[label];
      return (
        <Badge variant="outline" className="text-xs font-normal">
          {config.label}
        </Badge>
      );
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "dueAt",
    header: "Due",
    cell: ({ row }) => {
      const dueAt = row.getValue<Date | null>("dueAt");
      if (!dueAt) {
        return <span className="text-muted-foreground">—</span>;
      }
      const isDone =
        row.original.status === "done" ||
        row.original.status === "cancelled";
      const overdue = isPast(dueAt) && !isToday(dueAt) && !isDone;
      return (
        <span
          className={cn(
            "text-sm whitespace-nowrap",
            overdue && "text-red-500 font-medium",
            isToday(dueAt) && !isDone && "text-amber-500 font-medium",
          )}
        >
          {format(dueAt, "MMM d")}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <TaskRowActions task={row.original} />,
  },
];
