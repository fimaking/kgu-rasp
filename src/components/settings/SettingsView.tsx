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
} from 'lucide-react';
import { ThemeMode, UserSettings } from '../../types/settings';
import { StorageService } from '../../services/storageService';
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
        </div>
      </div>
    </div>
  );
};
