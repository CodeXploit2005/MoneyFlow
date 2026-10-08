import { BankLogo } from './BankLogo';
import React, { useId, useMemo, useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, CreditCard, Search, X } from 'lucide-react';
import { VIET_BANKS } from '../../utils/vietqr';
import { Modal } from './Modal';

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
const popular = new Set(['MB', 'VCB', 'TCB', 'ICB', 'BIDV', 'VBA', 'ACB', 'VPB']);

export const BankPicker: React.FC<{ value: string; onChange: (code: string) => void; label?: string }> = ({ value, onChange, label = 'Ngân hàng nhận tiền' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [opensUp, setOpensUp] = useState(false);
  const id = useId();
  const dropdown = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (dropdown.current && !dropdown.current.contains(event.target as Node)) dropdown.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && dropdown.current?.open) { dropdown.current.open = false; dropdown.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, []);
  const selected = VIET_BANKS.find(bank => bank.code === value);
  const matches = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return VIET_BANKS.filter(bank => terms.every(term => normalize(`${bank.name} ${bank.code} ${bank.bin}`).includes(term)));
  }, [query]);
  const choose = (code: string) => { onChange(code); setOpen(false); if (dropdown.current) { dropdown.current.open = false; dropdown.current.querySelector('summary')?.focus(); } };
  const row = (bank: typeof VIET_BANKS[number]) => (
    <button key={bank.code} type="button" onClick={() => choose(bank.code)} aria-pressed={value === bank.code}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors min-h-16 ${value === bank.code ? 'bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
      <BankLogo key={bank.code} bank={bank} />
      <span className="min-w-0 flex-1"><span className="block font-semibold text-sm">{bank.name.split(' - ')[0]}</span><span className="block text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{bank.name.split(' - ').slice(1).join(' - ')}</span></span>
      {value === bank.code && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
    </button>
  );
  const searchField = <div className="shrink-0 pb-3">
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label="Tìm ngân hàng" placeholder="Tên hoặc mã ngân hàng"
        className="w-full h-12 pl-11 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 [&::-webkit-search-cancel-button]:appearance-none" />
      {query && <button type="button" onClick={() => setQuery('')} aria-label="Xóa tìm kiếm" className="absolute right-1 top-1 h-10 w-10 flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>}
    </div>
  </div>;
  return <>
    <details ref={dropdown} onToggle={event => { if (event.currentTarget.open) { setQuery(''); const rect = event.currentTarget.getBoundingClientRect(); setOpensUp(window.innerHeight - rect.bottom < 360 && rect.top > 360); } }} className="hidden sm:block relative w-full">
      <summary aria-label={label} className="list-none [&::-webkit-details-marker]:hidden cursor-pointer min-h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">
        <BankLogo key={value} bank={selected} small /><span className="min-w-0 flex-1 truncate">{selected?.name.split(' - ')[0] || 'Chọn ngân hàng'}</span><ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </summary>
      <div className={`absolute ${opensUp ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-50 w-full min-w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151D2A] text-slate-900 dark:text-slate-100 shadow-xl p-3`}>
        {searchField}
        <div className="max-h-64 overflow-y-auto overscroll-contain space-y-1">{matches.map(row)}{!matches.length && <p role="status" className="py-5 text-sm text-center text-slate-500">Không tìm thấy ngân hàng</p>}</div>
      </div>
    </details>
    <button id={id} type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setQuery(''); setOpen(true); }}
      className="sm:hidden w-full min-h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-colors">
      <BankLogo key={value} bank={selected} small />
      <span className="min-w-0 flex-1 text-left truncate">{selected?.name.split(' - ')[0] || 'Chọn ngân hàng'}</span><ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
    </button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Chọn ngân hàng" maxWidth="max-w-md" className="bank-picker-sheet" description="Tìm theo tên hoặc mã ngân hàng">
      {searchField}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-1 pb-4">
        {query.trim() ? <><p role="status" className="text-xs text-slate-500 px-1 pb-2">{matches.length} ngân hàng phù hợp</p>{matches.map(row)}{!matches.length && <p className="text-center text-sm text-slate-500 py-8">Không tìm thấy ngân hàng. Thử tên viết tắt hoặc từ khóa khác.</p>}</> : <>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 py-2">Phổ biến</p>
          <div className="grid grid-cols-2 gap-2 pb-3">{VIET_BANKS.filter(bank => popular.has(bank.code)).map(bank => <button key={bank.code} type="button" onClick={() => choose(bank.code)} aria-pressed={value === bank.code} className={`min-h-11 px-3 py-2.5 rounded-xl text-sm font-semibold text-left flex items-center justify-between gap-1 border ${value === bank.code ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><BankLogo bank={bank} small /><span className="min-w-0 flex-1 text-xs leading-tight break-words">{bank.name.split(' - ')[0]}</span>{value === bank.code && <Check className="w-4 h-4 shrink-0" />}</button>)}</div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 py-2">Tất cả ngân hàng ({VIET_BANKS.length})</p>{VIET_BANKS.map(row)}
        </>}
      </div>
    </Modal>
  </>;
};
