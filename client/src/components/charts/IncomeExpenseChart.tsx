import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  TooltipProps
} from 'recharts';
import { formatVND, formatShortVND } from '../../utils/format';

export interface ChartDayItem {
  day: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  data?: ChartDayItem[];
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data = [] }) => {
  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const incomeVal = Number(payload.find(item => item.dataKey === 'income')?.value || 0);
      const expenseVal = Number(payload.find(item => item.dataKey === 'expense')?.value || 0);
      return (
        <div className="rounded-xl bg-white p-3 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">{label}</div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Thu: {formatVND(incomeVal)}</span>
          </div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold mt-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Chi: {formatVND(expenseVal)}</span>
          </div>
          <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
            Chênh lệch thu chi: {formatVND(incomeVal - expenseVal)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatShortVND} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="linear"
            dataKey="income"
            name="Thu"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#incomeGrad)"
          />
          <Area
            type="linear"
            dataKey="expense"
            name="Chi"
            stroke="#f43f5e"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#expenseGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
