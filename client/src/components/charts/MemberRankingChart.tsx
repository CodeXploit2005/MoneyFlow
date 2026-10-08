import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LeaderboardItem } from '../../types';
import { formatVND } from '../../utils/format';

type Metric = 'profit' | 'revenue' | 'orders';
const labels = { profit: 'Lãi gộp', revenue: 'Doanh thu', orders: 'Số đơn' };
const compact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 });

export const MemberRankingChart: React.FC<{ ranking: LeaderboardItem[]; metric: Metric; userId?: string }> = ({ ranking, metric, userId }) => {
  const data = ranking.slice(0, 10).map((member, index) => ({ ...member, position: index, value: member[metric] }));
  if (!data.length || !ranking.some(member => member.orders > 0)) return null;
  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">So sánh {labels[metric].toLowerCase()}</h2><p className="mt-1 text-xs text-slate-500">{ranking.length > 10 ? '10 thành viên dẫn đầu · Bảng đầy đủ ở bên dưới' : 'Cùng kỳ với bảng xếp hạng bên dưới'}</p></div><span className="text-[11px] text-slate-500">{metric === 'orders' ? 'Đơn bán' : 'Đơn vị: đồng'}</span></div>
    <div role="img" aria-label={`Biểu đồ ${labels[metric].toLowerCase()} của từng thành viên; số liệu chi tiết trong bảng bên dưới.`} style={{ height: Math.max(180, data.length * 48 + 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
          <XAxis type="number" tickFormatter={value => compact.format(value)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={metric !== 'orders'} />
          <YAxis type="category" dataKey="position" width={92} tickFormatter={position => { const member = data[Number(position)]; return member ? `${member.name.slice(0, 13)}${member.name.length > 13 ? '…' : ''}` : ''; }} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''} formatter={(value: number) => [metric === 'orders' ? `${value} đơn` : formatVND(value), labels[metric]]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, color: '#0f172a', background: '#fff' }} />
          <ReferenceLine x={0} stroke="#cbd5e1" />
          <Bar dataKey="value" barSize={20} radius={4}>{data.map(member => <Cell key={member.userId} fill={member.value < 0 ? '#f43f5e' : member.userId === userId ? '#059669' : '#94a3b8'} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-500"><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-600" />Bạn</span><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-slate-400" />Thành viên khác</span>{metric === 'profit' && <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-rose-500" />Lỗ gộp</span>}</div>
  </section>;
};
