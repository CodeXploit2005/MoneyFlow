import { OptionPicker } from '../components/ui/OptionPicker';
import { MonthPicker } from '../components/ui/MonthPicker';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ArrowRight, TrendingUp, Wallet, Receipt, RefreshCw } from 'lucide-react';
import { useGroupStore } from '../store/groupStore';
import { useAuthStore } from '../store/authStore';
import { leaderboardApi } from '../api/endpoints';
import { formatVND } from '../utils/format';
import { LeaderboardItem } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { MemberRankingChart } from '../components/charts/MemberRankingChart';

export const Leaderboard: React.FC = () => {
  const { activeGroupId, activeGroupName } = useGroupStore();
  const userId = useAuthStore(state => state.user?._id);
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const [month, setMonth] = useState(() => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 7));
  const [sortBy, setSortBy] = useState<'profit' | 'revenue' | 'orders'>('profit');
  const { data: ranking = [], isPending, isError, refetch, isFetching } = useQuery<LeaderboardItem[]>({
    queryKey: ['leaderboard', userId, activeGroupId, period, month, sortBy],
    enabled: !!activeGroupId,
    queryFn: async () => (await leaderboardApi.getLeaderboard(activeGroupId!, { period, sortBy, ...(period === 'month' ? { year: Number(month.split('-')[0]), month: Number(month.split('-')[1]) } : {}) })).data,
    refetchInterval: 30000
  });
  if (!activeGroupId) return <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"><Trophy className="mx-auto mb-4 h-9 w-9 text-amber-500" /><h1 className="text-xl font-bold">Cùng nhóm theo dõi thành tích</h1><p className="mt-2 text-sm text-slate-500">Chọn nhóm để so sánh doanh thu, lãi gộp và số đơn. Dữ liệu ví cá nhân luôn được giữ riêng.</p><button onClick={() => navigate('/groups')} className="mt-5 min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white">Chọn nhóm</button></div>;
  const totals = ranking.reduce((sum, member) => ({ revenue: sum.revenue + member.revenue, profit: sum.profit + member.profit, collected: sum.collected + member.collected, orders: sum.orders + member.orders }), { revenue: 0, profit: 0, collected: 0, orders: 0 });
  const labels: Record<string, string> = { profit: 'Lãi gộp', revenue: 'Doanh thu', orders: 'Số đơn' };
  return <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="mb-1 flex items-center gap-2 text-xs font-semibold text-emerald-600"><Trophy className="h-4 w-4" /><span className="truncate">{activeGroupName}</span></p><h1 className="text-xl font-bold tracking-tight sm:text-2xl">Hiệu quả bán hàng</h1><p className="mt-1 text-xs text-slate-500 sm:text-sm">Theo dõi đóng góp của từng thành viên trong nhóm.</p></div><button onClick={() => refetch()} aria-label="Làm mới bảng xếp hạng" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900"><RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /></button></div>
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">{Object.entries(labels).map(([id, label]) => <button key={id} aria-pressed={sortBy === id} onClick={() => setSortBy(id as 'profit' | 'revenue' | 'orders')} className={`min-h-10 rounded-lg px-3 text-xs font-semibold ${sortBy === id ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-slate-500'}`}>{label}</button>)}</div>
      <div className="flex flex-wrap items-center gap-2"><div className="min-w-40 flex-1"><OptionPicker label="Kỳ xếp hạng" value={period} onChange={setPeriod} options={[{value:'today',label:'Hôm nay'},{value:'week',label:'Tuần này'},{value:'month',label:'Theo tháng'},{value:'year',label:'Năm nay'},{value:'all',label:'Tất cả'}]} /></div>{period === 'month' && <MonthPicker label="Tháng xếp hạng" value={month} onChange={setMonth} className="flex-1" />}</div>
    </div>
    {isPending ? <p role="status" className="py-12 text-center text-sm text-slate-400">Đang tổng hợp số liệu...</p> : isError ? <div role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30">Chưa tải được bảng xếp hạng. <button onClick={() => refetch()} className="min-h-11 font-semibold underline">Thử lại</button></div> : <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ label: 'Doanh thu', value: formatVND(totals.revenue), icon: TrendingUp }, { label: 'Lãi gộp', value: formatVND(totals.profit), icon: Trophy }, { label: 'Đã thu', value: formatVND(totals.collected), icon: Wallet }, { label: 'Đơn bán', value: totals.orders, icon: Receipt }].map(item => <div key={item.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="mb-2 flex items-center gap-2 text-[11px] text-slate-500"><item.icon className="h-3.5 w-3.5 text-emerald-500" />{item.label}</div><p className="break-words text-base font-bold sm:text-lg">{item.value}</p></div>)}</div>
      <MemberRankingChart ranking={ranking} metric={sortBy} userId={userId} />
      {!totals.orders && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">Chưa có đơn bán trong kỳ này. Tạo đơn trong ví nhóm để ghi nhận thành tích.</p>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800"><h2 className="text-sm font-semibold">Xếp hạng theo {labels[sortBy].toLowerCase()}</h2><span className="text-xs text-slate-400">{ranking.length} thành viên</span></div>
        <div className="hidden grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_60px] gap-3 bg-slate-50 px-5 py-3 text-[11px] font-semibold text-slate-500 dark:bg-slate-800/40 md:grid"><span>Thành viên</span><span className="text-right">Doanh thu</span><span className="text-right">Lãi gộp</span><span className="text-right">Đã thu</span><span className="text-right">Đơn</span></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">{ranking.map(member => <article key={member.userId} className={`p-4 md:grid md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_60px] md:items-center md:gap-3 md:px-5 ${member.userId === userId ? 'bg-emerald-50/40 dark:bg-emerald-950/10' : ''}`}>
          <div className="flex min-w-0 items-center gap-2.5"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${member.orders && member.rank === 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{member.orders ? member.rank : '—'}</span><Avatar src={member.avatar} alt={member.name} className="h-8 w-8 shrink-0 rounded-full object-cover" /><div className="min-w-0"><p className="break-words text-xs font-semibold">{member.name}{member.userId === userId && <span className="ml-1 text-[10px] text-emerald-600">(Bạn)</span>}</p><p className="mt-0.5 text-[10px] text-slate-400">{member.role === 'owner' ? 'Chủ nhóm' : member.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</p></div></div>
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40 md:contents">{[['Doanh thu', member.revenue], ['Lãi gộp', member.profit], ['Đã thu', member.collected]].map(([label, value]) => <div key={String(label)} className="min-w-0 md:text-right"><p className="mb-1 text-[10px] text-slate-400 md:hidden">{label}</p><p className="break-words text-[11px] font-semibold sm:text-xs">{formatVND(Number(value))}</p></div>)}</div><p className="mt-2 text-right text-[11px] text-slate-500 md:mt-0">{member.orders}<span className="md:hidden"> đơn</span></p>
        </article>)}</div>
      </section>
      <p className="text-[11px] leading-relaxed text-slate-500">Doanh thu = giá bán × số lượng. Lãi gộp = doanh thu − giá vốn, chưa trừ chi phí vận hành/bảo hành. Đã thu là tiền khách thanh toán trên đơn, gồm khoản thu sau kỳ bán; không phải dòng tiền riêng của tháng. Chỉ tính đơn của thành viên hiện tại, bỏ đơn đã hủy; số liệu thay đổi khi đơn được điều chỉnh. Thành viên bằng điểm có cùng hạng.</p>
      <button onClick={() => navigate('/sales')} className="flex min-h-11 items-center gap-2 text-xs font-semibold text-emerald-600">Xem đơn bán của nhóm<ArrowRight className="h-4 w-4" /></button>
    </>}
  </div>;
};
