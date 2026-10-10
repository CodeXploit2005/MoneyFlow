import { CustomerSearch } from '../customers/CustomerSearch';
import { OptionPicker } from '../ui/OptionPicker';
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MoneyInput } from '../ui/MoneyInput';
import { transactionApi, categoryApi } from '../../api/endpoints';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { Image as ImageIcon, Upload, Trash2, Tag, ShieldCheck, UserCheck } from 'lucide-react';
import { Category, Transaction } from '../../types';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: 'income' | 'expense';
  initialData?: Transaction | null;
  onOpenSaleModal?: () => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'income',
  initialData = null,
  onOpenSaleModal
}) => {
  const { user } = useAuthStore();
  const { activeGroupId } = useGroupStore();

  const [type, setType] = useState<'income' | 'expense'>(defaultType === 'expense' ? 'expense' : 'income');
  const [amount, setAmount] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState<string>(new Date(Date.now() + 7 * 3600000).toISOString().split('T')[0]);
  const [method, setMethod] = useState<string>('transfer');
  const [counterparty, setCounterparty] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Khách hàng có sẵn (để gợi ý nhanh)
  const [showCustPicker, setShowCustPicker] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getAll({ groupId: activeGroupId || undefined });
      setCategories(Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setCategories([]);
      setError('Không tải được danh mục. Đóng form và thử lại khi có kết nối.');
    }
  };
  useEffect(() => {
    if (!categories.some(c => c._id === categoryId && c.type === type)) setCategoryId(categories.find(c => c.type === type)?._id || '');
  }, [categories, type, categoryId]);

  useEffect(() => {
    const safeType: 'income' | 'expense' = (defaultType === 'expense' ? 'expense' : 'income');
    if (isOpen) {
      if (initialData) {
        const initialType: 'income' | 'expense' = initialData.type === 'expense' ? 'expense' : 'income';
        setType(initialType);
        setAmount(initialData.amount || 0);
        setTitle(initialData.title || '');
        const catId = typeof initialData.categoryId === 'object' ? initialData.categoryId?._id : initialData.categoryId;
        setCategoryId(catId || '');
        setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date(Date.now() + 7 * 3600000).toISOString().split('T')[0]);
        setMethod(initialData.method || 'transfer');
        setCounterparty(initialData.counterparty || '');
        setNote(initialData.note || '');
        setReceiptUrl(initialData.receiptUrl || '');
      } else {
        setType(safeType);
        setAmount(0);
        setTitle('');
        setDate(new Date(Date.now() + 7 * 3600000).toISOString().split('T')[0]);
        setMethod('transfer');
        setCounterparty('');
        setNote('');
        setReceiptUrl('');
        setShowCustPicker(false);

        const available = categories;
        const matched = available.find(c => (c.type || 'income').toLowerCase() === safeType);
        setCategoryId(matched?._id || '');
      }
      loadCategories();
    }
  }, [isOpen, defaultType, initialData, activeGroupId]);

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    const available = categories;
    const matched = available.find(c => (c.type || 'income').toLowerCase() === newType);
    if (matched) {
      setCategoryId(matched._id);
    } else if (available.length > 0) {
      setCategoryId(available[0]._id);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh tối đa 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setReceiptUrl(event.target.result as string);
        setError('');
      }
    };
    reader.onerror = () => {
      setError('Không thể đọc file ảnh, vui lòng thử lại');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên khoản thu/chi');
      return;
    }
    if (amount <= 0) {
      setError('Số tiền phải lớn hơn 0 đ');
      return;
    }

    const finalCategoryId = categoryId;
    if (!(initialData?.saleId || initialData?.debtId) && !categories.some(c => c._id === categoryId && c.type === type)) {
      setError('Vui lòng chọn danh mục phù hợp cho khoản thu / chi'); return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: Partial<Transaction> = {
        type,
        amount: Number(amount),
        title: title.trim(),
        categoryId: finalCategoryId,
        date: new Date(date).toISOString(),
        method: method as any,
        counterparty: counterparty.trim(),
        note: note.trim(),
        receiptUrl: receiptUrl || '',
        groupId: activeGroupId || null,
        saleId: initialData?.saleId?._id || initialData?.saleId || null
      };

      if (initialData?._id) {
        await transactionApi.update(initialData._id, (initialData.saleId || initialData.debtId) ? { amount: payload.amount, title: payload.title, method: payload.method, counterparty: payload.counterparty, note: payload.note, receiptUrl: payload.receiptUrl } : payload);
      } else {
        await transactionApi.create(payload);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu giao dịch');
    } finally {
      setLoading(false);
    }
  };

  // Tính toán danh mục khả dụng và lọc theo type hiện tại
  const activeType: 'income' | 'expense' = (type === 'expense' ? 'expense' : 'income');
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Chỉnh sửa giao dịch' : (activeType === 'income' ? 'Ghi nhận khoản THU (+)' : 'Ghi nhận khoản CHI (-)')}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {Boolean(error) && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Toggle Thu / Chi */}
        {!initialData && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-sm font-bold rounded-lg transition ${
                activeType === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              + Khoản THU (Tiền vào)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-sm font-bold rounded-lg transition ${
                activeType === 'expense'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              - Khoản CHI (Tiền ra)
            </button>
          </div>
        )}

        {/* Số tiền */}
        <fieldset disabled={Boolean(initialData?.saleId || initialData?.debtId)} className="space-y-4 disabled:opacity-70">
        <div>
          <label htmlFor="transaction-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Danh mục</label>
          <OptionPicker id="transaction-category" label="Chọn danh mục" value={categoryId} onChange={setCategoryId} searchable options={categories.filter(c => c.type === activeType).map(c => ({value:c._id,label:c.name,color:c.color}))} />
        </div>
        </fieldset>
        <MoneyInput
          value={amount}
          onChange={setAmount}
          label={activeType === 'income' ? 'Số tiền nhận được (VNĐ)' : 'Số tiền đã chi (VNĐ)'}
        />

        {/* Tên khoản */}
        <Input
          label="Tên khoản thu / chi"
          placeholder={activeType === 'income' ? 'Ví dụ: Bán tài khoản Gemini AI' : 'Ví dụ: Chi phí mua Server VPS'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />


        {/* Ngày & Phương thức */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày ghi nhận
            </label>
            <input
              type="date"
              disabled={Boolean(initialData?.saleId || initialData?.debtId)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Hình thức thanh toán
            </label>
            <OptionPicker label="Hình thức thanh toán" value={method} onChange={setMethod} options={[{value:'transfer',label:'Chuyển khoản ngân hàng'},{value:'cash',label:'Tiền mặt'},{value:'ewallet',label:'Ví điện tử (Momo / ZaloPay)'}]} />
          </div>
        </div>

        {/* Đối tác / Người liên quan */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {activeType === 'income' ? 'Khách hàng / Người thanh toán (tùy chọn)' : 'Người nhận tiền / Nhà cung cấp (tùy chọn)'}
            </label>
            {(
              <button
                type="button"
                onClick={() => setShowCustPicker(!showCustPicker)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {showCustPicker ? 'Đóng danh sách khách' : 'Chọn khách có sẵn'}
              </button>
            )}
          </div>

          {showCustPicker && <CustomerSearch groupId={activeGroupId} onSelect={customer => {
            setCounterparty(customer.phone ? `${customer.name} (${customer.phone})` : customer.name);
            setShowCustPicker(false);
          }} />}

          <Input
            placeholder="Tên khách hàng, SĐT hoặc đối tác..."
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
          />
        </div>

        {initialData?.saleId && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Khoản tiền này đồng bộ từ đơn bán: <strong>{typeof initialData.saleId === 'object' ? initialData.saleId.productName : 'Đơn bán'}</strong></span>
          </div>
        )}

        {initialData?.debtId && <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">Sửa số tiền sẽ đồng bộ cả công nợ và sổ thu chi, giữ ngày thanh toán và lưu lịch sử thay đổi.</p>}

        {/* Đính kèm tệp ảnh / Hoá đơn */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              Tệp ảnh chứng từ / Biên lai (tùy chọn)
            </span>
            {receiptUrl && (
              <button
                type="button"
                onClick={() => setReceiptUrl('')}
                className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa ảnh
              </button>
            )}
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
          />

          {receiptUrl ? (
            <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2.5 flex items-center gap-3">
              <img
                src={receiptUrl}
                alt="Biên lai chứng từ"
                className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  Ảnh chứng từ đã đính kèm
                </p>
                <p className="text-[11px] text-slate-400">
                  Nhấp "Đổi ảnh" nếu bạn muốn chọn ảnh khác
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100"
              >
                Đổi ảnh
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/70 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer text-xs font-medium"
            >
              <Upload className="w-4 h-4" />
              <span>Nhấn để chọn tệp ảnh hoá đơn / biên lai (PNG, JPG, tối đa 5MB)</span>
            </button>
          )}
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Ghi chú thêm
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Chi tiết giao dịch..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="form-actions flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant={activeType === 'income' ? 'primary' : 'danger'}
            isLoading={loading}
          >
            {initialData ? 'Cập nhật' : (activeType === 'income' ? 'Ghi nhận Thu' : 'Ghi nhận Chi')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
