import React, { useState } from 'react';
import { Check, ChevronDown, CheckCircle2, CircleDollarSign, Clock, SlidersHorizontal } from 'lucide-react';
import { Modal } from './Modal';
import { OptionPicker } from './OptionPicker';

const options = [
  { value: '', title: 'Tất cả trạng thái', detail: 'Hiển thị toàn bộ đơn bán', icon: SlidersHorizontal, color: 'text-slate-600 dark:text-slate-300', background: 'bg-slate-100 dark:bg-slate-800' },
  { value: 'paid', title: 'Đã thanh toán đủ', detail: 'Đã thu đủ 100% giá trị đơn', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', background: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { value: 'partial', title: 'Thanh toán một phần', detail: 'Đã nhận tiền cọc hoặc trả một phần', icon: CircleDollarSign, color: 'text-amber-600 dark:text-amber-400', background: 'bg-amber-50 dark:bg-amber-500/10' },
  { value: 'unpaid', title: 'Chưa thanh toán', detail: 'Chưa nhận được tiền thanh toán', icon: Clock, color: 'text-rose-600 dark:text-rose-400', background: 'bg-rose-50 dark:bg-rose-500/10' }
];

export const PaymentStatusPicker: React.FC<{ value: string; onChange: (value: string) => void; includeAll?: boolean }> = ({ value, onChange, includeAll = false }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value) || options[0];
  const Icon = selected.icon;
  return <>
    <div className="hidden sm:block w-full"><OptionPicker label={includeAll ? 'Lọc trạng thái thanh toán' : 'Chọn trạng thái thanh toán'} value={value} onChange={onChange} options={options.filter(option => includeAll || option.value).map(option => ({ value: option.value, label: option.title, color: option.value === 'paid' ? '#10b981' : option.value === 'partial' ? '#f59e0b' : option.value === 'unpaid' ? '#f43f5e' : '#94a3b8' }))} /></div>
    <button type="button" aria-label={includeAll ? 'Lọc trạng thái thanh toán' : 'Chọn trạng thái thanh toán'} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}
      className="sm:hidden w-full min-h-11 flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 transition-colors">
      <Icon className={`w-4 h-4 shrink-0 ${selected.color}`} /><span className="flex-1 text-left font-medium">{selected.title}</span><ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
    </button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title={includeAll ? 'Lọc theo thanh toán' : 'Trạng thái thanh toán'} maxWidth="max-w-md">
      <div className="space-y-2">
        {options.filter(option => includeAll || option.value).map(option => {
          const ItemIcon = option.icon;
          const active = value === option.value;
          return <button key={option.value} type="button" aria-pressed={active} onClick={() => { onChange(option.value); setOpen(false); }}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-colors ${active ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/5' : 'border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <span className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${option.background}`}><ItemIcon className={`w-5 h-5 ${option.color}`} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{option.title}</span><span className="block text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{option.detail}</span></span>
            {active && <Check className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
          </button>;
        })}
      </div>
    </Modal>
  </>;
};
