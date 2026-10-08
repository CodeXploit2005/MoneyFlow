import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShoppingBag,
  ShieldCheck,
  Users,
  UsersRound,
  PieChart,
  SlidersHorizontal,
  Wallet,
  Settings,
  Sparkles,
  Trophy
} from 'lucide-react';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useGroupStore } from '../../store/groupStore';

/**
 * Sidebar chuẩn theo thiết kế MoneyFlow
 * Cột trái cố định ~240px, hỗ trợ thu gọn tablet
 */
export const Sidebar = ({ isCollapsed = false, className = '' }) => {
  const { activeGroupId } = useGroupStore();

  const menuItems = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sổ Thu Chi', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Bán hàng', href: '/sales', icon: ShoppingBag },
    { name: 'Bảo hành & Hạn', href: '/warranty', icon: ShieldCheck },
    { name: 'Khách hàng', href: '/customers', icon: Users },
    { name: 'Nhóm cộng tác', href: '/groups', icon: UsersRound },
    ...(activeGroupId ? [{ name: 'Xếp hạng bán hàng', href: '/leaderboard', icon: Trophy }] : []),
    { name: 'Báo cáo & Phân tích', href: '/reports', icon: PieChart },
    { name: 'Hạn mức ngân sách', href: '/budgets', icon: SlidersHorizontal },
    { name: 'Sổ công nợ', href: '/debts', icon: Wallet },
    { name: 'Cài đặt tài khoản', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 border-r transition-all duration-200 ${
        isCollapsed ? 'w-16 p-2' : 'w-[240px] p-4'
      } bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#243044] ${className}`}
    >
      {/* 1. Header: Logo ô vuông xanh lục chữ M trắng + MoneyFlow FINANCE & SALES */}
      <div className={`flex items-center gap-2.5 pb-2 ${isCollapsed ? 'justify-center' : ''}`}>
        {/* Ô vuông xanh lục bo góc chứa chữ M */}
        <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
          M
        </div>

        {!isCollapsed && (
          <div className="min-w-0">
            <div className="text-base font-extrabold text-[#0F172A] dark:text-[#F1F5F9] leading-tight tracking-tight">
              MoneyFlow
            </div>
            <div className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.18em]">
              FINANCE & SALES
            </div>
          </div>
        )}
      </div>

      {/* 2. WorkspaceSwitcher Dropdown */}
      <WorkspaceSwitcher isCollapsed={isCollapsed} />

      {/* 3. Danh sách Menu điều hướng */}
      <nav className="flex-1 space-y-1 overflow-y-auto pt-1 -mx-1 px-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              title={isCollapsed ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isCollapsed ? 'justify-center px-2' : ''
                } ${
                  isActive
                    ? 'bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/40 dark:text-[#34D399] font-bold shadow-xs'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100/80 dark:hover:bg-[#151C2C] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 stroke-[2.1]" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* 4. Footer Pro Tip (Chỉ hiện khi mở rộng) */}
      {!isCollapsed && (
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-[#243044]">
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/15 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-[#059669] dark:text-[#34D399] mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mẹo Quản Lý</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[10.5px] leading-relaxed">
              Tạo đơn bán hàng sẽ tự động ghi sổ khoản Thu và Chi giá vốn tương ứng.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
