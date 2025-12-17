// Adapter do wysyłania e-maili
// MVP: SMTP przez proxy lub Webhook
// W środowisku desktop (Tauri) może używać natywnych bibliotek

import { EmailSettings } from '@/types';
import { secretsAdapter, SECRET_KEYS } from './secrets';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: boolean;
}

export interface EmailResult {
  success: boolean;
  message: string;
}

export interface EmailAdapter {
  send(settings: EmailSettings, payload: EmailPayload): Promise<EmailResult>;
  test(settings: EmailSettings): Promise<EmailResult>;
}

// SMTP Adapter (wymaga proxy lub Tauri backend)
class SMTPAdapter implements EmailAdapter {
  async send(settings: EmailSettings, payload: EmailPayload): Promise<EmailResult> {
    if (!settings.smtp) {
      return { success: false, message: 'Brak konfiguracji SMTP' };
    }

    const password = await secretsAdapter.get(SECRET_KEYS.SMTP_PASSWORD);
    if (!password) {
      return { success: false, message: 'Brak hasła SMTP. Skonfiguruj je w ustawieniach.' };
    }

    // W środowisku webowym SMTP wymaga proxy backendu
    // W Tauri można użyć tauri-plugin-smtp lub natywnej biblioteki Rust
    
    // Placeholder - w prawdziwej implementacji:
    // - Tauri: invoke('send_smtp_email', { settings, payload, password })
    // - Web: fetch('/api/send-email', { method: 'POST', body: JSON.stringify({ settings, payload }) })
    
    console.log('SMTPAdapter: wysyłanie e-maila (placeholder)', { to: payload.to, subject: payload.subject });
    
    // Symulacja - w MVP pokazujemy sukces z informacją
    return {
      success: false,
      message: 'Wysyłka SMTP wymaga backendu (Tauri lub proxy). E-mail nie został wysłany.',
    };
  }

  async test(settings: EmailSettings): Promise<EmailResult> {
    return this.send(settings, {
      to: settings.recipientEmail,
      subject: 'Test powiadomień - Produktywność',
      body: 'To jest testowa wiadomość z aplikacji Produktywność. Jeśli ją widzisz, konfiguracja e-mail działa poprawnie!',
    });
  }
}

// Webhook Adapter (np. dla n8n, Make, SendGrid API)
class WebhookAdapter implements EmailAdapter {
  async send(settings: EmailSettings, payload: EmailPayload): Promise<EmailResult> {
    if (!settings.webhook?.url) {
      return { success: false, message: 'Brak URL webhooka' };
    }

    const token = await secretsAdapter.get(SECRET_KEYS.WEBHOOK_TOKEN);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(settings.webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: payload.to,
          subject: payload.subject,
          body: payload.body,
          html: payload.html,
        }),
      });

      if (response.ok) {
        return { success: true, message: 'E-mail wysłany pomyślnie' };
      } else {
        const errorText = await response.text();
        return { success: false, message: `Błąd webhooka: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      return {
        success: false,
        message: `Błąd połączenia: ${error instanceof Error ? error.message : 'Nieznany błąd'}`,
      };
    }
  }

  async test(settings: EmailSettings): Promise<EmailResult> {
    return this.send(settings, {
      to: settings.recipientEmail,
      subject: 'Test powiadomień - Produktywność',
      body: 'To jest testowa wiadomość z aplikacji Produktywność. Jeśli ją widzisz, konfiguracja e-mail działa poprawnie!',
    });
  }
}

// Główny adapter wybierający metodę na podstawie ustawień
class EmailService implements EmailAdapter {
  private smtpAdapter = new SMTPAdapter();
  private webhookAdapter = new WebhookAdapter();

  private getAdapter(settings: EmailSettings): EmailAdapter {
    return settings.method === 'webhook' ? this.webhookAdapter : this.smtpAdapter;
  }

  async send(settings: EmailSettings, payload: EmailPayload): Promise<EmailResult> {
    if (!settings.enabled) {
      return { success: false, message: 'Wysyłka e-mail jest wyłączona' };
    }

    if (!settings.recipientEmail) {
      return { success: false, message: 'Brak adresu e-mail odbiorcy' };
    }

    return this.getAdapter(settings).send(settings, payload);
  }

  async test(settings: EmailSettings): Promise<EmailResult> {
    if (!settings.recipientEmail) {
      return { success: false, message: 'Brak adresu e-mail odbiorcy' };
    }

    return this.getAdapter(settings).test(settings);
  }
}

export const emailAdapter = new EmailService();
