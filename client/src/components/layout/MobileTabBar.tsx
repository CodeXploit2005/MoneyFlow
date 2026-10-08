import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShoppingBag,
  Menu,
  Plus,
  X
} from 'lucide-react';

/**
 * MobileTabBar: Thanh điều hướng dưới đáy màn hình trên mobile (<768px)
 * Bố cục 5 cột đối xứng hoàn hảo với nút (+) xanh / (X) đỏ ở chính giữa:
 * 1. Tổng quan | 2. Thu Chi | 3. [+] THÊM NHANH | 4. Bán hàng | 5. Thêm
 */
export const MobileTabBar = ({ onOpenMore, onToggleQuickAdd, isQuickAddOpen }: { onOpenMore: () => void; onToggleQuickAdd: () => void; isQuickAddOpen: boolean }) => {
  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#243044] safe-bottom transition-colors shadow-lg shadow-black/5`}>
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {/* 1. Tổng quan */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full py-1 text-[10px] font-semibold transition-colors ${
              isActive
                ? 'text-[#059669] dark:text-[#34D399]'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-1 stroke-[2]" />
          <span className="truncate">Tổng quan</span>
        </NavLink>

        {/* 2. Thu Chi */}
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full py-1 text-[10px] font-semibold transition-colors ${
              isActive
                ? 'text-[#059669] dark:text-[#34D399]'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
            }`
          }
        >
          <ArrowLeftRight className="w-5 h-5 mb-1 stroke-[2]" />
          <span className="truncate">Thu Chi</span>
        </NavLink>

        {/* 3. Nút (+) XANH / (X) ĐỎ CHÍNH GIỮA CÂN ĐỐI - HIỆU ỨNG XOAY & BIẾN ĐỔI CAO CẤP */}
        <div className={`flex items-center justify-center -mt-6 ${isQuickAddOpen ? 'relative z-[110]' : ''}`}>
          <button
            type="button"
            onClick={onToggleQuickAdd}
            aria-expanded={isQuickAddOpen}
            aria-haspopup="dialog"
            title={isQuickAddOpen ? 'Đóng menu' : 'Thêm giao dịch nhanh'}
            aria-label={isQuickAddOpen ? 'Đóng menu' : 'Thêm giao dịch nhanh'}
            className={`group relative w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-all duration-300 ease-out cursor-pointer focus:outline-none ${
              isQuickAddOpen
                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-lg ring-4 ring-white dark:ring-[#111827] rotate-45'
                : 'bg-gradient-to-tr from-[#059669] via-emerald-500 to-[#10B981] text-white shadow-xl shadow-emerald-500/40 ring-4 ring-white dark:ring-[#111827] hover:scale-110 hover:ring-4 hover:ring-emerald-400/40 hover:shadow-2xl hover:shadow-emerald-500/60 rotate-0'
            }`}
          >
<Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Bán hàng */}
        <NavLink
          to="/sales"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full py-1 text-[10px] font-semibold transition-colors ${
              isActive
                ? 'text-[#059669] dark:text-[#34D399]'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
            }`
          }
        >
          <ShoppingBag className="w-5 h-5 mb-1 stroke-[2]" />
          <span className="truncate">Bán hàng</span>
        </NavLink>

        {/* 5. Menu xem thêm tính năng */}
        <button
          type="button"
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center h-full py-1 text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] transition-colors"
        >
          <Menu className="w-5 h-5 mb-1 stroke-[2]" />
          <span>Thêm</span>
        </button>
      </div>
    </div>
  );
};

export default MobileTabBar;
