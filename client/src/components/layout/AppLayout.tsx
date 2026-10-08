import { useQueryClient } from '@tanstack/react-query';
import { groupApi } from '../../api/endpoints';
import { useSocket } from '../../hooks/useSocket';
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileTabBar } from './MobileTabBar';
import { Modal } from '../ui/Modal';
import { TransactionFormModal } from '../transactions/TransactionFormModal';
import { SaleFormModal } from '../sales/SaleFormModal';
import {
  Users,
  Trophy,
  PieChart,
  SlidersHorizontal,
  Wallet,
  Settings as SettingsIcon,
  ShieldCheck,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Plus,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { useGroupStore } from '../../store/groupStore';

/**
 * AppLayout: Khung ứng dụng chính
 * Bố cục 2 cột desktop: Sidebar cố định bên trái (~240px) + Topbar & Main content bên phải
 * Nền ngoài: #F4F6F8 (light) / #0B1220 (dark)
 */
export const AppLayout = () => {
  const navigate = useNavigate();
  const { activeGroupId, activeGroupName } = useGroupStore();
  const location = useLocation();
  const viewedGroupId = location.pathname.match(/^\/groups\/([^/]+)$/)?.[1];
  const socket = useSocket(viewedGroupId || activeGroupId);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      window.dispatchEvent(new Event('moneyflow:data-changed'));
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    const refreshGroups = async () => {
      try { useGroupStore.getState().setGroups((await groupApi.getMyGroups()).data || []); setRefreshVersion(value => value + 1); refresh(); }
      catch { /* API access is checked again on every request. */ }
    };
    const events = ['sale:created', 'sale:updated', 'transaction:created', 'transaction:updated', 'transaction:deleted'];
    events.forEach(event => socket.on(event, refresh));
    socket.on('groups:changed', refreshGroups);
    socket.on('notification:created', refresh);
    return () => { events.forEach(event => socket.off(event, refresh)); socket.off('groups:changed', refreshGroups); socket.off('notification:created', refresh); };
  }, [socket, queryClient]);

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  useEffect(() => { if (!successMessage) return; const timer = setTimeout(() => setSuccessMessage(''), 3500); return () => clearTimeout(timer); }, [successMessage]);
  const saved = (message: string) => { setRefreshVersion(v => v + 1); setSuccessMessage(message); };
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [showQuickActionChoice, setShowQuickActionChoice] = useState(false);

  useEffect(() => {
    setShowTransactionModal(false); setShowSaleModal(false); setShowQuickActionChoice(false);
  }, [activeGroupId]);

  const handleOpenIncome = () => {
    setTransactionType('income');
    setShowTransactionModal(true);
    setShowQuickActionChoice(false);
  };

  const handleOpenExpense = () => {
    setTransactionType('expense');
    setShowTransactionModal(true);
    setShowQuickActionChoice(false);
  };

  const handleOpenSale = () => {
    setShowSaleModal(true);
    setShowQuickActionChoice(false);
  };

  const mobileExtraNav = [
    { name: 'Bảo hành', href: '/warranty', icon: ShieldCheck },
    { name: 'Khách hàng', href: '/customers', icon: Users },
    { name: 'Nhóm cộng tác', href: '/groups', icon: Users },
    ...(activeGroupId ? [{ name: 'Xếp hạng bán hàng', href: '/leaderboard', icon: Trophy }] : []),
    { name: 'Hạn mức ngân sách', href: '/budgets', icon: SlidersHorizontal },
    { name: 'Sổ công nợ', href: '/debts', icon: Wallet },
    { name: 'Báo cáo & Phân tích', href: '/reports', icon: PieChart },
    { name: 'Cài đặt tài khoản', href: '/settings', icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#0B1220] flex transition-colors duration-200">
      {/* 1. Sidebar bên trái (~240px) */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      {/* 2. Vùng nội dung bên phải (Topbar + Main Content) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Vùng cuộn chính */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 mobile-content-spacing md:pb-8">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
            <span className="min-w-0 truncate text-xs font-semibold text-slate-600 dark:text-slate-300">{activeGroupId ? `Ví nhóm · ${activeGroupName}` : 'Ví cá nhân · Dữ liệu riêng của bạn'}</span>
            {activeGroupId && <button onClick={() => navigate('/groups')} className="shrink-0 min-h-8 text-[11px] font-semibold text-emerald-600">Quản lý nhóm</button>}
          </div>
          <div key={`${activeGroupId || 'personal'}:${refreshVersion}`} className="page-enter"><Outlet /></div>
        </main>
      </div>

      {/* 3. Thanh điều hướng di động với nút (+) xoay ở chính giữa */}
      <MobileTabBar
        onOpenMore={() => { setShowQuickActionChoice(false); setShowMobileMore(true); }}
        onToggleQuickAdd={() => { setShowMobileMore(false); setShowQuickActionChoice((prev) => !prev); }}
        isQuickAddOpen={showQuickActionChoice}
      />

      {/* 4. Nút "+" nổi trên Desktop (ẩn trên Mobile vì đã nằm ngay chính giữa TabBar) */}
      <div className="hidden md:block fixed bottom-8 right-8 z-40">
        <button
          type="button"
          onClick={() => setShowQuickActionChoice((prev) => !prev)}
          title={showQuickActionChoice ? 'Đóng menu' : 'Thêm giao dịch nhanh'}
          aria-label={showQuickActionChoice ? 'Đóng menu' : 'Thêm giao dịch nhanh'}
          className={`group w-14 h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-all duration-300 ease-out cursor-pointer focus:outline-none ${
            showQuickActionChoice
              ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-lg rotate-45'
              : 'bg-gradient-to-tr from-[#059669] via-emerald-500 to-[#10B981] hover:brightness-110 text-white shadow-xl shadow-emerald-500/35 hover:scale-110 hover:ring-4 hover:ring-emerald-400/40 hover:shadow-2xl hover:shadow-emerald-500/60 rotate-0'
          }`}
        >
<Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      <Modal
        isOpen={showQuickActionChoice}
        onClose={() => setShowQuickActionChoice(false)}
        title="Bạn muốn thêm gì?"
        description="Ghi nhanh, quản lý gọn."
        maxWidth="max-w-md"
        className="quick-action-sheet"
      >
        <div className="space-y-3">
          <button type="button" onClick={handleOpenSale} className="quick-sale group w-full flex items-center gap-4 p-4 rounded-[22px] text-left border border-emerald-200/70 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5">
            <span className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20"><ShoppingBag className="w-6 h-6" /></span>
            <span className="flex-1 min-w-0"><span className="block text-[10px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 mb-1">Bán hàng</span><span className="block text-base font-bold text-slate-900 dark:text-white">Tạo đơn bán mới</span><span className="block text-xs leading-relaxed text-slate-500 dark:text-slate-400 mt-1">Tính lãi, thu tiền & theo dõi bảo hành</span></span>
            <ChevronRight className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={handleOpenIncome} className="quick-secondary text-left p-4 rounded-[22px] border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-800/40">
              <span className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3"><ArrowUpRight className="w-5 h-5" /></span>
              <span className="block text-sm font-bold">Thêm khoản thu</span><span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">Tiền vào ví</span>
            </button>
            <button type="button" onClick={handleOpenExpense} className="quick-secondary text-left p-4 rounded-[22px] border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-800/40">
              <span className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3"><ArrowDownLeft className="w-5 h-5" /></span>
              <span className="block text-sm font-bold">Thêm khoản chi</span><span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">Tiền ra khỏi ví</span>
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-400 pt-1">Đơn bán tự đồng bộ vào sổ thu chi</p>
        </div>
      </Modal>

      {/* Modal menu mở rộng trên Mobile - Nổi phía trên MobileTabBar */}
      <Modal
        isOpen={showMobileMore}
        onClose={() => setShowMobileMore(false)}
        title="Tính năng mở rộng"
        maxWidth="max-w-sm"
        className="quick-action-sheet"
      >
        <div className="grid grid-cols-2 gap-2.5 py-2">
          {mobileExtraNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setShowMobileMore(false);
                  navigate(item.href);
                }}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-xs mb-2 text-[#10B981]">
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-xs font-semibold text-center">{item.name}</span>
              </button>
            );
          })}
        </div>
      </Modal>

      {successMessage && <div role="status" className="success-toast fixed z-[130] left-1/2 -translate-x-1/2 top-5 max-w-[calc(100%-32px)] flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-emerald-950 text-white px-4 py-3 shadow-xl text-sm"><CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />{successMessage}</div>}
      {/* Modal Ghi Thu / Chi */}
      <TransactionFormModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        defaultType={transactionType}
        onOpenSaleModal={() => { setShowTransactionModal(false); setShowSaleModal(true); }}
        onSuccess={() => saved('Đã lưu giao dịch')}
      />

      {/* Modal Tạo đơn bán */}
      <SaleFormModal
        onSuccess={() => saved('Đã tạo đơn bán và đồng bộ sổ thu chi')}
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
      />
    </div>
  );
};

export default AppLayout;
