// IndexedDB Repository z migracjami

import { AppData, Task, AppSettings, DEFAULT_SETTINGS, CURRENT_SCHEMA_VERSION } from '@/types';

const DB_NAME = 'produktywnosc-db';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Nie udało się otworzyć bazy danych'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Store dla zadań
      if (!database.objectStoreNames.contains('tasks')) {
        const taskStore = database.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('status', 'status', { unique: false });
        taskStore.createIndex('dueDate', 'dueDate', { unique: false });
        taskStore.createIndex('priority', 'priority', { unique: false });
      }

      // Store dla ustawień
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'id' });
      }

      // Store dla sekretów (placeholder dla Tauri)
      if (!database.objectStoreNames.contains('secrets')) {
        database.createObjectStore('secrets', { keyPath: 'key' });
      }

      // Store dla metadanych
      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'key' });
      }
    };
  });
}

function getDB(): IDBDatabase {
  if (!db) {
    throw new Error('Baza danych nie została zainicjalizowana');
  }
  return db;
}

// === ZADANIA ===

export async function getAllTasks(): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');
    const request = store.getAll();

    request.onsuccess = () => {
      const tasks = request.result || [];
      tasks.sort((a, b) => a.order - b.order);
      resolve(tasks);
    };
    request.onerror = () => reject(new Error('Błąd podczas pobierania zadań'));
  });
}

export async function getTask(id: string): Promise<Task | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Błąd podczas pobierania zadania'));
  });
}

export async function saveTask(task: Task): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    const request = store.put(task);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Błąd podczas zapisywania zadania'));
  });
}

export async function deleteTask(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Błąd podczas usuwania zadania'));
  });
}

export async function updateTasksOrder(tasks: Task[]): Promise<void> {
  const transaction = getDB().transaction(['tasks'], 'readwrite');
  const store = transaction.objectStore('tasks');

  for (const task of tasks) {
    store.put(task);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Błąd podczas aktualizacji kolejności'));
  });
}

// === USTAWIENIA ===

export async function getSettings(): Promise<AppSettings> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get('app-settings');

    request.onsuccess = () => {
      resolve(request.result?.data || DEFAULT_SETTINGS);
    };
    request.onerror = () => reject(new Error('Błąd podczas pobierania ustawień'));
  });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    const request = store.put({ id: 'app-settings', data: settings });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Błąd podczas zapisywania ustawień'));
  });
}

// === SEKRETY (placeholder dla Tauri secure storage) ===

export async function getSecret(key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['secrets'], 'readonly');
    const store = transaction.objectStore('secrets');
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result?.value || null);
    };
    request.onerror = () => reject(new Error('Błąd podczas pobierania sekretu'));
  });
}

export async function saveSecret(key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['secrets'], 'readwrite');
    const store = transaction.objectStore('secrets');
    const request = store.put({ key, value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Błąd podczas zapisywania sekretu'));
  });
}

export async function deleteSecret(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = getDB().transaction(['secrets'], 'readwrite');
    const store = transaction.objectStore('secrets');
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Błąd podczas usuwania sekretu'));
  });
}

// === EKSPORT / IMPORT ===

export async function exportData(): Promise<AppData> {
  const tasks = await getAllTasks();
  const settings = await getSettings();

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    tasks,
    settings,
  };
}

export async function importData(data: AppData): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Walidacja wersji schematu
  if (!data.schemaVersion || data.schemaVersion > CURRENT_SCHEMA_VERSION) {
    errors.push('Nieprawidłowa wersja schematu danych');
    return { success: false, errors };
  }

  // Walidacja zadań
  if (!Array.isArray(data.tasks)) {
    errors.push('Brak poprawnej listy zadań');
    return { success: false, errors };
  }

  for (const task of data.tasks) {
    if (!task.id || !task.title) {
      errors.push(`Zadanie bez wymaganego ID lub tytułu`);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Import danych
  try {
    // Czyszczenie istniejących danych
    const clearTransaction = getDB().transaction(['tasks'], 'readwrite');
    clearTransaction.objectStore('tasks').clear();

    await new Promise<void>((resolve, reject) => {
      clearTransaction.oncomplete = () => resolve();
      clearTransaction.onerror = () => reject();
    });

    // Dodanie nowych danych
    for (const task of data.tasks) {
      await saveTask(task);
    }

    if (data.settings) {
      await saveSettings(data.settings);
    }

    return { success: true, errors: [] };
  } catch (error) {
    errors.push('Błąd podczas importu danych');
    return { success: false, errors };
  }
}
