import { Avatar } from '../ui/Avatar';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Users,
  User,
  LogOut,
  Settings,
  PlusCircle,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useGroupStore } from '../../store/groupStore';
import { groupApi, notificationApi } from '../../api/endpoints';
import { Group } from '../../types';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore() as any;
  const { theme, toggleTheme } = useThemeStore();
  const { activeGroupId, activeGroupName, setActiveGroup, groups, setGroups } = useGroupStore();

  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadMyGroups();
    window.addEventListener('focus', loadMyGroups);
    return () => window.removeEventListener('focus', loadMyGroups);
  }, [user?._id, showGroupMenu]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadMyGroups = async () => {
    try {
      const res = await groupApi.getMyGroups();
      setGroups(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectGroup = (group: Group | null) => {
    if (group) {
      setActiveGroup(group._id, group.name, group.myRole);
    } else {
      setActiveGroup(null, 'Ví cá nhân', null);
    }
    setShowGroupMenu(false);
    navigate('/dashboard');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 transition-colors">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <span className="text-slate-950 font-black text-lg">M</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                MoneyFlow
              </span>
              <span className="text-[10px] block font-semibold text-slate-400 dark:text-slate-500 -mt-1 uppercase tracking-wider">
                Finance & Sales
              </span>
            </div>
          </Link>

          {/* Scope Selector */}
          <div className="relative">
            <button
              onClick={() => setShowGroupMenu(!showGroupMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-700 transition dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {activeGroupId ? (
                <Users className="w-4 h-4 text-emerald-500" />
              ) : (
                <User className="w-4 h-4 text-teal-500" />
              )}
              <span className="max-w-[130px] sm:max-w-[180px] truncate">{activeGroupName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showGroupMenu && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 z-50 animate-fade-in">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Chuyển đổi không gian
                </div>

                <button
                  onClick={() => handleSelectGroup(null)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-left text-sm transition ${
                    !activeGroupId
                      ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-teal-500" />
                    <span>Ví cá nhân (Riêng tư)</span>
                  </div>
                  {!activeGroupId && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Nhóm của tôi ({groups.length})
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {groups.map((g) => (
                    <button
                      key={g._id}
                      onClick={() => handleSelectGroup(g)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-left text-sm transition ${
                        activeGroupId === g._id
                          ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Users className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{g.name}</span>
                      </div>
                      {activeGroupId === g._id && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to="/groups"
                    onClick={() => setShowGroupMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-xl transition dark:text-emerald-400 dark:hover:bg-slate-800"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Tạo hoặc tham gia nhóm mới
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            title="Đổi giao diện"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white p-3 shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Thông báo ({unreadCount} mới)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">Không có thông báo mới nào</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`p-2.5 rounded-xl text-xs transition ${
                          !n.isRead
                            ? 'bg-emerald-50/70 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">{n.title}</div>
                        <div className="text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
              />
              <span className="hidden md:block text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                {user?.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{user?.name}</div>
                  <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Cài đặt tài khoản & QR
                  </Link>
                  <Link
                    to="/groups"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    Quản lý các nhóm
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 rounded-xl transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
