import Transaction from '../models/Transaction.js';
import { ReportService } from '../services/reportService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { startOfDayVN, endOfDayVN } from '../utils/dateUtils.js';

export const getOverview = async (req, res) => {
  try {
    const { groupId, month, year } = req.query;

    const data = await ReportService.getDashboardOverview({
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      userId: req.user._id,
      groupId: groupId || null
    });

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, 'Lỗi lấy tổng quan báo cáo: ' + error.message, 500);
  }
};

export const getDailyChart = async (req, res) => {
  try {
    const { groupId, year, month } = req.query;

    const data = await ReportService.getDailyChartData({
      userId: req.user._id,
      groupId: groupId || null,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined
    });

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, 'Lỗi lấy dữ liệu biểu đồ ngày: ' + error.message, 500);
  }
};

export const getCategoryBreakdown = async (req, res) => {
  try {
    const { groupId, startDate, endDate } = req.query;

    const data = await ReportService.getCategoryExpenses({
      userId: req.user._id,
      groupId: groupId || null,
      startDate,
      endDate
    });

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, 'Lỗi lấy cơ cấu danh mục: ' + error.message, 500);
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const { groupId, startDate, endDate } = req.query;

    const data = await ReportService.getTopProducts({
      userId: req.user._id,
      startDate, endDate,
      groupId: groupId || null
    });

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, 'Lỗi lấy top sản phẩm: ' + error.message, 500);
  }
};

export const getSmartInsights = async (req, res) => {
  try {
    const { groupId } = req.query;

    const data = await ReportService.getSmartInsights({
      userId: req.user._id,
      groupId: groupId || null
    });

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, 'Lỗi lấy gợi ý thông minh: ' + error.message, 500);
  }
};

export const exportTransactionsCsv = async (req, res) => {
  try {
    const { groupId, startDate, endDate }: any = req.query;
    const filter: any = { isDeleted: false };

    if (groupId) {
      filter.groupId = groupId;
    } else {
      filter.ownerId = (req as any).user._id;
      filter.groupId = null;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startOfDayVN(new Date(startDate));
      if (endDate) {
        const end = endOfDayVN(new Date(endDate));
        filter.date.$lte = end;
      }
    }

    const transactions: any[] = await Transaction.find(filter)
      .populate('categoryId', 'name')
      .populate('ownerId', 'name')
      .sort({ date: -1 });

    // UTF-8 BOM để Excel hiển thị đúng tiếng Việt
    let csvContent = '\uFEFF';
    csvContent += 'Ngày,Loại,Tên khoản,Số tiền (VNĐ),Danh mục,Phương thức,Người liên quan,Ghi chú,Người tạo\n';

    transactions.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('vi-VN');
      const typeStr = t.type === 'income' ? 'Thu' : 'Chi';
      const cleanTitle = `"${(t.title || '').replace(/"/g, '""')}"`;
      const amountStr = t.amount;
      const catName = `"${((t.categoryId as any)?.name || '').replace(/"/g, '""')}"`;
      const methodStr = t.method === 'transfer' ? 'Chuyển khoản' : (t.method === 'cash' ? 'Tiền mặt' : 'Ví điện tử');
      const counterparty = `"${(t.counterparty || '').replace(/"/g, '""')}"`;
      const note = `"${(t.note || '').replace(/"/g, '""')}"`;
      const creator = `"${((t.ownerId as any)?.name || '').replace(/"/g, '""')}"`;

      csvContent += `${dateStr},${typeStr},${cleanTitle},${amountStr},${catName},${methodStr},${counterparty},${note},${creator}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="moneyflow-transactions.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    return sendError(res, 'Lỗi xuất file CSV: ' + error.message, 500);
  }
};
