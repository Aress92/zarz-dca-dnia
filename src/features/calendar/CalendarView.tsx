// Widok kalendarza

import React, { useState, useMemo } from 'react';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { getTasksForDate } from '@/lib/utils/helpers';

type CalendarView = 'month' | 'week' | 'day';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDayClick: (date: Date) => void;
}

export function CalendarView({ tasks, onTaskClick, onDayClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');

  const navigatePrev = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Kalendarz</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Dzisiaj
          </Button>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setView('day')}
            >
              Dzień
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setView('week')}
            >
              Tydzień
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setView('month')}
            >
              Miesiąc
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={navigatePrev}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {view === 'month' && format(currentDate, 'LLLL yyyy', { locale: pl })}
          {view === 'week' && `Tydzień ${format(currentDate, 'w, LLLL yyyy', { locale: pl })}`}
          {view === 'day' && format(currentDate, 'EEEE, d MMMM yyyy', { locale: pl })}
        </h2>
        <Button variant="ghost" size="icon" onClick={navigateNext}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-hidden">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            tasks={tasks}
            onTaskClick={onTaskClick}
            onDayClick={onDayClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            tasks={tasks}
            onTaskClick={onTaskClick}
            onDayClick={onDayClick}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            tasks={tasks}
            onTaskClick={onTaskClick}
          />
        )}
      </div>
    </div>
  );
}

// Widok miesiąca
function MonthView({
  currentDate,
  tasks,
  onTaskClick,
  onDayClick,
}: {
  currentDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDayClick: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: pl });
  const calendarEnd = endOfWeek(monthEnd, { locale: pl });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

  return (
    <div className="h-full flex flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="flex-1 grid grid-cols-7 gap-1 auto-rows-fr">
        {days.map((day) => {
          const dayTasks = getTasksForDate(tasks, day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = isToday(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                'p-1 rounded-lg border border-border cursor-pointer transition-colors hover:bg-muted/50 overflow-hidden',
                !isCurrentMonth && 'opacity-40',
                isSelected && 'bg-primary/10 border-primary'
              )}
            >
              <div
                className={cn(
                  'text-sm font-medium mb-1',
                  isSelected && 'text-primary'
                )}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    className={cn(
                      'text-xs px-1 py-0.5 rounded truncate',
                      task.status === 'done'
                        ? 'bg-muted text-muted-foreground line-through'
                        : task.priority === 'high'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-primary/20 text-primary'
                    )}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{dayTasks.length - 3} więcej
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Widok tygodnia
function WeekView({
  currentDate,
  tasks,
  onTaskClick,
  onDayClick,
}: {
  currentDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDayClick: (date: Date) => void;
}) {
  const weekStart = startOfWeek(currentDate, { locale: pl });
  const weekEnd = endOfWeek(currentDate, { locale: pl });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="h-full grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayTasks = getTasksForDate(tasks, day);
        const isSelected = isToday(day);

        return (
          <div
            key={day.toISOString()}
            className={cn(
              'flex flex-col rounded-lg border border-border overflow-hidden',
              isSelected && 'border-primary'
            )}
          >
            <div
              onClick={() => onDayClick(day)}
              className={cn(
                'p-2 text-center cursor-pointer hover:bg-muted/50',
                isSelected && 'bg-primary/10'
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(day, 'EEE', { locale: pl })}
              </div>
              <div className={cn('text-lg font-medium', isSelected && 'text-primary')}>
                {format(day, 'd')}
              </div>
            </div>
            <div className="flex-1 p-1 space-y-1 overflow-y-auto">
              {dayTasks.map((task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-sm"
                  onClick={() => onTaskClick(task)}
                >
                  <CardContent className="p-2">
                    <p
                      className={cn(
                        'text-xs font-medium truncate',
                        task.status === 'done' && 'line-through text-muted-foreground'
                      )}
                    >
                      {task.title}
                    </p>
                    {task.dueTime && (
                      <p className="text-xs text-muted-foreground">{task.dueTime}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Widok dnia
function DayView({
  currentDate,
  tasks,
  onTaskClick,
}: {
  currentDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const dayTasks = getTasksForDate(tasks, currentDate);

  // Generuj godziny dnia
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getTasksForHour = (hour: number) => {
    return dayTasks.filter((task) => {
      if (!task.dueTime) return hour === 9; // Domyślnie o 9:00
      const taskHour = parseInt(task.dueTime.split(':')[0], 10);
      return taskHour === hour;
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-0">
        {hours.map((hour) => {
          const hourTasks = getTasksForHour(hour);
          const timeString = `${hour.toString().padStart(2, '0')}:00`;

          return (
            <div
              key={hour}
              className="flex border-b border-border min-h-[60px]"
            >
              <div className="w-16 p-2 text-sm text-muted-foreground border-r border-border flex-shrink-0">
                {timeString}
              </div>
              <div className="flex-1 p-1 space-y-1">
                {hourTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-sm"
                    onClick={() => onTaskClick(task)}
                  >
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            task.status === 'done' && 'line-through text-muted-foreground'
                          )}
                        >
                          {task.title}
                        </p>
                        <Badge
                          variant={
                            task.priority === 'high'
                              ? 'destructive'
                              : task.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {task.priority === 'high'
                            ? 'Wysoki'
                            : task.priority === 'medium'
                            ? 'Średni'
                            : 'Niski'}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {task.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
