import { getTasks } from "@/lib/actions/tasks";
import { Header } from "@/components/header";
import { TaskTable } from "@/components/task-table";
import { TaskMobileList } from "@/components/task-mobile-list";
import { PageTransition } from "@/components/page-transition";
import type { Task } from "@/lib/types";

export default async function TasksPage() {
  const rawTasks = await getTasks();

  const tasks: Task[] = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status as Task["status"],
    priority: t.priority as Task["priority"],
    label: t.label as Task["label"],
    dueAt: t.dueAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  return (
    <PageTransition>
      <div className="px-4 py-6 sm:px-6 lg:px-10">
        <Header tasks={tasks} />
        <div className="mt-6">
          <div className="hidden md:block">
            <TaskTable tasks={tasks} />
          </div>
          <div className="md:hidden">
            <TaskMobileList tasks={tasks} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
