import React, { useState, useMemo, useEffect } from 'react';
import { Search, Users, Check, School, BookOpen, X, Sparkles, Globe, User, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { ScheduleService } from '../../services/scheduleService';
import { KsuGroup, GROUP_PRESETS, GroupPreset } from '../../types/schedule';

interface GroupSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroupId: number;
  currentGroupName: string;
  currentSubgroup: number;
  currentForeignLanguage?: 'all' | 'de' | 'en' | 'fr';
  onSelectGroup: (groupId: number, groupName: string, subgroup: number, foreignLang: 'all' | 'de' | 'en' | 'fr') => void;
}

export const GroupSelectModal: React.FC<GroupSelectModalProps> = ({
  isOpen,
  onClose,
  currentGroupId,
  currentGroupName,
  currentSubgroup,
  currentForeignLanguage = 'all',
  onSelectGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubgroup, setSelectedSubgroup] = useState<number>(currentSubgroup);
  const [selectedForeignLang, setSelectedForeignLang] = useState<'all' | 'de' | 'en' | 'fr'>(currentForeignLanguage);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');

  useEffect(() => {
    if (isOpen) {
      setSelectedSubgroup(currentSubgroup);
      setSelectedForeignLang(currentForeignLanguage);
    }
  }, [isOpen, currentSubgroup, currentForeignLanguage]);

  // Load all 381 groups
  const allGroups = useMemo<KsuGroup[]>(() => {
    return ScheduleService.getAvailableGroups();
  }, []);

  // Extract distinct faculties
  const faculties = useMemo(() => {
    const set = new Set<string>();
    for (const g of allGroups) {
      if (g.facul) set.add(g.facul);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [allGroups]);

  // Extract distinct courses
  const courses = useMemo(() => {
    const set = new Set<number>();
    for (const g of allGroups) {
      if (g.kurs) set.add(g.kurs);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [allGroups]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = allGroups.filter((group: KsuGroup) => {
      // Faculty filter
      if (selectedFaculty !== 'all' && group.facul !== selectedFaculty) {
        return false;
      }
      // Course filter
      if (selectedCourse !== 'all' && group.kurs !== selectedCourse) {
        return false;
      }
      // Query filter
      if (q) {
        const matchesName = (group.name || '').toLowerCase().includes(q);
        const matchesFacul = (group.facul || '').toLowerCase().includes(q);
        const matchesCourse = group.kurs ? `${group.kurs} курс`.toLowerCase().includes(q) : false;
        return matchesName || matchesFacul || matchesCourse;
      }
      return true;
    });

    return result.sort((a, b) => {
      const aCount = a.lessonsCount || 0;
      const bCount = b.lessonsCount || 0;
      if ((aCount > 0) !== (bCount > 0)) {
        return bCount - aCount;
      }
      return a.name.localeCompare(b.name, 'ru');
    });
  }, [allGroups, searchQuery, selectedFaculty, selectedCourse]);

  const hasSettingsChanges =
    selectedSubgroup !== currentSubgroup || selectedForeignLang !== currentForeignLanguage;

  const handlePickGroup = (group: KsuGroup) => {
    onSelectGroup(group.id, group.name, selectedSubgroup, selectedForeignLang);
    onClose();
  };

  const handleApplyCurrentGroupSettings = () => {
    onSelectGroup(currentGroupId, currentGroupName, selectedSubgroup, selectedForeignLang);
    onClose();
  };

  const handleApplyPreset = (preset: GroupPreset) => {
    setSelectedSubgroup(preset.subgroup);
    setSelectedForeignLang(preset.foreignLang);
    onSelectGroup(preset.groupId, preset.groupName, preset.subgroup, preset.foreignLang);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Выбор группы, подгруппы и языка"
      subtitle="Расписание КГУ • Все 381 группа институтов и колледжа"
      maxWidth="xl"
    >
      <div className="space-y-5 select-none">
        {/* 1. Quick Presets Section */}
        <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Быстрые пресеты</span>
            </span>
            <span className="text-[11px] text-apple-gray-400">Переключение в 1 клик</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {GROUP_PRESETS.map((preset) => {
              const isCurrent =
                currentGroupId === preset.groupId &&
                currentSubgroup === preset.subgroup &&
                (currentForeignLanguage || 'all') === preset.foreignLang;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3.5 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between gap-2.5 active:scale-[0.98] group relative ${
                    isCurrent
                      ? 'bg-apple-blue/10 dark:bg-apple-blue/20 border-apple-blue/40 shadow-apple-sm ring-1 ring-apple-blue/30'
                      : 'bg-white/80 dark:bg-zinc-800/80 border-black/5 dark:border-white/10 hover:border-apple-blue/30 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-apple-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-apple-blue text-white shadow-apple-sm'
                            : 'bg-black/5 dark:bg-white/10 text-apple-gray-600 dark:text-apple-gray-300 group-hover:text-apple-blue group-hover:bg-apple-blue/10'
                        }`}
                      >
                        {preset.id === 'my-group' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-apple-gray-900 dark:text-white flex items-center gap-1.5">
                          <span>{preset.title}</span>
                        </div>
                        <div className="text-[10px] text-apple-gray-500 dark:text-apple-gray-400">
                          {preset.facul} • {preset.kurs} курс
                        </div>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-apple-blue text-white shadow-apple-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Активна</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-apple-gray-400 group-hover:text-apple-blue transition-colors flex items-center gap-0.5">
                        <span>Выбрать</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-apple-gray-900 dark:text-white">
                      {preset.groupName}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-apple-gray-600 dark:text-apple-gray-300">
                      <span className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-medium">
                        {preset.subgroupLabel}
                      </span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-medium">
                        {preset.langLabel}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Subgroup & Foreign Language Configuration */}
        <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-apple-blue" />
              <span>Подгруппа и язык</span>
            </span>
            {hasSettingsChanges && (
              <button
                onClick={handleApplyCurrentGroupSettings}
                className="text-xs font-bold text-apple-blue hover:underline bg-apple-blue/10 dark:bg-apple-blue/20 px-2.5 py-1 rounded-lg transition-colors"
              >
                Сохранить настройки
              </button>
            )}
          </div>

          {/* Subgroup Segmented Control */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-apple-gray-500 dark:text-apple-gray-400">
              Ваша подгруппа:
            </div>
            <div className="grid grid-cols-3 p-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] gap-1">
              {[
                { id: 0, label: 'Вся группа' },
                { id: 1, label: '1-я подгруппа' },
                { id: 2, label: '2-я подгруппа' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedSubgroup(tab.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    selectedSubgroup === tab.id
                      ? 'bg-apple-blue text-white shadow-apple-sm font-bold scale-[1.01]'
                      : 'text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Foreign Language Segmented Control */}
          <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-apple-gray-500 dark:text-apple-gray-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-apple-blue" />
                <span>Изучаемый иностранный язык:</span>
              </span>
            </div>
            <div className="grid grid-cols-4 p-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] gap-1">
              {[
                { id: 'de' as const, label: 'Немецкий' },
                { id: 'en' as const, label: 'Английский' },
                { id: 'fr' as const, label: 'Французский' },
                { id: 'all' as const, label: 'Все языки' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSelectedForeignLang(lang.id)}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all text-center truncate ${
                    selectedForeignLang === lang.id
                      ? 'bg-apple-blue text-white shadow-apple-sm font-bold scale-[1.01]'
                      : 'text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-gray-900 dark:hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-apple-gray-500 dark:text-apple-gray-400 leading-normal">
            {selectedSubgroup === 0 && 'Отображаются все пары обеих подгрупп.'}
            {selectedSubgroup === 1 && 'Отображаются общие пары и 1-я подгруппа.'}
            {selectedSubgroup === 2 && 'Отображаются общие пары и 2-я подгруппа.'}
            {selectedForeignLang !== 'all' && ` Фильтр языка: ${selectedForeignLang === 'de' ? 'Немецкий' : selectedForeignLang === 'en' ? 'Английский' : 'Французский'}.`}
          </p>
        </div>

        {/* 3. Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск группы (например: 26-ИСбо-4, ИФМЕН, 1 курс)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-sm text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white dark:focus:bg-zinc-800 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-gray-400 hover:text-apple-gray-600 dark:hover:text-white p-1 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. Filter Chips: Faculties and Courses */}
        <div className="space-y-2">
          {/* Faculty chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar text-xs">
            <button
              onClick={() => setSelectedFaculty('all')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-medium ${
                selectedFaculty === 'all'
                  ? 'bg-apple-blue text-white shadow-apple-sm font-semibold'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-apple-gray-600 dark:text-apple-gray-400 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              Все институты
            </button>
            {faculties.map((fac) => (
              <button
                key={fac}
                onClick={() => setSelectedFaculty(fac)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-medium ${
                  selectedFaculty === fac
                    ? 'bg-apple-blue text-white shadow-apple-sm font-semibold'
                    : 'bg-black/[0.04] dark:bg-white/[0.06] text-apple-gray-600 dark:text-apple-gray-400 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {fac}
              </button>
            ))}
          </div>

          {/* Course chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCourse('all')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all text-[11px] font-medium ${
                selectedCourse === 'all'
                  ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-semibold'
                  : 'bg-black/[0.03] dark:bg-white/[0.05] text-apple-gray-600 dark:text-apple-gray-400 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              Все курсы
            </button>
            {courses.map((kurs) => (
              <button
                key={kurs}
                onClick={() => setSelectedCourse(kurs)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all text-[11px] font-medium ${
                  selectedCourse === kurs
                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-semibold'
                    : 'bg-black/[0.03] dark:bg-white/[0.05] text-apple-gray-600 dark:text-apple-gray-400 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {kurs} курс
              </button>
            ))}
          </div>
        </div>

        {/* 4. Groups Count and List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-apple-gray-500 px-1">
            <span>Доступные группы ({filteredGroups.length})</span>
            {currentGroupName && (
              <span className="font-medium text-apple-blue">
                Текущая: <span className="font-bold font-mono">{currentGroupName}</span>
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 -mr-1">
            {filteredGroups.length === 0 ? (
              <div className="py-12 text-center text-apple-gray-400 dark:text-apple-gray-500 space-y-2">
                <School className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-sm font-medium">Группа не найдена</p>
                <p className="text-xs">
                  Попробуйте изменить поисковый запрос или сбросить фильтр института.
                </p>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isCurrent = group.id === currentGroupId;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handlePickGroup(group)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] border ${
                      isCurrent
                        ? 'bg-apple-blue/10 dark:bg-apple-blue/15 border-apple-blue/30 text-apple-blue shadow-apple-sm'
                        : 'bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] border-black/5 dark:border-white/5 text-apple-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-apple-blue text-white shadow-apple-sm'
                            : 'bg-black/5 dark:bg-white/10 text-apple-gray-600 dark:text-apple-gray-300'
                        }`}
                      >
                        {isCurrent ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <BookOpen className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-sm tracking-tight truncate">
                            {group.name}
                          </span>
                          {group.kurs && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-apple-gray-600 dark:text-apple-gray-400 font-medium">
                              {group.kurs} курс
                            </span>
                          )}
                          {typeof group.lessonsCount === 'number' && group.lessonsCount > 0 ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                              {group.lessonsCount} пар
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-apple-gray-400 font-medium">
                              Нет пар
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 truncate">
                          {group.facul}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isCurrent ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-apple-blue/20 text-apple-blue">
                          Выбрана
                        </span>
                      ) : (
                        <span className="text-xs text-apple-gray-400 dark:text-apple-gray-500 group-hover:text-apple-blue transition-colors">
                          Выбрать →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 5. Footer info */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-apple-gray-400 dark:text-apple-gray-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-apple-blue" />
            <span>Расписание загрузится автоматически</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  );
};
