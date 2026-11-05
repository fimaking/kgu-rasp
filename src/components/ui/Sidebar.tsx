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
  Check,
  Cloud,
  Layers,
  ChevronDown,
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
  subjectsList?: string[];
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
  subjectsList = [],
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'today',
      label: 'Сегодня',
      icon: <Clock className="w-4 h-4 text-[#FA8C16]" />,
      badge: dueTodayCount > 0 ? dueTodayCount : undefined,
      badgeColor: 'bg-[#FA8C16] text-white',
    },
    {
      id: 'schedule',
      label: 'Расписание',
      icon: <CalendarDays className="w-4 h-4 text-[#2B82FB]" />,
    },
    {
      id: 'homework',
      label: 'Задания',
      icon: <CheckSquare className="w-4 h-4 text-[#10B981]" />,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-[#EF4444] text-white',
    },
    {
      id: 'calendar',
      label: 'Календарь',
      icon: <Calendar className="w-4 h-4 text-[#8B5CF6]" />,
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: <Settings className="w-4 h-4 text-zinc-400" />,
    },
  ];

  // Distinct colors for subjects list (TickTick list tag dots)
  const tagColors = [
    'bg-[#2B82FB]',
    'bg-[#10B981]',
    'bg-[#FA8C16]',
    'bg-[#8B5CF6]',
    'bg-[#EC4899]',
    'bg-[#06B6D4]',
    'bg-[#F59E0B]',
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-[#FFFFFF] dark:bg-[#1F1F1F] border-r border-zinc-200 dark:border-[#2C2C2C] select-none shrink-0 transition-colors duration-150">
      {/* Brand & User Profile Header - TickTick Style */}
      <div className="p-3.5 pb-2 border-b border-zinc-100 dark:border-[#2A2A2A]">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* TickTick Iconic Logo */}
            <div className="w-8 h-8 rounded-xl bg-[#2B82FB] flex items-center justify-center text-white shadow-sm shadow-[#2B82FB]/40 shrink-0">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  UniKGU
                </span>
                <span className="text-[10px] font-semibold px-1 py-0.2 rounded bg-[#2B82FB]/10 text-[#2B82FB] font-mono leading-none">
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate">Онлайн</span>
              </div>
            </div>
          </div>

          {/* Group Switcher Button */}
          {onOpenGroupSelect && (
            <button
              type="button"
              onClick={onOpenGroupSelect}
              title="Сменить учебную группу"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#2C2C2C] transition-colors shrink-0"
            >
              <span className="max-w-[75px] truncate font-mono text-[11px]">{groupName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Task Button - TickTick Primary Action */}
      <div className="p-3">
        <button
          onClick={onOpenCreateHomework}
          className="flex items-center justify-between w-full py-2 px-3 rounded-xl bg-[#2B82FB] hover:bg-[#2072E5] active:bg-[#1668E3] text-white text-xs font-semibold shadow-sm transition-all duration-150 ease-out cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Добавить задачу</span>
          </div>
          <kbd className="hidden lg:inline-block text-[10px] font-mono font-normal opacity-70 px-1 py-0.5 rounded bg-black/20">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Navigation List - TickTick Left Rail */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        <div className="px-2 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Разделы
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out text-left cursor-pointer ${
                isActive
                  ? 'bg-[#2B82FB]/10 text-[#2B82FB] font-semibold dark:bg-[#2B82FB]/15'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#2A2A2A]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    item.badgeColor || 'bg-[#2B82FB] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Subjects / Lists (TickTick Lists section) */}
        {subjectsList.length > 0 && (
          <div className="pt-4 space-y-0.5">
            <div className="px-2 pb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              <span>Предметы</span>
              <Layers className="w-3 h-3 text-zinc-400" />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
              {subjectsList.slice(0, 8).map((subject, idx) => {
                const dotColor = tagColors[idx % tagColors.length];
                return (
                  <button
                    key={subject}
                    onClick={() => {
                      onTabChange('homework');
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#2A2A2A] hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors text-left truncate cursor-pointer"
                    title={subject}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                    <span className="truncate">{subject}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer: Theme Switcher & Status */}
      <div className="p-3 border-t border-zinc-100 dark:border-[#2A2A2A] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#2C2C2C] text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
          title={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          <span className="text-[11px] font-medium">{isDark ? 'Светлая' : 'Тёмная'}</span>
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <Cloud className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-mono text-[10px]">{APP_VERSION}</span>
        </div>
      </div>
    </aside>
  );
};
