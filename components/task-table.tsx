"use client";

import { Fragment, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getExpandedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type ExpandedState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { columns } from "@/components/task-table-columns";
import { TaskTableToolbar } from "@/components/task-table-toolbar";
import { TaskExpandedRow } from "@/components/task-expanded-row";
import type { Task } from "@/lib/types";
import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewTab = "all" | "active" | "done";

interface TaskTableProps {
  tasks: Task[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const filteredByView = useMemo(() => {
    if (viewTab === "active") {
      return tasks.filter(
        (t) => t.status === "todo" || t.status === "in_progress",
      );
    }
    if (viewTab === "done") {
      return tasks.filter(
        (t) => t.status === "done" || t.status === "cancelled",
      );
    }
    return tasks;
  }, [tasks, viewTab]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter(
        (t) => t.status === "todo" || t.status === "in_progress",
      ).length,
      done: tasks.filter(
        (t) => t.status === "done" || t.status === "cancelled",
      ).length,
    }),
    [tasks],
  );

  const table = useReactTable({
    data: filteredByView,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <div className="space-y-4">
      <Tabs
        value={viewTab}
        onValueChange={(v) => {
          setViewTab(v as ViewTab);
          setRowSelection({});
          setExpanded({});
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
          <TabsTrigger value="done">Done ({counts.done})</TabsTrigger>
        </TabsList>
      </Tabs>

      <TaskTableToolbar table={table} />

      <div className="max-h-[calc(100dvh-280px)] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "cursor-pointer transition-colors",
                      row.getIsExpanded() && "bg-accent/50",
                    )}
                    onClick={(e) => {
                      // Don't toggle expansion when clicking checkbox, actions, or interactive elements
                      const target = e.target as HTMLElement;
                      if (
                        target.closest("button") ||
                        target.closest('[role="checkbox"]') ||
                        target.closest("[data-slot]") ||
                        target.closest("a")
                      ) {
                        return;
                      }
                      row.toggleExpanded();
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <AnimatePresence>
                    {row.getIsExpanded() && (
                      <motion.tr
                        key={`${row.id}-expanded`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <TaskExpandedRow
                          task={row.original}
                          colSpan={row.getVisibleCells().length}
                        />
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 rounded-full bg-muted p-3">
                      <ClipboardList className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">
                      {tasks.length === 0
                        ? "No tasks yet"
                        : "No matches"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {tasks.length === 0
                        ? "Click New Task to get started."
                        : "Try adjusting your search or filters."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="px-2 text-sm text-muted-foreground">
        {table.getFilteredRowModel().rows.length} task(s) total
      </p>
    </div>
  );
}
