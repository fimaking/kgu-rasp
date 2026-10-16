import React, { useState, useRef } from 'react';
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
  Link2,
  QrCode,
} from 'lucide-react';
import { ThemeMode, UserSettings } from '../../types/settings';
import { StorageService } from '../../services/storageService';
import { SyncService } from '../../services/syncService';
import { NotificationService } from '../../services/notificationService';
import { Button } from '../ui/Button';

interface SettingsViewProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  subgroupPreference: number;
  onSubgroupChange: (sg: number) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  onDataImported: () => void;
  onRefreshSchedule: () => void;
  lastUpdated: string | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeMode,
  onThemeChange,
  subgroupPreference,
  onSubgroupChange,
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
  const [syncKey, setSyncKey] = useState<string | null>(() => SyncService.getSyncKey());
  const [inputSyncKey, setInputSyncKey] = useState('');
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

  const handleTestNotification = () => {
    const success = NotificationService.sendTestNotification();
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

  const handleCreateSync = async () => {
    setIsSyncing(true);
    const res = await SyncService.createSyncRoom();
    setIsSyncing(false);
    if (res.success && res.syncKey) {
      setSyncKey(res.syncKey);
      onShowToast('success', 'Облачная связка создана!', 'Скопируйте ключ и введите его на другом устройстве.');
    } else {
      onShowToast('error', 'Ошибка создания связки', res.error);
    }
  };

  const handleConnectSync = async () => {
    if (!inputSyncKey.trim()) return;
    setIsSyncing(true);
    const res = await SyncService.connectToSyncRoom(inputSyncKey);
    setIsSyncing(false);
    if (res.success) {
      setSyncKey(inputSyncKey.trim());
      setInputSyncKey('');
      onDataImported();
      onShowToast('success', 'Устройства синхронизированы!', `Загружено заданий: ${res.countHw}`);
    } else {
      onShowToast('error', 'Ошибка подключения', res.error);
    }
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    await SyncService.pushToCloud();
    const res = await SyncService.pullFromCloud();
    setIsSyncing(false);
    if (res.updated) {
      onDataImported();
      onShowToast('success', 'Данные обновлены из облака!');
    } else {
      onShowToast('info', 'Всё синхронизировано', 'У вас актуальная версия заданий.');
    }
  };

  const handleCopyKey = () => {
    if (syncKey) {
      navigator.clipboard.writeText(syncKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      onShowToast('info', 'Ключ скопирован в буфер обмена');
    }
  };

  const handleDisconnect = () => {
    SyncService.clearSyncKey();
    setSyncKey(null);
    onShowToast('info', 'Синхронизация отключена');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200 select-none pb-12">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-apple-blue font-mono">
          <Settings className="w-3.5 h-3.5" />
          <span>Параметры приложения</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-apple-gray-900 dark:text-white mt-0.5">
          Настройки
        </h2>
        <p className="text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400">
          Тема, уведомления, выбор подгруппы и резервное копирование
        </p>
      </div>

      {/* Section 1: Appearance / Theme */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-4">
        <h3 className="text-base font-bold text-apple-gray-900 dark:text-white flex items-center gap-2">
          <span>Оформление интерфейса</span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light' as ThemeMode, label: 'Светлая', icon: <Sun className="w-5 h-5" /> },
            { id: 'dark' as ThemeMode, label: 'Тёмная', icon: <Moon className="w-5 h-5" /> },
            { id: 'system' as ThemeMode, label: 'Системная', icon: <Laptop className="w-5 h-5" /> },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => onThemeChange(mode.id)}
              className={`p-4 rounded-2.5xl flex flex-col items-center justify-center gap-2.5 transition-all ${
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
      </div>

      {/* Section 2: Subgroup and Group details */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-4">
        <h3 className="text-base font-bold text-apple-gray-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-apple-blue" />
          <span>Группа студента и подгруппа</span>
        </h3>

        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-apple-gray-500 font-medium">Группа в ЭИОС КГУ:</span>
            <span className="text-sm font-bold font-mono text-apple-gray-900 dark:text-white">
              26-ИСбо-4 (ID: 8953)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-apple-gray-500 font-medium">Официальный сайт:</span>
            <a
              href="https://eios.kosgos.ru/WebApp/#/Rasp/Group/8953"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-apple-blue font-semibold hover:underline flex items-center gap-1"
            >
              <span>eios.kosgos.ru</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-apple-gray-500 font-medium">Синхронизация данных:</span>
            <span className="text-xs text-apple-gray-600 dark:text-apple-300">
              {lastUpdated ? `Обновлено сервером: ${lastUpdated}` : 'Автономный режим'}
            </span>
          </div>
        </div>

        {/* Subgroup preference */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-2">
            Фильтр подгруппы по умолчанию
          </label>
          <div className="flex p-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl border border-black/10 dark:border-white/10 text-xs font-medium">
            {[
              { id: 0, label: 'Вся группа (показывать всё)' },
              { id: 1, label: '1-я подгруппа' },
              { id: 2, label: '2-я подгруппа' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onSubgroupChange(item.id)}
                className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                  subgroupPreference === item.id
                    ? 'bg-white dark:bg-zinc-800 text-apple-gray-900 dark:text-white font-bold shadow-apple-sm'
                    : 'text-apple-gray-600 dark:text-apple-gray-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
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

      {/* Section: Cloud Sync between Devices */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-apple-blue to-apple-indigo text-white flex items-center justify-center shadow-apple-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-apple-gray-900 dark:text-white flex items-center gap-2">
                <span>Облачная синхронизация устройств</span>
                {syncKey && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Активна
                  </span>
                )}
              </h3>
              <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                Телефон и компьютер обновляются синхронно без логина и пароля
              </p>
            </div>
          </div>
        </div>

        {syncKey ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-apple-gray-500">
                Ваш личный код связки:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={syncKey}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 font-mono text-sm sm:text-base font-bold text-apple-blue select-all text-center tracking-wider"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  onClick={handleCopyKey}
                >
                  {isCopied ? 'Скопировано!' : 'Копировать'}
                </Button>
              </div>

              {/* QR Code section for camera pairing */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-black/5 dark:border-white/5">
                <div className="bg-white p-2.5 rounded-2xl shadow-apple-sm flex-shrink-0 border border-black/5">
                  <img
                    src={SyncService.getQrCodeUrl(syncKey)}
                    alt="QR-код для связки"
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-apple-blue/10 text-apple-blue text-[11px] font-bold">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Быстрое подключение без ввода текста</span>
                  </div>
                  <p className="text-xs text-apple-gray-600 dark:text-apple-gray-300 leading-relaxed">
                    Наведите камеру смартфона на этот QR-код — откроется сайт приложения и все ваши домашние задания автоматически перенесутся на телефон!
                  </p>
                  <p className="text-[11px] text-apple-gray-400">
                    Или введите код <span className="font-mono font-bold text-apple-blue">{syncKey}</span> вручную в Настройках на телефоне.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-apple-blue' : ''}`} />}
                onClick={handleManualSyncNow}
                disabled={isSyncing}
              >
                {isSyncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}
              </Button>

              <button
                onClick={handleDisconnect}
                className="text-xs text-apple-gray-400 hover:text-apple-red transition-colors py-1 px-2 rounded-lg hover:bg-apple-red/5"
              >
                Отвязать устройство
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-apple-gray-600 dark:text-apple-gray-300 leading-relaxed">
              Вы можете создать новую облачную связку прямо с этого устройства, либо ввести код с уже настроенного телефона или ПК.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option A: Create new key */}
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-apple-gray-900 dark:text-white uppercase tracking-wider mb-1">
                    Вариант 1: Новая связка
                  </h4>
                  <p className="text-xs text-apple-gray-500">
                    Сгенерировать код для синхронизации текущих заданий с другими гаджетами.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  loading={isSyncing}
                  onClick={handleCreateSync}
                >
                  Создать код синхронизации
                </Button>
              </div>

              {/* Option B: Enter existing key */}
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-apple-gray-900 dark:text-white uppercase tracking-wider mb-1">
                    Вариант 2: Подключить устройство
                  </h4>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Вставьте код KGU-..."
                      value={inputSyncKey}
                      onChange={(e) => setInputSyncKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-apple-blue"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Link2 className="w-3.5 h-3.5" />}
                      loading={isSyncing}
                      onClick={handleConnectSync}
                    >
                      Подключить
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-apple-gray-400">
                  Возьмите код из Настроек на вашем первом устройстве.
                </p>
              </div>
            </div>
          </div>
        )}
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
            Сбросить кэш и обновить версию
          </Button>
        </div>
      </div>
    </div>
  );
};
