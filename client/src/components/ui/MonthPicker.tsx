import React, { useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from './Modal';

export const MonthPicker = ({ value, onChange, label = 'Chọn tháng', className = '' }: { value: string; onChange: (value: string) => void; label?: string; className?: string }) => {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(value.slice(0, 4));
  const numericYear = Number(year);
  const validYear = /^\d{4}$/.test(year) && numericYear >= 1970 && numericYear <= 9999;
  const current = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 7);
  const choose = (next: string) => { onChange(next); setOpen(false); };
  return <>
    <button type="button" aria-label={`${label}: tháng ${Number(value.slice(5))} năm ${value.slice(0, 4)}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setYear(value.slice(0, 4)); setOpen(true); }} className={`flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 shadow-sm transition-colors hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${className}`}>
      <span className="truncate">Tháng {Number(value.slice(5))}, {value.slice(0, 4)}</span><CalendarDays className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
    </button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title={label} maxWidth="max-w-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-1.5 dark:bg-slate-800/60">
          <button type="button" aria-label="Năm trước" disabled={!validYear || numericYear <= 1970} onClick={() => setYear(String(numericYear - 1))} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-white disabled:opacity-30 dark:hover:bg-slate-700"><ChevronLeft className="h-4 w-4" /></button>
          <input aria-label="Năm" inputMode="numeric" maxLength={4} value={year} onChange={event => setYear(event.target.value.replace(/\D/g, '').slice(0, 4))} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }} className="h-11 w-24 rounded-xl border border-transparent bg-transparent text-center text-base font-bold text-slate-900 outline-none focus:border-emerald-400 dark:text-white" />
          <button type="button" aria-label="Năm sau" disabled={!validYear || numericYear >= 9999} onClick={() => setYear(String(numericYear + 1))} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-white disabled:opacity-30 dark:hover:bg-slate-700"><ChevronRight className="h-4 w-4" /></button>
        </div>
        {!validYear && <p role="status" className="text-xs text-rose-500">Nhập năm từ 1970 đến 9999.</p>}
        <div className="grid grid-cols-3 gap-2">{Array.from({ length: 12 }, (_, index) => {
          const month = `${year}-${String(index + 1).padStart(2, '0')}`;
          const selected = month === value;
          return <button key={index} type="button" disabled={!validYear} aria-pressed={selected} onClick={() => choose(month)} className={`relative flex min-h-12 items-center justify-center rounded-xl border text-xs font-semibold transition-colors disabled:opacity-30 ${selected ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm' : month === current ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>Tháng {index + 1}{selected && <Check className="absolute right-1.5 top-1.5 h-3 w-3" />}</button>;
        })}</div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800"><span className="text-[11px] text-slate-400">Chọn tháng để áp dụng</span><button type="button" onClick={() => choose(current)} className="min-h-11 rounded-xl px-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Tháng này</button></div>
      </div>
    </Modal>
  </>;
};
