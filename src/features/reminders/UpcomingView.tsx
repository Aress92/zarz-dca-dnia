// Widok nadchodzących przypomnień

import React from 'react';
import { Task, Reminder } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Mail, Monitor, Check, AlarmClock } from 'lucide-react';
import { getUpcomingReminders, formatDateTime } from '@/lib/utils/helpers';
import { getTimeUntilReminder } from '@/lib/desktop/scheduler';

interface UpcomingViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onSnooze: (taskId: string, reminderId: string, minutes: number) => void;
  onComplete: (taskId: string, reminderId: string) => void;
}

export function UpcomingView({ tasks, onTaskClick, onSnooze, onComplete }: UpcomingViewProps) {
  const upcomingReminders = getUpcomingReminders(tasks);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-7 w-7 text-primary" />
          Nadchodzące przypomnienia
        </h1>
        <p className="text-muted-foreground mt-1">
          Przypomnienia z następnych 7 dni
        </p>
      </div>

      <div className="p-3 rounded-lg bg-muted/50 mb-6 text-sm text-muted-foreground">
        <Bell className="h-4 w-4 inline mr-2" />
        Powiadomienia działają, gdy aplikacja jest uruchomiona. W przyszłej wersji z Tauri
        będą działać w tle.
      </div>

      {upcomingReminders.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">Brak nadchodzących przypomnień</p>
          <p className="text-muted-foreground mt-1">
            Dodaj przypomnienia do swoich zadań, aby je tu zobaczyć.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingReminders.map(({ reminder, task }) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              task={task}
              onTaskClick={() => onTaskClick(task)}
              onSnooze={(minutes) => onSnooze(task.id, reminder.id, minutes)}
              onComplete={() => onComplete(task.id, reminder.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReminderCardProps {
  reminder: Reminder;
  task: Task;
  onTaskClick: () => void;
  onSnooze: (minutes: number) => void;
  onComplete: () => void;
}

function ReminderCard({ reminder, task, onTaskClick, onSnooze, onComplete }: ReminderCardProps) {
  const timeUntil = getTimeUntilReminder(reminder);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 cursor-pointer" onClick={onTaskClick}>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-primary" />
              <span className="font-medium">{reminder.title}</span>
            </div>

            {reminder.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {reminder.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <AlarmClock className="h-3 w-3" />
                {formatDateTime(reminder.snoozedUntil || reminder.datetime)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {timeUntil}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mt-2">
              {reminder.channels.includes('desktop') && (
                <Badge variant="outline" className="text-xs">
                  <Monitor className="h-3 w-3 mr-1" />
                  Pulpit
                </Badge>
              )}
              {reminder.channels.includes('email') && (
                <Badge variant="outline" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  E-mail
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Zadanie: {task.title}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button size="sm" variant="outline" onClick={onComplete}>
              <Check className="h-4 w-4 mr-1" />
              Wykonane
            </Button>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => onSnooze(10)}>
                10m
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onSnooze(30)}>
                30m
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onSnooze(60)}>
                1h
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
