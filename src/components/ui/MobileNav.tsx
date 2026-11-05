import React from 'react';
import { Clock, CalendarDays, CheckSquare, Calendar, Settings, Plus } from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenCreateHomework: () => void;
  dueTodayCount: number;
  overdueCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onTabChange,
  onOpenCreateHomework,
  dueTodayCount,
  overdueCount,
}) => {
  const tabs: {
    id: NavTab;
    label: string;
    icon: (isActive: boolean) => React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'today',
      label: 'Сегодня',
      icon: (active) => (
        <Clock className={`w-5 h-5 ${active ? 'text-[#FA8C16]' : 'text-zinc-400 dark:text-zinc-500'}`} />
      ),
      badge: dueTodayCount > 0 ? dueTodayCount : undefined,
      badgeColor: 'bg-[#FA8C16] text-white',
    },
    {
      id: 'schedule',
      label: 'Расписание',
      icon: (active) => (
        <CalendarDays className={`w-5 h-5 ${active ? 'text-[#2B82FB]' : 'text-zinc-400 dark:text-zinc-500'}`} />
      ),
    },
    {
      id: 'homework',
      label: 'Задания',
      icon: (active) => (
        <CheckSquare className={`w-5 h-5 ${active ? 'text-[#10B981]' : 'text-zinc-400 dark:text-zinc-500'}`} />
      ),
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-[#EF4444] text-white',
    },
    {
      id: 'calendar',
      label: 'Календарь',
      icon: (active) => (
        <Calendar className={`w-5 h-5 ${active ? 'text-[#8B5CF6]' : 'text-zinc-400 dark:text-zinc-500'}`} />
      ),
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: (active) => (
        <Settings className={`w-5 h-5 ${active ? 'text-[#2B82FB]' : 'text-zinc-400 dark:text-zinc-500'}`} />
      ),
    },
  ];

  return (
    <>
      {/* Floating Action Button for mobile (+ task button in TickTick blue) */}
      <button
        onClick={onOpenCreateHomework}
        className="md:hidden fixed bottom-20 right-4 z-40 w-13 h-13 rounded-full bg-[#2B82FB] hover:bg-[#2072E5] active:scale-90 text-white shadow-lg shadow-[#2B82FB]/35 flex items-center justify-center transition-all duration-150 ease-out cursor-pointer"
        aria-label="Добавить задачу"
        title="Добавить задачу"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Docked bottom navigation bar - TickTick style */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#1F1F1F]/95 backdrop-blur-lg border-t border-zinc-200 dark:border-[#2C2C2C] px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 ease-out active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-zinc-900 dark:text-white font-semibold'
                  : 'text-zinc-400 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                {tab.icon(isActive)}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center leading-none ${
                      tab.badgeColor || 'bg-[#2B82FB] text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight truncate max-w-full text-center leading-tight ${
                  isActive ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
