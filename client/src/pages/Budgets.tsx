import { MonthPicker } from '../components/ui/MonthPicker';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupStore } from '../store/groupStore';
import { budgetApi, categoryApi } from '../api/endpoints';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { MoneyInput } from '../components/ui/MoneyInput';
import { formatVND } from '../utils/format';
import { Sliders, Plus, AlertCircle, AlertTriangle, Trash2, Tag } from 'lucide-react';
import { Category } from '../types';
import { CategorySelect } from '../components/categories/CategorySelect';
import { CategoryIcon } from '../components/categories/CategoryIcon';

export const Budgets: React.FC = () => {
  const navigate = useNavigate();
  const { activeGroupId, myRoleInActiveGroup } = useGroupStore();
  const canManage = !activeGroupId || ['owner', 'admin'].includes(myRoleInActiveGroup || '');

  const [selectedMonth, setSelectedMonth] = useState(() => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 7));
  const [loadError, setLoadError] = useState('');
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Set Budget Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<number>(1000000);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getAll({ groupId: activeGroupId || undefined, type: 'expense' });
      const raw = Array.isArray(res) ? res : (res?.data || []);
      setCategories(raw);
    } catch (e) {
      console.error(e);
    }
  };

  const loadBudgets = async () => {
    setLoading(true); setLoadError('');
    try {
      const res = await budgetApi.getAll({ groupId: activeGroupId || undefined, month: Number(selectedMonth.split('-')[1]), year: Number(selectedMonth.split('-')[0]) });
      setBudgets(res.data || []);
    } catch (e) {
      setBudgets([]);
      setLoadError('Chưa tải được ngân sách. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadBudgets();
  }, [activeGroupId, selectedMonth]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || amount <= 0) return;

    setActionLoading(true);
    try {
      await budgetApi.setBudget({
        categoryId,
        amount,
        month: Number(selectedMonth.split('-')[1]), year: Number(selectedMonth.split('-')[0]),
        groupId: activeGroupId || null
      });
      setShowModal(false);
      loadBudgets();
    } catch (err: any) {
      alert(err.message || 'Lỗi thiết lập ngân sách');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('Bạn có muốn xóa hạn mức ngân sách này?')) {
      try {
        await budgetApi.deleteBudget(id);
        loadBudgets();
      } catch (err: any) {
        alert(err.message || 'Lỗi xóa ngân sách');
      }
    }
  };

  const totalLimit = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const exceeded = budgets.filter(budget => budget.spent > budget.amount).length;
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Quản Lý Hạn Mức Ngân Sách</span>
            <Sliders className="w-6 h-6 text-emerald-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Đặt giới hạn theo tháng, theo dõi số đã chi và cảnh báo từ 80% hạn mức
          </p>
        </div>

        {canManage && <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/settings?tab=categories')}>
            <Tag className="w-4 h-4 mr-1.5" />
            + Thêm danh mục
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Thiết lập ngân sách
          </Button>
        </div>}
      </div>

      {!canManage && <p className="text-xs text-slate-500">Bạn có thể theo dõi hạn mức chung. Chủ nhóm hoặc quản trị viên quản lý ngân sách.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"><span>Tháng theo dõi</span><MonthPicker label="Tháng ngân sách" value={selectedMonth} onChange={setSelectedMonth} /></div>
        {exceeded > 0 && <span className="text-xs font-semibold text-rose-500">{exceeded} danh mục vượt hạn mức</span>}
      </div>
      {loadError && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-950/20">{loadError} <button onClick={loadBudgets} className="min-h-11 font-semibold underline">Thử lại</button></div>}
      {!loading && !loadError && budgets.length > 0 && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[{ label: 'Hạn mức đã đặt', value: totalLimit }, { label: 'Đã chi trong các danh mục này', value: totalSpent }, { label: totalSpent > totalLimit ? 'Vượt tổng hạn mức' : 'Còn trong tổng hạn mức', value: Math.abs(totalLimit - totalSpent) }].map(item => <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-[11px] text-slate-500">{item.label}</p><p className="mt-1 break-words text-lg font-bold">{formatVND(item.value)}</p></div>)}</div>}
      <p className="text-[11px] text-slate-400">Chỉ tính các danh mục đã đặt hạn mức, không gồm giá vốn bán hàng. Hãy xem Báo cáo để biết toàn bộ chi tiêu.</p>
      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-20 text-center text-xs text-slate-400">Đang tải ngân sách...</div>
        ) : budgets.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 text-sm">
            Chưa thiết lập ngân sách nào cho tháng đã chọn. Hãy đặt hạn mức chi tiêu để kiểm soát tài chính!
          </div>
        ) : (
          budgets.map((b) => {
            const isExceeded = b.spent > b.amount;
            const isWarning = b.spent >= b.amount * 0.8 && !isExceeded;

            return (
              <div
                key={b._id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
                      style={{
                        backgroundColor: `${b.categoryId?.color || '#10b981'}26`,
                        color: b.categoryId?.color || '#10b981'
                      }}
                    >
                      <CategoryIcon name={b.categoryId?.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {b.categoryId?.name}
                      </h3>
                      <div className="text-[11px] text-slate-400">
                        Hạn mức: <strong className="text-slate-700 dark:text-slate-300">{formatVND(b.amount)}</strong>
                      </div>
                    </div>
                  </div>

                  {canManage && <button
                    aria-label="Xóa hạn mức ngân sách"
                    onClick={() => handleDeleteBudget(b._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Đã chi: {formatVND(b.spent)}</span>
                    <span className={isExceeded ? 'text-rose-600 font-bold' : (isWarning ? 'text-amber-600 font-bold' : 'text-emerald-600')}>
                      {b.percent}%
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded ? 'bg-rose-500' : (isWarning ? 'bg-amber-500' : 'bg-emerald-500')
                      }`}
                      style={{ width: `${Math.min(100, b.percent)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>{isExceeded ? `Vượt: ${formatVND(b.spent - b.amount)}` : `Còn lại: ${formatVND(b.remaining)}`}</span>
                    {isExceeded && (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Đã vượt hạn mức!
                      </span>
                    )}
                    {isWarning && (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Cảnh báo sắp chạm trần (80%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Set Budget Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Đặt hạn mức · ${selectedMonth.split('-').reverse().join('/')}`}>
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <CategorySelect
            value={categoryId}
            onChange={(newId: string) => setCategoryId(newId)}
            type="expense"
            excludeCogs={true}
            label="Danh mục chi tiêu *"
            showCount={true}
          />

          <MoneyInput
            label="Hạn mức tối đa trong tháng (VNĐ)"
            value={amount}
            onChange={setAmount}
            quickAmounts={[500000, 1000000, 2000000, 5000000]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Lưu hạn mức
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
