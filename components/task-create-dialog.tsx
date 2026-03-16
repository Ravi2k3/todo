"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [state, formAction, isPending] = useActionState<
    CreateTaskState | null,
    FormData
  >(createTask, null);

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
      formRef.current?.reset();
      setDueDate(undefined);
    }
  }, [state, onOpenChange]);

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
            rows={3}
          />
          <div className="grid grid-cols-3 gap-2">
            <Select name="status" defaultValue="todo">
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="priority" defaultValue="medium">
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {PRIORITY_CONFIG[priority].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="label" defaultValue="personal">
              <SelectTrigger>
                <SelectValue placeholder="Label" />
              </SelectTrigger>
              <SelectContent>
                {TASK_LABELS.map((label) => (
                  <SelectItem key={label} value={label}>
                    {LABEL_CONFIG[label].label}
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
          <Popover>
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
                {dueDate ? format(dueDate, "PPP") : "Set due date (optional)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
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
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
