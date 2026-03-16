import { getTasks, getArchivedTasks } from "@/lib/actions/tasks";
import { Header } from "@/components/header";
import { TaskTable } from "@/components/task-table";
import { TaskMobileLayout } from "@/components/task-mobile-layout";
import { ArchivedTasks } from "@/components/archived-tasks";
import { PageTransition } from "@/components/page-transition";
import type { Task } from "@/lib/types";

function mapRawTask(t: Awaited<ReturnType<typeof getTasks>>[number]): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status as Task["status"],
    priority: t.priority as Task["priority"],
    label: t.label as Task["label"],
    dueAt: t.dueAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    archivedAt: t.archivedAt,
  };
}

export default async function TasksPage() {
  const [rawTasks, rawArchived] = await Promise.all([
    getTasks(),
    getArchivedTasks(),
  ]);

  const tasks: Task[] = rawTasks.map(mapRawTask);
  const archivedTasks: Task[] = rawArchived.map(mapRawTask);

  return (
    <PageTransition>
      <div className="min-h-dvh px-4 py-6 sm:px-6 lg:px-10">
        <Header tasks={tasks} />
        <div className="mt-6">
          <div className="hidden md:block">
            <TaskTable tasks={tasks} />
            {archivedTasks.length > 0 && (
              <div className="mt-6">
                <ArchivedTasks tasks={archivedTasks} />
              </div>
            )}
          </div>
          <div className="md:hidden">
            <TaskMobileLayout
              tasks={tasks}
              archivedTasks={archivedTasks}
            />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
