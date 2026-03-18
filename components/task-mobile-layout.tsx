"use client";

import { useState } from "react";
import { ListTodo, SquarePen, Archive } from "lucide-react";
import { TaskMobileList } from "@/components/task-mobile-list";
import { TaskCreateMobile } from "@/components/task-create-mobile";
import { ArchiveSheet } from "@/components/archive-sheet";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type MobileView = "tasks" | "create";

interface TaskMobileLayoutProps {
  tasks: Task[];
  archivedTasks: Task[];
}

export function TaskMobileLayout({
  tasks,
  archivedTasks,
}: TaskMobileLayoutProps) {
  const [activeView, setActiveView] = useState<MobileView>("tasks");
  const [archiveOpen, setArchiveOpen] = useState<boolean>(false);

  return (
    <>
      {/* Scrollable content area — fills remaining viewport, clears bottom nav */}
      <div className="h-full overflow-y-auto pb-20">
        {activeView === "tasks" ? (
          <TaskMobileList tasks={tasks} />
        ) : (
          <TaskCreateMobile onCreated={() => setActiveView("tasks")} />
        )}
      </div>

      {/* Bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex h-14 items-center justify-around">
          <button
            type="button"
            onClick={() => setActiveView("tasks")}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors",
              activeView === "tasks"
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            <ListTodo className="h-5 w-5" />
            Tasks
          </button>
          <button
            type="button"
            onClick={() => setActiveView("create")}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors",
              activeView === "create"
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            <SquarePen className="h-5 w-5" />
            New Task
          </button>
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors"
          >
            <Archive className="h-5 w-5" />
            Archive
            {archivedTasks.length > 0 && (
              <span className="absolute right-1/4 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                {archivedTasks.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      <ArchiveSheet
        tasks={archivedTasks}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
      />
    </>
  );
}
