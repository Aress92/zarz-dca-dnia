// Kontekst aplikacji - zarządzanie stanem

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Task, AppSettings, DEFAULT_SETTINGS, Reminder } from '@/types';
import { initDatabase, getAllTasks, saveTask, deleteTask as dbDeleteTask, getSettings, saveSettings as dbSaveSettings, updateTasksOrder } from '@/lib/storage/db';
import { reminderScheduler } from '@/lib/desktop/scheduler';
import { widgetAdapter } from '@/lib/desktop/widget';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  tasks: Task[];
  settings: AppSettings;
  loading: boolean;
  initialized: boolean;
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (tasks: Task[]) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  refreshTasks: () => Promise<void>;
  snoozeReminder: (taskId: string, reminderId: string, minutes: number) => Promise<void>;
  completeReminder: (taskId: string, reminderId: string) => Promise<void>;
  activeReminder: { reminder: Reminder; task: Task } | null;
  dismissActiveReminder: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [activeReminder, setActiveReminder] = useState<{ reminder: Reminder; task: Task } | null>(null);
  const { toast } = useToast();

  // Inicjalizacja bazy danych
  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        const [loadedTasks, loadedSettings] = await Promise.all([
          getAllTasks(),
          getSettings(),
        ]);
        setTasks(loadedTasks);
        setSettings(loadedSettings);
        setInitialized(true);

        // Uruchom scheduler przypomnień
        reminderScheduler.start(loadedSettings, (reminder, task) => {
          setActiveReminder({ reminder, task });
          toast({
            title: reminder.title,
            description: reminder.description || task.description,
          });
        });

        // Otwórz widget przy starcie jeśli ustawiono
        if (loadedSettings.widgetSettings?.enabled && loadedSettings.widgetSettings?.showOnStartup) {
          widgetAdapter.open();
        }
      } catch (error) {
        console.error('Błąd inicjalizacji:', error);
        toast({
          title: 'Błąd',
          description: 'Nie udało się zainicjalizować aplikacji',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      reminderScheduler.stop();
    };
  }, [toast]);

  // Aktualizuj scheduler gdy zmienią się ustawienia
  useEffect(() => {
    if (initialized) {
      reminderScheduler.updateSettings(settings);
    }
  }, [settings, initialized]);

  const refreshTasks = useCallback(async () => {
    const loadedTasks = await getAllTasks();
    setTasks(loadedTasks);
  }, []);

  const addTask = useCallback(async (task: Task) => {
    await saveTask(task);
    await refreshTasks();
  }, [refreshTasks]);

  const updateTask = useCallback(async (task: Task) => {
    const updatedTask = { ...task, updatedAt: new Date().toISOString() };
    await saveTask(updatedTask);
    await refreshTasks();
  }, [refreshTasks]);

  const deleteTaskHandler = useCallback(async (id: string) => {
    await dbDeleteTask(id);
    await refreshTasks();
  }, [refreshTasks]);

  const reorderTasks = useCallback(async (reorderedTasks: Task[]) => {
    const tasksWithOrder = reorderedTasks.map((task, index) => ({
      ...task,
      order: index,
    }));
    await updateTasksOrder(tasksWithOrder);
    setTasks(tasksWithOrder);
  }, []);

  const updateSettingsHandler = useCallback(async (newSettings: AppSettings) => {
    await dbSaveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const snoozeReminder = useCallback(async (taskId: string, reminderId: string, minutes: number) => {
    await reminderScheduler.snoozeReminder(taskId, reminderId, minutes);
    await refreshTasks();
    setActiveReminder(null);
    toast({
      title: 'Przypomnienie odłożone',
      description: `Przypomnę za ${minutes} minut`,
    });
  }, [refreshTasks, toast]);

  const completeReminder = useCallback(async (taskId: string, reminderId: string) => {
    await reminderScheduler.completeReminder(taskId, reminderId);
    await refreshTasks();
    setActiveReminder(null);
    toast({
      title: 'Gotowe',
      description: 'Przypomnienie oznaczone jako wykonane',
    });
  }, [refreshTasks, toast]);

  const dismissActiveReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

  const value: AppContextType = {
    tasks,
    settings,
    loading,
    initialized,
    addTask,
    updateTask,
    deleteTask: deleteTaskHandler,
    reorderTasks,
    updateSettings: updateSettingsHandler,
    refreshTasks,
    snoozeReminder,
    completeReminder,
    activeReminder,
    dismissActiveReminder,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp musi być użyty wewnątrz AppProvider');
  }
  return context;
}
