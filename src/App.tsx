import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar, NavTab } from './components/ui/Sidebar';
import { MobileNav } from './components/ui/MobileNav';
import { Header } from './components/ui/Header';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { TodayView } from './components/today/TodayView';
import { ScheduleView } from './components/schedule/ScheduleView';
import { HomeworkView } from './components/homework/HomeworkView';
import { CalendarView } from './components/calendar/CalendarView';
import { SettingsView } from './components/settings/SettingsView';
import { HomeworkFormModal } from './components/homework/HomeworkFormModal';

import { useSchedule } from './hooks/useSchedule';
import { useHomework } from './hooks/useHomework';
import { useCalendar } from './hooks/useCalendar';
import { useTheme } from './hooks/useTheme';
import { SyncService } from './services/syncService';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('today');
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateSubject, setQuickCreateSubject] = useState<string | undefined>(undefined);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Hooks
  const { themeMode, isDark, setThemeMode } = useTheme();
  const schedule = useSchedule();
  const homework = useHomework();
  const calendar = useCalendar(schedule.lessons, homework.allItems);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Keyboard shortcut listener: Cmd/Ctrl+K or 'n' for quick task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickCreateOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Automatic data transfer when opened from a QR code (#transfer=...)
  useEffect(() => {
    const checkHashTransfer = async () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('#transfer=') || hash.includes('#rawtransfer='))) {
        showToast('info', 'Импорт заданий...', 'Распаковка данных из QR-кода');
        const res = await SyncService.decodeTransferData(hash);
        if (res.success) {
          homework.reload();
          calendar.reload();
          showToast('success', 'Синхронизация завершена!', `Успешно перенесено заданий: ${res.countHw}`);
        } else {
          showToast('error', 'Ошибка импорта', res.error);
        }
        window.history.replaceState(null, '', window.location.pathname);
      } else if (hash && hash.includes('#gist=')) {
        const query = hash.replace(/^#/, '');
        const params = new URLSearchParams(query);
        const gId = params.get('gist') || '';
        const gToken = params.get('token') || '';
        if (gId) {
          showToast('info', 'Подключение GitHub Gist...', `ID: ${gId.slice(0, 8)}...`);
          const res = await SyncService.connectGistSync(gId, gToken);
          if (res.success) {
            homework.reload();
            calendar.reload();
            showToast('success', 'GitHub Gist подключен!', `Загружено заданий: ${res.countHw}`);
          } else {
            showToast('error', 'Ошибка подключения Gist', res.error);
          }
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };

    checkHashTransfer();
  }, [homework, calendar, showToast]);

  const openCreateHomework = (subject?: string) => {
    setQuickCreateSubject(subject);
    setIsQuickCreateOpen(true);
  };

  const handleRefreshSchedule = async () => {
    try {
      await schedule.refresh();
      showToast('success', 'Расписание обновлено', 'Получены свежие данные с сервера КГУ.');
    } catch {
      showToast('error', 'Ошибка обновления', 'Не удалось связаться с сервером КГУ.');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-apple-gray-100 dark:bg-[#121214] text-apple-gray-900 dark:text-zinc-100 font-sans selection:bg-apple-blue selection:text-white">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenCreateHomework={() => openCreateHomework()}
        dueTodayCount={homework.dueTodayList.length}
        overdueCount={homework.overdueList.length}
        groupName={schedule.info?.group?.name || '26-ИСбо-4'}
        themeMode={themeMode}
        isDark={isDark}
        onToggleTheme={() => setThemeMode(isDark ? 'light' : 'dark')}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sticky Header */}
        <Header
          subgroupFilter={schedule.subgroupFilter}
          onSubgroupChange={(sg) => {
            schedule.setSubgroupFilter(sg);
            showToast('info', 'Фильтр подгруппы обновлен', sg === 0 ? 'Показываются все подгруппы' : `Выбрана ${sg}-я подгруппа`);
          }}
          onRefresh={handleRefreshSchedule}
          refreshing={schedule.refreshing}
          isOffline={schedule.isOffline}
          lastUpdated={schedule.lastUpdated}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-28 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'today' && (
              <TodayView
                todayLessons={schedule.todayLessons}
                currentOrNextLesson={schedule.currentOrNextLesson}
                dueTodayList={homework.dueTodayList}
                overdueList={homework.overdueList}
                activeHomeworkCount={homework.stats.active}
                info={schedule.info}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
                onToggleCompleteHomework={(id) => {
                  homework.toggleComplete(id);
                  showToast('success', 'Статус обновлен');
                }}
                onOpenCreateHomework={() => openCreateHomework()}
                onSelectHomework={() => setCurrentTab('homework')}
              />
            )}

            {currentTab === 'schedule' && (
              <ScheduleView
                weekSchedule={schedule.weekSchedule}
                allLessons={schedule.allLessons}
                info={schedule.info}
                selectedWeekMonday={schedule.selectedWeekMonday}
                onPrevWeek={schedule.prevWeek}
                onNextWeek={schedule.nextWeek}
                onGoToToday={schedule.goToToday}
                subgroupFilter={schedule.subgroupFilter}
                onSubgroupChange={schedule.setSubgroupFilter}
                onOpenCreateHomeworkForSubject={(subj) => openCreateHomework(subj)}
              />
            )}

            {currentTab === 'homework' && (
              <HomeworkView
                items={homework.items}
                allItems={homework.allItems}
                stats={homework.stats}
                filters={homework.filters}
                onFilterChange={homework.setFilters}
                onToggleComplete={(id) => {
                  homework.toggleComplete(id);
                  showToast('success', 'Статус задания обновлен');
                }}
                onToggleSubtask={homework.toggleSubtask}
                onAddHomework={(data) => {
                  homework.addHomework(data);
                  showToast('success', 'Задание создано', data.title);
                }}
                onUpdateHomework={(hw) => {
                  homework.updateHomework(hw);
                  showToast('info', 'Задание обновлено');
                }}
                onDeleteHomework={(id) => {
                  homework.deleteHomework(id);
                  showToast('info', 'Задание удалено');
                }}
                subjectsList={schedule.subjects}
                isCreateModalOpen={isQuickCreateOpen}
                onCloseCreateModal={() => {
                  setIsQuickCreateOpen(false);
                  setQuickCreateSubject(undefined);
                }}
                onOpenCreateModal={() => openCreateHomework()}
              />
            )}

            {currentTab === 'calendar' && (
              <CalendarView
                selectedDate={calendar.selectedDate}
                onSelectDate={calendar.setSelectedDate}
                selectedDaySummary={calendar.selectedDaySummary}
                eventsByDate={calendar.eventsByDate}
                onSelectLesson={() => setCurrentTab('schedule')}
                onSelectHomework={() => setCurrentTab('homework')}
                onAddEvent={(ev) => {
                  calendar.addEvent(ev);
                  showToast('success', 'Событие добавлено в календарь', ev.title);
                }}
                onDeleteEvent={(id) => {
                  calendar.deleteEvent(id);
                  showToast('info', 'Событие удалено');
                }}
                subjectsList={schedule.subjects}
                allCustomEvents={calendar.events}
                allHomework={homework.allItems}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                themeMode={themeMode}
                onThemeChange={setThemeMode}
                subgroupPreference={schedule.subgroupFilter}
                onSubgroupChange={schedule.setSubgroupFilter}
                onShowToast={showToast}
                onDataImported={() => {
                  homework.reload();
                  calendar.reload();
                }}
                onRefreshSchedule={handleRefreshSchedule}
                lastUpdated={schedule.lastUpdated}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Navigation Dock */}
      <MobileNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenCreateHomework={() => openCreateHomework()}
        dueTodayCount={homework.dueTodayList.length}
        overdueCount={homework.overdueList.length}
      />

      {/* Global Quick Add Homework Modal */}
      {isQuickCreateOpen && currentTab !== 'homework' && (
        <HomeworkFormModal
          isOpen={isQuickCreateOpen}
          onClose={() => {
            setIsQuickCreateOpen(false);
            setQuickCreateSubject(undefined);
          }}
          onSubmit={(data) => {
            homework.addHomework(data);
            showToast('success', 'Задание создано', data.title);
            setIsQuickCreateOpen(false);
            setQuickCreateSubject(undefined);
          }}
          defaultSubject={quickCreateSubject}
          subjectsList={schedule.subjects}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
