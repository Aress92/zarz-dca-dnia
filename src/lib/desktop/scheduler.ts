// Lokalny harmonogram przypomnień
// Działa gdy aplikacja jest uruchomiona
// W Tauri można rozszerzyć o background tasks

import { Task, Reminder, AppSettings } from '@/types';
import { notificationAdapter } from './notifications';
import { emailAdapter } from './email';
import { getAllTasks, saveTask } from '@/lib/storage/db';

type ReminderCallback = (reminder: Reminder, task: Task) => void;

class ReminderScheduler {
  private intervalId: number | null = null;
  private settings: AppSettings | null = null;
  private onReminderTriggered: ReminderCallback | null = null;
  private checkIntervalMs = 30000; // Sprawdzanie co 30 sekund

  start(settings: AppSettings, onReminderTriggered?: ReminderCallback) {
    this.settings = settings;
    this.onReminderTriggered = onReminderTriggered || null;

    if (this.intervalId !== null) {
      this.stop();
    }

    // Natychmiastowe sprawdzenie
    this.checkReminders();

    // Cykliczne sprawdzanie
    this.intervalId = window.setInterval(() => {
      this.checkReminders();
    }, this.checkIntervalMs);

    console.log('Scheduler przypomnień uruchomiony');
  }

  stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Scheduler przypomnień zatrzymany');
    }
  }

  updateSettings(settings: AppSettings) {
    this.settings = settings;
  }

  private async checkReminders() {
    if (!this.settings) return;

    const now = new Date();
    const tasks = await getAllTasks();

    for (const task of tasks) {
      for (const reminder of task.reminders) {
        if (reminder.completed) continue;

        const reminderTime = reminder.snoozedUntil
          ? new Date(reminder.snoozedUntil)
          : new Date(reminder.datetime);

        // Sprawdź czy czas przypomnienia minął (z marginesem 1 minuty)
        if (reminderTime <= now && now.getTime() - reminderTime.getTime() < 60000) {
          await this.triggerReminder(reminder, task);
        }
      }
    }
  }

  private async triggerReminder(reminder: Reminder, task: Task) {
    console.log('Wyzwalanie przypomnienia:', reminder.title);

    // Powiadomienie na pulpicie
    if (reminder.channels.includes('desktop') && this.settings?.desktopNotificationsEnabled) {
      await notificationAdapter.show({
        title: reminder.title,
        body: reminder.description || task.description || '',
        tag: reminder.id,
        requireInteraction: true,
      });
    }

    // E-mail
    if (reminder.channels.includes('email') && this.settings?.emailSettings.enabled) {
      await emailAdapter.send(this.settings.emailSettings, {
        to: this.settings.emailSettings.recipientEmail,
        subject: `Przypomnienie: ${reminder.title}`,
        body: `${reminder.description || ''}\n\nZadanie: ${task.title}\n${task.description || ''}`,
      });
    }

    // Callback dla UI
    if (this.onReminderTriggered) {
      this.onReminderTriggered(reminder, task);
    }
  }

  async snoozeReminder(taskId: string, reminderId: string, minutes: number): Promise<void> {
    const tasks = await getAllTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const reminder = task.reminders.find((r) => r.id === reminderId);
    if (!reminder) return;

    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

    reminder.snoozedUntil = snoozeUntil.toISOString();
    task.updatedAt = new Date().toISOString();

    await saveTask(task);
    console.log(`Przypomnienie odłożone o ${minutes} minut`);
  }

  async completeReminder(taskId: string, reminderId: string): Promise<void> {
    const tasks = await getAllTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const reminder = task.reminders.find((r) => r.id === reminderId);
    if (!reminder) return;

    reminder.completed = true;
    task.updatedAt = new Date().toISOString();

    await saveTask(task);
    console.log('Przypomnienie oznaczone jako wykonane');
  }
}

export const reminderScheduler = new ReminderScheduler();

// Helper do obliczania "za ile" czas do przypomnienia
export function getTimeUntilReminder(reminder: Reminder): string {
  const now = new Date();
  const reminderTime = reminder.snoozedUntil
    ? new Date(reminder.snoozedUntil)
    : new Date(reminder.datetime);

  const diffMs = reminderTime.getTime() - now.getTime();

  if (diffMs < 0) {
    return 'Teraz';
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `za ${diffDays} ${diffDays === 1 ? 'dzień' : diffDays < 5 ? 'dni' : 'dni'}`;
  }

  if (diffHours > 0) {
    return `za ${diffHours} ${diffHours === 1 ? 'godzinę' : diffHours < 5 ? 'godziny' : 'godzin'}`;
  }

  if (diffMinutes > 0) {
    return `za ${diffMinutes} ${diffMinutes === 1 ? 'minutę' : diffMinutes < 5 ? 'minuty' : 'minut'}`;
  }

  return 'Za chwilę';
}
