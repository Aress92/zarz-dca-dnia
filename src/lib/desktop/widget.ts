// Adapter widgetu dla Tauri

declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };
    };
  }
}

const isTauri = () => typeof window !== 'undefined' && !!window.__TAURI__;

export const widgetAdapter = {
  // Otwórz okno widgetu
  async open(): Promise<boolean> {
    if (!isTauri()) {
      console.log('[Widget] Tryb deweloperski - widget wymaga Tauri');
      return false;
    }

    try {
      await window.__TAURI__!.core.invoke('open_widget');
      return true;
    } catch (error) {
      console.error('[Widget] Błąd otwierania widgetu:', error);
      return false;
    }
  },

  // Zamknij okno widgetu
  async close(): Promise<boolean> {
    if (!isTauri()) {
      return false;
    }

    try {
      await window.__TAURI__!.core.invoke('close_widget');
      return true;
    } catch (error) {
      console.error('[Widget] Błąd zamykania widgetu:', error);
      return false;
    }
  },

  // Sprawdź czy widget jest otwarty
  async isOpen(): Promise<boolean> {
    if (!isTauri()) {
      return false;
    }

    try {
      return await window.__TAURI__!.core.invoke<boolean>('is_widget_open');
    } catch (error) {
      console.error('[Widget] Błąd sprawdzania stanu widgetu:', error);
      return false;
    }
  },
};

export const autostartAdapter = {
  // Sprawdź czy autostart jest włączony
  async isEnabled(): Promise<boolean> {
    if (!isTauri()) {
      console.log('[Autostart] Tryb deweloperski - autostart wymaga Tauri');
      return false;
    }

    try {
      return await window.__TAURI__!.core.invoke<boolean>('get_autostart_enabled');
    } catch (error) {
      console.error('[Autostart] Błąd sprawdzania stanu:', error);
      return false;
    }
  },

  // Włącz/wyłącz autostart
  async setEnabled(enabled: boolean): Promise<boolean> {
    if (!isTauri()) {
      console.log('[Autostart] Tryb deweloperski - autostart wymaga Tauri');
      return false;
    }

    try {
      await window.__TAURI__!.core.invoke('set_autostart_enabled', { enabled });
      return true;
    } catch (error) {
      console.error('[Autostart] Błąd ustawiania autostartu:', error);
      return false;
    }
  },
};
