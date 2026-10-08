import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  showClose?: boolean;
  description?: string | null;
  className?: string;
  anchorRef?: React.RefObject<HTMLElement> | null;
}


let locks = 0;
let savedOverflow = '';
let savedPadding = '';
const dialogs: string[] = [];
export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg', showClose = true, description = null, className = '', anchorRef = null }: ModalProps) => {
  const [present, setPresent] = useState(isOpen);
  const panel = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const dragStart = useRef<number | null>(null);
  const id = useId();
  close.current = onClose;
  useEffect(() => {
    if (isOpen) { setPresent(true); return; }
    const timer = setTimeout(() => setPresent(false), 180);
    return () => clearTimeout(timer);
  }, [isOpen]);
  useEffect(() => {
    if (!present) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogs.push(id);
    if (locks++ === 0) {
      savedOverflow = document.body.style.overflow;
      savedPadding = document.body.style.paddingRight;
      const width = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (width > 0) document.body.style.paddingRight = `${width}px`;
    }
    panel.current?.focus({ preventScroll: true });
    if (body.current) body.current.scrollTop = 0;
    const onKey = (event: KeyboardEvent) => {
      if (dialogs[dialogs.length - 1] !== id) return;
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key === 'Tab' && panel.current) {
        const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')).filter(node => node.getClientRects().length);
        const first = nodes[0]; const last = nodes[nodes.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      dialogs.splice(dialogs.indexOf(id), 1);
      if (--locks === 0) { document.body.style.overflow = savedOverflow; document.body.style.paddingRight = savedPadding; }
      window.removeEventListener('keydown', onKey);
      if (!dialogs.length && previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [present, id]);
  if (!present) return null;
  return createPortal(
    <div style={anchorRef?.current ? { '--notification-right': `${Math.max(16, window.innerWidth - anchorRef.current.getBoundingClientRect().right)}px` } as React.CSSProperties : undefined} className={`${anchorRef ? 'notification-root' : ''} modal-root fixed inset-0 z-[100] flex items-end sm:items-center justify-center overflow-hidden sm:p-5 ${isOpen ? '' : 'modal-closing'}`}>
      <div className="modal-backdrop absolute inset-0 bg-slate-950/50 dark:bg-black/60 backdrop-blur-[5px]" onClick={() => close.current()} aria-hidden="true" />
      <section ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
        className={`modal-panel relative z-10 w-full ${maxWidth} flex flex-col bg-white dark:bg-[#151D2A] text-slate-900 dark:text-slate-100 rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-slate-200/70 dark:border-slate-700/50 outline-none ${className}`}>
        <div className="sm:hidden flex justify-center py-3 shrink-0 touch-none" onPointerDown={e => { dragStart.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerUp={e => { if (dragStart.current !== null && e.clientY - dragStart.current > 64) close.current(); dragStart.current = null; }} onPointerCancel={() => { dragStart.current = null; }}>
          <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        <div className="flex items-start justify-between px-5 sm:px-6 pb-4 pt-1 sm:pt-5 border-b border-slate-100 dark:border-slate-800 shrink-0 gap-3">
          <div className="min-w-0"><h3 id={`${id}-title`} className="text-lg font-bold tracking-tight leading-snug">{title}</h3>
            {description && <p id={`${id}-description`} className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>}
          </div>
          {showClose && <button type="button" onClick={() => close.current()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Đóng cửa sổ"><X className="w-5 h-5" /></button>}
        </div>
        <div ref={body} className="modal-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 pt-5">{children}</div>
      </section>
    </div>, document.body
  );
};
export default Modal;
