// Widok Dzisiaj

import React from 'react';
import { Task } from '@/types';
import { TaskCard } from '../tasks/TaskCard';
import { Button } from '@/components/ui/button';
import { Plus, Sun, PartyPopper } from 'lucide-react';
import { isTaskDueToday, isTaskOverdue } from '@/lib/utils/helpers';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface TodayViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskStatusChange: (task: Task, status: 'done' | 'todo') => void;
  onAddTask: () => void;
}

export function TodayView({ tasks, onTaskClick, onTaskStatusChange, onAddTask }: TodayViewProps) {
  const today = new Date();
  const todayTasks = tasks.filter((task) => isTaskDueToday(task) && task.status !== 'done');
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task));
  const completedToday = tasks.filter((task) => isTaskDueToday(task) && task.status === 'done');

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sun className="h-7 w-7 text-primary" />
              Dzisiaj
            </h1>
            <p className="text-muted-foreground mt-1">
              {format(today, 'EEEE, d MMMM yyyy', { locale: pl })}
            </p>
          </div>
          <Button onClick={onAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Nowe zadanie
          </Button>
        </div>
      </div>

      {/* Zaległe */}
      {overdueTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-destructive mb-3">
            Zaległe ({overdueTasks.length})
          </h2>
          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onStatusChange={(status) => onTaskStatusChange(task, status)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Na dziś */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Do zrobienia dzisiaj ({todayTasks.length})
        </h2>
        {todayTasks.length > 0 ? (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onStatusChange={(status) => onTaskStatusChange(task, status)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <PartyPopper className="h-12 w-12 mx-auto text-primary mb-3" />
            <p className="text-lg font-medium">Brak zadań na dziś 🎉</p>
            <p className="text-muted-foreground mt-1">
              Świetna robota! Wszystko zrobione.
            </p>
            <Button variant="outline" className="mt-4" onClick={onAddTask}>
              <Plus className="h-4 w-4 mr-2" />
              Zaplanuj coś nowego
            </Button>
          </div>
        )}
      </div>

      {/* Ukończone dziś */}
      {completedToday.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-muted-foreground mb-3">
            Ukończone dzisiaj ({completedToday.length})
          </h2>
          <div className="space-y-3">
            {completedToday.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onStatusChange={(status) => onTaskStatusChange(task, status)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
