import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar, NavTab } from './components/ui/Sidebar';
import { MobileNav } from './components/ui/MobileNav';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { TodayView } from './components/today/TodayView';
import { ScheduleView } from './components/schedule/ScheduleView';
import { HomeworkView } from './components/homework/HomeworkView';
import { CalendarView } from './components/calendar/CalendarView';
import { SettingsView } from './components/settings/SettingsView';
import { HomeworkFormModal } from './components/homework/HomeworkFormModal';
import { SplashScreen } from './components/ui/SplashScreen';

import { useSchedule } from './hooks/useSchedule';
import { useHomework } from './hooks/useHomework';
import { useCalendar } from './hooks/useCalendar';
import { useTheme } from './hooks/useTheme';
import { SyncService } from './services/syncService';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('today');
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateSubject, setQuickCreateSubject] = useState<string | undefined>(undefined);
  const [quickCreateDueDate, setQuickCreateDueDate] = useState<string | undefined>(undefined);
  const [quickCreateDueTime, setQuickCreateDueTime] = useState<string | undefined>(undefined);
  const [quickCreateLessonType, setQuickCreateLessonType] = useState<string | undefined>(undefined);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Hooks
  const theme = useTheme();
  const schedule = useSchedule();
  const homework = useHomework();
  const calendar = useCalendar(schedule.lessons, homework.allItems);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev.slice(-2), { id, type, title, message }]);
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
            if (gToken) {
              showToast(
                'success',
                'Двусторонняя связка подключена!',
                `Синхронизировано заданий: ${res.countHw}. Добавление и удаление активны с обоих устройств!`
              );
            } else {
              showToast('success', 'GitHub Gist подключен (чтение)', `Загружено заданий: ${res.countHw}`);
            }
          } else {
            showToast('error', 'Ошибка подключения Gist', res.error);
          }
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };

    checkHashTransfer();
  }, [homework, calendar, showToast]);

  const openCreateHomework = (
    options?:
      | {
          subject?: string;
          dueDate?: string;
          dueTime?: string;
          lessonType?: string;
        }
      | string
  ) => {
    if (typeof options === 'string') {
      setQuickCreateSubject(options);
      setQuickCreateDueDate(undefined);
      setQuickCreateDueTime(undefined);
      setQuickCreateLessonType(undefined);
    } else if (options) {
      setQuickCreateSubject(options.subject);
      setQuickCreateDueDate(options.dueDate);
      setQuickCreateDueTime(options.dueTime);
      setQuickCreateLessonType(options.lessonType);
    } else {
      setQuickCreateSubject(undefined);
      setQuickCreateDueDate(undefined);
      setQuickCreateDueTime(undefined);
      setQuickCreateLessonType(undefined);
    }
    setIsQuickCreateOpen(true);
  };

  const closeQuickCreate = () => {
    setIsQuickCreateOpen(false);
    setQuickCreateSubject(undefined);
    setQuickCreateDueDate(undefined);
    setQuickCreateDueTime(undefined);
    setQuickCreateLessonType(undefined);
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
    <div className="flex h-screen w-screen overflow-hidden bg-apple-gray-100 dark:bg-black text-apple-gray-900 dark:text-zinc-100 font-sans selection:bg-apple-blue selection:text-white relative">
      {/* Smooth Apple-inspired Launch Screen */}
      {showSplash && (
        <SplashScreen
          onFinished={() => setShowSplash(false)}
          groupName={schedule.groupName || schedule.info?.group?.name || '26-ИСбо-4'}
        />
      )}

      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenCreateHomework={() => openCreateHomework()}
        dueTodayCount={homework.dueTodayList.length}
        overdueCount={homework.overdueList.length}
        groupName={schedule.groupName || schedule.info?.group?.name || '26-ИСбо-4'}
        themeMode={theme.themeMode}
        isDark={theme.isDark}
        onToggleTheme={() => theme.setThemeMode(theme.isDark ? 'light' : 'dark')}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Scrollable View Area with Smooth Transitions */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 py-6 pb-28 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <div key={currentTab} className="animate-tab-transition">
              {currentTab === 'today' && (
              <TodayView
                todayLessons={schedule.todayLessons}
                allLessons={schedule.lessons}
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
                onOpenCreateHomework={(options) => openCreateHomework(options)}
                onSelectHomework={() => setCurrentTab('homework')}
              />
            )}

            {currentTab === 'schedule' && (
              <ScheduleView
                weekSchedule={schedule.weekSchedule}
                allLessons={schedule.lessons}
                info={schedule.info}
                selectedWeekMonday={schedule.selectedWeekMonday}
                onPrevWeek={schedule.prevWeek}
                onNextWeek={schedule.nextWeek}
                onGoToToday={schedule.goToToday}
                onGoToDate={schedule.goToDate}
                subgroupFilter={schedule.subgroupFilter}
                onSubgroupChange={schedule.setSubgroupFilter}
                onOpenCreateHomeworkForSubject={(options) => openCreateHomework(options)}
              />
            )}

            {currentTab === 'homework' && (
              <HomeworkView
                items={homework.items}
                allItems={homework.allItems}
                stats={homework.stats}
                filters={homework.filters}
                onFilterChange={homework.setFilters}
                todayLessonsCount={schedule.todayLessons.length}
                onNavigateToSchedule={() => setCurrentTab('schedule')}
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
                onCloseCreateModal={closeQuickCreate}
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
                themeMode={theme.themeMode}
                onThemeChange={theme.setThemeMode}
                groupId={schedule.groupId}
                groupName={schedule.groupName}
                subgroupPreference={schedule.subgroupFilter}
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
          onClose={closeQuickCreate}
          onSubmit={(data) => {
            homework.addHomework(data);
            showToast('success', 'Задание создано', data.title);
            closeQuickCreate();
          }}
          defaultSubject={quickCreateSubject}
          defaultDueDate={quickCreateDueDate}
          defaultDueTime={quickCreateDueTime}
          defaultLessonType={quickCreateLessonType}
          subjectsList={schedule.subjects}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
