// Główny layout aplikacji

import React, { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types';
import { Sidebar, ViewType } from '@/components/Sidebar';
import { TaskForm } from '@/features/tasks/TaskForm';
import { TaskList } from '@/features/tasks/TaskList';
import { TodayView } from '@/features/today/TodayView';
import { CalendarView } from '@/features/calendar/CalendarView';
import { UpcomingView } from '@/features/reminders/UpcomingView';
import { SettingsView } from '@/features/settings/SettingsView';
import { ActiveReminderModal } from '@/components/ActiveReminderModal';
import { useApp } from '@/app/AppContext';
import { isTaskDueToday, isTaskOverdue, createNewTask, getUpcomingReminders } from '@/lib/utils/helpers';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function AppLayout() {
  const {
    tasks,
    settings,
    loading,
    initialized,
    addTask,
    updateTask,
    deleteTask,
    updateSettings,
    snoozeReminder,
    completeReminder,
    activeReminder,
    dismissActiveReminder,
  } = useApp();

  const [currentView, setCurrentView] = useState<ViewType>('today');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Oblicz liczniki dla sidebara
  const taskCounts = {
    today: tasks.filter((t) => isTaskDueToday(t) && t.status !== 'done').length,
    overdue: tasks.filter((t) => isTaskOverdue(t)).length,
    upcoming: getUpcomingReminders(tasks).length,
  };

  // Skróty klawiaturowe
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            handleAddTask();
            break;
          case 'f':
            e.preventDefault();
            setCurrentView('tasks');
            // Focus na wyszukiwarkę (można rozszerzyć)
            break;
          case ',':
            e.preventDefault();
            setCurrentView('settings');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tasks]);

  const handleAddTask = useCallback(() => {
    const newTask = createNewTask(tasks.length);
    setSelectedTask(newTask);
    setShowTaskForm(true);
  }, [tasks.length]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  }, []);

  const handleSaveTask = useCallback(
    async (task: Task) => {
      if (selectedTask && tasks.find((t) => t.id === task.id)) {
        await updateTask(task);
      } else {
        await addTask(task);
      }
      setShowTaskForm(false);
      setSelectedTask(null);
    },
    [selectedTask, tasks, updateTask, addTask]
  );

  const handleDeleteTask = useCallback(async () => {
    if (selectedTask) {
      await deleteTask(selectedTask.id);
      setShowTaskForm(false);
      setSelectedTask(null);
    }
  }, [selectedTask, deleteTask]);

  const handleCloseForm = useCallback(() => {
    setShowTaskForm(false);
    setSelectedTask(null);
  }, []);

  const handleTaskStatusChange = useCallback(
    async (task: Task, status: 'done' | 'todo') => {
      await updateTask({ ...task, status });
    },
    [updateTask]
  );

  const handleDayClick = useCallback(
    (date: Date) => {
      const newTask = createNewTask(tasks.length);
      newTask.dueDate = date.toISOString();
      setSelectedTask(newTask);
      setShowTaskForm(true);
    },
    [tasks.length]
  );

  if (loading || !initialized) {
    return (
      <div className="h-screen flex">
        <div className="w-64 border-r border-border bg-sidebar p-6">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    switch (currentView) {
      case 'today':
        return (
          <TodayView
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskStatusChange={handleTaskStatusChange}
            onAddTask={handleAddTask}
          />
        );
      case 'tasks':
        return (
          <TaskList
            tasks={tasks.filter((t) => t.status !== 'done')}
            onTaskClick={handleTaskClick}
            onTaskStatusChange={handleTaskStatusChange}
            onAddTask={handleAddTask}
            emptyMessage="Brak aktywnych zadań"
          />
        );
      case 'calendar':
        return (
          <CalendarView
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onDayClick={handleDayClick}
          />
        );
      case 'upcoming':
        return (
          <UpcomingView
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onSnooze={snoozeReminder}
            onComplete={completeReminder}
          />
        );
      case 'overdue':
        return (
          <TaskList
            tasks={tasks.filter((t) => isTaskOverdue(t))}
            onTaskClick={handleTaskClick}
            onTaskStatusChange={handleTaskStatusChange}
            onAddTask={handleAddTask}
            showAddButton={false}
            emptyMessage="Brak zaległych zadań 🎉"
          />
        );
      case 'completed':
        return (
          <TaskList
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskStatusChange={handleTaskStatusChange}
            onAddTask={handleAddTask}
            showAddButton={false}
            filterStatus="done"
            emptyMessage="Brak zakończonych zadań"
          />
        );
      case 'settings':
        return <SettingsView settings={settings} onSave={updateSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        taskCounts={taskCounts}
      />

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        <div className={cn('flex-1 p-6 overflow-hidden', showTaskForm && 'hidden md:block')}>
          {renderMainContent()}
        </div>

        {/* Task form panel */}
        {showTaskForm && (
          <div className="w-full md:w-[450px] border-l border-border bg-card flex-shrink-0">
            <TaskForm
              task={selectedTask}
              onSave={handleSaveTask}
              onDelete={selectedTask?.title ? handleDeleteTask : undefined}
              onClose={handleCloseForm}
            />
          </div>
        )}
      </main>

      {/* Active reminder modal */}
      {activeReminder && (
        <ActiveReminderModal
          reminder={activeReminder.reminder}
          task={activeReminder.task}
          onSnooze={(minutes) => snoozeReminder(activeReminder.task.id, activeReminder.reminder.id, minutes)}
          onComplete={() => completeReminder(activeReminder.task.id, activeReminder.reminder.id)}
          onDismiss={dismissActiveReminder}
        />
      )}
    </div>
  );
}
