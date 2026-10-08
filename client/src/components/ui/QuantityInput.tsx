import React, { useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export const QuantityInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const commit = (next: number) => {
    if (Number.isSafeInteger(next) && next >= 1) onChange(next);
    setDraft(null);
  };
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Số lượng</label>
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-colors">
        <button type="button" aria-label="Giảm số lượng" disabled={value <= 1} onClick={() => commit(value - 1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 active:scale-95 transition"><Minus className="w-4 h-4" /></button>
        <input id={id} type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={draft ?? String(value)}
          onChange={e => { const text = e.target.value; if (!/^\d*$/.test(text)) return; setDraft(text); const next = Number(text); if (Number.isSafeInteger(next) && next >= 1) onChange(next); }}
          onBlur={() => commit(Number(draft ?? value) || 1)}
          onKeyDown={e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); commit(Math.max(1, value + (e.key === 'ArrowUp' ? 1 : -1))); } }}
          className="min-w-0 w-full bg-transparent text-center text-base font-bold tabular-nums outline-none text-slate-900 dark:text-white" />
        <button type="button" aria-label="Tăng số lượng" disabled={value >= Number.MAX_SAFE_INTEGER} onClick={() => commit(value + 1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 disabled:opacity-30 active:scale-95 transition"><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
