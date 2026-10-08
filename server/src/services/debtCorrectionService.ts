import mongoose from 'mongoose';
import Debt from '../models/Debt.js';
import Transaction from '../models/Transaction.js';

export async function correctDebtPayment({ debtId, paymentId, transactionId, amount, actorId, expectedAmount }: { debtId: any; paymentId?: string; transactionId?: any; amount: number; actorId: any; expectedAmount?: number }) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Số tiền phải là số nguyên dương');
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const debt = await Debt.findById(debtId).session(session);
      if (!debt) throw new Error('Không tìm thấy khoản nợ');
      const payment = transactionId ? debt.payments.find(item => String(item.transactionId) === String(transactionId)) : debt.payments.id(paymentId);
      if (!payment) throw new Error('Không tìm thấy lần thanh toán');
      if (expectedAmount !== undefined && payment.amount !== expectedAmount) throw new Error('Số tiền vừa được thay đổi. Hãy tải lại trước khi sửa');
      const paid = debt.payments.reduce((sum, item) => sum + (String(item._id) === String(payment._id) ? amount : item.amount), 0);
      if (!Number.isSafeInteger(paid) || paid > debt.amount) throw new Error('Tổng đã thanh toán vượt tổng nợ. Hãy sửa tổng nợ trước');
      const changes = { amount: { from: payment.amount, to: amount }, paymentId: String(payment._id) };
      if (payment.transactionId) {
        const tx = await Transaction.findById(payment.transactionId).session(session);
        if (!tx || tx.isDeleted || String(tx.debtId) !== String(debt._id) || tx.amount !== payment.amount) throw new Error('Chứng từ không khớp khoản nợ. Cần đối soát trước khi sửa');
        tx.history.push({ modifiedBy: actorId, action: 'update', changes });
        tx.amount = amount;
        await tx.save({ session });
      }
      payment.amount = amount;
      debt.remainingAmount = debt.amount - paid;
      debt.status = debt.remainingAmount === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
      debt.history.push({ modifiedBy: actorId, action: 'payment:update', changes });
      await debt.save({ session });
      return debt;
    });
  } finally { await session.endSession(); }
}
