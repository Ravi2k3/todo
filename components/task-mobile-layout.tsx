"use client";

import { useState } from "react";
import { ListTodo, SquarePen } from "lucide-react";
import { TaskMobileList } from "@/components/task-mobile-list";
import { TaskCreateMobile } from "@/components/task-create-mobile";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type MobileView = "tasks" | "create";

interface TaskMobileLayoutProps {
  tasks: Task[];
}

export function TaskMobileLayout({ tasks }: TaskMobileLayoutProps) {
  const [activeView, setActiveView] = useState<MobileView>("tasks");

  return (
    <>
      {/* Content with bottom padding to clear the nav bar */}
      <div className="pb-20">
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
        </div>
      </nav>
    </>
  );
}
