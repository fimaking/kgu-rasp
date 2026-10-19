import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Bell,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  GraduationCap,
  Cloud,
  Check,
  Copy,
  RefreshCw,
  QrCode,
  Link2,
  Users,
  RotateCw,
  Palette,
  Database,
} from 'lucide-react';
import {
  ThemeMode,
  UserSettings,
} from '../../types/settings';
import { ParsedLesson } from '../../types/schedule';
import { StorageService } from '../../services/storageService';
import { SyncService, normalizeFirebaseUrl } from '../../services/syncService';
import { RealtimeSyncService } from '../../services/realtimeSync';
import { NotificationService } from '../../services/notificationService';
import { APP_VERSION } from '../../utils/version';
import { Button } from '../ui/Button';

interface SettingsViewProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  groupId?: number;
  groupName?: string;
  onOpenGroupSelect?: () => void;
  lessons?: ParsedLesson[];
  onShowToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  onDataImported: () => void;
  onRefreshSchedule: () => void;
  lastUpdated: string | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeMode,
  onThemeChange,
  groupId = 8953,
  groupName = '26-ИСбо-4',
  onOpenGroupSelect,
  lessons: _lessons = [],
  onShowToast,
  onDataImported,
  onRefreshSchedule,
  lastUpdated,
}) => {
  const [settings, setSettings] = useState<UserSettings>(() => StorageService.getSettings());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    NotificationService.getPermission()
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloud Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleToggleNotifications = async () => {
    if (notificationPermission !== 'granted') {
      const granted = await NotificationService.requestPermission();
      setNotificationPermission(NotificationService.getPermission());
      if (granted) {
        onShowToast('success', 'Уведомления разрешены!', 'Теперь вы будете получать напоминания.');
        const updated = {
          ...settings,
          notifications: { ...settings.notifications, enabled: true },
        };
        setSettings(updated);
        StorageService.saveSettings(updated);
      } else {
        onShowToast(
          'error',
          'Разрешение не получено',
          'Включите уведомления в настройках вашего браузера.'
        );
      }
    } else {
      const updated = {
        ...settings,
        notifications: {
          ...settings.notifications,
          enabled: !settings.notifications.enabled,
        },
      };
      setSettings(updated);
      StorageService.saveSettings(updated);
      onShowToast(
        'info',
        updated.notifications.enabled ? 'Напоминания включены' : 'Напоминания отключены'
      );
    }
  };

  const handleTestNotification = async () => {
    const success = await NotificationService.sendTestNotification();
    if (success) {
      onShowToast('success', 'Уведомление отправлено', 'Проверьте шторку уведомлений вашей системы.');
    } else {
      onShowToast(
        'error',
        'Не удалось отправить',
        'Сначала разрешите отправку уведомлений браузеру.'
      );
    }
  };

  const handleExportJson = () => {
    StorageService.exportData();
    onShowToast('success', 'Резервная копия сохранена', 'Файл JSON загружен на ваше устройство.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = StorageService.importData(content);
      if (res.success) {
        onShowToast(
          'success',
          'Данные успешно импортированы',
          `Восстановлено заданий: ${res.countHw}, событий: ${res.countEvents}`
        );
        onDataImported();
      } else {
        onShowToast('error', 'Ошибка импорта файла', res.error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Google Firebase Cloud Sync state
  const [firebaseUrl, setFirebaseUrlState] = useState<string>(() => SyncService.getFirebaseUrl() || '');
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState<boolean>(() => SyncService.isFirebaseConfigured());
  const [showFirebaseHelp, setShowFirebaseHelp] = useState(false);
  const [isFirebaseCopied, setIsFirebaseCopied] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => SyncService.getLastSyncTime());

  // Direct Transfer QR state (offline fallback)
  const [transferQrUrl, setTransferQrUrl] = useState<string | null>(null);
  const [transferQrDataUrl, setTransferQrDataUrl] = useState<string | null>(null);
  const [firebaseQrDataUrl, setFirebaseQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [showOfflineTransfer, setShowOfflineTransfer] = useState(false);

  // Generate offline, client-side QR data URL for Firebase pairing without third-party APIs
  useEffect(() => {
    let active = true;
    if (isFirebaseConfigured && firebaseUrl) {
      const pairingUrl = SyncService.getFirebasePairingUrl(firebaseUrl);
      SyncService.getQrCodeDataUrl(pairingUrl, 280).then((dataUrl) => {
        if (active) setFirebaseQrDataUrl(dataUrl);
      });
    } else {
      setFirebaseQrDataUrl('');
    }
    return () => {
      active = false;
    };
  }, [isFirebaseConfigured, firebaseUrl]);

  const handleConnectFirebase = async () => {
    const clean = firebaseUrl.trim();
    if (!clean) {
      onShowToast('error', 'Укажите адрес базы данных', 'Вставьте ссылку на вашу Realtime Database.');
      return;
    }
    const normalized = normalizeFirebaseUrl(clean);
    SyncService.setFirebaseUrl(normalized);
    setFirebaseUrlState(normalized);
    setIsSyncing(true);

    await SyncService.pushToCloud();
    const res = await SyncService.pullFromCloud();
    setIsSyncing(false);

    if (res.error) {
      onShowToast('error', 'Ошибка подключения', res.error);
    } else {
      setIsFirebaseConfigured(true);
      RealtimeSyncService.initFirebaseStream();
      setLastSyncTime(SyncService.getLastSyncTime());
      onDataImported();
      onShowToast('success', 'Google Firebase подключен!', 'Синхронизация между ПК и телефоном активна.');
    }
  };

  const handleDisconnectFirebase = () => {
    SyncService.clearFirebaseUrl();
    RealtimeSyncService.initFirebaseStream();
    setIsFirebaseConfigured(false);
    setFirebaseUrlState('');
    onShowToast('info', 'Облако отвязано', 'Синхронизация отключена на этом устройстве.');
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    await SyncService.pushToCloud();
    const res = await SyncService.pullFromCloud();
    setIsSyncing(false);
    setLastSyncTime(SyncService.getLastSyncTime());
    if (res.updated) {
      onDataImported();
      onShowToast('success', 'Данные обновлены из облака!');
    } else if (res.error) {
      onShowToast('error', 'Ошибка синхронизации', res.error);
    } else {
      onShowToast('info', 'Всё синхронизировано', 'У вас самая актуальная версия заданий.');
    }
  };

  const handleCopyFirebasePairingUrl = () => {
    const url = SyncService.getFirebasePairingUrl(firebaseUrl);
    navigator.clipboard.writeText(url);
    setIsFirebaseCopied(true);
    setTimeout(() => setIsFirebaseCopied(false), 2000);
    onShowToast('info', 'Ссылка для телефона скопирована!', 'Откройте её на телефоне для мгновенного подключения.');
  };

  const handleGenerateTransferQr = async () => {
    setIsGeneratingQr(true);
    const url = await SyncService.createDirectTransferUrl();
    setTransferQrUrl(url);
    const qrData = await SyncService.getQrCodeDataUrl(url, 260);
    setTransferQrDataUrl(qrData);
    setIsGeneratingQr(false);
    onShowToast('info', 'QR-код готов', 'Наведите камеру смартфона для мгновенного переноса заданий');
  };

  const handleCopyTransferUrl = () => {
    if (transferQrUrl) {
      navigator.clipboard.writeText(transferQrUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      onShowToast('info', 'Ссылка для переноса скопирована в буфер обмена');
    }
  };

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Не синхронизировано';
    try {
      const d = new Date(iso);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
      return `Синхронизировано: ${d.getDate()} ${months[d.getMonth()]}, ${hours}:${mins}`;
    } catch {
      return 'Синхронизировано';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200 select-none pb-12">
      {/* Top Banner: Settings Badge & App Version */}
      <div className="flex items-center justify-between select-none">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-sm">
          <Settings className="w-3.5 h-3.5 text-apple-blue shrink-0" />
          <span className="text-xs sm:text-sm font-semibold tracking-tight text-apple-gray-800 dark:text-zinc-200">
            Настройки
          </span>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-sm text-xs font-semibold tracking-tight text-apple-gray-700 dark:text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Версия:</span>
          <span className="font-mono font-bold text-apple-blue">{APP_VERSION}</span>
        </div>
      </div>

      {/* Section 1: Subgroup and Group details (Смена группы вверху) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-apple-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-apple-blue" />
            <span>Группа и профиль студента</span>
          </h3>
          {onOpenGroupSelect && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Users className="w-3.5 h-3.5 text-apple-blue" />}
              onClick={onOpenGroupSelect}
            >
              Сменить группу
            </Button>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-apple-gray-500 font-medium">Группа в ЭИОС КГУ:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono text-apple-gray-900 dark:text-white">
                {groupName} (ID: {groupId})
              </span>
              {onOpenGroupSelect && (
                <button
                  onClick={onOpenGroupSelect}
                  className="text-xs text-apple-blue hover:underline font-semibold"
                >
                  Изменить
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-apple-gray-500 font-medium">Официальный сайт КГУ:</span>
            <a
              href={`https://eios.kosgos.ru/WebApp/#/Rasp/Group/${groupId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-apple-blue font-semibold hover:underline flex items-center gap-1"
            >
              <span>eios.kosgos.ru</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
            <span className="text-xs text-apple-gray-500 font-medium">Статус расписания КГУ:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{formatLastSync(lastUpdated)}</span>
              </div>
              <button
                onClick={onRefreshSchedule}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-apple-gray-700 dark:text-apple-gray-300 transition-all duration-200 ease-out active:scale-90"
                title="Обновить расписание с сайта КГУ"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Appearance / Theme Mode */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-4">
        <div className="space-y-3">
          <h3 className="text-base font-bold text-apple-gray-900 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-apple-blue" />
            <span>Тема оформления</span>
          </h3>

          {/* Light / Dark / System */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light' as ThemeMode, label: 'Светлая', icon: <Sun className="w-5 h-5" /> },
              { id: 'dark' as ThemeMode, label: 'Тёмная', icon: <Moon className="w-5 h-5" /> },
              { id: 'system' as ThemeMode, label: 'Системная', icon: <Laptop className="w-5 h-5" /> },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => onThemeChange(mode.id)}
                className={`p-3.5 sm:p-4 rounded-2.5xl flex flex-col items-center justify-center gap-2 transition-all ${
                  themeMode === mode.id
                    ? 'bg-apple-blue text-white shadow-apple-sm font-bold scale-[1.02]'
                    : 'bg-black/[0.03] dark:bg-white/[0.05] text-apple-gray-700 dark:text-apple-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/10">{mode.icon}</div>
                <span className="text-xs font-medium">{mode.label}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 pt-1">
            По умолчанию активна контрастная тема OLED Black и шрифт Comfortaa.
          </p>
        </div>
      </div>

      {/* Section 3: Notifications and Reminders */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-apple-gray-900 dark:text-white">
                Уведомления и напоминания
              </h3>
              <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                Статус в браузере:{' '}
                {notificationPermission === 'granted'
                  ? 'Разрешено ✅'
                  : notificationPermission === 'denied'
                  ? 'Заблокировано ❌'
                  : 'Требуется запрос'}
              </p>
            </div>
          </div>

          <Button
            variant={settings.notifications.enabled ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleToggleNotifications}
          >
            {settings.notifications.enabled ? 'Включено' : 'Включить'}
          </Button>
        </div>

        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-apple-gray-700 dark:text-apple-gray-300 font-medium">
              Напоминать о начале пары
            </span>
            <span className="font-mono text-apple-blue font-semibold">за 15 минут</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-apple-gray-700 dark:text-apple-gray-300 font-medium">
              Предупреждать о дедлайне ДЗ
            </span>
            <span className="font-mono text-apple-blue font-semibold">за 24 часа</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-apple-gray-700 dark:text-apple-gray-300 font-medium">
              Оповещение о просроченных заданиях
            </span>
            <span className="font-mono text-emerald-600 font-semibold">Активно</span>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="secondary" size="sm" onClick={handleTestNotification}>
            Проверить тестовое уведомление
          </Button>
        </div>
      </div>

      {/* Section 3: Google Firebase Cloud Sync */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-apple-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-apple-gray-900 dark:text-white flex items-center gap-2">
                <span>Синхронизация (Google Firebase)</span>
                {isFirebaseConfigured ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Активно ⚡
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-black/5 dark:bg-white/10 text-apple-gray-500">
                    Не подключено
                  </span>
                )}
              </h3>
              <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                Бесплатно навсегда. Мгновенная передача заданий между телефоном и ПК без ограничений.
              </p>
            </div>
          </div>

          {isFirebaseConfigured && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={isSyncing}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
                onClick={handleManualSyncNow}
              >
                Синхронизировать сейчас
              </Button>
              <button
                onClick={handleDisconnectFirebase}
                className="text-xs text-apple-gray-400 hover:text-apple-red transition-colors px-2 py-1"
              >
                Отвязать
              </button>
            </div>
          )}
        </div>

        {isFirebaseConfigured ? (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            {/* Active Cloud Status */}
            <div className="p-4 rounded-2.5xl bg-emerald-500/[0.06] border border-emerald-500/20 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-0.5">
                    Ваше персональное облако Firebase:
                  </div>
                  <div className="font-mono text-xs font-bold text-apple-gray-800 dark:text-zinc-200 break-all select-all">
                    {firebaseUrl}
                  </div>
                </div>
                <div className="text-xs text-apple-gray-500 dark:text-apple-gray-400 whitespace-nowrap">
                  {formatLastSync(lastSyncTime)}
                </div>
              </div>
            </div>

            {/* Smartphone Pairing Box (QR-code & Link) */}
            <div className="p-4 sm:p-5 rounded-2.5xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="bg-white p-3 rounded-2xl shadow-apple-sm flex-shrink-0 border border-black/5 flex items-center justify-center min-w-[152px] min-h-[152px]">
                  {firebaseQrDataUrl ? (
                    <img
                      src={firebaseQrDataUrl}
                      alt="QR-код связки с телефоном"
                      className="w-36 h-36 rounded-lg"
                    />
                  ) : (
                    <div className="w-36 h-36 flex flex-col items-center justify-center text-apple-gray-400 gap-2">
                      <QrCode className="w-8 h-8 animate-pulse text-apple-blue" />
                      <span className="text-[11px] font-medium text-apple-gray-500">Генерация QR...</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue text-[11px] font-bold">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Связка со смартфоном в 1 скан</span>
                  </div>
                  <h4 className="text-sm font-bold text-apple-gray-900 dark:text-white">
                    Наведите камеру смартфона на этот QR-код
                  </h4>
                  <p className="text-xs text-apple-gray-600 dark:text-apple-gray-300 leading-relaxed">
                    Телефон сразу откроет приложение и <b>автоматически подключится к вашей базе данных</b>. Все задания моментально перенесутся — ничего вводить на телефоне не нужно!
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={isFirebaseCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5 text-apple-blue" />}
                      onClick={handleCopyFirebasePairingUrl}
                    >
                      {isFirebaseCopied ? 'Ссылка скопирована!' : 'Скопировать ссылку для отправки в Telegram/VK'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            {/* Input form */}
            <div className="p-4 rounded-2.5xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-3">
              <label className="block text-xs font-bold text-apple-gray-800 dark:text-zinc-200">
                Вставьте адрес вашей базы Google Firebase:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="https://[проект]-default-rtdb.firebaseio.com/sync.json"
                  value={firebaseUrl}
                  onChange={(e) => setFirebaseUrlState(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-xs font-mono text-apple-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/40 shadow-apple-sm"
                />
                <Button
                  variant="primary"
                  size="sm"
                  loading={isSyncing}
                  onClick={handleConnectFirebase}
                >
                  Подключить облако
                </Button>
              </div>

              {/* Instructions Accordion */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowFirebaseHelp(!showFirebaseHelp)}
                  className="text-xs text-apple-blue font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>{showFirebaseHelp ? 'Скрыть инструкцию' : 'Инструкция: как создать базу в Google Firebase за 2 минуты (бесплатно)'}</span>
                </button>

                {showFirebaseHelp && (
                  <div className="mt-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-apple-gray-800 dark:text-apple-gray-200 space-y-2.5 leading-relaxed animate-in fade-in duration-200">
                    <p className="font-bold text-amber-900 dark:text-amber-300">
                      Пошаговая настройка за 2 минуты (100% бесплатно навсегда, без ввода карт):
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-apple-gray-700 dark:text-apple-gray-300">
                      <li>
                        Перейдите на{' '}
                        <a
                          href="https://console.firebase.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-apple-blue hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>console.firebase.google.com</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>{' '}
                        под своим Google-аккаунтом и нажмите <b>«Создать проект»</b> (Google Analytics можно выключить).
                      </li>
                      <li>
                        В боковом меню выберите <b>Сборка (Build) → Realtime Database</b> и нажмите <b>«Создать базу данных»</b>. Выберите локацию (например, Belgium или US) и нажмите «Далее».
                      </li>
                      <li>
                        Выберите <b>«Тестовый режим» (Test mode)</b> и нажмите <b>Включить (Enable)</b>.
                      </li>
                      <li>
                        Вверху во вкладке <b>Правила (Rules)</b> проверьте, чтобы стояло:
                        <pre className="font-mono bg-black/10 dark:bg-white/10 p-2 rounded-xl text-[11px] mt-1 text-apple-gray-900 dark:text-white">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
                        </pre>
                        и нажмите <b>Опубликовать (Publish)</b>.
                      </li>
                      <li>
                        Вернитесь во вкладку <b>Данные (Data)</b>, скопируйте ссылку на базу вверху (например, <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">https://my-sync-default-rtdb.firebaseio.com/</code>), вставьте её в поле выше и нажмите <b>«Подключить облако»</b>!
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Offline Transfer Accordion */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={() => setShowOfflineTransfer(!showOfflineTransfer)}
            className="text-xs text-apple-gray-500 hover:text-apple-gray-800 dark:hover:text-zinc-200 font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{showOfflineTransfer ? 'Скрыть офлайн-перенос' : 'Экстренный офлайн-перенос по QR-коду (без интернета)'}</span>
          </button>

          {showOfflineTransfer && (
            <div className="mt-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-apple-gray-500">
                  Зашифровывает все задания прямо в картинку QR-кода. Работает даже если полностью нет интернета.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={isGeneratingQr}
                  onClick={handleGenerateTransferQr}
                >
                  {transferQrUrl ? 'Обновить QR' : 'Сгенерировать QR'}
                </Button>
              </div>

              {transferQrUrl && (
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <div className="bg-white p-2.5 rounded-xl shadow-apple-sm flex-shrink-0 border border-black/5 flex items-center justify-center min-w-[124px] min-h-[124px]">
                    {transferQrDataUrl ? (
                      <img
                        src={transferQrDataUrl}
                        alt="Офлайн QR"
                        className="w-28 h-28 rounded-lg"
                      />
                    ) : (
                      <div className="w-28 h-28 flex flex-col items-center justify-center text-apple-gray-400 gap-1.5">
                        <QrCode className="w-6 h-6 animate-pulse text-apple-blue" />
                        <span className="text-[10px] font-medium text-apple-gray-500">Генерация...</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-apple-gray-600 dark:text-apple-gray-300 space-y-1">
                    <p className="font-bold">Наведите камеру смартфона:</p>
                    <p>Телефон откроет ссылку и мгновенно перенесет все задания без серверов.</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      onClick={handleCopyTransferUrl}
                    >
                      {isCopied ? 'Скопировано' : 'Скопировать ссылку'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Data Storage, Export & Import */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-apple-gray-900 dark:text-white">
              Сохранение данных и Резервная копия
            </h3>
            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
              Все задания сохраняются локально. Не требует создания учётной записи.
            </p>
          </div>
        </div>

        <p className="text-xs text-apple-gray-600 dark:text-apple-gray-300 leading-relaxed">
          Вы можете скачать резервную копию всех ваших домашних заданий, чек-листов и событий в
          формате JSON или восстановить сохранённые данные на другом устройстве.
        </p>

        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <div className="text-xs font-semibold text-apple-gray-800 dark:text-zinc-200 flex items-center gap-1.5 flex-wrap">
                <span>Текущая версия приложения:</span>
                <span className="font-mono font-bold text-apple-blue">{APP_VERSION}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Актуальная
                </span>
              </div>
              <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                PWA • Кэш Service Worker {APP_VERSION}
              </p>
            </div>
          </div>
        </div>

        {/* Local Storage Health & Statistics */}
        {(() => {
          const stats = StorageService.getStorageStats();
          return (
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-apple-blue shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-apple-gray-800 dark:text-zinc-200 flex items-center gap-2 flex-wrap">
                    <span>Локальное хранилище данных:</span>
                    <span className="font-mono font-bold text-apple-blue">{stats.formattedSize}</span>
                    <span className="text-[10px] text-apple-gray-500">
                      ({stats.totalHomework} заданий, {stats.eventsCount} событий)
                    </span>
                  </div>
                  <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                    Все данные хранятся изолированно и безопасно в памяти браузера
                  </p>
                </div>
              </div>
              {stats.completedHomework > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const purged = StorageService.purgeOldCompletedHomework(60);
                    if (purged > 0) {
                      onShowToast('info', 'Очистка завершена', `Удалено ${purged} старых выполненных заданий (> 60 дней)`);
                    } else {
                      onShowToast('info', 'Хранилище в порядке', 'Старых выполненных заданий (> 60 дней) не обнаружено.');
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-[11px] font-medium text-apple-gray-600 dark:text-zinc-300 transition-colors shrink-0"
                  title="Удалить выполненные задания старше 2 месяцев"
                >
                  Очистить старые ДЗ
                </button>
              )}
            </div>
          );
        })()}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4 text-apple-blue" />}
            onClick={handleExportJson}
          >
            Экспорт в JSON
          </Button>

          <Button
            variant="secondary"
            icon={<Upload className="w-4 h-4 text-emerald-600" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Импорт из JSON
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            variant="ghost"
            icon={<RotateCcw className="w-4 h-4 text-apple-gray-500" />}
            onClick={onRefreshSchedule}
          >
            Синхронизировать расписание
          </Button>

          <Button
            variant="ghost"
            icon={<RefreshCw className="w-4 h-4 text-apple-orange" />}
            onClick={() => {
              if ('caches' in window) {
                caches.keys().then((names) => {
                  names.forEach((name) => caches.delete(name));
                });
              }
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  registrations.forEach((r) => r.unregister());
                });
              }
              setTimeout(() => {
                window.location.reload();
              }, 300);
            }}
          >
            Сбросить кэш ({APP_VERSION})
          </Button>
        </div>
      </div>

      {/* App Version & Info Footer */}
      <div className="text-center pt-2 pb-6 space-y-1 select-none text-apple-gray-400 dark:text-zinc-500">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-xs">
          <span className="font-semibold text-apple-gray-700 dark:text-zinc-300">КГУ Студент</span>
          <span>•</span>
          <span className="font-mono font-bold text-apple-blue">{APP_VERSION}</span>
        </div>
        <p className="text-[11px]">Костромской государственный университет</p>
      </div>
    </div>
  );
};
