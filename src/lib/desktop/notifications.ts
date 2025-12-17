// Adapter do powiadomień na pulpicie
// MVP: Notification API przeglądarki
// Przygotowane pod Tauri native notifications

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

export interface NotificationAdapter {
  isSupported(): boolean;
  requestPermission(): Promise<NotificationPermission>;
  getPermission(): NotificationPermission;
  show(options: NotificationOptions): Promise<Notification | null>;
}

// MVP: Web Notification API adapter
class WebNotificationAdapter implements NotificationAdapter {
  isSupported(): boolean {
    return 'Notification' in window;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.requestPermission();
  }

  getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  async show(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isSupported()) {
      console.warn('Powiadomienia nie są obsługiwane');
      return null;
    }

    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Brak uprawnień do wyświetlania powiadomień');
        return null;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
      });

      return notification;
    } catch (error) {
      console.error('Błąd podczas wyświetlania powiadomienia:', error);
      return null;
    }
  }
}

// Placeholder dla Tauri native notifications
class TauriNotificationAdapter implements NotificationAdapter {
  isSupported(): boolean {
    // Tauri notifications są zawsze dostępne
    return true;
  }

  async requestPermission(): Promise<NotificationPermission> {
    // TODO: Implementacja z @tauri-apps/api/notification
    // import { requestPermission } from '@tauri-apps/api/notification';
    // const permission = await requestPermission();
    // return permission ? 'granted' : 'denied';
    console.warn('TauriNotificationAdapter: używam fallback na Web Notification');
    return new WebNotificationAdapter().requestPermission();
  }

  getPermission(): NotificationPermission {
    // TODO: import { isPermissionGranted } from '@tauri-apps/api/notification';
    console.warn('TauriNotificationAdapter: używam fallback na Web Notification');
    return new WebNotificationAdapter().getPermission();
  }

  async show(options: NotificationOptions): Promise<Notification | null> {
    // TODO: Implementacja z @tauri-apps/api/notification
    // import { sendNotification } from '@tauri-apps/api/notification';
    // await sendNotification({ title: options.title, body: options.body });
    console.warn('TauriNotificationAdapter: używam fallback na Web Notification');
    return new WebNotificationAdapter().show(options);
  }
}

// Wykrywanie środowiska i wybór adaptera
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export const notificationAdapter: NotificationAdapter = isTauriEnvironment()
  ? new TauriNotificationAdapter()
  : new WebNotificationAdapter();

// Helper do sprawdzania stanu uprawnień
export function getNotificationStatus(): {
  supported: boolean;
  permission: NotificationPermission;
  message: string;
} {
  const supported = notificationAdapter.isSupported();
  const permission = notificationAdapter.getPermission();

  let message = '';
  if (!supported) {
    message = 'Powiadomienia nie są obsługiwane w tym środowisku';
  } else if (permission === 'granted') {
    message = 'Powiadomienia są włączone';
  } else if (permission === 'denied') {
    message = 'Powiadomienia zostały zablokowane. Zmień ustawienia w przeglądarce.';
  } else {
    message = 'Kliknij, aby włączyć powiadomienia';
  }

  return { supported, permission, message };
}
