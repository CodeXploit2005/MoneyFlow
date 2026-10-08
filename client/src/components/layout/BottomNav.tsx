import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShoppingBag,
  ShieldCheck,
  Menu,
  LucideIcon
} from 'lucide-react';

interface BottomNavProps {
  onOpenMore: () => void;
}

interface BottomNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMore }) => {
  const navItems: BottomNavItem[] = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Thu Chi', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Bán hàng', href: '/sales', icon: ShoppingBag },
    { name: 'Bảo hành', href: '/warranty', icon: ShieldCheck }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-14 h-full py-1 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Nút Xem Thêm Menu */}
        <button
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center w-14 h-full py-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Thêm</span>
        </button>
      </div>
    </div>
  );
};
