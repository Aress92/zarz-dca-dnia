// Karta zadania

import React from 'react';
import { Task } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Bell, Flag, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeDate, getPriorityLabel, isTaskOverdue } from '@/lib/utils/helpers';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onStatusChange: (status: 'done' | 'todo') => void;
  draggable?: boolean;
}

export function TaskCard({ task, onClick, onStatusChange, draggable = false }: TaskCardProps) {
  const isDone = task.status === 'done';
  const overdue = isTaskOverdue(task);
  const hasReminders = task.reminders.filter((r) => !r.completed).length > 0;

  const priorityColors = {
    low: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
    medium: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
    high: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isDone && 'opacity-60',
        overdue && !isDone && 'border-destructive/50'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {draggable && (
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab flex-shrink-0 mt-0.5" />
          )}
          
          <Checkbox
            checked={isDone}
            onCheckedChange={(checked) => {
              onStatusChange(checked ? 'done' : 'todo');
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5"
          />

          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                'font-medium truncate',
                isDone && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {task.dueDate && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    overdue && !isDone ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="h-3 w-3" />
                  {formatRelativeDate(task.dueDate)}
                  {task.dueTime && `, ${task.dueTime}`}
                </span>
              )}

              {hasReminders && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Bell className="h-3 w-3" />
                  {task.reminders.filter((r) => !r.completed).length}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={cn('text-xs', priorityColors[task.priority])}
              >
                <Flag className="h-3 w-3 mr-1" />
                {getPriorityLabel(task.priority)}
              </Badge>

              {task.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
