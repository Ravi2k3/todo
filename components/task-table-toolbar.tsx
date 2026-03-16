"use client";

import { useTransition } from "react";
import type { Table } from "@tanstack/react-table";
import { X, Circle, Timer, CheckCircle2, XCircle, ArrowDown, ArrowRight, ArrowUp, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskTableFacetedFilter } from "@/components/task-table-faceted-filter";
import type { Task } from "@/lib/types";
import { deleteTasks } from "@/lib/actions/tasks";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "todo", label: "Todo", icon: Circle },
  { value: "in_progress", label: "In Progress", icon: Timer },
  { value: "done", label: "Done", icon: CheckCircle2 },
  { value: "cancelled", label: "Cancelled", icon: XCircle },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", icon: ArrowDown },
  { value: "medium", label: "Medium", icon: ArrowRight },
  { value: "high", label: "High", icon: ArrowUp },
];

interface TaskTableToolbarProps {
  table: Table<Task>;
}

export function TaskTableToolbar({ table }: TaskTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const [isBulkDeleting, startTransition] = useTransition();

  function handleBulkDelete(): void {
    const ids = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);
    startTransition(async () => {
      await deleteTasks(ids);
      table.toggleAllRowsSelected(false);
      toast.success(`${ids.length} task(s) deleted`);
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Search tasks..."
          value={
            (table.getColumn("title")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full sm:w-[250px]"
        />
        <div className="hidden items-center gap-2 sm:flex">
          {table.getColumn("status") && (
            <TaskTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={STATUS_OPTIONS}
            />
          )}
          {table.getColumn("priority") && (
            <TaskTableFacetedFilter
              column={table.getColumn("priority")}
              title="Priority"
              options={PRIORITY_OPTIONS}
            />
          )}
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            <span className="text-sm text-muted-foreground">
              {selectedCount} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-3.5 w-3.5" />
              )}
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
