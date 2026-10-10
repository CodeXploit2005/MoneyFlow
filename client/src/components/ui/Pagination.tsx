import { OptionPicker } from './OptionPicker';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';

interface PaginationProps {
  page: number; limit: number; total: number; totalPages: number;
  loading?: boolean; noun?: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const Pagination = ({ page, limit, total, totalPages, loading = false, noun = 'mục', onPageChange, onLimitChange }: PaginationProps) => {
  const lastPage = Math.max(1, totalPages);
  const visible = [...new Set([1, page - 1, page, page + 1, lastPage])].filter(n => n > 0 && n <= lastPage).sort((a, b) => a - b);
  const button = 'inline-flex min-h-11 min-w-11 md:min-h-9 md:min-w-9 items-center justify-center rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-35 disabled:cursor-not-allowed';
  const neutral = 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800';
  return <nav aria-label={`Phân trang ${noun}`} aria-busy={loading} className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-4 sm:px-5">
    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
      <div className="space-y-2">
        <p aria-live="polite" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          {loading && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-emerald-500" />}
          <span>{total ? <><strong className="font-semibold text-slate-800 dark:text-slate-200">{((page - 1) * limit + 1).toLocaleString('vi-VN')}–{Math.min(page * limit, total).toLocaleString('vi-VN')}</strong> / {total.toLocaleString('vi-VN')} {noun}</> : `0 ${noun}`}</span>
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Hiển thị</span>
          <div className="w-36"><OptionPicker label="Số mục mỗi trang" value={String(limit)} disabled={loading} onChange={value => onLimitChange(Number(value))} options={[20, 50, 100].map(size => ({ value: String(size), label: `${size} / trang` }))} /></div>
          <span className="sm:hidden ml-auto">Trang {page} / {lastPage}</span>
        </div>
      </div>
      <div className="flex items-center flex-wrap justify-between sm:justify-end gap-1.5">
        <button type="button" aria-label="Trang đầu" title="Trang đầu" disabled={loading || page <= 1} onClick={() => onPageChange(1)} className={`${button} ${neutral} hidden sm:inline-flex`}><ChevronsLeft className="h-4 w-4" /></button>
        <button type="button" aria-label="Trang trước" disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)} className={`${button} ${neutral}`}><ChevronLeft className="h-4 w-4" /></button>
        <div className="hidden sm:flex items-center gap-1.5">
          {visible.map((n, i) => <span key={n} className="flex items-center gap-1.5">
            {i > 0 && n - visible[i - 1] > 1 && <span className="px-1 text-slate-400" aria-hidden="true">…</span>}
            <button type="button" aria-label={`Trang ${n}`} aria-current={n === page ? 'page' : undefined} disabled={loading} onClick={() => onPageChange(n)} className={`${button} ${n === page ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' : neutral}`}>{n}</button>
          </span>)}
        </div>
        <span className="sm:hidden rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-5 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{page} / {lastPage}</span>
        <button type="button" aria-label="Trang sau" disabled={loading || page >= lastPage} onClick={() => onPageChange(page + 1)} className={`${button} ${neutral}`}><ChevronRight className="h-4 w-4" /></button>
        <button type="button" aria-label="Trang cuối" title="Trang cuối" disabled={loading || page >= lastPage} onClick={() => onPageChange(lastPage)} className={`${button} ${neutral} hidden sm:inline-flex`}><ChevronsRight className="h-4 w-4" /></button>
      </div>
    </div>
  </nav>;
};
