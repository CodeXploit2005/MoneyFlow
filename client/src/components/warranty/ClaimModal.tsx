import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MoneyInput } from '../ui/MoneyInput';
import { warrantyApi } from '../../api/endpoints';
import { Sale } from '../../types';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSuccess?: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ isOpen, onClose, sale, onSuccess }) => {
  const [issue, setIssue] = useState<string>('');
  const [resolution, setResolution] = useState<string>('');
  const [cost, setCost] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!sale) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) {
      setError('Vui lòng mô tả lỗi/vấn đề cần bảo hành');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await warrantyApi.claim(sale._id, {
        issue: issue.trim(),
        resolution: resolution.trim(),
        cost: Number(cost) || 0
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Lỗi ghi nhận bảo hành');
    } finally {
      setLoading(false);
    }
  };

  const custName = typeof sale.customerId === 'object' ? sale.customerId?.name : 'Khách hàng';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ghi nhận xử lý bảo hành / Đổi tài khoản" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm">
          <div className="font-bold text-slate-800 dark:text-slate-200">{sale.productName}</div>
          <div className="text-xs text-slate-500 mt-1">
            Khách: <span className="font-semibold text-slate-700 dark:text-slate-300">{custName}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Lỗi / Vấn đề phát sinh *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Tài khoản bị mất Plus, lỗi pass, bị kick khỏi family..."
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Biện pháp xử lý / Tài khoản mới bàn giao
          </label>
          <textarea
            rows={2}
            placeholder="Ví dụ: Đã đổi tài khoản mới: acc_new@gmail.com / pass..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <MoneyInput
          label="Chi phí bảo hành phát sinh (VNĐ - Tự sinh khoản Chi)"
          value={cost}
          onChange={setCost}
          quickAmounts={[0, 10000, 20000, 50000]}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="danger" isLoading={loading}>
            Lưu lịch sử bảo hành
          </Button>
        </div>
      </form>
    </Modal>
  );
};
