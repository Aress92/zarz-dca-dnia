// Widok ustawień

import React, { useState, useEffect } from 'react';
import { AppSettings, EmailSettings, WidgetSettings, DEFAULT_WIDGET_SETTINGS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Mail, Moon, Download, Upload, Send, AlertCircle, CheckCircle, LayoutGrid, Power, ExternalLink } from 'lucide-react';
import { useTheme } from '@/app/ThemeProvider';
import { notificationAdapter, getNotificationStatus } from '@/lib/desktop/notifications';
import { emailAdapter } from '@/lib/desktop/email';
import { secretsAdapter, SECRET_KEYS } from '@/lib/desktop/secrets';
import { widgetAdapter, autostartAdapter } from '@/lib/desktop/widget';
import { exportData, importData } from '@/lib/storage/db';
import { useToast } from '@/hooks/use-toast';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function SettingsView({ settings, onSave }: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState({
    ...settings,
    widgetSettings: settings.widgetSettings || DEFAULT_WIDGET_SETTINGS,
  });
  const [smtpPassword, setSmtpPassword] = useState('');
  const [webhookToken, setWebhookToken] = useState('');
  const [emailTestStatus, setEmailTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailTestMessage, setEmailTestMessage] = useState('');
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [autostartLoading, setAutostartLoading] = useState(true);
  const [widgetOpen, setWidgetOpen] = useState(false);

  const notificationStatus = getNotificationStatus();

  // Sprawdź stan autostartu przy ładowaniu
  useEffect(() => {
    async function checkAutostart() {
      const enabled = await autostartAdapter.isEnabled();
      setAutostartEnabled(enabled);
      setAutostartLoading(false);
    }
    checkAutostart();
  }, []);

  // Sprawdź czy widget jest otwarty
  useEffect(() => {
    async function checkWidget() {
      const isOpen = await widgetAdapter.isOpen();
      setWidgetOpen(isOpen);
    }
    checkWidget();
  }, []);

  const handleSave = async () => {
    // Zapisz sekrety jeśli wprowadzone
    if (smtpPassword) {
      await secretsAdapter.set(SECRET_KEYS.SMTP_PASSWORD, smtpPassword);
    }
    if (webhookToken) {
      await secretsAdapter.set(SECRET_KEYS.WEBHOOK_TOKEN, webhookToken);
    }

    onSave(localSettings);
    toast({
      title: 'Zapisano',
      description: 'Ustawienia zostały zapisane',
    });
  };

  const handleRequestNotificationPermission = async () => {
    const permission = await notificationAdapter.requestPermission();
    if (permission === 'granted') {
      toast({
        title: 'Sukces',
        description: 'Powiadomienia zostały włączone',
      });
    } else {
      toast({
        title: 'Odmowa',
        description: 'Nie udało się włączyć powiadomień. Sprawdź ustawienia przeglądarki.',
        variant: 'destructive',
      });
    }
  };

  const handleTestEmail = async () => {
    setEmailTestStatus('loading');
    setEmailTestMessage('');

    const result = await emailAdapter.test(localSettings.emailSettings);

    setEmailTestStatus(result.success ? 'success' : 'error');
    setEmailTestMessage(result.message);

    toast({
      title: result.success ? 'Sukces' : 'Błąd',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `produktywnosc-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Eksport zakończony',
        description: 'Plik został pobrany',
      });
    } catch (error) {
      toast({
        title: 'Błąd eksportu',
        description: 'Nie udało się wyeksportować danych',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const result = await importData(data);

        if (result.success) {
          toast({
            title: 'Import zakończony',
            description: 'Dane zostały zaimportowane. Odśwież stronę, aby zobaczyć zmiany.',
          });
        } else {
          toast({
            title: 'Błąd importu',
            description: result.errors.join(', '),
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Błąd importu',
          description: 'Nieprawidłowy format pliku',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  const updateEmailSettings = (updates: Partial<EmailSettings>) => {
    setLocalSettings({
      ...localSettings,
      emailSettings: {
        ...localSettings.emailSettings,
        ...updates,
      },
    });
  };

  const updateWidgetSettings = (updates: Partial<WidgetSettings>) => {
    setLocalSettings({
      ...localSettings,
      widgetSettings: {
        ...localSettings.widgetSettings,
        ...updates,
      },
    });
  };

  const handleAutostartToggle = async (enabled: boolean) => {
    const success = await autostartAdapter.setEnabled(enabled);
    if (success) {
      setAutostartEnabled(enabled);
      setLocalSettings({ ...localSettings, autoStartEnabled: enabled });
      toast({
        title: enabled ? 'Autostart włączony' : 'Autostart wyłączony',
        description: enabled
          ? 'Aplikacja uruchomi się automatycznie po starcie systemu'
          : 'Aplikacja nie będzie uruchamiana automatycznie',
      });
    } else {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zmienić ustawień autostartu. Funkcja wymaga aplikacji Tauri.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenWidget = async () => {
    const success = await widgetAdapter.open();
    if (success) {
      setWidgetOpen(true);
      toast({
        title: 'Widget otwarty',
        description: 'Widget został otwarty w osobnym oknie',
      });
    } else {
      toast({
        title: 'Informacja',
        description: 'Widget wymaga aplikacji Tauri. W trybie deweloperskim niedostępny.',
        variant: 'destructive',
      });
    }
  };

  const handleCloseWidget = async () => {
    const success = await widgetAdapter.close();
    if (success) {
      setWidgetOpen(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          Ustawienia
        </h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Motyw */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Wygląd
            </CardTitle>
            <CardDescription>Dostosuj wygląd aplikacji</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label>Motyw</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Jasny</SelectItem>
                  <SelectItem value="dark">Ciemny</SelectItem>
                  <SelectItem value="system">Systemowy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Powiadomienia na pulpicie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Powiadomienia na pulpicie
            </CardTitle>
            <CardDescription>
              Otrzymuj powiadomienia o przypomnieniach na pulpicie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Włącz powiadomienia</Label>
              <Switch
                checked={localSettings.desktopNotificationsEnabled}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, desktopNotificationsEnabled: checked })
                }
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm flex items-center gap-2">
                {notificationStatus.permission === 'granted' ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                {notificationStatus.message}
              </p>
              {notificationStatus.permission !== 'granted' && notificationStatus.supported && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleRequestNotificationPermission}
                >
                  Włącz uprawnienia
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* E-mail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Powiadomienia e-mail
            </CardTitle>
            <CardDescription>
              Konfiguracja wysyłki przypomnień przez e-mail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Włącz wysyłkę e-mail</Label>
              <Switch
                checked={localSettings.emailSettings.enabled}
                onCheckedChange={(checked) => updateEmailSettings({ enabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Adres e-mail odbiorcy</Label>
              <Input
                type="email"
                placeholder="twoj@email.pl"
                value={localSettings.emailSettings.recipientEmail}
                onChange={(e) => updateEmailSettings({ recipientEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Metoda wysyłki</Label>
              <Select
                value={localSettings.emailSettings.method}
                onValueChange={(v) => updateEmailSettings({ method: v as 'smtp' | 'webhook' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smtp">SMTP (zalecane dla desktop)</SelectItem>
                  <SelectItem value="webhook">Webhook / API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {localSettings.emailSettings.method === 'smtp' ? (
              <div className="space-y-4">
                <h4 className="font-medium">Konfiguracja SMTP</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Host</Label>
                    <Input
                      placeholder="smtp.gmail.com"
                      value={localSettings.emailSettings.smtp?.host || ''}
                      onChange={(e) =>
                        updateEmailSettings({
                          smtp: {
                            ...localSettings.emailSettings.smtp,
                            host: e.target.value,
                            port: localSettings.emailSettings.smtp?.port || 587,
                            secure: localSettings.emailSettings.smtp?.secure ?? false,
                            username: localSettings.emailSettings.smtp?.username || '',
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                      type="number"
                      placeholder="587"
                      value={localSettings.emailSettings.smtp?.port || ''}
                      onChange={(e) =>
                        updateEmailSettings({
                          smtp: {
                            ...localSettings.emailSettings.smtp!,
                            port: parseInt(e.target.value) || 587,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={localSettings.emailSettings.smtp?.secure ?? false}
                    onCheckedChange={(checked) =>
                      updateEmailSettings({
                        smtp: {
                          ...localSettings.emailSettings.smtp!,
                          secure: checked,
                        },
                      })
                    }
                  />
                  <Label>Użyj TLS/SSL</Label>
                </div>
                <div className="space-y-2">
                  <Label>Nazwa użytkownika</Label>
                  <Input
                    placeholder="twoj@email.pl"
                    value={localSettings.emailSettings.smtp?.username || ''}
                    onChange={(e) =>
                      updateEmailSettings({
                        smtp: {
                          ...localSettings.emailSettings.smtp!,
                          username: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hasło / Hasło aplikacji</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hasło jest przechowywane lokalnie i bezpiecznie (w przyszłości przez Tauri Stronghold).
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium">Konfiguracja Webhook</h4>
                <div className="space-y-2">
                  <Label>URL Webhooka</Label>
                  <Input
                    placeholder="https://api.example.com/send-email"
                    value={localSettings.emailSettings.webhook?.url || ''}
                    onChange={(e) =>
                      updateEmailSettings({
                        webhook: {
                          url: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Token autoryzacji (opcjonalny)</Label>
                  <Input
                    type="password"
                    placeholder="Bearer token"
                    value={webhookToken}
                    onChange={(e) => setWebhookToken(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleTestEmail} disabled={emailTestStatus === 'loading'}>
                <Send className="h-4 w-4 mr-2" />
                Wyślij testowy e-mail
              </Button>
              {emailTestMessage && (
                <span
                  className={`text-sm ${emailTestStatus === 'success' ? 'text-primary' : 'text-destructive'}`}
                >
                  {emailTestMessage}
                </span>
              )}
            </div>

            {!localSettings.emailSettings.recipientEmail && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Podaj adres e-mail, aby włączyć wysyłkę przypomnień
              </p>
            )}
          </CardContent>
        </Card>

        {/* Autostart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              Autostart
            </CardTitle>
            <CardDescription>
              Automatyczne uruchamianie aplikacji po starcie systemu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Uruchamiaj przy starcie systemu</Label>
                <p className="text-sm text-muted-foreground">
                  Aplikacja uruchomi się automatycznie po zalogowaniu
                </p>
              </div>
              <Switch
                checked={autostartEnabled}
                onCheckedChange={handleAutostartToggle}
                disabled={autostartLoading}
              />
            </div>
            {!autostartLoading && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {autostartEnabled ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Autostart jest włączony
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Autostart jest wyłączony
                  </>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Widget na pulpicie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Widget na pulpicie
            </CardTitle>
            <CardDescription>
              Mały widget z kalendarzem i przypomnieniami
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Włącz widget</Label>
                <p className="text-sm text-muted-foreground">
                  Pokaż mini-widget zawsze na wierzchu
                </p>
              </div>
              <Switch
                checked={localSettings.widgetSettings.enabled}
                onCheckedChange={(checked) => updateWidgetSettings({ enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Otwieraj przy starcie</Label>
                <p className="text-sm text-muted-foreground">
                  Automatycznie otwórz widget przy uruchomieniu aplikacji
                </p>
              </div>
              <Switch
                checked={localSettings.widgetSettings.showOnStartup}
                onCheckedChange={(checked) => updateWidgetSettings({ showOnStartup: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Zawartość widgetu</Label>

              <div className="flex items-center justify-between">
                <span className="text-sm">Pokaż kalendarz</span>
                <Switch
                  checked={localSettings.widgetSettings.showCalendar}
                  onCheckedChange={(checked) => updateWidgetSettings({ showCalendar: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Pokaż przypomnienia</span>
                <Switch
                  checked={localSettings.widgetSettings.showReminders}
                  onCheckedChange={(checked) => updateWidgetSettings({ showReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Maks. przypomnień</span>
                <Select
                  value={String(localSettings.widgetSettings.maxRemindersToShow)}
                  onValueChange={(v) => updateWidgetSettings({ maxRemindersToShow: parseInt(v) })}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              {!widgetOpen ? (
                <Button variant="outline" onClick={handleOpenWidget}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Otwórz widget
                </Button>
              ) : (
                <Button variant="outline" onClick={handleCloseWidget}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Zamknij widget
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Widget jest dostępny tylko w aplikacji Tauri (po zbudowaniu jako .exe).
              W trybie deweloperskim możesz przetestować widok pod adresem /#/widget.
            </p>
          </CardContent>
        </Card>

        {/* Import/Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Dane
            </CardTitle>
            <CardDescription>Eksportuj lub importuj dane aplikacji</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Eksportuj do JSON
              </Button>
              <Button variant="outline" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Importuj z JSON
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Eksport zawiera wszystkie zadania i ustawienia. Import zastąpi istniejące dane.
            </p>
          </CardContent>
        </Card>

        {/* Zapisz */}
        <div className="flex justify-end">
          <Button onClick={handleSave}>Zapisz ustawienia</Button>
        </div>
      </div>
    </div>
  );
}
