import React from 'react';
import { TooltipProps } from 'recharts';
export interface ExpenseSlice { name: string; total: number; color?: string; icon?: string; percentage?: number; percent?: number; categoryId?: string }
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { Card } from '../ui/Card';
import { formatMoney } from '../../utils/formatMoney';
import { CategoryIcon } from '../categories/CategoryIcon';

const FALLBACK_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EC4899',
  '#8B5CF6', '#06B6D4', '#F43F5E', '#64748B'
];

/**
 * Biểu đồ Donut "Cơ cấu chi tiêu" (Chiếm 1/3 không gian lưới)
 * - Nối trực tiếp API cơ cấu chi tiêu
 * - Có công tắc nhỏ "Gồm giá vốn"
 * - Chú giải bên dưới: Tên danh mục + Số tiền + %
 * - Hover hiển thị tooltip chi tiết
 * - Trạng thái rỗng: Vòng tròn xám rỗng "Chưa có dữ liệu chi tiêu"
 */
export const ExpenseDonut = ({
  data = [],
  isDark = false,
  includeCogs = false,
  onToggleCogs = undefined,
  className = ''
}: { data?: ExpenseSlice[]; isDark?: boolean; includeCogs?: boolean; onToggleCogs?: (value: boolean) => void; className?: string }) => {
  const hasData = data && data.length > 0 && data.some((d) => d.total > 0);

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-2xl bg-white dark:bg-[#151D2A] p-3 shadow-2xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.name}</span>
          </div>
          <div className="text-rose-500 font-extrabold text-sm">
            {formatMoney(item.value)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Tỉ trọng: {item.percent}%
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      {/* Header card + Công tắc "Gồm giá vốn" */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">
          Cơ cấu chi tiêu
        </h3>

        {onToggleCogs && (
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={includeCogs}
              onChange={(e) => onToggleCogs(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Gồm giá vốn</span>
          </label>
        )}
      </div>

      <div className="relative w-full h-[280px] flex flex-col items-center justify-center">
        {hasData ? (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="h-[170px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.map((item, idx) => ({
                      name: item.name,
                      value: item.total,
                      percent: item.percent,
                      color: item.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={75}
                    paddingAngle={data.length > 1 ? 3 : 0}
                    dataKey="value"
                  >
                    {data.map((item, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={item.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Chú thích bên dưới: Tên danh mục + Số tiền + % */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              {data.slice(0, 6).map((item, idx) => {
                const color = item.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
                return (
                  <div key={idx} className="flex items-center justify-between gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                      {item.percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Trạng thái rỗng: Vòng tròn donut rỗng đúng như mẫu */
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center">
              <svg width="120" height="120" viewBox="0 0 120 120" className="rotate-[-90deg]">
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke={isDark ? '#243044' : '#E2E8F0'}
                  strokeWidth="18"
                />
              </svg>
            </div>
            <p className="mt-6 text-xs text-[#94A3B8] dark:text-[#64748B] text-center font-medium">
              Chưa có dữ liệu chi tiêu
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ExpenseDonut;
