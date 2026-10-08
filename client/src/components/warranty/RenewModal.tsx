import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MoneyInput } from '../ui/MoneyInput';
import { warrantyApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';
import { Sale } from '../../types';

interface RenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSuccess?: () => void;
}

export const RenewModal: React.FC<RenewModalProps> = ({ isOpen, onClose, sale, onSuccess }) => {
  const [days, setDays] = useState<number>(30);
  const [price, setPrice] = useState<number>(50000);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!sale) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!days || days <= 0) {
      setError('Số ngày gia hạn phải lớn hơn 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await warrantyApi.extend(sale._id, {
        additionalDays: Number(days),
        price: Number(price) || 0
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Lỗi gia hạn');
    } finally {
      setLoading(false);
    }
  };

  const custName = typeof sale.customerId === 'object' ? sale.customerId?.name : 'Khách hàng';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gia hạn bảo hành dịch vụ" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm">
          <div className="font-bold text-slate-800 dark:text-slate-200">{sale.productName}</div>
          <div className="text-xs text-slate-500 mt-1">
            Khách hàng: <span className="font-semibold text-slate-700 dark:text-slate-300">{custName}</span>
          </div>
          <div className="text-xs text-slate-500">
            Hạn hiện tại: <span className="font-semibold text-rose-600 dark:text-rose-400">{formatDate(sale.warrantyEnd)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Số ngày gia hạn thêm
          </label>
          <input
            type="number"
            min="1"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 0)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            required
          />
          <div className="mt-1.5 flex gap-1.5">
            {[15, 30, 60, 90, 180, 365].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                +{d} ngày
              </button>
            ))}
          </div>
        </div>

        <MoneyInput
          label="Phí gia hạn thu từ khách (VNĐ - Tự sinh khoản Thu)"
          value={price}
          onChange={setPrice}
          quickAmounts={[30000, 50000, 100000, 150000]}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Xác nhận gia hạn
          </Button>
        </div>
      </form>
    </Modal>
  );
};
