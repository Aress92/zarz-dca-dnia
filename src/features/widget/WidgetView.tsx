// Widok widgetu - mini kalendarz i przypomnienia

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Task, Reminder, AppSettings, DEFAULT_SETTINGS } from '@/types';
import { getAllTasks, getSettings, initDatabase } from '@/lib/storage/db';
import { ChevronLeft, ChevronRight, Bell, Calendar, Clock, CheckCircle, X } from 'lucide-react';
import { widgetAdapter } from '@/lib/desktop/widget';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/app/ThemeProvider';

interface UpcomingReminder {
  reminder: Reminder;
  task: Task;
}

export function WidgetView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Funkcja zamykania widgetu
  const handleCloseWidget = useCallback(async () => {
    try {
      await widgetAdapter.close();
    } catch (err) {
      console.error('Błąd zamykania widgetu:', err);
      // Fallback - spróbuj zamknąć okno przeglądarki
      window.close();
    }
  }, []);

  // Funkcja ładowania danych (bez inicjalizacji DB)
  const loadData = useCallback(async () => {
    if (!dbInitialized) return;

    try {
      const [loadedTasks, loadedSettings] = await Promise.all([
        getAllTasks(),
        getSettings(),
      ]);
      setTasks(loadedTasks);
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Błąd ładowania danych widgetu:', error);
    }
  }, [dbInitialized]);

  // Inicjalizacja bazy danych - tylko raz, z timeout
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    async function init() {
      try {
        // Timeout 10 sekund na inicjalizację
        const initPromise = initDatabase();
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Timeout inicjalizacji bazy danych'));
          }, 10000);
        });

        await Promise.race([initPromise, timeoutPromise]);

        if (timeoutId) clearTimeout(timeoutId);

        if (mounted) {
          setDbInitialized(true);
          setError(null);
        }
      } catch (err) {
        console.error('Błąd inicjalizacji bazy w widgecie:', err);
        if (mounted) {
          setError('Nie udało się załadować danych. Spróbuj ponownie otworzyć widget.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Ładowanie danych po inicjalizacji DB
  useEffect(() => {
    if (dbInitialized) {
      loadData();
    }
  }, [dbInitialized, loadData]);

  // Interwał odświeżania z obsługą widoczności okna
  useEffect(() => {
    if (!dbInitialized) return;

    const startInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Odświeżaj co 2 minuty zamiast co minutę
      intervalRef.current = setInterval(loadData, 120000);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Odśwież dane gdy okno staje się widoczne
        loadData();
        startInterval();
      } else {
        // Zatrzymaj interwał gdy okno jest niewidoczne
        stopInterval();
      }
    };

    // Nasłuchuj zmiany widoczności
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Uruchom interwał jeśli okno jest widoczne
    if (document.visibilityState === 'visible') {
      startInterval();
    }

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dbInitialized, loadData]);

  // Pobierz nadchodzące przypomnienia (następne 7 dni)
  const getUpcomingReminders = useCallback((): UpcomingReminder[] => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const reminders: UpcomingReminder[] = [];

    tasks.forEach((task) => {
      task.reminders.forEach((reminder) => {
        if (reminder.completed) return;

        const reminderDate = reminder.snoozedUntil
          ? new Date(reminder.snoozedUntil)
          : new Date(reminder.datetime);

        if (reminderDate >= now && reminderDate <= weekFromNow) {
          reminders.push({ reminder, task });
        }
      });
    });

    return reminders
      .sort((a, b) => {
        const dateA = a.reminder.snoozedUntil || a.reminder.datetime;
        const dateB = b.reminder.snoozedUntil || b.reminder.datetime;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      })
      .slice(0, settings.widgetSettings?.maxRemindersToShow || 5);
  }, [tasks, settings.widgetSettings?.maxRemindersToShow]);

  // Pobierz zadania na dany dzień
  const getTasksForDate = useCallback((date: Date): Task[] => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), date);
    });
  }, [tasks]);

  // Dni miesiąca
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Początek tygodnia (poniedziałek)
  const startDay = monthStart.getDay();
  const paddingDays = startDay === 0 ? 6 : startDay - 1;

  const upcomingReminders = getUpcomingReminders();
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const showCalendar = settings.widgetSettings?.showCalendar ?? true;
  const showReminders = settings.widgetSettings?.showReminders ?? true;

  if (loading) {
    return (
      <ThemeProvider>
        <div className="h-screen flex items-center justify-center bg-background text-foreground p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Ładowanie...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider>
        <div className="h-screen flex flex-col bg-background text-foreground">
          <div className="p-3 border-b flex items-center justify-between bg-card">
            <h1 className="text-sm font-semibold">Zarządca Dnia</h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCloseWidget}
              title="Zamknij widget"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Odśwież
              </Button>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
        {/* Nagłówek */}
        <div className="p-3 border-b flex items-center justify-between bg-card flex-shrink-0">
          <h1 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Zarządca Dnia
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {format(new Date(), 'd MMMM', { locale: pl })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCloseWidget}
              title="Zamknij widget"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 space-y-4">
            {/* Mini kalendarz */}
            {showCalendar && (
              <div className="bg-card rounded-lg border p-3">
                {/* Nawigacja miesiąca */}
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {format(currentMonth, 'LLLL yyyy', { locale: pl })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Dni tygodnia */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs text-muted-foreground font-medium py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Dni miesiąca */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Puste komórki na początku */}
                  {Array.from({ length: paddingDays }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-7" />
                  ))}

                  {monthDays.map((day) => {
                    const dayTasks = getTasksForDate(day);
                    const hasTasks = dayTasks.length > 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(isSelected ? null : day)}
                        className={cn(
                          'h-7 w-full rounded text-xs font-medium relative flex items-center justify-center transition-colors',
                          isToday(day) && 'bg-primary text-primary-foreground',
                          !isToday(day) && isSelected && 'bg-accent',
                          !isToday(day) && !isSelected && 'hover:bg-accent/50',
                          !isSameMonth(day, currentMonth) && 'text-muted-foreground'
                        )}
                      >
                        {format(day, 'd')}
                        {hasTasks && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Zadania wybranego dnia */}
                {selectedDate && selectedDateTasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground">
                      {format(selectedDate, 'd MMMM', { locale: pl })}
                    </h3>
                    {selectedDateTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="text-xs p-2 rounded bg-accent/50 flex items-center gap-2"
                      >
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            task.priority === 'high' && 'bg-destructive',
                            task.priority === 'medium' && 'bg-yellow-500',
                            task.priority === 'low' && 'bg-primary'
                          )}
                        />
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {selectedDateTasks.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{selectedDateTasks.length - 3} więcej
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Nadchodzące przypomnienia */}
            {showReminders && (
              <div className="bg-card rounded-lg border p-3">
                <h2 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Bell className="h-4 w-4 text-primary" />
                  Nadchodzące przypomnienia
                </h2>

                {upcomingReminders.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Brak nadchodzących przypomnień
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingReminders.map(({ reminder, task }) => {
                      const reminderDate = reminder.snoozedUntil
                        ? new Date(reminder.snoozedUntil)
                        : new Date(reminder.datetime);

                      return (
                        <div
                          key={reminder.id}
                          className="p-2 rounded bg-accent/50 space-y-1"
                        >
                          <div className="flex items-start gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {reminder.title || task.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {format(reminderDate, 'd MMM, HH:mm', { locale: pl })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Dzisiejsze zadania - szybki podgląd */}
            <div className="bg-card rounded-lg border p-3">
              <h2 className="text-sm font-medium flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-primary" />
                Dzisiaj
              </h2>

              {(() => {
                const todayTasks = getTasksForDate(new Date()).filter(
                  (t) => t.status !== 'done'
                );

                if (todayTasks.length === 0) {
                  return (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Brak zadań na dziś
                    </p>
                  );
                }

                return (
                  <div className="space-y-1">
                    {todayTasks.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        className="text-xs p-2 rounded bg-accent/50 flex items-center gap-2"
                      >
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            task.priority === 'high' && 'bg-destructive',
                            task.priority === 'medium' && 'bg-yellow-500',
                            task.priority === 'low' && 'bg-primary'
                          )}
                        />
                        <span className="truncate flex-1">{task.title}</span>
                        {task.dueTime && (
                          <span className="text-muted-foreground">{task.dueTime}</span>
                        )}
                      </div>
                    ))}
                    {todayTasks.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{todayTasks.length - 4} więcej
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </ScrollArea>
      </div>
    </ThemeProvider>
  );
}

export default WidgetView;
