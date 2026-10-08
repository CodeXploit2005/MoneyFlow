import { OptionPicker } from '../components/ui/OptionPicker';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupStore } from '../store/groupStore';
import { useAuthStore } from '../store/authStore';
import { transactionApi, categoryApi } from '../api/endpoints';
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import { VietQRModal } from '../components/ui/VietQRModal';
import { Button } from '../components/ui/Button';
import { formatVND, formatDate } from '../utils/format';
import { CategoryIcon } from '../components/categories/CategoryIcon';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  QrCode,
  RotateCcw,
  ArrowUpRight,
  ArrowDownLeft,
  Tag,
  Settings as SettingsIcon,
  Check,
  ChevronDown,
  X,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Transaction, Category } from '../types';

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeGroupId } = useGroupStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [type, setType] = useState<string>('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [includeDeleted, setIncludeDeleted] = useState<boolean>(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [qrTx, setQrTx] = useState<Transaction | null>(null);

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getAll({ groupId: activeGroupId || undefined });
      const cats = (res.data && res.data.length > 0) ? res.data : [
        { _id: 'cat_sales', name: 'Bán hàng & Doanh thu', type: 'income', icon: 'shopping-bag', color: '#10b981' },
        { _id: 'cat_renew', name: 'Gia hạn dịch vụ / Key', type: 'income', icon: 'refresh-cw', color: '#06b6d4' },
        { _id: 'cat_bonus', name: 'Thưởng & Hoa hồng', type: 'income', icon: 'award', color: '#f59e0b' },
        { _id: 'cat_other_in', name: 'Thu nhập phụ & Khác', type: 'income', icon: 'plus-circle', color: '#8b5cf6' },
        { _id: 'cat_cost', name: 'Giá vốn sản phẩm', type: 'expense', icon: 'package', color: '#ef4444' },
        { _id: 'cat_claim', name: 'Chi phí bảo hành / Đổi', type: 'expense', icon: 'shield-alert', color: '#f97316' },
        { _id: 'cat_vps', name: 'Server / VPS / Proxy', type: 'expense', icon: 'server', color: '#ec4899' },
        { _id: 'cat_ads', name: 'Quảng cáo & Marketing', type: 'expense', icon: 'megaphone', color: '#3b82f6' },
        { _id: 'cat_living', name: 'Ăn uống & Sinh hoạt', type: 'expense', icon: 'coffee', color: '#6b7280' },
        { _id: 'cat_other_ex', name: 'Chi phí văn phòng / Khác', type: 'expense', icon: 'more-horizontal', color: '#9ca3af' }
      ];
      setCategories(cats);
    } catch (e) {
      console.error(e);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await transactionApi.getAll({
        groupId: activeGroupId || undefined,
        type: type || undefined,
        categoryId: selectedCategoryIds.length > 0 ? selectedCategoryIds.join(',') : undefined,
        keyword: keyword || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        includeDeleted: includeDeleted ? 'true' : 'false',
        page: pagination.page,
        limit: 20
      });

      setTransactions(res.data?.transactions || []);
      setPagination(res.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [activeGroupId]);

  // Click outside to close category filter dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown]);

  useEffect(() => {
    loadTransactions();
  }, [activeGroupId, type, selectedCategoryIds, keyword, startDate, endDate, includeDeleted, pagination.page]);

  const handleDelete = async (id: string) => {
    const transaction = transactions.find(tx => tx._id === id);
    if (transaction?.saleId) {
      navigate('/sales');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn chuyển giao dịch này vào thùng rác?')) {
      try {
        await transactionApi.delete(id, { groupId: activeGroupId || undefined });
        loadTransactions();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await transactionApi.restore(id, { groupId: activeGroupId || undefined });
      loadTransactions();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Sổ Thu Chi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ghi chép và theo dõi toàn bộ dòng tiền ra vào
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={includeDeleted ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIncludeDeleted(!includeDeleted)}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            {includeDeleted ? 'Quay lại danh sách' : 'Thùng rác'}
          </Button>

          <Button variant="primary" size="sm" onClick={() => { setEditingTx(null); setShowAddModal(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Thêm giao dịch
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-center">
          {/* Search keyword */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, ghi chú..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full min-h-11 pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Type */}
          <OptionPicker label="Loại giao dịch" value={type} onChange={setType} options={[{value:'',label:'Tất cả loại (Thu & Chi)'},{value:'income',label:'Khoản thu (+)',color:'#10b981'},{value:'expense',label:'Khoản chi (-)',color:'#f43f5e'}]} />

          {/* Bộ lọc chọn nhiều danh mục (Multi-select) */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full min-h-11 flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Tag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">
                  {selectedCategoryIds.length === 0
                    ? 'Tất cả danh mục'
                    : `Danh mục (${selectedCategoryIds.length})`}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {showCategoryDropdown && (
              <div className="absolute top-full left-0 mt-1.5 z-40 w-64 p-2 rounded-2xl bg-white dark:bg-[#151D2A] border border-slate-200 dark:border-slate-700 shadow-2xl max-h-72 overflow-y-auto animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Lọc theo danh mục
                  </span>
                  {selectedCategoryIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryIds([])}
                      className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>

                <div className="space-y-1 py-1">
                  {categories.map((c) => {
                    const isChecked = selectedCategoryIds.includes(c._id);
                    return (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== c._id));
                          } else {
                            setSelectedCategoryIds([...selectedCategoryIds, c._id]);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${c.color || '#10b981'}26`,
                              color: c.color || '#10b981'
                            }}
                          >
                            <CategoryIcon name={c.icon} className="w-3 h-3" />
                          </div>
                          <span className="truncate">{c.name}</span>
                        </div>
                        {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Nút "Quản lý danh mục" mở thẳng Cài đặt */}
          <button
            type="button"
            onClick={() => navigate('/settings?tab=categories')}
            title="Mở cấu hình danh mục trong Cài đặt"
            className="min-h-11 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="whitespace-nowrap">Quản lý danh mục</span>
          </button>
        </div>

        {/* Bộ lọc ngày tháng rõ ràng, có nhãn và nút chọn nhanh */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              Lọc theo ngày:
            </span>

            {/* Nút chọn nhanh */}
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  !startDate && !endDate
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setStartDate(today);
                  setEndDate(today);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  startDate && startDate === endDate
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                  setStartDate(firstDay);
                  setEndDate(lastDay);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  startDate && !startDate.includes(endDate) && startDate.endsWith('-01')
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tháng này
              </button>
            </div>
          </div>

          {/* Ô nhập ngày có nhãn "Từ ngày" - "Đến ngày" rõ ràng */}
          <div className="flex w-full sm:w-auto min-w-0 items-center gap-2">
            <div className="flex flex-1 sm:flex-none min-w-0 items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Từ:</span>
              <input
                type="date"
                aria-label="Lọc từ ngày"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-32 min-w-0 bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              />
            </div>
            <span className="text-slate-400 font-bold">-</span>
            <div className="flex flex-1 sm:flex-none min-w-0 items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Đến:</span>
              <input
                type="date"
                aria-label="Lọc đến ngày"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-32 min-w-0 bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                title="Xóa bộ lọc ngày"
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Đang tải dữ liệu giao dịch...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-slate-400 text-sm">Chưa có giao dịch nào phù hợp với bộ lọc</div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Khoản thu / chi</th>
                    <th className="py-3 px-4">Danh mục</th>
                    <th className="py-3 px-4">Đối tác / Khách</th>
                    <th className="py-3 px-4 text-right">Số tiền</th>
                    <th className="py-3 px-4">Người ghi</th>
                    <th className="py-3 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map((tx) => {
                    const catObj = typeof tx.categoryId === 'object' ? tx.categoryId : categories.find(c => c._id === tx.categoryId);
                    const catName = catObj?.name || 'Khác';
                    const catColor = catObj?.color || '#10b981';
                    const catIcon = catObj?.icon || 'tag';
                    const ownerName = typeof tx.ownerId === 'object' ? tx.ownerId?.name : 'Tôi';
                    return (
                      <tr key={tx._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'}`}>
                              {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                            </div>
                            <div>
                              <div>{tx.title}</div>
                              {tx.saleId && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const pName = typeof tx.saleId === 'object' ? tx.saleId.productName : '';
                                    navigate(`/warranty${pName ? `?keyword=${encodeURIComponent(pName)}` : ''}`);
                                  }}
                                  className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 transition group cursor-pointer"
                                  title="Xem chi tiết đơn hàng & thời hạn bảo hành"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>Đơn bán: {typeof tx.saleId === 'object' ? tx.saleId.productName : 'Xem đơn'}</span>
                                  <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                              )}
                              {tx.note && <div className="text-xs text-slate-400 font-normal mt-0.5">{tx.note}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
                            style={{
                              backgroundColor: `${catColor}22`,
                              color: catColor
                            }}
                          >
                            <CategoryIcon name={catIcon} className="w-3.5 h-3.5" />
                            <span>{catName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                          {tx.counterparty || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold whitespace-nowrap">
                          <span className={tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {ownerName?.split(' ')[0] || 'Tôi'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                          {tx.type === 'income' && (
                            <button
                              onClick={() => setQrTx(tx)}
                              title="Tạo VietQR"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}
                          {!includeDeleted ? (
                            <>
                              <button
                                onClick={() => { setEditingTx(tx); setShowAddModal(true); }}
                                title="Sửa"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => tx.saleId ? navigate('/sales') : handleDelete(tx._id)}
                                title={tx.saleId ? 'Quản lý giao dịch này tại đơn bán' : 'Xóa vào thùng rác'}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              >
                                {tx.saleId ? <ArrowUpRight className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestore(tx._id)}
                              title="Khôi phục"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((tx) => {
                const catObj = typeof tx.categoryId === 'object' ? tx.categoryId : categories.find(c => c._id === tx.categoryId);
                const catName = catObj?.name || 'Khác';
                const catColor = catObj?.color || '#10b981';
                const catIcon = catObj?.icon || 'tag';
                const ownerName = typeof tx.ownerId === 'object' ? tx.ownerId?.name : 'Tôi';
                return (
                  <div key={tx._id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'}`}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{tx.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400">{formatDate(tx.date)}</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold"
                              style={{
                                backgroundColor: `${catColor}20`,
                                color: catColor
                              }}
                            >
                              <CategoryIcon name={catIcon} className="w-3 h-3" />
                              <span>{catName}</span>
                            </div>
                          </div>
                          {tx.saleId && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const pName = typeof tx.saleId === 'object' ? tx.saleId.productName : '';
                                navigate(`/warranty${pName ? `?keyword=${encodeURIComponent(pName)}` : ''}`);
                              }}
                              className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Đơn bán: {typeof tx.saleId === 'object' ? tx.saleId.productName : 'Xem đơn'}</span>
                              <ArrowUpRight className="w-3 h-3 opacity-60" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={`font-extrabold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                      </div>
                    </div>

                    {tx.counterparty && (
                      <div className="text-xs text-slate-500">
                        Người liên quan: <span className="font-semibold text-slate-700 dark:text-slate-300">{tx.counterparty}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-400">Bởi: {ownerName}</span>
                      <div className="flex gap-2">
                        {tx.type === 'income' && (
                          <button onClick={() => setQrTx(tx)} className="text-emerald-600 font-medium">VietQR</button>
                        )}
                        {!includeDeleted ? (
                          <>
                            <button onClick={() => { setEditingTx(tx); setShowAddModal(true); }} className="text-indigo-600 font-medium">Sửa</button>
                            <button onClick={() => tx.saleId ? navigate('/sales') : handleDelete(tx._id)} className="text-rose-600 font-medium">{tx.saleId ? 'Đơn bán' : 'Xóa'}</button>
                          </>
                        ) : (
                          <button onClick={() => handleRestore(tx._id)} className="text-emerald-600 font-medium">Khôi phục</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total} giao dịch)
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadTransactions}
        initialData={editingTx}
        defaultType="income"
      />

      {/* VietQR Modal */}
      {qrTx && (
        <VietQRModal
          isOpen={!!qrTx}
          onClose={() => setQrTx(null)}
          bankInfo={user?.bankInfo}
          amount={qrTx.amount}
          description={`MF-${qrTx.title.slice(0, 15).toUpperCase().replace(/\s+/g, '')}`}
          title="Mã VietQR Chuyển Khoản"
        />
      )}
    </div>
  );
};
