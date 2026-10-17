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
  const tabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    {
      id: 'today',
      label: 'Сегодня',
      icon: <Clock className="w-5 h-5" />,
      badge: dueTodayCount > 0 ? dueTodayCount : undefined,
      badgeColor: 'bg-apple-blue',
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
      badgeColor: 'bg-rose-500',
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
    <>
      {/* Floating Action Button for mobile */}
      <button
        onClick={onOpenCreateHomework}
        className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-apple-blue text-white shadow-apple-float flex items-center justify-center transition-all duration-200 ease-out active:scale-90 hover:scale-105"
        aria-label="Добавить домашнее задание"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Docked bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/85 dark:bg-[#18181b]/85 backdrop-blur-2xl border-t border-black/5 dark:border-white/10 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ease-out active:scale-90 ${
                isActive
                  ? 'text-apple-blue font-semibold scale-105'
                  : 'text-apple-gray-500 dark:text-apple-gray-400 hover:text-apple-gray-800'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-check-pop ${
                      tab.badgeColor || 'bg-apple-blue'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
