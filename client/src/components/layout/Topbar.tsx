import { MobileWorkspaceSwitcher } from './MobileWorkspaceSwitcher';
import { NotificationBell } from './NotificationBell';
import { Avatar } from '../ui/Avatar';
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Bell, ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';

/**
 * Topbar theo chuẩn thiết kế MoneyFlow
 * Trái: Breadcrumb "Ví cá nhân / [Tên Trang]"
 * Phải: ThemeToggle pill + Chuông thông báo + User Profile
 */
export const Topbar = ({ onToggleSidebarCollapse, isSidebarCollapsed }: { onToggleSidebarCollapse: () => void; isSidebarCollapsed: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { activeGroupName } = useGroupStore();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Xác định tên trang theo URL cho breadcrumb
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Tổng quan';
    if (path.includes('/transactions')) return 'Số Thu Chi';
    if (path.includes('/sales')) return 'Bán hàng';
    if (path.includes('/warranty')) return 'Bảo hành & Hạn';
    if (path.includes('/customers')) return 'Khách hàng';
    if (path.includes('/leaderboard')) return 'Xếp hạng bán hàng';
    if (path.includes('/groups')) return 'Nhóm cộng tác';
    if (path.includes('/reports')) return 'Báo cáo & Phân tích';
    if (path.includes('/budgets')) return 'Hạn mức ngân sách';
    if (path.includes('/debts')) return 'Sổ công nợ';
    if (path.includes('/settings')) return 'Cài đặt tài khoản';
    return 'Tổng quan';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || 'Trần Quốc Hoà...';
  const displayAvatar = user?.avatar;

  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#243044] flex items-center justify-between transition-colors duration-200 shrink-0">
      <div className="md:hidden min-w-0 flex-1 mr-2"><MobileWorkspaceSwitcher /></div>
      {/* 1. Bên trái: Breadcrumb nhỏ với icon người */}
      <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 mr-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
        <div className="hidden sm:flex items-center gap-1.5 min-w-0">
          <User className="w-3.5 h-3.5 stroke-[2] text-[#10B981]" />
          <span className="truncate max-w-40">{activeGroupName || 'Ví cá nhân'}</span>
        </div>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">/</span>
        <span className="truncate font-bold text-[#0F172A] dark:text-[#F1F5F9]">
          {getPageTitle()}
        </span>
      </div>

      {/* 2. Bên phải: ThemeToggle pill + Chuông + Avatar & Tên */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {/* Nút chuyển Theme dạng viên thuốc */}
        <ThemeToggle />

        <NotificationBell />

        {/* User profile dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1E293B] transition text-left"
          >
            <Avatar
              src={displayAvatar}
              alt={displayName}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <span className="hidden sm:inline-block text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9] max-w-[120px] truncate">
              {displayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-white dark:bg-[#151C2C] border border-slate-200 dark:border-[#243044] shadow-xl p-1.5 space-y-1 z-50 animate-fade-in text-xs">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-[#243044]">
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Người dùng'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@moneyflow.vn'}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E293B] font-medium"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Cài đặt tài khoản</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
