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
  growthRate: number;
  rank: number;
}

export class LeaderboardService {
  /**
   * Xác định khoảng ngày hiện tại và khoảng ngày kỳ trước để so sánh
   */
  static getDateRange(period: string = 'month'): LeaderboardDateRange {
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date = endOfDayVN(now);
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
    sortBy = 'revenue'
  }: {
    groupId: string;
    period?: string;
    sortBy?: 'revenue' | 'profit' | 'orders';
  }): Promise<LeaderboardMemberRank[]> {
    const { currentStart, currentEnd, prevStart, prevEnd } = this.getDateRange(period);
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
          totalOrders: { $sum: 1 }
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
            soldAt: { $gte: prevStart, $lte: prevEnd }
          }
        },
        {
          $group: {
            _id: '$ownerId',
            totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } },
            totalProfit: { $sum: '$profit' },
            totalOrders: { $sum: 1 }
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
        growthRate
      };
    });

    // Sắp xếp theo tiêu chí sortBy
    rankingList.sort((a, b) => {
      if (sortBy === 'profit') return b.profit - a.profit;
      if (sortBy === 'orders') return b.orders - a.orders;
      return b.revenue - a.revenue;
    });

    // Gán thứ hạng rank
    const rankedWithRank: LeaderboardMemberRank[] = rankingList.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    return rankedWithRank;
  }
}
export default LeaderboardService;
