"use client";

import { useActionState, useRef, useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskCreateDialog({
  open,
  onOpenChange,
}: TaskCreateDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);

  // Controlled state so data persists across dialog close/reopen
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
      onOpenChange(false);
      resetForm();
    }
  }, [state, onOpenChange, resetForm]);

  function handleDateSelect(date: Date | undefined): void {
    setDueDate(date);
    setCalendarOpen(false);
  }

  function handleClearDate(): void {
    setDueDate(undefined);
    setCalendarOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Input
              name="title"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </div>
          <Textarea
            name="description"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <div className="grid grid-cols-3 gap-2">
            <Select
              name="status"
              value={status}
              onValueChange={(v) => setStatus(v as TaskStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              name="priority"
              value={priority}
              onValueChange={(v) => setPriority(v as TaskPriority)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              name="label"
              value={label}
              onValueChange={(v) => setLabel(v as TaskLabel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Label" />
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

          {/* Hidden input to submit the date value */}
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
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "No due date"}
                {dueDate && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-auto rounded-sm p-0.5 opacity-50 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearDate();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        handleClearDate();
                      }
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
