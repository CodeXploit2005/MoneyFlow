import React, { useState, useEffect } from 'react';
import { useGroupStore } from '../store/groupStore';
import { debtApi } from '../api/endpoints';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MoneyInput } from '../components/ui/MoneyInput';
import { Badge } from '../components/ui/Badge';
import { formatVND, formatDate } from '../utils/format';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Trash2, CreditCard } from 'lucide-react';
import { Debt } from '../types';

export const Debts: React.FC = () => {
  const { activeGroupId } = useGroupStore();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState({ totalReceivable: 0, totalPayable: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('');

  // Add Debt Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [type, setType] = useState<'receivable' | 'payable'>('receivable');
  const [amount, setAmount] = useState<number>(500000);
  const [counterparty, setCounterparty] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Pay Debt Modal
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  const loadDebts = async () => {
    setLoading(true);
    try {
      const res = await debtApi.getAll({
        groupId: activeGroupId || undefined,
        type: filterType || undefined
      });
      setDebts(res.data?.debts || []);
      setSummary(res.data?.summary || { totalReceivable: 0, totalPayable: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, [activeGroupId, filterType]);

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterparty.trim() || amount <= 0) return;

    setActionLoading(true);
    try {
      await debtApi.create({
        type,
        amount,
        counterparty: counterparty.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        note: note.trim(),
        groupId: activeGroupId || null
      });
      setShowAddModal(false);
      loadDebts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || payAmount <= 0) return;

    setActionLoading(true);
    try {
      await debtApi.pay(selectedDebt._id, { amount: payAmount });
      setSelectedDebt(null);
      loadDebts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa khoản nợ này?')) {
      try {
        await debtApi.delete(id);
        loadDebts();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Sổ Quản Lý Công Nợ</span>
            <Wallet className="w-6 h-6 text-emerald-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Theo dõi ai nợ bạn (Phải thu) và bạn nợ ai (Phải trả), thanh toán từng đợt
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Ghi nhận công nợ mới
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Khách Nợ Bạn (Phải thu)
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatVND(summary.totalReceivable)}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bạn Nợ Đối Tác (Phải trả)
            </span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              -{formatVND(summary.totalPayable)}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            !filterType ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Tất cả nợ
        </button>
        <button
          onClick={() => setFilterType('receivable')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filterType === 'receivable' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Ai nợ mình (Phải thu)
        </button>
        <button
          onClick={() => setFilterType('payable')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filterType === 'payable' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Mình nợ ai (Phải trả)
        </button>
      </div>

      {/* Debt List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Đang tải sổ nợ...</div>
        ) : debts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">Chưa có khoản nợ nào</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {debts.map((d) => (
              <div key={d._id} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {d.counterparty}
                    </span>
                    <Badge variant={d.type === 'receivable' ? 'success' : 'danger'}>
                      {d.type === 'receivable' ? 'Khách nợ mình' : 'Mình nợ đối tác'}
                    </Badge>
                    <Badge variant={d.status === 'paid' ? 'success' : (d.status === 'partial' ? 'warning' : 'default')}>
                      {d.status === 'paid' ? 'Đã thanh toán đủ' : (d.status === 'partial' ? 'Đã trả 1 phần' : 'Chưa trả')}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-400 mt-1 flex gap-3">
                    <span>Tổng nợ: <strong className="text-slate-700 dark:text-slate-300">{formatVND(d.amount)}</strong></span>
                    {d.dueDate && <span>Hạn trả: {formatDate(d.dueDate)}</span>}
                    {d.note && <span>Ghi chú: {d.note}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Còn lại phải trả</div>
                    <div className={`font-black text-sm ${d.type === 'receivable' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatVND(d.remainingAmount)}
                    </div>
                  </div>

                  {d.status !== 'paid' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedDebt(d);
                        setPayAmount(d.remainingAmount);
                      }}
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      Trả bớt
                    </Button>
                  )}

                  <button
                    onClick={() => handleDeleteDebt(d._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Debt Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ghi nhận khoản công nợ mới">
        <form onSubmit={handleCreateDebt} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setType('receivable')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                type === 'receivable' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Khách nợ bạn (Phải thu)
            </button>
            <button
              type="button"
              onClick={() => setType('payable')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                type === 'payable' ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Bạn nợ đối tác (Phải trả)
            </button>
          </div>

          <Input
            label="Đối tác / Người nợ *"
            placeholder="Tên khách hàng hoặc nhà cung cấp..."
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            required
          />

          <MoneyInput
            label="Số tiền nợ (VNĐ) *"
            value={amount}
            onChange={setAmount}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Hạn hoàn trả
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi chú
            </label>
            <textarea
              rows={2}
              placeholder="Chi tiết lý do nợ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Lưu công nợ
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Debt Modal */}
      {selectedDebt && (
        <Modal isOpen={!!selectedDebt} onClose={() => setSelectedDebt(null)} title="Ghi nhận trả nợ" maxWidth="max-w-md">
          <form onSubmit={handlePayDebt} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm">
              <div className="font-bold">{selectedDebt.counterparty}</div>
              <div className="text-xs text-slate-400">Còn nợ: {formatVND(selectedDebt.remainingAmount)}</div>
            </div>

            <MoneyInput
              label="Số tiền trả đợt này (VNĐ)"
              value={payAmount}
              onChange={setPayAmount}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setSelectedDebt(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={actionLoading}>
                Xác nhận thanh toán
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
