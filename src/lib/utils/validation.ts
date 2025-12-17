// Walidacja danych w języku polskim

import { z } from 'zod';

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Tytuł jest wymagany')
    .max(200, 'Tytuł może mieć maksymalnie 200 znaków'),
  description: z.string().max(5000, 'Opis może mieć maksymalnie 5000 znaków').optional(),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Wybierz priorytet' }),
  }),
  status: z.enum(['todo', 'in_progress', 'done'], {
    errorMap: () => ({ message: 'Wybierz status' }),
  }),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  tags: z.array(z.string().max(50, 'Tag może mieć maksymalnie 50 znaków')),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'custom']),
  customRecurrenceInterval: z.number().min(1, 'Interwał musi być większy od 0').optional(),
});

export const reminderSchema = z.object({
  datetime: z.string().min(1, 'Data i godzina są wymagane'),
  channels: z
    .array(z.enum(['desktop', 'email']))
    .min(1, 'Wybierz przynajmniej jeden kanał powiadomienia'),
  title: z
    .string()
    .min(1, 'Tytuł przypomnienia jest wymagany')
    .max(100, 'Tytuł może mieć maksymalnie 100 znaków'),
  description: z.string().max(500, 'Opis może mieć maksymalnie 500 znaków').optional(),
});

export const emailSettingsSchema = z.object({
  enabled: z.boolean(),
  recipientEmail: z
    .string()
    .email('Nieprawidłowy adres e-mail')
    .optional()
    .or(z.literal('')),
  method: z.enum(['smtp', 'webhook']),
  smtp: z
    .object({
      host: z.string().min(1, 'Host jest wymagany'),
      port: z.number().min(1).max(65535, 'Nieprawidłowy numer portu'),
      secure: z.boolean(),
      username: z.string().min(1, 'Nazwa użytkownika jest wymagana'),
    })
    .optional(),
  webhook: z
    .object({
      url: z.string().url('Nieprawidłowy URL webhooka'),
    })
    .optional(),
});

export const importDataSchema = z.object({
  schemaVersion: z.number(),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high']),
      status: z.enum(['todo', 'in_progress', 'done']),
      dueDate: z.string().optional(),
      dueTime: z.string().optional(),
      tags: z.array(z.string()),
      recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'custom']),
      customRecurrenceInterval: z.number().optional(),
      reminders: z.array(z.any()),
      order: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
  settings: z.any().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
export type ReminderFormData = z.infer<typeof reminderSchema>;
export type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;
