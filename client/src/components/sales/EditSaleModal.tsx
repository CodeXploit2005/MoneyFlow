import React, { useEffect, useState } from 'react';
import { Pencil, Save, UserRound, KeyRound, CalendarDays } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CustomerSearch } from '../customers/CustomerSearch';
import { saleApi } from '../../api/endpoints';
import { Sale, Customer } from '../../types';

const dateValue = (value: string) => new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 10);
const inputClass = 'w-full min-w-0 min-h-11 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export const EditSaleModal = ({ sale, onClose, onSuccess }: { sale: Sale | null; onClose: () => void; onSuccess: () => void }) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [soldAt, setSoldAt] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!sale) return;
    setName(sale.productName); setNotes(sale.notes || '');
    setCustomer(typeof sale.customerId === 'object' ? sale.customerId : null);
    setCustomerId(typeof sale.customerId === 'object' ? sale.customerId?._id || '' : sale.customerId || '');
    setSoldAt(dateValue(sale.soldAt)); setEnd(dateValue(sale.warrantyEnd)); setError('');
  }, [sale]);
  const close = () => { if (!loading) onClose(); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sale || loading) return;
    if (!name.trim() || !customerId || !soldAt || !end || end < soldAt) {
      setError('Vui lòng nhập tên, chọn khách hàng và ngày hết hạn từ ngày bán trở đi.'); return;
    }
    setLoading(true); setError('');
    try {
      await saleApi.update(sale._id, { productName: name.trim(), notes, customerId,
        soldAt: soldAt === dateValue(sale.soldAt) ? sale.soldAt : `${soldAt}T00:00:00+07:00`,
        warrantyEnd: end === dateValue(sale.warrantyEnd) ? sale.warrantyEnd : `${end}T00:00:00+07:00` });
      onSuccess(); onClose();
    } catch (err: any) { setError(err.message || 'Không thể lưu thay đổi. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };
  return <Modal isOpen={!!sale} onClose={close} maxWidth="max-w-2xl"
    title={<span className="flex items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Pencil className="h-4 w-4" /></span>Chỉnh sửa tài khoản</span>}
    description="Cập nhật thông tin bàn giao và thời hạn sử dụng.">
    <form onSubmit={submit} className="space-y-5">
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">{error}</div>}
      <fieldset disabled={loading} className="min-w-0 space-y-5 disabled:opacity-70">
        <div><label htmlFor="edit-sale-name" className="mb-2 block text-sm font-semibold">Sản phẩm / Dịch vụ</label>
          <input id="edit-sale-name" required maxLength={200} value={name} onChange={e => setName(e.target.value)} className={inputClass} /></div>
        <section className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 sm:p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
          <h4 className="flex items-center gap-2 text-sm font-semibold"><UserRound className="h-4 w-4 text-emerald-500" />Khách hàng</h4>
          {customer && <p className="break-words text-sm text-slate-600 dark:text-slate-300"><strong>{customer.name}</strong>{customer.phone ? ` · ${customer.phone}` : ''}</p>}
          <CustomerSearch groupId={sale?.groupId || null} onSelect={value => { setCustomer(value); setCustomerId(value._id); }} />
        </section>
        <div><label htmlFor="edit-sale-notes" className="mb-2 flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4 text-emerald-500" />Thông tin tài khoản bàn giao</label>
          <textarea id="edit-sale-notes" rows={5} maxLength={50000} spellCheck={false} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Email, mật khẩu, mã khôi phục, key hoặc hướng dẫn…" className={`${inputClass} resize-y font-mono leading-relaxed`} />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Có thể xuống dòng để tách email, mật khẩu và hướng dẫn sử dụng.</p></div>
        <section className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-emerald-500" />Thời hạn sử dụng</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label htmlFor="edit-sale-date" className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">Ngày bán</label><input id="edit-sale-date" type="date" required value={soldAt} onChange={e => setSoldAt(e.target.value)} className={inputClass} /></div>
            <div><label htmlFor="edit-sale-end" className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">Ngày hết hạn</label><input id="edit-sale-end" type="date" required min={soldAt} value={end} onChange={e => setEnd(e.target.value)} className={inputClass} /></div>
          </div>
        </section>
      </fieldset>
      <div className="form-actions flex gap-2 sm:justify-end">
        <Button type="button" variant="secondary" disabled={loading} onClick={close} className="min-h-11 flex-1 sm:flex-none">Hủy</Button>
        <Button type="submit" variant="primary" isLoading={loading} className="min-h-11 flex-1 gap-2 sm:flex-none"><Save className="h-4 w-4" />Lưu thay đổi</Button>
      </div>
    </form>
  </Modal>;
};
