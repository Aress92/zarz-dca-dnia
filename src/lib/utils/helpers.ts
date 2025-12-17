// Funkcje pomocnicze

import { Task, Reminder } from '@/types';
import { format, isToday, isTomorrow, isPast, addDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(date: string | Date, pattern: string = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: pl });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, HH:mm', { locale: pl });
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(d)) {
    return 'Dzisiaj';
  }
  if (isTomorrow(d)) {
    return 'Jutro';
  }
  
  return formatDate(d);
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'low':
      return 'Niski';
    case 'medium':
      return 'Średni';
    case 'high':
      return 'Wysoki';
    default:
      return priority;
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'todo':
      return 'Do zrobienia';
    case 'in_progress':
      return 'W trakcie';
    case 'done':
      return 'Zakończone';
    default:
      return status;
  }
}

export function getRecurrenceLabel(recurrence: string): string {
  switch (recurrence) {
    case 'none':
      return 'Brak';
    case 'daily':
      return 'Codziennie';
    case 'weekly':
      return 'Co tydzień';
    case 'monthly':
      return 'Co miesiąc';
    case 'custom':
      return 'Własny';
    default:
      return recurrence;
  }
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  
  const dueDate = parseISO(task.dueDate);
  return isPast(endOfDay(dueDate));
}

export function isTaskDueToday(task: Task): boolean {
  if (!task.dueDate) return false;
  return isToday(parseISO(task.dueDate));
}

export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    const taskDate = parseISO(task.dueDate);
    return isWithinInterval(taskDate, {
      start: startOfDay(date),
      end: endOfDay(date),
    });
  });
}

export function getTasksForDateRange(tasks: Task[], startDate: Date, endDate: Date): Task[] {
  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    const taskDate = parseISO(task.dueDate);
    return isWithinInterval(taskDate, {
      start: startOfDay(startDate),
      end: endOfDay(endDate),
    });
  });
}

export function getUpcomingReminders(tasks: Task[]): Array<{ reminder: Reminder; task: Task }> {
  const now = new Date();
  const upcoming: Array<{ reminder: Reminder; task: Task }> = [];

  for (const task of tasks) {
    for (const reminder of task.reminders) {
      if (reminder.completed) continue;

      const reminderTime = reminder.snoozedUntil
        ? parseISO(reminder.snoozedUntil)
        : parseISO(reminder.datetime);

      // Pokaż przypomnienia z następnych 7 dni
      if (reminderTime >= now && reminderTime <= addDays(now, 7)) {
        upcoming.push({ reminder, task });
      }
    }
  }

  // Sortuj według czasu
  upcoming.sort((a, b) => {
    const timeA = a.reminder.snoozedUntil || a.reminder.datetime;
    const timeB = b.reminder.snoozedUntil || b.reminder.datetime;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });

  return upcoming;
}

export function createNewTask(order: number): Task {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: '',
    priority: 'medium',
    status: 'todo',
    tags: [],
    recurrence: 'none',
    reminders: [],
    order,
    createdAt: now,
    updatedAt: now,
  };
}

export function createNewReminder(taskId: string, taskTitle: string): Reminder {
  return {
    id: generateId(),
    taskId,
    datetime: new Date().toISOString(),
    channels: ['desktop'],
    title: taskTitle,
    completed: false,
  };
}
