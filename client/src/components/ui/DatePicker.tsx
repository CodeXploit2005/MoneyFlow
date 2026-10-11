import { useState } from 'react';
import { addDays, addMonths, format, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from './Modal';

interface DatePickerProps {
  id: string;
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}

export function DatePicker({ id, label, value, min, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = format(new Date(), 'yyyy-MM-dd');
  const first = startOfWeek(month, { weekStartsOn: 1 });
  const choose = (day: string) => { onChange(day); setOpen(false); };
  const years = Array.from({ length: 201 }, (_, i) => month.getFullYear() - 100 + i);
  return <>
    <label htmlFor={id} className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{label}</label>
    <button id={id} type="button" aria-haspopup="dialog" aria-expanded={open}
      onClick={() => { setMonth(startOfMonth(new Date(`${value || today}T12:00:00`))); setOpen(true); }}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base tabular-nums text-slate-900 transition hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-600">
      <span>{value ? value.split('-').reverse().join('/') : 'Chọn ngày'}</span><CalendarDays className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
    </button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title={label} description="Chọn ngày trên lịch hoặc chuyển tháng, năm." maxWidth="max-w-sm">
      <div className="pb-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button type="button" aria-label="Tháng trước" onClick={() => setMonth(addMonths(month, -1))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-500/10"><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex min-w-0 flex-1 justify-center gap-1">
            <select aria-label="Chọn tháng" value={month.getMonth()} onChange={e => setMonth(new Date(month.getFullYear(), Number(e.target.value), 1))} className="min-h-11 min-w-0 rounded-lg bg-transparent px-1 text-sm font-semibold dark:bg-[#151D2A]">
              {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>Tháng {i + 1}</option>)}
            </select>
            <select aria-label="Chọn năm" value={month.getFullYear()} onChange={e => setMonth(new Date(Number(e.target.value), month.getMonth(), 1))} className="min-h-11 min-w-0 rounded-lg bg-transparent px-1 text-sm font-semibold dark:bg-[#151D2A]">
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          <button type="button" aria-label="Tháng sau" onClick={() => setMonth(addMonths(month, 1))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-500/10"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <span key={day} className="pb-2 text-xs font-semibold text-slate-400">{day}</span>)}
          {Array.from({ length: 42 }, (_, i) => {
            const date = addDays(first, i), key = format(date, 'yyyy-MM-dd');
            const selected = key === value, disabled = !!min && key < min;
            return <button type="button" key={key} disabled={disabled} aria-label={format(date, 'dd/MM/yyyy')} aria-pressed={selected}
              aria-current={key === today ? 'date' : undefined} onClick={() => choose(key)}
              className={`relative mx-auto flex h-11 w-full max-w-[44px] items-center justify-center rounded-xl text-sm tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-25 ${selected ? 'bg-emerald-500 font-bold text-white shadow-md shadow-emerald-500/20' : `hover:bg-emerald-50 dark:hover:bg-emerald-500/10 ${date.getMonth() !== month.getMonth() ? 'text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200'} ${key === today ? 'font-bold ring-1 ring-inset ring-emerald-500/50' : ''}`}`}>
              {date.getDate()}
            </button>;
          })}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">{value ? `Đã chọn: ${value.split('-').reverse().join('/')}` : 'Chưa chọn ngày'}</span>
          <button type="button" disabled={!!min && today < min} onClick={() => choose(today)} className="min-h-11 rounded-xl bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 disabled:opacity-30 dark:bg-emerald-500/10 dark:text-emerald-400">Hôm nay</button>
        </div>
      </div>
    </Modal>
  </>;
}

