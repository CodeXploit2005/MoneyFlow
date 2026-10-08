import { Avatar } from '../components/ui/Avatar';
import React, { useState, useEffect } from 'react';
import { useGroupStore } from '../store/groupStore';
import { leaderboardApi } from '../api/endpoints';
import { formatVND } from '../utils/format';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Crown
} from 'lucide-react';
import { LeaderboardItem } from '../types';

export const Leaderboard: React.FC = () => {
  const { activeGroupId, activeGroupName } = useGroupStore();

  const [ranking, setRanking] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<string>('month'); // today, week, month, year, all
  const [sortBy, setSortBy] = useState<string>('revenue'); // revenue, profit, orders

  const loadLeaderboard = async () => {
    if (!activeGroupId) return;
    setLoading(true);
    try {
      const res = await leaderboardApi.getLeaderboard(activeGroupId, { period, sortBy });
      setRanking(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeGroupId) {
      loadLeaderboard();
      // Hiệu ứng pháo giấy chúc mừng
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  }, [activeGroupId, period, sortBy]);

  if (!activeGroupId) {
    return (
      <div className="py-24 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Chưa chọn nhóm làm việc
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Bảng xếp hạng chỉ áp dụng khi bạn chọn một nhóm cộng tác. Hãy chuyển sang nhóm ở góc trên màn hình.
        </p>
      </div>
    );
  }

  const top1 = ranking[0];
  const top2 = ranking[1];
  const top3 = ranking[2];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 text-xs font-extrabold mb-2">
          <Crown className="w-4 h-4 text-amber-500" />
          <span>Bảng Vinh Danh • {activeGroupName}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Bảng Xếp Hạng Doanh Số & Lợi Nhuận
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Thi đua bán hàng, bứt phá doanh thu cùng đồng đội
        </p>
      </div>

      {/* Filter and Criteria Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        {/* Metric Sort By */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-full sm:w-auto">
          {[
            { id: 'revenue', label: 'Tổng Doanh Thu' },
            { id: 'profit', label: 'Lợi Nhuận Ròng' },
            { id: 'orders', label: 'Số Đơn Bán' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSortBy(item.id)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                sortBy === item.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: 'week', label: 'Tuần này' },
            { id: 'month', label: 'Tháng này' },
            { id: 'year', label: 'Năm nay' },
            { id: 'all', label: 'Tất cả' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                period === item.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400">Đang tính toán bảng xếp hạng...</div>
      ) : ranking.length === 0 ? (
        <div className="py-24 text-center text-slate-400 text-sm">Chưa có giao dịch bán hàng trong kỳ này</div>
      ) : (
        <>
          {/* Top 3 Podium (Bục vinh quang 2 - 1 - 3) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-8 max-w-2xl mx-auto">
            {/* Rank 2 (Bạc) */}
            {top2 ? (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <Avatar
                    src={top2.avatar}
                    alt={top2.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-slate-300 dark:ring-slate-600 shadow-md"
                  />
                  <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-xs">
                    2
                  </div>
                </div>
                <div className="text-center w-full">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate px-1">
                    {top2.name.split(' ')[0]}
                  </div>
                  <div className="text-[11px] sm:text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {sortBy === 'orders' ? `${top2.orders} đơn` : formatVND(sortBy === 'profit' ? top2.profit : top2.revenue)}
                  </div>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700/60 mt-3 flex items-center justify-center shadow-inner">
                  <Medal className="w-8 h-8 text-slate-400" />
                </div>
              </div>
            ) : <div />}

            {/* Rank 1 (Vàng - Cao nhất) */}
            {top1 ? (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Crown className="w-7 h-7 text-amber-500 fill-amber-400 animate-bounce" />
                  </div>
                  <Avatar
                    src={top1.avatar}
                    alt={top1.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-amber-400 shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs">
                    1
                  </div>
                </div>
                <div className="text-center w-full">
                  <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate px-1">
                    {top1.name.split(' ')[0]}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                    {sortBy === 'orders' ? `${top1.orders} đơn` : formatVND(sortBy === 'profit' ? top1.profit : top1.revenue)}
                  </div>
                </div>
                <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 mt-3 flex items-center justify-center shadow-inner">
                  <Trophy className="w-10 h-10 text-amber-500" />
                </div>
              </div>
            ) : <div />}

            {/* Rank 3 (Đồng) */}
            {top3 ? (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <Avatar
                    src={top3.avatar}
                    alt={top3.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-amber-700/50 shadow-md"
                  />
                  <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs">
                    3
                  </div>
                </div>
                <div className="text-center w-full">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate px-1">
                    {top3.name.split(' ')[0]}
                  </div>
                  <div className="text-[11px] sm:text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {sortBy === 'orders' ? `${top3.orders} đơn` : formatVND(sortBy === 'profit' ? top3.profit : top3.revenue)}
                  </div>
                </div>
                <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-t from-amber-900/20 to-amber-900/10 dark:from-slate-800 dark:to-slate-800/60 mt-3 flex items-center justify-center shadow-inner">
                  <Medal className="w-7 h-7 text-amber-700" />
                </div>
              </div>
            ) : <div />}
          </div>

          {/* Full List */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {ranking.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                      member.rank === 1 ? 'bg-amber-400 text-amber-950' :
                      member.rank === 2 ? 'bg-slate-300 text-slate-900' :
                      member.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {member.rank}
                    </span>

                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />

                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {member.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {member.orders} đơn hàng • Lãi: {formatVND(member.profit)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {formatVND(member.revenue)}
                    </div>
                    {member.growthRate !== undefined && (
                      <div className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                        member.growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {member.growthRate >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{member.growthRate >= 0 ? `+${member.growthRate}%` : `${member.growthRate}%`}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
