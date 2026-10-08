import Debt from '../models/Debt.js';
import GroupMember from '../models/GroupMember.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getDebts = async (req, res) => {
  try {
    const { groupId, type, status }: any = req.query;
    const filter: any = {
      ...(groupId ? { groupId } : { ownerId: (req as any).user._id, groupId: null })
    };

    if (type) filter.type = type;
    if (status) filter.status = status;

    const debts = await Debt.find(filter).sort({ dueDate: 1, createdAt: -1 });

    // Tính tổng nợ phải thu và nợ phải trả
    let totalReceivable = 0;
    let totalPayable = 0;

    debts.forEach(d => {
      if (d.status !== 'paid') {
        if (d.type === 'receivable') totalReceivable += d.remainingAmount;
        if (d.type === 'payable') totalPayable += d.remainingAmount;
      }
    });

    return sendSuccess(res, {
      debts,
      summary: {
        totalReceivable,
        totalPayable
      }
    });
  } catch (error) {
    return sendError(res, 'Lỗi lấy danh sách công nợ: ' + error.message, 500);
  }
};

export const createDebt = async (req, res) => {
  try {
    const { type, amount, counterparty, dueDate, note, groupId } = req.body;
    const numAmount = Number(amount);
    if (!Number.isSafeInteger(numAmount) || numAmount <= 0) return sendError(res, 'Số tiền nợ phải là số nguyên dương', 400);

    const debt = await Debt.create({
      type,
      amount: numAmount,
      remainingAmount: numAmount,
      counterparty,
      dueDate: dueDate ? new Date(dueDate) : null,
      note: note || '',
      status: 'unpaid',
      ownerId: req.user._id,
      groupId: groupId || null
    });

    return sendSuccess(res, debt, 'Tạo sổ công nợ thành công', 201);
  } catch (error) {
    return sendError(res, 'Lỗi tạo sổ công nợ: ' + error.message, 500);
  }
};

export const recordDebtPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, note = '' } = req.body;

    const debt = await Debt.findById(id);
    if (!debt) return sendError(res, 'Không tìm thấy sổ nợ', 404);
    if (!await canAccessDebt(debt, req.user._id)) return sendError(res, 'Không có quyền truy cập khoản nợ', 403);

    const payAmount = Number(amount);
    if (!Number.isSafeInteger(payAmount) || payAmount > debt.remainingAmount || payAmount <= 0) return sendError(res, 'Số tiền thanh toán phải lớn hơn 0', 400);

    debt.payments.push({
      amount: payAmount,
      date: new Date(),
      note
    });

    debt.remainingAmount = Math.max(0, debt.remainingAmount - payAmount);
    if (debt.remainingAmount <= 0) {
      debt.status = 'paid';
    } else {
      debt.status = 'partial';
    }

    await debt.save();
    return sendSuccess(res, debt, 'Ghi nhận thanh toán nợ thành công');
  } catch (error) {
    return sendError(res, 'Lỗi thanh toán nợ: ' + error.message, 500);
  }
};

export const deleteDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await Debt.findById(id);
    if (!debt) return sendError(res, 'Không tìm thấy sổ nợ', 404);
    if (!await canAccessDebt(debt, req.user._id)) return sendError(res, 'Không có quyền truy cập khoản nợ', 403);
    await debt.deleteOne();
    return sendSuccess(res, null, 'Đã xóa khoản nợ');
  } catch (error) {
    return sendError(res, 'Lỗi xóa khoản nợ: ' + error.message, 500);
  }
};

async function canAccessDebt(debt, userId) {
 return debt.groupId ? Boolean(await GroupMember.exists({ groupId: debt.groupId, userId })) : String(debt.ownerId) === String(userId);
}
