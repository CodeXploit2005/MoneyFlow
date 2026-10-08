import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Sale from '../models/Sale.js';
import Category from '../models/Category.js';
import Budget from '../models/Budget.js';
import {
  startOfDayVN,
  endOfDayVN,
  getStartOfMonthVN,
  getEndOfMonthVN,
  addDays,
  vietnamDate
} from '../utils/dateUtils.js';

export class ReportService {
  /**
   * Tính toán số liệu tổng quan Dashboard
   */
  static async getDashboardOverview({ userId, groupId = null, year = undefined, month = undefined }) {
    const now = new Date();
    const todayStart = startOfDayVN(now);
    const todayEnd = endOfDayVN(now);

    const reference = month && year ? new Date(Date.UTC(Number(year), Number(month) - 1, 1) - 7 * 3600000) : now;
    const thisMonthStart = getStartOfMonthVN(reference);
    const thisMonthEnd = getEndOfMonthVN(reference);

    // Tháng trước để so sánh
    const lastMonth = addDays(thisMonthStart, -1);
    const lastMonthStart = getStartOfMonthVN(lastMonth);
    const lastMonthEnd = getEndOfMonthVN(lastMonth);

    const baseFilter = {
      isDeleted: false,
      ...(groupId ? { groupId: new mongoose.Types.ObjectId(groupId) } : { ownerId: new mongoose.Types.ObjectId(userId), groupId: null })
    };

    // 1. Tính tổng Thu/Chi hôm nay
    const todayStats = await Transaction.aggregate([
      {
        $match: {
          ...baseFilter,
          date: { $gte: todayStart, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const incomeToday = todayStats.find(s => s._id === 'income')?.total || 0;
    const expenseToday = todayStats.find(s => s._id === 'expense')?.total || 0;

    // 2. Tính tổng Thu/Chi tháng này
    const monthStats = await Transaction.aggregate([
      {
        $match: {
          ...baseFilter,
          date: { $gte: thisMonthStart, $lte: thisMonthEnd }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const incomeMonth = monthStats.find(s => s._id === 'income')?.total || 0;
    const expenseMonth = monthStats.find(s => s._id === 'expense')?.total || 0;
    const profitMonth = incomeMonth - expenseMonth;

    // 3. Tính tổng Thu/Chi tháng trước (để so sánh % thay đổi)
    const lastMonthStats = await Transaction.aggregate([
      {
        $match: {
          ...baseFilter,
          date: { $gte: lastMonthStart, $lte: lastMonthEnd }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const incomeLastMonth = lastMonthStats.find(s => s._id === 'income')?.total || 0;
    const expenseLastMonth = lastMonthStats.find(s => s._id === 'expense')?.total || 0;

    const incomeGrowth = incomeLastMonth > 0
      ? Number((((incomeMonth - incomeLastMonth) / incomeLastMonth) * 100).toFixed(1))
      : (incomeMonth > 0 ? null : 0);

    const expenseGrowth = expenseLastMonth > 0
      ? Number((((expenseMonth - expenseLastMonth) / expenseLastMonth) * 100).toFixed(1))
      : (expenseMonth > 0 ? null : 0);

    // 4. Tính số dư luỹ kế toàn thời gian
    const allTimeStats = await Transaction.aggregate([
      {
        $match: baseFilter
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalIncomeAllTime = allTimeStats.find(s => s._id === 'income')?.total || 0;
    const totalExpenseAllTime = allTimeStats.find(s => s._id === 'expense')?.total || 0;
    const balance = totalIncomeAllTime - totalExpenseAllTime;

    // 5. Thống kê số đơn bảo hành
    const saleFilter = groupId
      ? { groupId: new mongoose.Types.ObjectId(groupId) }
      : { ownerId: new mongoose.Types.ObjectId(userId), groupId: null };

    const activeWarrantiesCount = await Sale.countDocuments({
      ...saleFilter,
      status: { $ne: 'void' }, warrantyEnd: { $gte: todayStart }
    });

    const expiringSoonCount = await Sale.countDocuments({
      ...saleFilter,
      status: { $ne: 'void' }, warrantyEnd: { $gte: todayStart, $lt: addDays(todayStart, 4) }
    });

    return {
      today: {
        income: incomeToday,
        expense: expenseToday,
        net: incomeToday - expenseToday
      },
      month: {
        income: incomeMonth,
        expense: expenseMonth,
        profit: profitMonth,
        incomeGrowth,
        expenseGrowth
      },
      balance,
      warranty: {
        activeCount: activeWarrantiesCount,
        expiringSoonCount
      }
    };
  }

  /**
   * Biểu đồ thu chi theo ngày trong tháng hiện tại
   */
  static async getDailyChartData({ userId, groupId = null, year, month }) {
    const y = Number(year) || vietnamDate().getUTCFullYear();
    const m = month ? Number(month) - 1 : vietnamDate().getUTCMonth();
    const startDate = new Date(Date.UTC(y, m, 1) - 7 * 3600000);
    const endDate = getEndOfMonthVN(startDate);

    const baseFilter = {
      isDeleted: false,
      date: { $gte: startDate, $lte: endDate },
      ...(groupId ? { groupId: new mongoose.Types.ObjectId(groupId) } : { ownerId: new mongoose.Types.ObjectId(userId), groupId: null })
    };

    const dailyStats = await Transaction.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: { date: '$date', timezone: 'Asia/Ho_Chi_Minh' } },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const daysInMonth = vietnamDate(endDate).getUTCDate();
    const chartData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const incomeItem = dailyStats.find(s => s._id.day === day && s._id.type === 'income');
      const expenseItem = dailyStats.find(s => s._id.day === day && s._id.type === 'expense');

      const income = incomeItem ? incomeItem.total : 0;
      const expense = expenseItem ? expenseItem.total : 0;

      chartData.push({
        day: `${day}/${m + 1}`,
        dayNumber: day,
        income,
        expense,
        profit: income - expense
      });
    }

    return chartData;
  }

  /**
   * Biểu đồ chi phí theo danh mục (Pie Chart)
   */
  static async getCategoryExpenses({ userId, groupId = null, startDate, endDate }) {
    const baseFilter: any = {
      isDeleted: false,
      type: 'expense',
      ...(groupId ? { groupId: new mongoose.Types.ObjectId(groupId) } : { ownerId: new mongoose.Types.ObjectId(userId), groupId: null })
    };

    if (startDate && endDate) {
      baseFilter.date = { $gte: startOfDayVN(new Date(startDate)), $lte: endOfDayVN(new Date(endDate)) };
    }

    const categories = await Transaction.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: '$_id',
          categoryName: { $ifNull: ['$category.name', 'Khác'] },
          color: { $ifNull: ['$category.color', '#6b7280'] },
          icon: { $ifNull: ['$category.icon', 'tag'] },
          total: 1,
          count: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    return categories;
  }

  /**
   * Top sản phẩm bán chạy & tỷ suất sinh lời
   */
  static async getTopProducts({ userId, groupId = null, startDate = undefined, endDate = undefined }) {
    const saleFilter = groupId
      ? { groupId: new mongoose.Types.ObjectId(groupId) }
      : { ownerId: new mongoose.Types.ObjectId(userId), groupId: null };

    const top = await Sale.aggregate([
      { $match: { ...saleFilter, status: { $ne: 'void' }, ...(startDate && endDate ? {soldAt: {$gte: startOfDayVN(new Date(startDate)), $lte: endOfDayVN(new Date(endDate))}} : {}) } },
      {
        $group: {
          _id: '$productName',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } },
          totalProfit: { $sum: '$profit' }
        }
      },
      {
        $project: {
          productName: '$_id',
          totalQuantity: 1,
          totalRevenue: 1,
          totalProfit: 1,
          margin: {
            $cond: [
              { $gt: ['$totalRevenue', 0] },
              { $round: [{ $multiply: [{ $divide: ['$totalProfit', '$totalRevenue'] }, 100] }, 1] },
              0
            ]
          }
        }
      },
      { $sort: { totalProfit: -1 } },
      { $limit: 5 }
    ]);

    return top;
  }

  /**
   * Tạo gợi ý thông minh (Smart Insights)
   */
  static async getSmartInsights({ userId, groupId = null }) {
    const insights = [];
    const now = new Date();

    const saleFilter = groupId
      ? { groupId: new mongoose.Types.ObjectId(groupId) }
      : { ownerId: new mongoose.Types.ObjectId(userId), groupId: null };

    // 1. Kiểm tra đơn sắp hết hạn bảo hành
    const expiringSoon = await Sale.find({
      ...saleFilter,
      status: { $ne: 'void' }, warrantyEnd: { $gte: startOfDayVN(now), $lt: addDays(startOfDayVN(now), 4) }
    }).populate('customerId', 'name phone zalo');

    if (expiringSoon.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Bảo hành sắp hết hạn',
        message: `Có ${expiringSoon.length} đơn hàng sắp hết hạn bảo hành trong 3 ngày tới. Hãy liên hệ khách để chăm sóc hoặc gia hạn!`,
        actionUrl: '/warranty?filter=expiring_soon'
      });
    }

    // 2. Tìm sản phẩm có biên lợi nhuận cao nhất
    const topProducts = await this.getTopProducts({ userId, groupId });
    if (topProducts.length > 0) {
      const best = topProducts[0];
      insights.push({
        type: 'success',
        title: 'Sản phẩm chủ lực',
        message: `"${best.productName}" mang lại lợi nhuận cao nhất với ${best.totalProfit.toLocaleString('vi-VN')} ₫ (Biên lợi nhuận ~${best.margin}%).`,
        actionUrl: '/sales'
      });
    }

    // 3. Kiểm tra cảnh báo ngân sách
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const budgets = await Budget.find({
      ...(groupId ? { groupId } : { ownerId: userId, groupId: null }),
      month: currentMonth,
      year: currentYear
    }).populate('categoryId');

    for (const b of budgets) {
      // Tính chi thực tế cho category này trong tháng
      const spentAgg = await Transaction.aggregate([
        {
          $match: {
            categoryId: b.categoryId._id,
            isDeleted: false,
            type: 'expense',
            date: { $gte: getStartOfMonthVN(now), $lte: getEndOfMonthVN(now) }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const spent = spentAgg[0]?.total || 0;
      const ratio = spent / b.amount;

      if (ratio >= 1.0) {
        insights.push({
          type: 'danger',
          title: 'Vượt ngân sách!',
          message: `Danh mục "${(b.categoryId as any)?.name}" đã chi ${spent.toLocaleString('vi-VN')} ₫, vượt hạn mức (${b.amount.toLocaleString('vi-VN')} ₫)!`,
          actionUrl: '/budgets'
        });
      } else if (ratio >= 0.8) {
        insights.push({
          type: 'warning',
          title: 'Sắp chạm trần ngân sách',
          message: `Danh mục "${(b.categoryId as any)?.name}" đã đạt ${(ratio * 100).toFixed(0)}% ngân sách tháng này.`,
          actionUrl: '/budgets'
        });
      }
    }

    return insights;
  }
}
