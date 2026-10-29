import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, BookOpen, AlertTriangle } from 'lucide-react';
import { Homework, Priority, HomeworkStatus, Subtask } from '../../types/homework';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatDateToIso } from '../../utils/dateUtils';

interface HomeworkFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Homework, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Homework | null;
  defaultSubject?: string;
  defaultDueDate?: string;
  defaultDueTime?: string;
  defaultLessonType?: string;
  subjectsList: string[];
  groupName?: string;
}

export const HomeworkFormModal: React.FC<HomeworkFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultSubject,
  defaultDueDate,
  defaultDueTime,
  defaultLessonType,
  subjectsList,
  groupName,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [dueDate, setDueDate] = useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 3);
    return formatDateToIso(next);
  });

  // Preserve underlying data for existing tasks
  const [assignedDate, setAssignedDate] = useState(() => formatDateToIso(new Date()));
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<Priority>('normal');
  const [status, setStatus] = useState<HomeworkStatus>('todo');
  const [lessonType, setLessonType] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [materialLink, setMaterialLink] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string | undefined>(undefined);

  const [errors, setErrors] = useState<{ title?: string; subject?: string }>({});

  const isPastDue = useMemo(() => {
    if (!dueDate) return false;
    const todayStr = formatDateToIso(new Date());
    return dueDate < todayStr;
  }, [dueDate]);

  const setQuickDeadline = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDueDate(formatDateToIso(d));
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      if (subjectsList.includes(initialData.subject)) {
        setSubject(initialData.subject);
        setIsCustomSubject(false);
      } else {
        setSubject('custom');
        setCustomSubject(initialData.subject);
        setIsCustomSubject(true);
      }
      setDueDate(initialData.dueDate);
      setAssignedDate(initialData.assignedDate || formatDateToIso(new Date()));
      setDueTime(initialData.dueTime || '23:59');
      setPriority(initialData.priority || 'normal');
      setStatus(initialData.status || 'todo');
      setLessonType(initialData.lessonType);
      setDescription(initialData.description);
      setSubtasks(initialData.subtasks || []);
      setMaterialLink(initialData.materialLink);
      setNotes(initialData.notes);
    } else {
      // New form reset
      setTitle('');
      if (defaultSubject) {
        const matched = subjectsList.find((s) => s.toLowerCase() === defaultSubject.toLowerCase());
        if (matched) {
          setSubject(matched);
          setIsCustomSubject(false);
        } else {
          setSubject('custom');
          setCustomSubject(defaultSubject);
          setIsCustomSubject(true);
        }
      } else if (subjectsList.length > 0) {
        setSubject(subjectsList[0]);
        setIsCustomSubject(false);
      } else {
        setSubject('');
        setIsCustomSubject(true);
      }

      if (defaultDueDate) {
        setDueDate(defaultDueDate);
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        setDueDate(formatDateToIso(d));
      }

      setAssignedDate(formatDateToIso(new Date()));
      setDueTime(defaultDueTime || '23:59');
      setPriority('normal');
      setStatus('todo');
      setLessonType(defaultLessonType);
      setDescription(undefined);
      setSubtasks([]);
      setMaterialLink(undefined);
      setNotes(undefined);
    }
    setErrors({});
  }, [initialData, defaultSubject, defaultDueDate, defaultDueTime, defaultLessonType, subjectsList, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = isCustomSubject ? customSubject.trim() : subject;
    const newErrors: { title?: string; subject?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Пожалуйста, укажите название задания';
    }
    if (!finalSubject) {
      newErrors.subject = 'Пожалуйста, выберите или укажите предмет';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      title: title.trim(),
      subject: finalSubject,
      lessonType,
      description,
      assignedDate,
      dueDate,
      dueTime,
      priority,
      status,
      subtasks,
      materialLink,
      notes,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Редактировать задание' : 'Новое домашнее задание'}
      subtitle="Укажите название задания, предмет и срок сдачи"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 select-none">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300">
            Название задания *
          </label>
          <input
            type="text"
            placeholder="Например, Лаба №3 или конспект"
            value={title}
            maxLength={200}
            autoFocus
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            className={`w-full px-4 py-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border text-sm text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all ${
              errors.title
                ? 'border-rose-500'
                : 'border-black/10 dark:border-white/10'
            }`}
          />
          {errors.title && (
            <p className="text-xs text-rose-500 font-medium">{errors.title}</p>
          )}
        </div>

        {/* Subject selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-apple-blue" />
            <span>Дисциплина (Предмет) *</span>
          </label>
          <select
            value={isCustomSubject ? 'custom' : subject}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setIsCustomSubject(true);
              } else {
                setIsCustomSubject(false);
                setSubject(e.target.value);
              }
              if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
            }}
            className="w-full px-4 py-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-apple-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all"
          >
            <optgroup label={`Дисциплины группы ${groupName || 'КГУ'}`}>
              {subjectsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </optgroup>
            <option value="custom">✏️ Ввести другой предмет вручную...</option>
          </select>

          {isCustomSubject && (
            <div className="pt-2">
              <input
                type="text"
                placeholder="Введите название предмета..."
                value={customSubject}
                maxLength={100}
                onChange={(e) => {
                  setCustomSubject(e.target.value);
                  if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
                }}
                className={`w-full px-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border text-sm text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all ${
                  errors.subject ? 'border-rose-500' : 'border-black/10 dark:border-white/10'
                }`}
              />
            </div>
          )}
          {errors.subject && (
            <p className="text-xs text-rose-500 font-medium">{errors.subject}</p>
          )}
        </div>

        {/* Due Date (Deadline) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-apple-blue" />
            <span>Срок сдачи (Дедлайн) *</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm font-semibold text-apple-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all"
          />

          {/* Quick deadline shortcuts */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs text-apple-gray-400 font-medium">Быстро:</span>
            <button
              type="button"
              onClick={() => setQuickDeadline(1)}
              className="text-xs px-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-apple-blue/15 hover:text-apple-blue dark:hover:text-blue-300 transition-colors font-medium text-apple-gray-700 dark:text-zinc-300 active:scale-95"
            >
              Завтра
            </button>
            <button
              type="button"
              onClick={() => setQuickDeadline(3)}
              className="text-xs px-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-apple-blue/15 hover:text-apple-blue dark:hover:text-blue-300 transition-colors font-medium text-apple-gray-700 dark:text-zinc-300 active:scale-95"
            >
              +3 дня
            </button>
            <button
              type="button"
              onClick={() => setQuickDeadline(7)}
              className="text-xs px-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-apple-blue/15 hover:text-apple-blue dark:hover:text-blue-300 transition-colors font-medium text-apple-gray-700 dark:text-zinc-300 active:scale-95"
            >
              +1 неделя
            </button>
          </div>

          {isPastDue && (
            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Выбранная дата в прошлом — задание станет просроченным</span>
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/5 dark:border-white/5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary">
            {initialData ? 'Сохранить изменения' : 'Создать задание'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
