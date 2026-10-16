import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock, BookOpen, Link as LinkIcon, CheckCircle } from 'lucide-react';
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
  subjectsList: string[];
}

export const HomeworkFormModal: React.FC<HomeworkFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultSubject,
  subjectsList,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [description, setDescription] = useState('');
  const [assignedDate, setAssignedDate] = useState(() => formatDateToIso(new Date()));
  const [dueDate, setDueDate] = useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 3);
    return formatDateToIso(next);
  });
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<Priority>('normal');
  const [status, setStatus] = useState<HomeworkStatus>('todo');
  const [materialLink, setMaterialLink] = useState('');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [errors, setErrors] = useState<{ title?: string; subject?: string }>({});

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
      setDescription(initialData.description || '');
      setAssignedDate(initialData.assignedDate);
      setDueDate(initialData.dueDate);
      setDueTime(initialData.dueTime || '23:59');
      setPriority(initialData.priority);
      setStatus(initialData.status);
      setMaterialLink(initialData.materialLink || '');
      setNotes(initialData.notes || '');
      setSubtasks(initialData.subtasks || []);
    } else {
      // New form reset
      setTitle('');
      if (defaultSubject && subjectsList.includes(defaultSubject)) {
        setSubject(defaultSubject);
        setIsCustomSubject(false);
      } else if (subjectsList.length > 0) {
        setSubject(subjectsList[0]);
        setIsCustomSubject(false);
      } else {
        setSubject('');
        setIsCustomSubject(true);
      }
      setDescription('');
      setAssignedDate(formatDateToIso(new Date()));
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setDueDate(formatDateToIso(d));
      setDueTime('23:59');
      setPriority('normal');
      setStatus('todo');
      setMaterialLink('');
      setNotes('');
      setSubtasks([]);
    }
    setErrors({});
  }, [initialData, defaultSubject, subjectsList, isOpen]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const item: Subtask = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, item]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

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
      description: description.trim() || undefined,
      assignedDate,
      dueDate,
      dueTime,
      priority,
      status,
      subtasks,
      materialLink: materialLink.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Редактировать задание' : 'Новое домашнее задание'}
      subtitle="Заполните информацию о задании, дедлайне и чек-листе"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
            Название задания *
          </label>
          <input
            type="text"
            placeholder="Например, Лабораторная работа №3 или Эссе"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border text-sm text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all ${
              errors.title
                ? 'border-rose-500'
                : 'border-black/10 dark:border-white/10'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.title}</p>
          )}
        </div>

        {/* Subject selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5 flex items-center gap-1.5">
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
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-apple-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all"
            >
              <optgroup label="Дисциплины группы 8953 (КГУ)">
                {subjectsList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
              <option value="custom">✏️ Ввести другой предмет вручную...</option>
            </select>
          </div>

          {isCustomSubject && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
                Название предмета
              </label>
              <input
                type="text"
                placeholder="Введите название предмета..."
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border text-sm text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all ${
                  errors.subject ? 'border-rose-500' : 'border-black/10 dark:border-white/10'
                }`}
              />
            </div>
          )}
        </div>

        {/* Priority & Status segmented controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
              Приоритет
            </label>
            <div className="flex p-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl border border-black/10 dark:border-white/10 text-xs font-medium">
              {[
                { id: 'low' as Priority, label: 'Низкий' },
                { id: 'normal' as Priority, label: 'Обычный' },
                { id: 'high' as Priority, label: 'Высокий' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    priority === p.id
                      ? p.id === 'high'
                        ? 'bg-rose-500 text-white font-bold shadow-apple-sm'
                        : 'bg-white dark:bg-zinc-800 text-apple-gray-900 dark:text-white font-bold shadow-apple-sm'
                      : 'text-apple-gray-600 dark:text-apple-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
              Статус выполнения
            </label>
            <div className="flex p-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl border border-black/10 dark:border-white/10 text-xs font-medium">
              {[
                { id: 'todo' as HomeworkStatus, label: 'Не начато' },
                { id: 'in_progress' as HomeworkStatus, label: 'В работе' },
                { id: 'completed' as HomeworkStatus, label: 'Сдано' },
              ].map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStatus(s.id)}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    status === s.id
                      ? s.id === 'completed'
                        ? 'bg-emerald-500 text-white font-bold shadow-apple-sm'
                        : 'bg-white dark:bg-zinc-800 text-apple-gray-900 dark:text-white font-bold shadow-apple-sm'
                      : 'text-apple-gray-600 dark:text-apple-gray-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dates: Assigned date, Due date, Due time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-apple-gray-400" />
              <span>Дата выдачи</span>
            </label>
            <input
              type="date"
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-apple-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-apple-blue" />
              <span>Срок сдачи (Дедлайн)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-apple-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/40 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-apple-gray-400" />
              <span>Время сдачи</span>
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-apple-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/40 font-mono"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
            Подробное описание задания
          </label>
          <textarea
            rows={3}
            placeholder="Требования, номер варианта, указания преподавателя..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all resize-none"
          />
        </div>

        {/* Checklist Subtasks Builder */}
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 flex items-center justify-between">
            <span>Чек-лист этапов / подзадач ({subtasks.length})</span>
          </label>

          {/* Add input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Добавить шаг, например 'Написать теорию'..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-xs text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-1 focus:ring-apple-blue"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddSubtask}
            >
              Добавить шаг
            </Button>
          </div>

          {/* Subtask list */}
          {subtasks.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5 text-xs text-apple-gray-800 dark:text-apple-gray-200"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle className="w-3.5 h-3.5 text-apple-blue shrink-0" />
                    <span className="truncate">{st.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-apple-gray-400 hover:text-apple-red p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-apple-blue" />
              <span>Ссылка на материалы / СДО</span>
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={materialLink}
              onChange={(e) => setMaterialLink(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
              Личные заметки
            </label>
            <input
              type="text"
              placeholder="Краткая заметка для себя..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-black/5 dark:border-white/5">
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
