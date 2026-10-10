import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { addDays, addMonths, format, startOfMonth, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CompactDateInputProps {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
}

export function CompactDateInput({ label, ariaLabel, value, onChange }: CompactDateInputProps) {
  const display = value ? value.split('-').reverse().join('/') : 'Chọn ngày';
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const id = useId();
  const choose = (date: string) => {
    onChange(date);
    setOpen(false);
    trigger.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const rect = trigger.current!.getBoundingClientRect();
    const width = popup.current!.offsetWidth;
    const height = popup.current!.offsetHeight;
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - height - 8))
    });
    popup.current?.querySelector<HTMLButtonElement>('[data-selected="true"]')?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!popup.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
    };
    const dismiss = () => setOpen(false);
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [open]);

  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  return (
    <>
    <button type="button" ref={trigger} aria-label={`${ariaLabel}: ${display}`} aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? id : undefined}
      onClick={() => {
        if (!open) setMonth(startOfMonth(value ? new Date(`${value}T12:00:00`) : new Date()));
        setOpen(!open);
      }}
      className="relative flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/80 sm:flex-none sm:px-2.5">
      <span className="shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="min-w-0 truncate text-left text-xs tabular-nums text-slate-900 dark:text-slate-100 sm:w-32">{display}</span>
    </button>
    {open && createPortal(
      <div ref={popup} id={id} role="dialog" aria-label={ariaLabel}
        onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}
        style={{ top: position.top, left: position.left }}
        className="fixed z-[100] w-72 max-w-[calc(100vw-16px)] max-h-[calc(100dvh-16px)] overflow-auto rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" aria-label="Tháng trước" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft size={18} /></button>
          <span aria-live="polite" className="font-semibold">Tháng {format(month, 'MM/yyyy')}</span>
          <button type="button" aria-label="Tháng sau" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 text-center">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <span key={day} className="py-1 text-xs text-slate-500">{day}</span>)}
          {Array.from({ length: 42 }, (_, index) => {
            const date = addDays(first, index);
            const key = format(date, 'yyyy-MM-dd');
            const selected = key === value;
            return <button type="button" key={key} aria-label={format(date, 'dd/MM/yyyy')} aria-pressed={selected} data-selected={selected || (!value && key === format(new Date(), 'yyyy-MM-dd'))}
              onClick={() => choose(key)}
              className={`h-9 rounded-lg text-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${selected ? 'bg-emerald-500 text-white font-bold' : `hover:bg-emerald-50 dark:hover:bg-slate-800 ${date.getMonth() !== month.getMonth() ? 'text-slate-400' : ''}`}`}>
              {date.getDate()}
            </button>;
          })}
        </div>
        <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
          <button type="button" className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => choose('')}>Xóa</button>
          <button type="button" className="rounded-lg px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800" onClick={() => choose(format(new Date(), 'yyyy-MM-dd'))}>Hôm nay</button>
        </div>
      </div>, document.body
    )}
    </>
  );
}
