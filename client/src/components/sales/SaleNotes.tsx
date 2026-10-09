import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Maximize2 } from 'lucide-react';
import { Modal } from '../ui/Modal';

// Recognize the common handover formats without changing the stored note.
function noteFields(notes: string) {
  const parts = notes.split(/\||\r?\n/).map(part => part.trim()).filter(Boolean);
  const fields: { label: string; value: string }[] = [];
  let hasAccount = false;
  for (const [index, part] of parts.entries()) {
    const account = part.match(/^(?:account|email|username|user|tài khoản|tai khoan|tk)\s*:\s*(.+)$/i);
    const password = part.match(/^(?:password|pass|mật khẩu|mat khau|mk)\s*:\s*(.+)$/i);
    if (account || (index === 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part))) {
      fields.push({ label: 'Tài khoản', value: account?.[1] || part });
      hasAccount = true;
    } else if (password) {
      fields.push({ label: 'Mật khẩu', value: password[1] });
    } else if (index === 1 && hasAccount && notes.includes('|')) {
      fields.push({ label: 'Mật khẩu / phần thứ hai', value: part });
    } else {
      fields.push({ label: parts.length === 1 ? 'Thông tin bàn giao' : `Thông tin bổ sung ${index + 1}`, value: part });
    }
  }
  return fields;
}

async function copyText(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch { /* Try the selection-based fallback on older mobile browsers. */ }
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const input = document.createElement('textarea');
  input.value = value;
  input.readOnly = true;
  input.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;font-size:16px;';
  document.body.appendChild(input);
  try {
    input.focus({ preventScroll: true });
    input.select();
    input.setSelectionRange(0, value.length);
    if (!document.execCommand('copy')) throw new Error('Copy unavailable');
  } finally {
    input.remove();
    previous?.focus({ preventScroll: true });
  }
}

export function SaleNotes({ notes, productName, customerName }: { notes: string; productName: string; customerName: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { setOpen(false); setCopied(null); setError(false); }, [notes, productName, customerName]);
  const copy = async (value: string, key: string) => {
    setError(false);
    try {
      await copyText(value);
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 2200);
    } catch { setError(true); }
  };
  const fields = noteFields(notes);
  return <>
    <div className="mt-2 flex w-full min-w-0 max-w-xl items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
      <button type="button" onClick={() => setOpen(true)} aria-label={`Xem đầy đủ thông tin bàn giao ${productName} của ${customerName}`}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
        <span className="min-w-0 flex-1 truncate font-mono text-xs">{notes}</span>
        <Maximize2 className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => void copy(notes, 'all')} aria-label="Sao chép toàn bộ thông tin bàn giao" title="Sao chép toàn bộ"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
        {copied === 'all' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
    <span role="status" className="sr-only">{copied ? 'Đã sao chép' : ''}</span>
    {error && !open && <p role="alert" className="mt-1 text-xs text-rose-600">Chưa sao chép được. Mở thông tin rồi chạm giữ để chọn nội dung.</p>}
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Thông tin bàn giao" description={`${productName} · ${customerName}`} maxWidth="max-w-xl">
      <div className="space-y-4 min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">Sao chép từng phần hoặc chạm giữ nội dung để chọn. Chuỗi dài được xuống dòng để đọc đầy đủ.</p>
        {fields.map((field, index) => <div key={index} className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{field.label}</span>
            <button type="button" onClick={() => void copy(field.value, String(index))} aria-label={`Sao chép ${field.label.toLowerCase()}`}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
              {copied === String(index) ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied === String(index) ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>
          <div className="select-text whitespace-pre-wrap break-all font-mono text-sm leading-6 text-slate-800 dark:text-slate-100">{field.value}</div>
        </div>)}
        <details className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <summary className="cursor-pointer py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Xem nội dung gốc đầy đủ</summary>
          <div className="mt-2 select-text whitespace-pre-wrap break-all font-mono text-sm leading-6">{notes}</div>
        </details>
        {error && <p role="alert" className="text-xs text-rose-600">Trình duyệt chưa cho phép sao chép. Bạn có thể chạm giữ nội dung để chọn và sao chép thủ công.</p>}
        <button type="button" onClick={() => void copy(notes, 'all')} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
          {copied === 'all' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied === 'all' ? 'Đã sao chép toàn bộ' : 'Sao chép toàn bộ nội dung gốc'}
        </button>
      </div>
    </Modal>
  </>;
}
