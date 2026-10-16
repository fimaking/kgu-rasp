import React, { useState } from 'react';
import { CalendarCustomEvent, EventType } from '../../types/calendar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatDateToIso } from '../../utils/dateUtils';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: Omit<CalendarCustomEvent, 'id' | 'createdAt'>) => void;
  initialDate?: string;
  subjectsList: string[];
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
  initialDate,
  subjectsList,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('test');
  const [date, setDate] = useState(() => initialDate || formatDateToIso(new Date()));
  const [time, setTime] = useState('10:10');
  const [subject, setSubject] = useState(subjectsList[0] || '');
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddEvent({
      title: title.trim(),
      type,
      date,
      time: time || undefined,
      subject: subject || undefined,
      room: room.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Reset
    setTitle('');
    setNotes('');
    setRoom('');
    onClose();
  };

  const eventTypeLabels: { id: EventType; label: string; color: string }[] = [
    { id: 'test', label: 'Контрольная работа', color: 'bg-rose-500 text-white' },
    { id: 'exam', label: 'Экзамен', color: 'bg-purple-600 text-white' },
    { id: 'colloquium', label: 'Коллоквиум', color: 'bg-amber-500 text-white' },
    { id: 'deadline', label: 'Сдача проекта / КП', color: 'bg-blue-600 text-white' },
    { id: 'consultation', label: 'Консультация', color: 'bg-emerald-600 text-white' },
    { id: 'other', label: 'Событие', color: 'bg-zinc-700 text-white' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Добавить контрольную / экзамен"
      subtitle="Событие появится в календаре и расписании"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
            Название события *
          </label>
          <input
            type="text"
            placeholder="Например, Контрольная точка №2 по матану"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
          />
        </div>

        {/* Type pills */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
            Тип события
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-medium">
            {eventTypeLabels.map((et) => (
              <button
                type="button"
                key={et.id}
                onClick={() => setType(et.id)}
                className={`py-2 px-2.5 rounded-xl transition-all truncate text-left ${
                  type === et.id
                    ? `${et.color} font-bold shadow-apple-sm`
                    : 'bg-black/[0.03] dark:bg-white/[0.05] text-apple-gray-700 dark:text-apple-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {et.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject & Auditorium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
              Предмет
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-apple-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
            >
              <option value="">Не привязан к предмету</option>
              {subjectsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
              Аудитория / Корпус
            </label>
            <input
              type="text"
              placeholder="Например, Б-407"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
            />
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
              Дата события
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-apple-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
              Время начала
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-apple-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/40 font-mono"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-apple-gray-600 dark:text-apple-gray-300 mb-1.5">
            Заметки к событию
          </label>
          <textarea
            rows={2}
            placeholder="Вопросы, шпаргалки, темы билетов..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-apple-gray-900 dark:text-white placeholder:text-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/40 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-black/5 dark:border-white/5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary">
            Добавить событие
          </Button>
        </div>
      </form>
    </Modal>
  );
};
