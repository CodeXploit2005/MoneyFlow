import { ownDetailsFilter } from '../utils/groupPolicy.js';
import Transaction from '../models/Transaction.js';
import Sale from '../models/Sale.js';
import mongoose from 'mongoose';
import { buildExcelReport, summarizeTransactions } from '../services/excelReportService.js';
import { ReportService } from '../services/reportService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { startOfDayVN, endOfDayVN } from '../utils/dateUtils.js';

const reportScope = (req: any) => req.query.groupId
  ? { groupId: req.query.groupId, ...ownDetailsFilter(req) }
  : { ownerId: req.user._id, groupId: null };

export const getAnnualSummary = async (req, res) => {
  const year = Number(req.query.year);
  if (!Number.isInteger(year) || year < 1900 || year > 9999) return sendError(res, 'Năm báo cáo không hợp lệ', 400);
  try {
    const scope = reportScope(req);
    const aggregateScope = Object.fromEntries(Object.entries(scope).map(([key, value]) => [key, value ? new mongoose.Types.ObjectId(String(value)) : null]));
    const start = new Date(`${year}-01-01T00:00:00+07:00`);
    const end = new Date(`${year + 1}-01-01T00:00:00+07:00`);
    const [annualTransactions, allTime] = await Promise.all([
      Transaction.find({ ...scope, isDeleted: false, date: { $gte: start, $lt: end } }).select('date type amount').lean(),
      Transaction.aggregate([{ $match: { ...aggregateScope, isDeleted: false } }, { $group: { _id: '$type', total: { $sum: '$amount' } } }])
    ]);
    const income = allTime.find(t => t._id === 'income')?.total || 0;
    const expense = allTime.find(t => t._id === 'expense')?.total || 0;
    return sendSuccess(res, { year, annual: summarizeTransactions(annualTransactions, year), allTime: { income, expense, net: income - expense } });
  } catch (error) {
    return sendError(res, 'Lỗi tổng hợp năm: ' + error.message, 500);
  }
};

export const exportExcelReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const validDate = (value: any) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    if ((startDate && !validDate(startDate)) || (endDate && !validDate(endDate)) || (!!startDate !== !!endDate) || (startDate && startDate > endDate)) return sendError(res, 'Khoảng ngày báo cáo không hợp lệ', 400);
    const scope = reportScope(req);
    const range = startDate ? { $gte: new Date(`${startDate}T00:00:00+07:00`), $lte: new Date(`${endDate}T23:59:59.999+07:00`) } : undefined;
    const [transactions, sales] = await Promise.all([
      Transaction.find({ ...scope, isDeleted: false, ...(range ? { date: range } : {}) }).populate('categoryId', 'name').populate('ownerId', 'name').sort({ date: 1 }).lean(),
      Sale.find({ ...scope, status: { $ne: 'void' }, ...(range ? { soldAt: range } : {}) }).populate('customerId', 'name phone').sort({ soldAt: 1 }).lean()
    ]);
    const year = startDate && startDate.endsWith('-01-01') && endDate === `${startDate.slice(0, 4)}-12-31` ? Number(startDate.slice(0, 4)) : undefined;
    const period = startDate ? `${startDate.split('-').reverse().join('/')} – ${endDate.split('-').reverse().join('/')}` : 'Toàn bộ thời gian';
    const workbook = buildExcelReport({ transactions, sales, period, year });
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="MoneyFlow-${startDate || 'all'}-${endDate || 'time'}.xlsx"`);
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    return sendError(res, 'Lỗi xuất Excel: ' + error.message, 500);
  }
};

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
      Object.assign(filter, ownDetailsFilter(req));
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
