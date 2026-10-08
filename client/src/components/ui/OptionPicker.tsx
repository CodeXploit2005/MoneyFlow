import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Modal } from './Modal';
export interface PickerOption { value: string; label: string; color?: string }
const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d');
export const OptionPicker = ({ value, onChange, options, label, searchable = false, id }: { value: string; onChange: (value: string) => void; options: PickerOption[]; label: string; searchable?: boolean; id?: string }) => {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<React.CSSProperties>({});
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const choose = (next: string) => { onChange(next); setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open || mobile) return;
    popup.current?.querySelector<HTMLInputElement>('input')?.focus();
    const outside = (event: PointerEvent) => { if (!popup.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); trigger.current?.focus(); } };
    const resize = () => setOpen(false);
    const scroll = (event: Event) => { if (!popup.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside); window.addEventListener('keydown', escape, true); window.addEventListener('resize', resize); window.addEventListener('scroll', scroll, true);
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', escape, true); window.removeEventListener('resize', resize); window.removeEventListener('scroll', scroll, true); };
  }, [open, mobile]);
  const filtered = options.filter(option => normalize(option.label).includes(normalize(query)));
  const content = <div className="flex min-h-0 flex-col">
    {searchable && <div className="relative mb-3 shrink-0"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input aria-label={`Tìm ${label.toLowerCase()}`} value={query} onChange={event => setQuery(event.target.value)} placeholder="Nhập tên để tìm…" className="w-full h-11 rounded-xl pl-9 pr-3 text-base sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/30" /></div>}
    <div className="overflow-y-auto overscroll-contain max-h-[45dvh] sm:max-h-64 space-y-1">
      {filtered.map(option => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => choose(option.value)} className={`w-full min-h-12 flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm transition-colors ${value === option.value ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
        {option.color && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{background:option.color}} />}<span className="flex-1">{option.label}</span>{value === option.value && <Check className="w-4 h-4 shrink-0" />}
      </button>)}
      {!filtered.length && <p className="py-5 text-center text-sm text-slate-500">Không tìm thấy lựa chọn phù hợp</p>}
    </div>
  </div>;
  return <>
    <button ref={trigger} id={id} type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => {
      const rect = trigger.current!.getBoundingClientRect(); const width = Math.min(Math.max(rect.width, 260), window.innerWidth - 24);
      setMobile(window.matchMedia('(max-width: 639px)').matches); setQuery('');
      setPosition({ position:'fixed', width, left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12)), ...(window.innerHeight-rect.bottom < 330 && rect.top > 330 ? {bottom:window.innerHeight-rect.top+8} : {top:rect.bottom+8}) }); setOpen(!open);
    }} className="w-full min-h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30">
      <span className="flex-1 text-left truncate">{options.find(option=>option.value===value)?.label || 'Chọn lựa chọn'}</span><ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
    </button>
    <Modal isOpen={open && mobile} onClose={() => setOpen(false)} title={label} maxWidth="max-w-md">{content}</Modal>
    {open && !mobile && createPortal(<div ref={popup} role="dialog" aria-label={label} style={position} className="z-[210] p-2.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151D2A] text-slate-900 dark:text-slate-100">{content}</div>,document.body)}
  </>;
};
