// Modal aktywnego przypomnienia

import React from 'react';
import { Reminder, Task } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, Check, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/helpers';

interface ActiveReminderModalProps {
  reminder: Reminder;
  task: Task;
  onSnooze: (minutes: number) => void;
  onComplete: () => void;
  onDismiss: () => void;
}

export function ActiveReminderModal({
  reminder,
  task,
  onSnooze,
  onComplete,
  onDismiss,
}: ActiveReminderModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
            {reminder.title}
          </DialogTitle>
          <DialogDescription>
            {formatDateTime(reminder.datetime)}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {reminder.description && (
            <p className="text-sm mb-4">{reminder.description}</p>
          )}

          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Zadanie: {task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={onComplete} className="w-full">
            <Check className="h-4 w-4 mr-2" />
            Oznacz jako wykonane
          </Button>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Odłóż na:
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onSnooze(10)}>
                10 min
              </Button>
              <Button variant="outline" size="sm" onClick={() => onSnooze(30)}>
                30 min
              </Button>
              <Button variant="outline" size="sm" onClick={() => onSnooze(60)}>
                1 godz.
              </Button>
            </div>
          </div>

          <Button variant="ghost" onClick={onDismiss} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Zamknij
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
