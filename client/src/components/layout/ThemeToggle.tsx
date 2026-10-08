import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

/**
 * Nút chuyển đổi Theme dạng viên thuốc (Pill) chuẩn thiết kế MoneyFlow
 * Gồm 2 icon Mặt Trời / Mặt Trăng, icon đang chọn có nền tròn nổi bật
 */
export const ThemeToggle = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`inline-flex items-center p-1 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] transition-colors duration-200 ${className}`}
      role="group"
      aria-label="Chuyển chế độ sáng / tối"
    >
      {/* Nút Chế độ Sáng (Mặt Trời) */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Chế độ Sáng (Light mode)"
        className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${
          !isDark
            ? 'bg-white text-amber-500 shadow-[0_1px_3px_rgba(0,0,0,0.1)] scale-100 font-bold'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 scale-95'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      {/* Nút Chế độ Tối (Mặt Trăng) */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Chế độ Tối (Dark mode)"
        className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${
          isDark
            ? 'bg-[#0F172A] text-sky-400 shadow-[0_1px_4px_rgba(0,0,0,0.3)] scale-100 font-bold'
            : 'text-slate-400 hover:text-slate-600 scale-95'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ThemeToggle;
