// Główne typy aplikacji

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type ReminderChannel = 'desktop' | 'email';

export interface Reminder {
  id: string;
  taskId: string;
  datetime: string; // ISO string
  channels: ReminderChannel[];
  title: string;
  description?: string;
  snoozedUntil?: string; // ISO string, jeśli odłożone
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string; // ISO string
  dueTime?: string; // HH:mm format
  tags: string[];
  recurrence: RecurrenceType;
  customRecurrenceInterval?: number; // w dniach
  reminders: Reminder[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSettings {
  enabled: boolean;
  recipientEmail: string;
  method: 'smtp' | 'webhook';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    // hasło przechowywane w secrets
  };
  webhook?: {
    url: string;
    // token przechowywany w secrets
  };
}

export interface WidgetSettings {
  enabled: boolean;
  showOnStartup: boolean;
  showCalendar: boolean;
  showReminders: boolean;
  maxRemindersToShow: number;
}

export interface AppSettings {
  desktopNotificationsEnabled: boolean;
  emailSettings: EmailSettings;
  theme: 'light' | 'dark' | 'system';
  autoStartEnabled: boolean;
  widgetSettings: WidgetSettings;
}

export interface AppData {
  schemaVersion: number;
  tasks: Task[];
  settings: AppSettings;
}

export const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  enabled: false,
  showOnStartup: false,
  showCalendar: true,
  showReminders: true,
  maxRemindersToShow: 5,
};

export const DEFAULT_SETTINGS: AppSettings = {
  desktopNotificationsEnabled: true,
  emailSettings: {
    enabled: false,
    recipientEmail: '',
    method: 'smtp',
  },
  theme: 'system',
  autoStartEnabled: false,
  widgetSettings: DEFAULT_WIDGET_SETTINGS,
};

export const CURRENT_SCHEMA_VERSION = 1;
