"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Circle,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Plus,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { updateTask } from "@/lib/actions/tasks";
import { logout } from "@/lib/auth/actions";
import type { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/types";
import { toast } from "sonner";

interface CommandMenuProps {
  tasks: Task[];
  onCreateNew: () => void;
}

export function CommandMenu({ tasks, onCreateNew }: CommandMenuProps) {
  const [open, setOpen] = useState<boolean>(false);
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleStatusChange = useCallback(
    (taskId: number, status: TaskStatus): void => {
      setOpen(false);
      startTransition(async () => {
        await updateTask(taskId, { status });
        toast.success(`Status → ${STATUS_CONFIG[status].label}`);
      });
    },
    [startTransition],
  );

  const handlePriorityChange = useCallback(
    (taskId: number, priority: TaskPriority): void => {
      setOpen(false);
      startTransition(async () => {
        await updateTask(taskId, { priority });
        toast.success(`Priority → ${PRIORITY_CONFIG[priority].label}`);
      });
    },
    [startTransition],
  );

  // Active tasks for quick-complete
  const activeTasks = tasks.filter(
    (t) => t.status === "todo" || t.status === "in_progress",
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search tasks..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick actions */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              onCreateNew();
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New task
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle theme
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              startTransition(async () => {
                await logout();
              });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </CommandItem>
        </CommandGroup>

        {/* Quick-complete active tasks */}
        {activeTasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Mark as done">
              {activeTasks.map((task) => (
                <CommandItem
                  key={task.id}
                  onSelect={() => handleStatusChange(task.id, "done")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  {task.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
