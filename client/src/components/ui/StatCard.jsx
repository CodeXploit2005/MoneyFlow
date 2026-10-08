import React from 'react';

/**
 * Component StatCard theo thiết kế Dashboard MoneyFlow
 * Cấu trúc: ô icon vuông bo góc bên trái + nhãn, số tiền lớn in đậm, chú thích bên phải
 *
 * @param {string} title Tên chỉ số ("Tổng thu", "Tổng chi", "Lãi ròng", "Bảo hành đang chạy")
 * @param {string|number} value Giá trị hiển thị ("0 đ", "1.500.000 đ", "0")
 * @param {string} subtitle Dòng chú thích bên dưới ("Trong tháng này", "Chưa có đơn bảo hành")
 * @param {React.ComponentType} icon Component icon Lucide
 * @param {'income'|'expense'|'profit'|'warranty'} variant Tông màu chủ đạo
 */
export const StatCard = ({
  title,
  value = '0 đ',
  subtitle = 'Trong tháng này',
  icon: Icon,
  variant = 'income',
  className = ''
}) => {
  // Bảng phối màu chuẩn hệ thống thiết kế Light / Dark mode
  const colorMap = {
    // 1. Tổng thu (Xanh lục ngọc)
    income: {
      bgLight: 'bg-[#D1FAE5]',
      bgDark: 'dark:bg-emerald-950/40',
      iconLight: 'text-[#059669]',
      iconDark: 'dark:text-[#10B981]'
    },
    // 2. Tổng chi (Đỏ / hồng)
    expense: {
      bgLight: 'bg-[#FFE4E6]',
      bgDark: 'dark:bg-rose-950/40',
      iconLight: 'text-[#F43F5E]',
      iconDark: 'dark:text-[#FB7185]'
    },
    // 3. Lãi ròng (Xanh dương)
    profit: {
      bgLight: 'bg-[#DBEAFE]',
      bgDark: 'dark:bg-blue-950/40',
      iconLight: 'text-[#3B82F6]',
      iconDark: 'dark:text-[#60A5FA]'
    },
    // 4. Bảo hành đang chạy (Vàng cam)
    warranty: {
      bgLight: 'bg-[#FEF3C7]',
      bgDark: 'dark:bg-amber-950/40',
      iconLight: 'text-[#F59E0B]',
      iconDark: 'dark:text-[#FBBF24]'
    }
  };

  const scheme = colorMap[variant] || colorMap.income;

  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-[#151C2C] border-[#E5E7EB] dark:border-[#243044] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-4 ${className}`}
    >
      {/* Ô Icon vuông bo góc nền nhạt */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${scheme.bgLight} ${scheme.bgDark} ${scheme.iconLight} ${scheme.iconDark} transition-colors duration-200`}
      >
        {Icon && <Icon className="w-6 h-6 stroke-[2.2]" />}
      </div>

      {/* Nội dung thống kê */}
      <div className="flex-1 min-w-0">
        <span className="block text-xs font-medium text-[#64748B] dark:text-[#94A3B8] truncate">
          {title}
        </span>
        <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight tabular-nums mt-0.5 truncate">
          {value}
        </div>
        <span className="block text-xs text-[#94A3B8] dark:text-[#64748B] mt-0.5 truncate">
          {subtitle}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
