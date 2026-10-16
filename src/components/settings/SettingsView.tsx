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
  QrCode,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import { ThemeMode, UserSettings } from '../../types/settings';
import { StorageService } from '../../services/storageService';
import { SyncService } from '../../services/syncService';
import { NotificationService } from '../../services/notificationService';
import { Button } from '../ui/Button';

interface SettingsViewProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  subgroupPreference?: number;
  onSubgroupChange?: (sg: number) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  onDataImported: () => void;
  onRefreshSchedule: () => void;
  lastUpdated: string | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeMode,
  onThemeChange,
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

  // Direct Transfer QR state
  const [transferQrUrl, setTransferQrUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [gistToken, setGistToken] = useState<string>(() => SyncService.getGistToken() || '');
  const [gistId, setGistId] = useState<string>(() => SyncService.getGistId() || '');
  const [inputGistId, setInputGistId] = useState('');
  const [showGistConfig, setShowGistConfig] = useState(false);
  const [isGistCopied, setIsGistCopied] = useState(false);
  const [showGistQr, setShowGistQr] = useState(false);

  const handleGenerateTransferQr = async () => {
    setIsGeneratingQr(true);
    const url = await SyncService.createDirectTransferUrl();
    setTransferQrUrl(url);
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

  const handleCopyGistUrl = () => {
    if (gistId) {
      const url = SyncService.getGistPairingUrl(gistId, gistToken || undefined);
      navigator.clipboard.writeText(url);
      setIsGistCopied(true);
      setTimeout(() => setIsGistCopied(false), 2000);
      onShowToast('info', 'Ссылка связки скопирована', 'Откройте её на втором устройстве для моментального подключения.');
    }
  };

  const handleSaveGistToken = async () => {
    const cleanToken = gistToken.trim();
    if (!cleanToken) {
      onShowToast('error', 'Укажите токен GitHub', 'Вставьте ваш токен с разрешением gist.');
      return;
    }
    setIsSyncing(true);
    SyncService.setGistToken(cleanToken);
    const ok = await SyncService.pushToCloud();
    setIsSyncing(false);
    if (ok) {
      onShowToast('success', 'Двусторонняя синхронизация включена!', 'Все задания с этого устройства сохранены в облако.');
    } else {
      onShowToast('info', 'Токен сохранён', 'Теперь изменения с этого устройства будут отправляться в облако.');
    }
  };

  const handleCreateGistSync = async () => {
    if (!gistToken.trim()) {
      onShowToast('error', 'Укажите токен GitHub', 'Создайте токен с разрешением gist.');
      return;
    }
    setIsSyncing(true);
    const res = await SyncService.createGistSync(gistToken);
    setIsSyncing(false);
    if (res.success && res.gistId) {
      setGistId(res.gistId);
      onShowToast('success', 'Облако GitHub Gist подключено!', 'Задания будут автоматически обновляться.');
    } else {
      onShowToast('error', 'Ошибка GitHub Gist', res.error);
    }
  };

  const handleConnectGistSync = async () => {
    const cleanId = inputGistId.trim();
    if (!cleanId) {
      onShowToast('error', 'Заполните поле', 'Введите ID существующего Gist (например: e2d77945...).');
      return;
    }
    setIsSyncing(true);
    const res = await SyncService.connectGistSync(cleanId, gistToken.trim() || undefined);
    setIsSyncing(false);
    if (res.success) {
      setGistId(cleanId);
      onDataImported();
      onShowToast('success', 'Связка подключена!', `Восстановлено заданий: ${res.countHw}`);
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
      onShowToast('info', 'Всё синхронизировано', 'У вас самая актуальная версия заданий.');
    }
  };

  const handleDisconnect = () => {
    SyncService.clearGistCredentials();
    setGistId('');
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

        {/* Subgroup & Language profile */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-2">
            Профиль расписания
          </label>
          <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <p className="text-xs font-bold text-apple-gray-900 dark:text-white">
                  1-я подгруппа • Немецкий язык
                </p>
                <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                  Автоматически отфильтрованы 2-я подгруппа, английский и французский языки
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Активен
            </span>
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

      {/* Section: Cloud Sync and Device Pairing */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-apple-card space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-apple-blue to-apple-indigo text-white flex items-center justify-center shadow-apple-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-apple-gray-900 dark:text-white flex items-center gap-2">
                <span>Синхронизация между устройствами</span>
                {gistId && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    GitHub Облако активно
                  </span>
                )}
              </h3>
              <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">
                Мгновенная передача заданий по QR-коду и постоянное облако GitHub
              </p>
            </div>
          </div>
        </div>

        {/* Option 1: Direct QR Code Transfer (Recommended & 100% Reliable) */}
        <div className="p-4 sm:p-5 rounded-2.5xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-apple-blue">
                <QrCode className="w-3.5 h-3.5" />
                <span>Способ 1: Мгновенно по QR-коду (Без авторизации)</span>
              </div>
              <p className="text-xs text-apple-gray-600 dark:text-apple-gray-300 mt-0.5">
                Переносит все домашние задания прямо в браузер смартфона за 1 секунду.
              </p>
            </div>

            <Button
              variant={transferQrUrl ? 'secondary' : 'primary'}
              size="sm"
              loading={isGeneratingQr}
              icon={<QrCode className="w-4 h-4" />}
              onClick={handleGenerateTransferQr}
            >
              {transferQrUrl ? 'Обновить QR-код' : 'Показать QR-код для телефона'}
            </Button>
          </div>

          {transferQrUrl && (
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-3 border-t border-black/5 dark:border-white/5 animate-in fade-in duration-300">
              <div className="bg-white p-3 rounded-2xl shadow-apple-sm flex-shrink-0 border border-black/5">
                <img
                  src={SyncService.getQrCodeForUrl(transferQrUrl)}
                  alt="QR-код для переноса заданий"
                  className="w-32 h-32 rounded-lg"
                />
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>QR-код готов к сканированию</span>
                </div>
                <p className="text-xs text-apple-gray-700 dark:text-apple-gray-200 leading-relaxed">
                  1. Наведите камеру телефона на этот QR-код.<br />
                  2. Нажмите на всплывающее уведомление со ссылкой.<br />
                  3. Все ваши задания и расписание моментально откроются на телефоне!
                </p>
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={handleCopyTransferUrl}
                  >
                    {isCopied ? 'Ссылка скопирована' : 'Скопировать ссылку для отправки'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Option 2: Permanent GitHub Gist Cloud Sync */}
        <div className="p-4 sm:p-5 rounded-2.5xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-apple-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-apple-indigo" />
                <span>Способ 2: Постоянное облако через GitHub Gist</span>
              </h4>
              <p className="text-xs text-apple-gray-500 mt-0.5">
                Автоматически обновляет телефон и компьютер в фоне через ваш личный GitHub.
              </p>
            </div>

            {!gistId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGistConfig(!showGistConfig)}
              >
                {showGistConfig ? 'Скрыть настройку' : 'Настроить'}
              </Button>
            )}
          </div>

          {gistId ? (
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-apple-gray-400">
                      ID связки:
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Живая синхронизация ⚡ (Телефон ⇄ ПК)
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-apple-blue select-all">
                    {gistId}
                  </span>
                </div>
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
                    onClick={handleDisconnect}
                    className="text-xs text-apple-gray-400 hover:text-apple-red transition-colors px-2 py-1"
                  >
                    Отвязать
                  </button>
                </div>
              </div>

              {!gistToken && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Включите двустороннюю синхронизацию для этого ПК</span>
                  </div>
                  <p className="text-xs text-apple-gray-600 dark:text-apple-gray-300 leading-relaxed">
                    Сейчас задания с телефона поступают на этот ПК. Но чтобы новые или удалённые задания с ПК тоже появлялись на телефоне, введите токен GitHub:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Вставьте ваш токен GitHub (ghp_...)"
                      value={gistToken}
                      onChange={(e) => setGistToken(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-apple-blue"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      loading={isSyncing}
                      onClick={handleSaveGistToken}
                    >
                      Сохранить токен
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-apple-gray-900 dark:text-white block">
                      Связка со вторым устройством (Телефон ⇄ ПК)
                    </span>
                    <span className="text-xs text-apple-gray-500">
                      Отправьте ссылку себе в Telegram/VK или отсканируйте QR-код для моментального подключения.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<QrCode className="w-3.5 h-3.5" />}
                      onClick={() => setShowGistQr(!showGistQr)}
                    >
                      {showGistQr ? 'Скрыть QR' : 'Показать QR-код'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={isGistCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5 text-apple-blue" />}
                      onClick={handleCopyGistUrl}
                    >
                      {isGistCopied ? 'Ссылка скопирована!' : 'Скопировать ссылку для второго устройства'}
                    </Button>
                  </div>
                </div>

                {showGistQr && (
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-3 border-t border-black/5 dark:border-white/5 animate-in fade-in duration-200">
                    <div className="bg-white p-3 rounded-2xl shadow-apple-sm flex-shrink-0 border border-black/5">
                      <img
                        src={SyncService.getQrCodeForUrl(SyncService.getGistPairingUrl(gistId, gistToken || undefined))}
                        alt="QR-код связки"
                        className="w-32 h-32 rounded-lg"
                      />
                    </div>
                    <div className="text-xs text-apple-gray-600 dark:text-apple-gray-300 space-y-1 text-center sm:text-left">
                      <p className="font-bold text-apple-gray-900 dark:text-white">
                        QR-код для подключения второго устройства:
                      </p>
                      <p>
                        Отсканируйте камерой второго устройства — оно автоматически подключится к этой же связке заданий.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : showGistConfig ? (
            <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5 animate-in fade-in duration-200">
              <p className="text-xs text-apple-gray-600 dark:text-apple-gray-300">
                1. Откройте{' '}
                <a
                  href="https://github.com/settings/tokens/new?scopes=gist&description=KSU+Planner+Sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-apple-blue font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  <span>создание токена на GitHub (1 клик)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>{' '}
                и нажмите «Generate token» внизу страницы.<br />
                2. Вставьте полученный токен <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">ghp_...</code> сюда:
              </p>

              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Вставьте токен GitHub (ghp_...)"
                  value={gistToken}
                  onChange={(e) => setGistToken(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-apple-blue"
                />
                <Button
                  variant="primary"
                  size="sm"
                  loading={isSyncing}
                  onClick={handleCreateGistSync}
                >
                  Создать связку
                </Button>
              </div>

              <div className="pt-2 border-t border-black/5 dark:border-white/5">
                <span className="text-[11px] text-apple-gray-500 block mb-1.5">
                  Или подключитесь к уже созданному Gist (вставьте ID связки с другого устройства; токен не обязателен):
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Вставьте ID связки (например: e2d77945...)"
                    value={inputGistId}
                    onChange={(e) => setInputGistId(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-apple-blue"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={isSyncing}
                    onClick={handleConnectGistSync}
                  >
                    Подключить
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
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
