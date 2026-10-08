import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  TooltipProps
} from 'recharts';
import { formatVND } from '../../utils/format';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#f43f5e', '#64748b'];

export interface CategoryPieItem {
  categoryName: string;
  total: number;
  color?: string;
}

interface CategoryPieChartProps {
  data?: CategoryPieItem[];
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        Chưa có dữ liệu chi tiêu trong kỳ
      </div>
    );
  }

  const chartData = data.map((item, idx) => ({
    name: item.categoryName,
    value: item.total,
    color: item.color || COLORS[idx % COLORS.length]
  }));

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      return (
        <div className="rounded-xl bg-white p-2.5 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200">{d.name}</div>
          <div className="text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            {formatVND(Number(d.value))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={chartData.length > 1 ? 4 : 0}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
