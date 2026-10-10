import { useEffect, useId, useState } from 'react';
import { customerApi } from '../../api/endpoints';
import { Customer } from '../../types';

export const CustomerSearch = ({ groupId, onSelect }: { groupId: string | null; onSelect: (customer: Customer) => void }) => {
  const id = useId();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => { setQuery(''); setPage(1); }, [groupId]);
  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    const timer = window.setTimeout(async () => {
      try {
        const res = await customerApi.getAll({ groupId: groupId || undefined, keyword: query.trim() || undefined, page, limit: 20 });
        if (!current) return;
        setCustomers(res.data?.customers || []); setPages(res.data?.pagination?.totalPages || 0);
      } catch (e: any) { if (current) setError(e.message || 'Không thể tìm khách hàng'); }
      finally { if (current) setLoading(false); }
    }, 300);
    return () => { current = false; window.clearTimeout(timer); };
  }, [groupId, query, page, retry]);
  return <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
    <label htmlFor={id} className="block text-xs text-slate-500">Tìm trong toàn bộ danh bạ</label>
    <input id={id} type="search" maxLength={200} value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Tên, SĐT, Zalo hoặc email…" className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" />
    <div aria-live="polite" className="max-h-48 overflow-y-auto space-y-1">
      {loading ? <p className="p-2 text-xs text-slate-500">Đang tìm khách…</p> : error ? <p role="alert" className="text-sm text-rose-600">{error} <button type="button" onClick={() => setRetry(n => n + 1)} className="underline">Thử lại</button></p> : customers.length ? customers.map(customer => <button type="button" key={customer._id} onClick={() => onSelect(customer)} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500">
        <span className="block font-semibold text-sm break-words">{customer.name}</span>
        <span className="block text-xs text-slate-500 break-all">{[customer.phone, customer.email, customer.zalo].filter(Boolean).join(' • ') || 'Chưa có thông tin liên hệ'} • {customer._id.slice(-8).toUpperCase()}</span>
      </button>) : <p className="p-2 text-xs text-slate-500">Không tìm thấy khách phù hợp.</p>}
    </div>
    {pages > 1 && <div className="flex items-center justify-between text-xs">
      <button type="button" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)} className="disabled:opacity-40 p-2">Trước</button><span>Trang {page} / {pages}</span><button type="button" disabled={loading || page >= pages} onClick={() => setPage(p => p + 1)} className="disabled:opacity-40 p-2">Sau</button>
    </div>}
  </div>;
};
