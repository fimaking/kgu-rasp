import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Clock,
  Flag,
  Layers,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import {
  GROUP_ACADEMIC_METADATA,
  ACADEMIC_STAGES,
  ACADEMIC_HOLIDAYS,
  ACADEMIC_WEEKS,
  getAcademicWeekByDate,
  getAcademicStageForDate,
  AcademicWeekData,
} from '../../data/academicCalendar';
import { formatRussianDate, parseIsoDate } from '../../utils/dateUtils';

interface AcademicScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWeek?: (weekNumber: number, monday: Date) => void;
  currentSelectedMonday?: Date;
}

export const AcademicScheduleModal: React.FC<AcademicScheduleModalProps> = ({
  isOpen,
  onClose,
  onSelectWeek,
  currentSelectedMonday: _currentSelectedMonday,
}) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'stages' | 'holidays'>('grid');

  const today = new Date();
  const currentWeek = getAcademicWeekByDate(today);
  const currentStage = getAcademicStageForDate(today);

  // Calculate days until next milestone (e.g. Winter Session)
  const winterSessionStart = parseIsoDate('2027-01-11');
  const daysUntilWinterSession = Math.ceil(
    (winterSessionStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleWeekClick = (week: AcademicWeekData) => {
    if (onSelectWeek) {
      const mon = parseIsoDate(week.startDate);
      onSelectWeek(week.weekNumber, mon);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="График учебного процесса"
      subtitle={`${GROUP_ACADEMIC_METADATA.faculty} • Группа ${GROUP_ACADEMIC_METADATA.groupName} • ${GROUP_ACADEMIC_METADATA.academicYear} уч. год`}
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Academic Status Card */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 dark:from-blue-500/20 dark:via-indigo-500/10 dark:to-purple-500/20 border border-blue-500/20 shadow-apple-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3 h-3" />
                <span>{GROUP_ACADEMIC_METADATA.title}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-apple-gray-900 dark:text-white flex items-center gap-2">
                <span>1 курс • Учебный план:</span>
                <span className="font-mono text-xs sm:text-sm px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-blue-600 dark:text-blue-400 font-semibold">
                  {GROUP_ACADEMIC_METADATA.studyPlan}
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-apple-gray-600 dark:text-apple-gray-300">
                {currentWeek ? (
                  <>
                    Сейчас идёт <strong className="text-apple-blue">{currentWeek.weekNumber}-я неделя</strong> ({currentWeek.primaryTypeLabel}, {currentWeek.semester} семестр).
                  </>
                ) : (
                  <>Официальный график учебного процесса на 52 недели для студентов группы 26-ИСбо-4.</>
                )}
              </p>
            </div>

            {/* Countdown widget */}
            {daysUntilWinterSession > 0 && (
              <div className="shrink-0 p-3 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-apple-sm text-center sm:text-right">
                <div className="text-xs text-apple-gray-500 dark:text-apple-gray-400 font-medium">До зимней сессии</div>
                <div className="text-lg font-extrabold text-purple-600 dark:text-purple-400">
                  {daysUntilWinterSession} {daysUntilWinterSession === 1 ? 'день' : daysUntilWinterSession < 5 ? 'дня' : 'дней'}
                </div>
                <div className="text-[10px] text-apple-gray-400">с 11 января 2027 г.</div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-black/5 dark:bg-white/10 rounded-2xl border border-black/5 dark:border-white/5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'grid'
                ? 'bg-white dark:bg-zinc-800 text-apple-blue shadow-apple-sm'
                : 'text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Календарный график (52 нед.)</span>
          </button>
          <button
            onClick={() => setActiveTab('stages')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'stages'
                ? 'bg-white dark:bg-zinc-800 text-apple-blue shadow-apple-sm'
                : 'text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Этапы и сроки семестров</span>
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'holidays'
                ? 'bg-white dark:bg-zinc-800 text-apple-blue shadow-apple-sm'
                : 'text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-rose-500" />
            <span>Праздничные дни ({ACADEMIC_HOLIDAYS.length})</span>
          </button>
        </div>

        {/* Tab 1: Interactive 52-week calendar grid matching the official document */}
        {activeTab === 'grid' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-apple-gray-500 dark:text-apple-gray-400">
              <span>Нажмите на номер недели для быстрого перехода в расписание:</span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-apple-blue animate-pulse"></span>
                Текущая неделя: {currentWeek?.weekNumber}
              </span>
            </div>

            {/* Scrollable table container */}
            <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 shadow-apple-sm scrollbar-thin">
              <table className="w-full text-center border-collapse text-[11px] font-mono select-none">
                <thead>
                  <tr className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 text-apple-gray-600 dark:text-apple-gray-300 font-bold">
                    <th className="p-2 text-left sticky left-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur z-10 w-12 border-r border-black/10 dark:border-white/10">
                      Нед.
                    </th>
                    {ACADEMIC_WEEKS.map((w) => {
                      const isCurrent = currentWeek?.weekNumber === w.weekNumber;
                      return (
                        <th
                          key={w.weekNumber}
                          onClick={() => handleWeekClick(w)}
                          className={`p-1.5 min-w-[28px] border-r border-black/5 dark:border-white/5 cursor-pointer hover:bg-apple-blue/20 transition-colors ${
                            isCurrent
                              ? 'bg-apple-blue text-white font-extrabold rounded-t'
                              : 'hover:text-apple-blue'
                          }`}
                          title={`Неделя ${w.weekNumber} (${formatRussianDate(parseIsoDate(w.startDate))} – ${formatRussianDate(parseIsoDate(w.endDate))}) • Нажмите для перехода`}
                        >
                          {w.weekNumber}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const).map((dayName, dayIdx) => (
                    <tr
                      key={dayName}
                      className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    >
                      <td className="p-1.5 text-left font-bold text-apple-gray-700 dark:text-apple-gray-300 sticky left-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur z-10 border-r border-black/10 dark:border-white/10">
                        {dayName}
                      </td>
                      {ACADEMIC_WEEKS.map((w) => {
                        const dayStatus = w.days[dayIdx];
                        const isCurrentWeek = currentWeek?.weekNumber === w.weekNumber;

                        let cellClass = 'bg-transparent text-apple-gray-400';
                        if (dayStatus.symbol === '*') {
                          cellClass = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold';
                        } else if (dayStatus.symbol === 'Э') {
                          cellClass = 'bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold';
                        } else if (dayStatus.symbol === 'К') {
                          cellClass = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold';
                        } else if (dayStatus.symbol === 'У') {
                          cellClass = 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold';
                        }

                        return (
                          <td
                            key={w.weekNumber}
                            onClick={() => handleWeekClick(w)}
                            className={`p-1 min-w-[28px] border-r border-black/5 dark:border-white/5 cursor-pointer transition-all ${cellClass} ${
                              isCurrentWeek ? 'ring-1 ring-inset ring-apple-blue/50' : ''
                            }`}
                            title={`Неделя ${w.weekNumber}, ${dayName} (${dayStatus.dateStr}): ${dayStatus.label}`}
                          >
                            {dayStatus.symbol !== ' ' ? dayStatus.symbol : '·'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend (Обозначения) */}
            <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <div className="text-xs font-bold text-apple-gray-700 dark:text-apple-gray-300 mb-2">
                Условные обозначения:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold flex items-center justify-center shrink-0">
                    К
                  </span>
                  <span className="text-apple-gray-700 dark:text-apple-gray-300">Каникулы</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono font-bold flex items-center justify-center shrink-0">
                    Э
                  </span>
                  <span className="text-apple-gray-700 dark:text-apple-gray-300">Экзамены (сессия)</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold flex items-center justify-center shrink-0">
                    У
                  </span>
                  <span className="text-apple-gray-700 dark:text-apple-gray-300">Учебная практика</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                  <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono font-bold flex items-center justify-center shrink-0">
                    *
                  </span>
                  <span className="text-apple-gray-700 dark:text-apple-gray-300">Праздничные дни</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
                  <span className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 text-apple-gray-500 font-mono font-bold flex items-center justify-center shrink-0">
                    ·
                  </span>
                  <span className="text-apple-gray-700 dark:text-apple-gray-300">Теоретич. обучение</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Stages List */}
        {activeTab === 'stages' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {ACADEMIC_STAGES.map((stage) => {
              const isCurrent = currentStage?.id === stage.id;
              const startFormatted = formatRussianDate(parseIsoDate(stage.startDate), true);
              const endFormatted = formatRussianDate(parseIsoDate(stage.endDate), true);

              return (
                <div
                  key={stage.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20 shadow-apple-sm'
                      : 'bg-white/70 dark:bg-zinc-900/70 border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.color.dot}`}></span>
                      <h4 className="text-sm font-bold text-apple-gray-900 dark:text-white flex items-center gap-1.5">
                        <span>{stage.title}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-500 text-white">
                            Сейчас идёт
                          </span>
                        )}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${stage.color.badge}`}>
                        {stage.shortCode !== ' ' ? `Код: ${stage.shortCode}` : 'Теория'}
                      </span>
                      <span className="text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400">
                        {stage.durationLabel} ({stage.weeksLabel})
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-apple-gray-600 dark:text-apple-gray-300 mb-2">
                    {stage.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-medium text-apple-gray-500 dark:text-apple-gray-400">
                    <Clock className="w-3.5 h-3.5 text-apple-blue" />
                    <span>Срок проведения: {startFormatted} — {endFormatted}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Official Holidays */}
        {activeTab === 'holidays' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <p className="text-xs text-apple-gray-600 dark:text-apple-gray-300">
              Официальные нерабочие праздничные дни в 2026–2027 учебном году согласно трудовому календарю РФ и графику учебного процесса КГУ (обозначены красной звёздочкой <strong className="text-rose-500 font-bold">*</strong>):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACADEMIC_HOLIDAYS.map((h) => {
                const hDate = parseIsoDate(h.dateStr);
                const isPast = hDate.getTime() < today.setHours(0, 0, 0, 0);

                return (
                  <div
                    key={h.dateStr}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 ${
                      isPast
                        ? 'bg-black/5 dark:bg-white/5 border-transparent opacity-60'
                        : 'bg-white/80 dark:bg-zinc-900/80 border-black/5 dark:border-white/10 shadow-apple-sm'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-apple-gray-900 dark:text-white flex items-center gap-1.5">
                        <Flag className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{h.name}</span>
                      </div>
                      <div className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400">
                        {formatRussianDate(hDate, true)}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold font-mono">
                      *
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
