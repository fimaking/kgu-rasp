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
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenCreateHomework,
  dueTodayCount,
  overdueCount,
  groupName,
  isDark,
  onToggleTheme,
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
    <aside className="hidden md:flex flex-col w-64 h-full bg-[#f6f6f8]/85 dark:bg-[#18181b]/85 backdrop-blur-2xl border-r border-black/5 dark:border-white/10 p-4 shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-apple-blue to-apple-indigo flex items-center justify-center text-white shadow-apple-sm">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-tight text-apple-gray-900 dark:text-white truncate">
            КГУ Студент
          </h1>
          <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 font-mono truncate">
            {groupName}
          </p>
        </div>
      </div>

      {/* Quick Add Homework Button */}
      <button
        onClick={onOpenCreateHomework}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mb-5 rounded-2xl bg-apple-blue hover:bg-blue-600 text-white font-medium text-sm shadow-apple-sm transition-all duration-150 active:scale-[0.98]"
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
              className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-black/5 dark:bg-white/10 text-apple-blue dark:text-apple-blue font-semibold shadow-sm'
                  : 'text-apple-gray-600 dark:text-apple-gray-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-apple-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-apple-blue' : 'text-current'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
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
          className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-apple-gray-500 hover:text-apple-gray-900 dark:text-apple-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="Сменить тему"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-apple-indigo" />}
          <span>{isDark ? 'Светлая тема' : 'Тёмная тема'}</span>
        </button>
        <span className="text-[11px] text-apple-gray-400 font-mono">v1.0</span>
      </div>
    </aside>
  );
};
