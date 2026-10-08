import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { CategoryService } from '../services/categoryService.js';
import { getSocketIO } from '../sockets/socketHandler.js';
import { ownDetailsFilter } from '../utils/groupPolicy.js';
import Debt from '../models/Debt.js';
import GroupMember from '../models/GroupMember.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { correctDebtPayment } from '../services/debtCorrectionService.js';

export const updateDebt = async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0) return sendError(res, 'Tổng nợ phải là số nguyên dương', 400);
  const session = await mongoose.startSession();
  try {
    const debt = await session.withTransaction(async () => {
      const record = await Debt.findById(req.params.id).session(session);
      if (!record) throw new Error('Không tìm thấy khoản nợ');
      if (req.body.expectedAmount !== undefined && record.amount !== Number(req.body.expectedAmount)) throw new Error('Tổng nợ vừa thay đổi. Hãy tải lại trước khi sửa');
      const paid = record.payments.reduce((sum, payment) => sum + payment.amount, 0);
      if (amount < paid) throw new Error('Tổng nợ không thể nhỏ hơn số tiền đã thanh toán');
      record.history.push({ modifiedBy: req.user._id, action: 'update', changes: { amount: { from: record.amount, to: amount } } });
      record.amount = amount;
      record.remainingAmount = amount - paid;
      record.status = record.remainingAmount === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
      await record.save({ session });
      return record;
    });
    return sendSuccess(res, debt, 'Đã sửa tổng nợ và tính lại số còn phải thanh toán');
  } catch (error) { return sendError(res, error.message, 400); }
  finally { await session.endSession(); }
};

export const updateDebtPayment = async (req, res) => {
  try {
    const debt = await correctDebtPayment({ debtId: req.params.id, paymentId: req.params.paymentId, amount: Number(req.body.amount), actorId: req.user._id, expectedAmount: req.body.expectedAmount === undefined ? undefined : Number(req.body.expectedAmount) });
    if (debt.groupId) getSocketIO()?.to(`group_${debt.groupId}`).emit('transaction:updated', { debtId: debt._id });
    return sendSuccess(res, debt, 'Đã sửa thanh toán và đồng bộ số liệu liên quan');
  } catch (error) { return sendError(res, error.message, 400); }
};

export const getDebts = async (req, res) => {
  try {
    const { groupId, type, status }: any = req.query;
    const filter: any = {
      ...(groupId ? { groupId } : { ownerId: (req as any).user._id, groupId: null })
    };

    Object.assign(filter, ownDetailsFilter(req));
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
  const payAmount = Number(req.body.amount);
  const requestId = req.body.requestId;
  if (requestId !== undefined && (typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId))) return sendError(res, 'Mã yêu cầu không hợp lệ', 400);
  if (!Number.isSafeInteger(payAmount) || payAmount <= 0) return sendError(res, 'Số tiền phải là số nguyên dương', 400);
  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      const debt = await Debt.findById(req.params.id).session(session);
      if (!debt) throw new Error('Không tìm thấy sổ nợ');
      if (!await canAccessDebt(debt, req.user._id)) throw new Error('Không có quyền truy cập khoản nợ');
      const previous = requestId ? debt.payments.find(payment => payment.requestId === requestId) : null;
      if (previous) {
        if (previous.amount !== payAmount) throw new Error('Mã yêu cầu đã được sử dụng với số tiền khác');
        updated = debt; return;
      }
      if (payAmount > debt.remainingAmount) throw new Error('Số tiền vượt quá khoản nợ còn lại');
      const type = debt.type === 'receivable' ? 'income' : 'expense';
      const category = await CategoryService.getSystemCategory(debt.ownerId, debt.groupId, type, type === 'income' ? 'Thu hồi công nợ' : 'Thanh toán công nợ');
      const date = new Date();
      const [tx] = await Transaction.create([{
        type, amount: payAmount, title: `${type === 'income' ? 'Thu nợ' : 'Trả nợ'}: ${debt.counterparty}`,
        categoryId: category._id, date, note: req.body.note || '', counterparty: debt.counterparty,
        ownerId: debt.ownerId, groupId: debt.groupId, debtId: debt._id,
        history: [{ modifiedBy: req.user._id, action: 'create', modifiedAt: date }]
      }], { session });
      debt.remainingAmount -= payAmount;
      debt.status = debt.remainingAmount === 0 ? 'paid' : 'partial';
      debt.payments.push({ amount: payAmount, date, note: req.body.note || '', transactionId: tx._id, requestId: requestId || null });
      await debt.save({ session });
      updated = debt;
    });
    if (updated.groupId) getSocketIO()?.to(`group_${updated.groupId}`).emit('transaction:created', { debtId: updated._id });
    return sendSuccess(res, updated, 'Đã cập nhật công nợ và sổ thu chi');
  } catch (error) { return sendError(res, error.message, 400); }
  finally { await session.endSession(); }
};

export const deleteDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await Debt.findById(id);
    if (!debt) return sendError(res, 'Không tìm thấy sổ nợ', 404);
    if (!await canAccessDebt(debt, req.user._id)) return sendError(res, 'Không có quyền truy cập khoản nợ', 403);
    if (debt.payments.length) return sendError(res, 'Khoản nợ đã có thanh toán cần giữ lại để đối soát lịch sử', 400);
    await debt.deleteOne();
    return sendSuccess(res, null, 'Đã xóa khoản nợ');
  } catch (error) {
    return sendError(res, 'Lỗi xóa khoản nợ: ' + error.message, 500);
  }
};

async function canAccessDebt(debt, userId) {
 return debt.groupId ? Boolean(await GroupMember.exists({ groupId: debt.groupId, userId })) : String(debt.ownerId) === String(userId);
}
