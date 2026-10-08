import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Sale from '../models/Sale.js';

// Update both sides of a sale-linked correction together, including legacy
// payment records that did not store their transaction IDs.
export async function correctLinkedAmount(id, amount, actorId) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Số tiền phải là số nguyên lớn hơn 0.');
  const session = await mongoose.startSession();
  let correctedSale;
  try {
    await session.withTransaction(async () => {
      const tx = await Transaction.findById(id).session(session);
      if (!tx || !tx.saleId || tx.isDeleted) throw new Error('Giao dịch không còn khả dụng.');
      const sale = await Sale.findById(tx.saleId).session(session);
      if (!sale || sale.status === 'void') throw new Error('Đơn bán không còn khả dụng.');
      const sameId = value => String(value) === String(tx._id);
      const renewal = sale.renewals.find(record => sameId(record.transactionId));
      const claim = sale.claims.find(record => sameId(record.costTransactionId));
      if (sameId(sale.costTransactionId)) {
        if (!Number.isSafeInteger(amount / sale.quantity)) throw new Error('Tổng giá vốn phải chia hết cho số lượng sản phẩm.');
        sale.cost = amount / sale.quantity;
        sale.profit = (sale.price - sale.cost) * sale.quantity;
      } else if (renewal) {
        renewal.price = amount;
      } else if (claim) {
        claim.cost = amount;
      } else if (tx.type === 'income') {
        const renewalIds = sale.renewals.map(record => record.transactionId).filter(Boolean);
        const receipts = await Transaction.find({saleId: sale._id, type: 'income', isDeleted: false, _id: {$nin: renewalIds}}).session(session);
        const paid = receipts.reduce((sum, receipt) => sum + (sameId(receipt._id) ? amount : receipt.amount), 0);
        if (paid > sale.price * sale.quantity) throw new Error('Tổng tiền đã thu vượt giá trị đơn bán. Vui lòng kiểm tra giá bán trước.');
        sale.paidAmount = paid;
        sale.paymentStatus = paid === 0 ? 'unpaid' : paid === sale.price * sale.quantity ? 'paid' : 'partial';
        sale.payments = receipts.filter(receipt => String(receipt._id) !== String(sale.incomeTransactionId)).map(receipt => ({amount: sameId(receipt._id) ? amount : receipt.amount, date: receipt.date, method: receipt.method, note: receipt.note})) as any;
      } else {
        throw new Error('Chưa xác định được khoản chi tương ứng trong đơn bán.');
      }
      tx.history.push({modifiedBy: actorId, action: 'update', changes: {amount: {from: tx.amount, to: amount}}});
      tx.amount = amount;
      await sale.save({session});
      await tx.save({session});
      correctedSale = sale;
    });
    return correctedSale;
  } finally {
    await session.endSession();
  }
}
