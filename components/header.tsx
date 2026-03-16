"use client";

import { useState } from "react";
import { Plus, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TaskCreateDialog } from "@/components/task-create-dialog";
import { CommandMenu } from "@/components/command-menu";
import { logout } from "@/lib/auth/actions";
import type { Task } from "@/lib/types";

interface HeaderProps {
  tasks: Task[];
}

export function Header({ tasks }: HeaderProps) {
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage your tasks and stay productive.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle theme</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <form action={logout}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sign out</span>
                </Button>
              </form>
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>

          {/* Hidden on mobile — bottom nav handles creation there */}
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="hidden md:inline-flex"
          >
            <Plus className="mr-1 h-4 w-4" />
            New Task
          </Button>
        </div>
      </header>

      <TaskCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CommandMenu tasks={tasks} onCreateNew={() => setCreateOpen(true)} />
    </>
  );
}
