"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { createTask, type CreateTaskState } from "@/lib/actions/tasks";
import type { TaskStatus, TaskPriority, TaskLabel } from "@/lib/types";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_LABELS,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  LABEL_CONFIG,
} from "@/lib/types";
import { TaskStatusIcon } from "@/components/task-status-icon";
import { TaskPriorityIcon } from "@/components/task-priority-icon";
import { cn } from "@/lib/utils";

interface TaskCreateMobileProps {
  onCreated: () => void;
}

export function TaskCreateMobile({ onCreated }: TaskCreateMobileProps) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [label, setLabel] = useState<TaskLabel>("personal");
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);

  const [state, formAction, isPending] = useActionState<
    CreateTaskState | null,
    FormData
  >(createTask, null);

  const resetForm = useCallback((): void => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setLabel("personal");
    setDueDate(new Date());
  }, []);

  useEffect(() => {
    if (state?.success) {
      resetForm();
      onCreated();
    }
  }, [state, onCreated, resetForm]);

  function handleDateSelect(date: Date | undefined): void {
    setDueDate(date);
    setCalendarOpen(false);
  }

  function handleClearDate(e: React.MouseEvent | React.KeyboardEvent): void {
    e.stopPropagation();
    setDueDate(undefined);
    setCalendarOpen(false);
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">New Task</h2>
        <p className="text-sm text-muted-foreground">
          What needs to be done?
        </p>
      </div>

      <div className="space-y-2">
        <Input
          name="title"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12 text-base"
          autoFocus
          required
        />
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>

      <Textarea
        name="description"
        placeholder="Add details (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        className="resize-none text-base"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Status
          </p>
          <Select
            name="status"
            value={status}
            onValueChange={(v) => setStatus(v as TaskStatus)}
          >
            <SelectTrigger className="h-10">
              <div className="flex items-center gap-2">
                <TaskStatusIcon status={status} className="h-3.5 w-3.5" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <div className="flex items-center gap-2">
                    <TaskStatusIcon status={s} className="h-3.5 w-3.5" />
                    {STATUS_CONFIG[s].label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Priority
          </p>
          <Select
            name="priority"
            value={priority}
            onValueChange={(v) => setPriority(v as TaskPriority)}
          >
            <SelectTrigger className="h-10">
              <div className="flex items-center gap-2">
                <TaskPriorityIcon priority={priority} className="h-3.5 w-3.5" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  <div className="flex items-center gap-2">
                    <TaskPriorityIcon priority={p} className="h-3.5 w-3.5" />
                    {PRIORITY_CONFIG[p].label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Label
          </p>
          <Select
            name="label"
            value={label}
            onValueChange={(v) => setLabel(v as TaskLabel)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_LABELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {LABEL_CONFIG[l].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Due date
          </p>
          <input
            type="hidden"
            name="dueAt"
            value={dueDate ? dueDate.toISOString() : ""}
          />
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-10 w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {dueDate ? format(dueDate, "MMM d") : "Set date"}
                {dueDate && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-auto rounded-sm p-0.5 opacity-50 hover:opacity-100"
                    onClick={handleClearDate}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleClearDate(e);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={handleDateSelect}
                defaultMonth={dueDate ?? new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Button
        type="submit"
        className="h-12 w-full text-base"
        disabled={isPending}
      >
        {isPending ? "Creating..." : "Create Task"}
      </Button>
    </form>
  );
}
