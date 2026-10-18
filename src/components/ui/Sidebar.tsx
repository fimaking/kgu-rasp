import React from 'react';
import {
  CalendarDays,
  CheckSquare,
  Clock,
  Calendar,
  Settings,
  Plus,
  Moon,
  Sun,
  GraduationCap,
} from 'lucide-react';
import { ThemeMode } from '../../types/settings';
import { APP_VERSION } from '../../utils/version';

export type NavTab = 'today' | 'schedule' | 'homework' | 'calendar' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenCreateHomework: () => void;
  dueTodayCount: number;
  overdueCount: number;
  groupName: string;
  themeMode: ThemeMode;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenGroupSelect?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenCreateHomework,
  dueTodayCount,
  overdueCount,
  groupName = '26-ИСбо-4',
  isDark,
  onToggleTheme,
  onOpenGroupSelect,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeVariant?: 'red' | 'blue' }[] = [
    {
      id: 'today',
      label: 'Сегодня',
      icon: <Clock className="w-5 h-5" />,
      badge: dueTodayCount > 0 ? dueTodayCount : undefined,
      badgeVariant: 'blue',
    },
    {
      id: 'schedule',
      label: 'Расписание',
      icon: <CalendarDays className="w-5 h-5" />,
    },
    {
      id: 'homework',
      label: 'Задания',
      icon: <CheckSquare className="w-5 h-5" />,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeVariant: 'red',
    },
    {
      id: 'calendar',
      label: 'Календарь',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-[#f6f6f8]/85 dark:bg-[#121214]/85 backdrop-blur-2xl border-r border-black/5 dark:border-white/10 p-4 shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 mb-4 rounded-2xl bg-white/70 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm backdrop-blur-md select-none">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-apple-blue via-blue-600 to-apple-indigo flex items-center justify-center text-white shadow-md shadow-apple-blue/25 ring-1 ring-white/20 shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold tracking-tight text-apple-gray-900 dark:text-white truncate leading-tight">
            КГУ Студент
          </h1>
          <div className="mt-1 flex items-center">
            {onOpenGroupSelect ? (
              <button
                type="button"
                onClick={onOpenGroupSelect}
                title="Нажмите, чтобы сменить учебную группу"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue dark:text-blue-400 border border-apple-blue/25 tracking-tight hover:bg-apple-blue/20 transition-all cursor-pointer active:scale-95"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-apple-blue dark:bg-blue-400 animate-pulse" />
                <span>{groupName}</span>
                <span className="text-[9px] opacity-70 ml-0.5">▾</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue dark:text-blue-400 border border-apple-blue/25 tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-apple-blue dark:bg-blue-400 animate-pulse" />
                {groupName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Homework Button */}
      <button
        onClick={onOpenCreateHomework}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mb-5 rounded-2xl bg-apple-blue hover:bg-blue-600 text-white font-medium text-sm shadow-apple-sm transition-all duration-200 ease-out active:scale-[0.96] hover:shadow-md"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Новое задание</span>
      </button>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ease-out active:scale-[0.97] ${
                isActive
                  ? 'bg-black/5 dark:bg-white/10 text-apple-blue dark:text-apple-blue font-semibold shadow-sm'
                  : 'text-apple-gray-600 dark:text-apple-gray-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-apple-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-transform duration-200 ${isActive ? 'text-apple-blue scale-110' : 'text-current'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold transition-all duration-200 ${
                    item.badgeVariant === 'red'
                      ? 'bg-rose-500 text-white'
                      : 'bg-apple-blue/15 text-apple-blue dark:bg-apple-blue/25'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer / Theme Switcher */}
      <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between px-2">
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-apple-gray-500 hover:text-apple-gray-900 dark:text-apple-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 ease-out active:scale-95"
          title="Сменить тему"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-apple-indigo" />}
          <span>{isDark ? 'Светлая тема' : 'Тёмная тема'}</span>
        </button>
        <span className="text-[11px] text-apple-gray-400 font-mono font-medium">{APP_VERSION}</span>
      </div>
    </aside>
  );
};
