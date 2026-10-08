import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { formatMoney, formatShortMoney } from '../../utils/formatMoney';

/**
 * Biểu đồ "Dòng tiền trong tháng" (Chiếm 2/3 không gian lưới)
 * Hỗ trợ hiển thị dữ liệu thực hoặc trạng thái rỗng chuẩn như ảnh tham chiếu
 */
export const CashflowChart = ({
  data = [],
  onAddTransaction,
  isDark = false,
  className = ''
}) => {
  // Kiểm tra có dữ liệu giao dịch hay không
  const hasData = data && data.length > 0 && data.some(d => (d.income > 0 || d.expense > 0));

  // Ticks chuẩn ngày trong tháng như thiết kế tham chiếu (1/10, 3/10, 5/10... 31/10)
  const defaultDays = [
    '1/10', '3/10', '5/10', '7/10', '9/10', '11/10', '13/10',
    '15/10', '17/10', '19/10', '21/10', '23/10', '25/10', '27/10', '29/10', '31/10'
  ];

  // Dữ liệu biểu đồ khi rỗng (để vẽ trục tọa độ và lưới giống hệt ảnh mẫu)
  const emptyChartData = defaultDays.map(day => ({
    day,
    income: 0,
    expense: 0
  }));

  const chartData = data.length > 0 ? data : emptyChartData;

  // Tùy chỉnh màu sắc trục và lưới theo Light/Dark theme
  const gridStroke = isDark ? '#243044' : '#E5E7EB';
  const tickFill = isDark ? '#64748B' : '#94A3B8';

  // Tooltip tùy chỉnh hiển thị tiền tệ tiếng Việt
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const income = payload.find(p => p.dataKey === 'income')?.value || 0;
      const expense = payload.find(p => p.dataKey === 'expense')?.value || 0;
      const profit = income - expense;

      return (
        <div className="rounded-xl bg-white dark:bg-[#151C2C] p-3 shadow-xl border border-slate-200 dark:border-[#243044] text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">{label}</div>
          <div className="flex items-center gap-2 text-[#059669] dark:text-[#10B981] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Thu: {formatMoney(income)}</span>
          </div>
          <div className="flex items-center gap-2 text-[#F43F5E] dark:text-[#FB7185] font-semibold mt-1">
            <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
            <span>Chi: {formatMoney(expense)}</span>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
            Chênh lệch thu chi: {formatMoney(profit)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Header card: Tiêu đề bên trái + Chú giải (Legend) bên phải */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">
          Dòng tiền trong tháng
        </h3>

        {/* Chú giải: Chấm xanh lục "Thu" và Chấm hồng "Chi" */}
        <div className="flex items-center gap-4 text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span>Thu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />
            <span>Chi</span>
          </div>
        </div>
      </div>

      {/* Vùng vẽ biểu đồ */}
      <div className="relative w-full h-[270px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cashflowIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="cashflowExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Lưới kẻ ngang mờ */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} strokeOpacity={0.8} />

            {/* Trục hoành ngày trong tháng */}
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: tickFill }}
              tickLine={false}
              axisLine={false}
              dy={8}
            />

            {/* Trục tung số tiền */}
            <YAxis
              tickFormatter={hasData ? formatShortMoney : (v => `${v} đ`)}
              domain={hasData ? ['auto', 'auto'] : [0, 4]}
              ticks={hasData ? undefined : [0, 1, 2, 3, 4]}
              tick={{ fontSize: 11, fill: tickFill }}
              tickLine={false}
              axisLine={false}
              dx={-4}
            />

            {hasData && <Tooltip content={<CustomTooltip />} />}

            {/* Đường Thu (Xanh lục) */}
            <Area
              type="linear"
              dataKey="income"
              name="Thu"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cashflowIncome)"
            />

            {/* Đường Chi (Đỏ/Hồng) */}
            <Area
              type="linear"
              dataKey="expense"
              name="Chi"
              stroke="#F43F5E"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cashflowExpense)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Lớp hiển thị EmptyState ở giữa khi chưa có dữ liệu */}
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-[#151C2C]/40 backdrop-blur-[0.5px]">
            <EmptyState
              title="Chưa có giao dịch trong tháng"
              actionText="Thêm giao dịch"
              onAction={onAddTransaction}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default CashflowChart;
