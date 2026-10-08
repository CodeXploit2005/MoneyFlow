import Budget from '../models/Budget.js';
import GroupMember from '../models/GroupMember.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import { getStartOfMonthVN, getEndOfMonthVN, vietnamDate } from '../utils/dateUtils.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getBudgets = async (req, res) => {
  try {
    const { groupId, month, year } = req.query;
    const now = vietnamDate();
    const m = month ? Number(month) : now.getUTCMonth() + 1;
    const y = year ? Number(year) : now.getUTCFullYear();
    if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 1970 || y > 9999) return sendError(res, 'Tháng hoặc năm không hợp lệ', 400);

    const filter = {
      month: m,
      year: y,
      ...(groupId ? { groupId } : { ownerId: req.user._id, groupId: null })
    };

    const budgets = await Budget.find(filter).populate('categoryId', 'name icon color');

    // Tính chi tiêu thực tế cho từng budget
    const startDate = new Date(Date.UTC(y, m - 1, 1) - 7 * 3600000);
    const endDate = getEndOfMonthVN(startDate);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (b) => {
        const spentAgg = await Transaction.aggregate([
          {
            $match: {
              categoryId: b.categoryId?._id,
              isDeleted: false,
              type: 'expense',
              date: { $gte: startDate, $lte: endDate },
              ...(groupId ? { groupId: b.groupId } : { ownerId: req.user._id, groupId: null })
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const spent = spentAgg[0]?.total || 0;
        const remaining = Math.max(0, b.amount - spent);
        const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

        return {
          ...b.toObject(),
          spent,
          remaining,
          percent
        };
      })
    );

    return sendSuccess(res, budgetsWithSpent);
  } catch (error) {
    return sendError(res, 'Lỗi lấy ngân sách: ' + error.message, 500);
  }
};

export const setBudget = async (req, res) => {
  try {
    const { categoryId, amount, month, year, groupId } = req.body;
    if (!Number.isSafeInteger(Number(amount)) || Number(amount) <= 0) return sendError(res, 'Ngân sách phải là số nguyên dương', 400);
    const current = vietnamDate();
    const targetMonth = month === undefined ? current.getUTCMonth() + 1 : Number(month);
    const targetYear = year === undefined ? current.getUTCFullYear() : Number(year);
    if (!Number.isInteger(targetMonth) || targetMonth < 1 || targetMonth > 12 || !Number.isInteger(targetYear) || targetYear < 1970 || targetYear > 9999) return sendError(res, 'Tháng hoặc năm không hợp lệ', 400);
    if (!categoryId) {
      return sendError(res, 'Vui lòng chọn danh mục cho ngân sách', 400);
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return sendError(res, 'Danh mục không tồn tại', 404);
    }
    if (groupId ? String(category.groupId) !== String(groupId) : category.groupId || String(category.ownerId) !== String(req.user._id)) return sendError(res, 'Danh mục không thuộc không gian làm việc', 403);
    if (category.type !== 'expense') {
      return sendError(res, 'Ngân sách chỉ áp dụng cho danh mục loại Chi phí', 400);
    }
    if (category.name === 'Giá vốn / Nhập hàng') {
      return sendError(res, 'Không thể đặt ngân sách cho Giá vốn / Nhập hàng', 400);
    }
    if (category.isArchived) {
      return sendError(res, 'Danh mục này đã bị ẩn, không thể tạo ngân sách', 400);
    }

    const m = targetMonth;
    const y = targetYear;

    const budget = await Budget.findOneAndUpdate(
      {
        categoryId,
        month: m,
        year: y,
        ...(groupId ? { groupId } : { ownerId: req.user._id, groupId: null })
      },
      {
        categoryId,
        amount: Math.round(Number(amount)),
        month: m,
        year: y,
        ownerId: groupId ? req.group.ownerId : req.user._id,
        groupId: groupId || null
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    ).populate('categoryId', 'name icon color');

    return sendSuccess(res, budget, 'Cập nhật ngân sách thành công');
  } catch (error) {
    return sendError(res, 'Lỗi thiết lập ngân sách: ' + error.message, 500);
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id);
    if (!budget) return sendError(res, 'Không tìm thấy ngân sách', 404);
    const allowed = budget.groupId ? Boolean(await GroupMember.exists({ groupId: budget.groupId, userId: req.user._id })) : String(budget.ownerId) === String(req.user._id);
    if (!allowed) return sendError(res, 'Không có quyền truy cập ngân sách', 403);
    await budget.deleteOne();
    return sendSuccess(res, null, 'Đã xóa ngân sách');
  } catch (error) {
    return sendError(res, 'Lỗi xóa ngân sách: ' + error.message, 500);
  }
};
