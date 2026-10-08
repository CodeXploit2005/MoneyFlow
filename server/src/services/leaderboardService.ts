import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Transaction from '../models/Transaction.js';
import GroupMember from '../models/GroupMember.js';
import {
  startOfDayVN,
  endOfDayVN,
  getStartOfWeekVN,
  getStartOfMonthVN,
  getEndOfMonthVN,
  getStartOfYearVN,
  addDays
} from '../utils/dateUtils.js';

export interface LeaderboardDateRange {
  currentStart: Date;
  currentEnd: Date;
  prevStart: Date | null;
  prevEnd: Date | null;
}

export interface LeaderboardMemberRank {
  userId: any;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  revenue: number;
  profit: number;
  orders: number;
  collected: number;
  outstanding: number;
  growthRate: number;
  rank: number;
}

export class LeaderboardService {
  /**
   * Xác định khoảng ngày hiện tại và khoảng ngày kỳ trước để so sánh
   */
  static getDateRange(period: string = 'month', year?: number, month?: number): LeaderboardDateRange {
    const now = new Date();
    if (year !== undefined || month !== undefined) {
      if (!Number.isInteger(year) || year! < 1970 || year! > 9999 || !Number.isInteger(month) || month! < 1 || month! > 12) throw new Error('Tháng hoặc năm không hợp lệ');
      const currentStart = new Date(Date.UTC(year!, month! - 1, 1) - 7 * 3600000);
      const previous = addDays(currentStart, -1);
      return { currentStart, currentEnd: new Date(Math.min(now.getTime(), getEndOfMonthVN(currentStart).getTime())), prevStart: getStartOfMonthVN(previous), prevEnd: getEndOfMonthVN(previous) };
    }
    let currentStart: Date;
    let currentEnd: Date = now;
    let prevStart: Date | null = null;
    let prevEnd: Date | null = null;

    switch (period) {
      case 'today': {
        currentStart = startOfDayVN(now);
        prevStart = startOfDayVN(addDays(now, -1));
        prevEnd = endOfDayVN(addDays(now, -1));
        break;
      }
      case 'week': {
        currentStart = getStartOfWeekVN(now);
        prevStart = addDays(currentStart, -7);
        prevEnd = addDays(currentStart, -1);
        prevEnd = endOfDayVN(prevEnd);
        break;
      }
      case 'month': {
        currentStart = getStartOfMonthVN(now);
        const lastMonth = addDays(currentStart, -1);
        prevStart = getStartOfMonthVN(lastMonth);
        prevEnd = getEndOfMonthVN(lastMonth);
        break;
      }
      case 'year': {
        currentStart = getStartOfYearVN(now);
        prevEnd = new Date(currentStart.getTime() - 1);
        prevStart = getStartOfYearVN(prevEnd);
        break;
      }
      case 'all':
      default: {
        currentStart = new Date(0);
        prevStart = null;
        prevEnd = null;
        break;
      }
    }

    return { currentStart, currentEnd, prevStart, prevEnd };
  }

  /**
   * Tính bảng xếp hạng cho một nhóm
   */
  static async getGroupLeaderboard({
    groupId,
    period = 'month',
    sortBy = 'revenue',
    year, month
  }: {
    groupId: string;
    period?: string;
    year?: number;
    month?: number;
    sortBy?: 'revenue' | 'profit' | 'orders';
  }): Promise<LeaderboardMemberRank[]> {
    const { currentStart, currentEnd, prevStart, prevEnd } = this.getDateRange(period, year, month);
    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    // Lấy danh sách thành viên nhóm
    const members = await GroupMember.find({ groupId: groupObjectId }).populate('userId', 'name email avatar');

    // Pipeline tính kỳ hiện tại từ đơn bán (Sale)
    const currentSalesStats = await Sale.aggregate([
      {
        $match: {
          groupId: groupObjectId,
          status: { $ne: 'void' },
          soldAt: { $gte: currentStart, $lte: currentEnd }
        }
      },
      {
        $group: {
          _id: '$ownerId',
          totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } },
          totalProfit: { $sum: '$profit' },
          totalOrders: { $sum: 1 },
          totalCollected: { $sum: '$paidAmount' }
        }
      }
    ]);

    // Pipeline tính kỳ trước (để so sánh % tăng trưởng)
    let prevSalesStats: any[] = [];
    if (prevStart && prevEnd) {
      prevSalesStats = await Sale.aggregate([
        {
          $match: {
            groupId: groupObjectId,
            status: { $ne: 'void' },
            soldAt: { $gte: prevStart, $lte: prevEnd }
          }
        },
        {
          $group: {
            _id: '$ownerId',
            totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } },
            totalProfit: { $sum: '$profit' },
            totalOrders: { $sum: 1 },
          totalCollected: { $sum: '$paidAmount' }
          }
        }
      ]);
    }

    const currentMap = new Map<string, any>();
    currentSalesStats.forEach(item => {
      if (item._id) currentMap.set(item._id.toString(), item);
    });

    const prevMap = new Map<string, any>();
    prevSalesStats.forEach(item => {
      if (item._id) prevMap.set(item._id.toString(), item);
    });

    // Kết hợp dữ liệu cho tất cả thành viên trong nhóm
    const rankingList = members.map(m => {
      const user: any = m.userId || {};
      const uid = user._id ? user._id.toString() : '';
      const curr = currentMap.get(uid) || { totalRevenue: 0, totalProfit: 0, totalOrders: 0 };
      const prev = prevMap.get(uid) || { totalRevenue: 0, totalProfit: 0, totalOrders: 0 };

      // Tính % tăng/giảm so với kỳ trước
      let growthRate = 0;
      let targetMetricCurr = curr.totalRevenue;
      let targetMetricPrev = prev.totalRevenue;

      if (sortBy === 'profit') {
        targetMetricCurr = curr.totalProfit;
        targetMetricPrev = prev.totalProfit;
      } else if (sortBy === 'orders') {
        targetMetricCurr = curr.totalOrders;
        targetMetricPrev = prev.totalOrders;
      }

      if (targetMetricPrev > 0) {
        growthRate = Number((((targetMetricCurr - targetMetricPrev) / targetMetricPrev) * 100).toFixed(1));
      } else if (targetMetricCurr > 0) {
        growthRate = 100;
      }

      return {
        userId: user._id,
        name: user.name || 'Thành viên',
        email: user.email || '',
        avatar: user.avatar,
        role: m.role,
        revenue: curr.totalRevenue,
        profit: curr.totalProfit,
        orders: curr.totalOrders,
        collected: curr.totalCollected || 0,
        outstanding: Math.max(0, curr.totalRevenue - (curr.totalCollected || 0)),
        growthRate
      };
    });

    // Sắp xếp theo tiêu chí sortBy
    rankingList.sort((a, b) => {
      if (sortBy === 'profit') return b.profit - a.profit;
      if (sortBy === 'orders') return b.orders - a.orders;
      return b.revenue - a.revenue;
    });

    let lastMetric: number | null = null;
    let rank = 0;
    const rankedWithRank: LeaderboardMemberRank[] = rankingList.map((item, index) => {
      const value = item[sortBy];
      if (value !== lastMetric) rank = index + 1;
      lastMetric = value;
      return { ...item, rank };
    });

    return rankedWithRank;
  }
}
export default LeaderboardService;
