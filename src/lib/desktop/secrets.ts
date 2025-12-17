// Adapter do bezpiecznego przechowywania sekretów
// W MVP używamy IndexedDB, ale struktura jest przygotowana pod Tauri secure storage

import { getSecret, saveSecret, deleteSecret } from '@/lib/storage/db';

export interface SecretsAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

// MVP: IndexedDB adapter (dane lokalne, ale niezaszyfrowane)
class IndexedDBSecretsAdapter implements SecretsAdapter {
  async get(key: string): Promise<string | null> {
    return getSecret(key);
  }

  async set(key: string, value: string): Promise<void> {
    return saveSecret(key, value);
  }

  async remove(key: string): Promise<void> {
    return deleteSecret(key);
  }
}

// Placeholder dla Tauri secure storage
// Po integracji z Tauri, ten adapter będzie używał tauri-plugin-store lub podobnego
class TauriSecretsAdapter implements SecretsAdapter {
  async get(key: string): Promise<string | null> {
    // TODO: Implementacja z tauri-plugin-stronghold lub store
    // import { invoke } from '@tauri-apps/api/tauri';
    // return invoke('get_secret', { key });
    console.warn('TauriSecretsAdapter: używam fallback na IndexedDB');
    return getSecret(key);
  }

  async set(key: string, value: string): Promise<void> {
    // TODO: invoke('set_secret', { key, value });
    console.warn('TauriSecretsAdapter: używam fallback na IndexedDB');
    return saveSecret(key, value);
  }

  async remove(key: string): Promise<void> {
    // TODO: invoke('remove_secret', { key });
    console.warn('TauriSecretsAdapter: używam fallback na IndexedDB');
    return deleteSecret(key);
  }
}

// Wykrywanie środowiska i wybór adaptera
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export const secretsAdapter: SecretsAdapter = isTauriEnvironment()
  ? new TauriSecretsAdapter()
  : new IndexedDBSecretsAdapter();

// Klucze sekretów
export const SECRET_KEYS = {
  SMTP_PASSWORD: 'smtp_password',
  WEBHOOK_TOKEN: 'webhook_token',
} as const;
