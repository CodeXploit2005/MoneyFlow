import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import Customer from '../src/models/Customer.js';
import '../src/models/User.js';
import Sale from '../src/models/Sale.js';
import Transaction from '../src/models/Transaction.js';
import { createSale, recordPayment } from '../src/controllers/saleController.js';
import { startOfDayVN, getEndOfMonthVN } from '../src/utils/dateUtils.js';
import { ReportService } from '../src/services/reportService.js';
import { CategoryService } from '../src/services/categoryService.js';
import Category from '../src/models/Category.js';
import Debt from '../src/models/Debt.js';
import { recordDebtPayment, deleteDebt, updateDebt, updateDebtPayment } from '../src/controllers/debtController.js';
import { createTransaction, updateTransaction, softDeleteTransaction } from '../src/controllers/transactionController.js';
import { WarrantyService } from '../src/services/warrantyService.js';

let db;
test.before(async () => { db = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(db.getUri()); });
test.after(async () => { await mongoose.disconnect(); await db.stop(); });
function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
test('Partial and unpaid sales only record collected money; later payments reconcile', async () => {
  const user = { _id: new mongoose.Types.ObjectId(), name: 'Test' };
  const customer = await Customer.create({ name: 'Test customer', ownerId: user._id });
  for (const [paymentStatus, paidAmount] of [['partial', 40000], ['unpaid', 0], ['paid', 200000]]) {
    const res = response();
    await createSale({ user, body: { productName: 'Test', customerId: customer._id, price: 100000, cost: 30000, quantity: 2, paymentStatus, paidAmount } }, res);
    assert.equal(res.code, 201, JSON.stringify(res.body));
    const sale = await Sale.findOne({ ownerId: user._id }).sort({ createdAt: -1 });
    assert.equal(sale.profit, 140000);
    assert.equal(sale.paidAmount, paidAmount);
    let txs = await Transaction.find({ saleId: sale._id, type: 'income' });
    assert.equal(txs.reduce((sum, tx) => sum + tx.amount, 0), paidAmount);
    if (paymentStatus !== 'paid') {
      const payment = response();
      await recordPayment({ user, params: { id: sale._id }, body: { amount: 200000 - paidAmount } }, payment);
      assert.equal(payment.code, 200);
      txs = await Transaction.find({ saleId: sale._id, type: 'income' });
      assert.equal(txs.reduce((sum, tx) => sum + tx.amount, 0), 200000);
    }
    const excess = response();
    await recordPayment({ user, params: { id: sale._id }, body: { amount: 1 } }, excess);
    assert.equal(excess.code, 400);
  }
});
test('VN month boundaries and charts include evening UTC transactions on the next VN date', async () => {
  assert.equal(startOfDayVN(new Date('2026-03-31T18:00:00Z')).toISOString(), '2026-03-31T17:00:00.000Z');
  assert.equal(getEndOfMonthVN(new Date('2026-01-31T12:00:00Z')).toISOString(), '2026-01-31T16:59:59.999Z');
  const ownerId = new mongoose.Types.ObjectId();
  await Transaction.create({ ownerId, categoryId: new mongoose.Types.ObjectId(), type: 'income', amount: 123, title: 'Boundary', date: new Date('2026-03-31T18:00:00Z') });
  const chart = await ReportService.getDailyChartData({ userId: ownerId, year: 2026, month: 4 });
  assert.equal(chart[0].income, 123);
  assert.equal(chart.length, 30);
  const overview = await ReportService.getDashboardOverview({ userId: ownerId, year: 2026, month: 4 });
  assert.equal(overview.month.income, 123);
  const previous = await ReportService.getDashboardOverview({ userId: ownerId, year: 2026, month: 3 });
  assert.equal(previous.month.income, 0);
});
test('Monthly overview, daily chart and category totals reconcile for personal and string group IDs', async () => {
  const ownerId = new mongoose.Types.ObjectId(), groupId = new mongoose.Types.ObjectId();
  const category = await Category.create({ownerId,name:'Giá vốn / Nhập hàng',type:'expense'});
  for (const group of [null, groupId]) {
    await Transaction.create([
      {ownerId,groupId:group,categoryId:category._id,type:'income',amount:329000,title:'Sale',date:new Date('2026-10-02T03:00:00Z')},
      {ownerId,groupId:group,categoryId:category._id,type:'expense',amount:150000,title:'Cost',date:new Date('2026-10-02T03:00:00Z')},
      {ownerId,groupId:group,categoryId:category._id,type:'expense',amount:99000,title:'Other month',date:new Date('2026-08-01T03:00:00Z')},
      {ownerId,groupId:group,categoryId:category._id,type:'expense',amount:123,title:'Deleted',isDeleted:true,date:new Date('2026-10-02T03:00:00Z')}
    ]);
    const scope = {userId:String(ownerId),groupId:group?String(group):null,year:2026,month:10};
    const overview = await ReportService.getDashboardOverview(scope);
    const days = await ReportService.getDailyChartData(scope);
    const breakdown = await CategoryService.getExpenseBreakdown({ownerId:String(ownerId),groupId:scope.groupId,startDate:'2026-10-01',endDate:'2026-10-31',excludeCogs:false});
    assert.equal(overview.month.income,329000);assert.equal(overview.month.expense,150000);assert.equal(overview.month.profit,179000);
    assert.equal(overview.month.incomeGrowth,null);assert.equal(overview.month.expenseGrowth,null);
    assert.equal(days.reduce((sum,day)=>sum+day.income,0),overview.month.income);assert.equal(days.reduce((sum,day)=>sum+day.expense,0),overview.month.expense);assert.equal(days[1].income,329000);
    assert.equal(breakdown.totalExpense,overview.month.expense);assert.equal(breakdown.categories[0].percentage,100);
    const withoutCost = await CategoryService.getExpenseBreakdown({ownerId:String(ownerId),groupId:scope.groupId,startDate:'2026-10-01',endDate:'2026-10-31',excludeCogs:true});assert.equal(withoutCost.totalExpense,0);
  }
});

test('Billion-VND debt settlements reconcile cash, charts and remaining debt without rounding', async () => {
  const user = { _id: new mongoose.Types.ObjectId() };
  const receivable = await Debt.create({ ownerId: user._id, type: 'receivable', amount: 3000000001, remainingAmount: 3000000001, counterparty: 'Customer' });
  const payable = await Debt.create({ ownerId: user._id, type: 'payable', amount: 987654321, remainingAmount: 987654321, counterparty: 'Supplier' });
  for (const [debt, amount] of [[receivable, 1234567890], [receivable, 1765432111], [payable, 987654321]]) {
    const res = response();
    await recordDebtPayment({ user, params: { id: debt._id }, body: { amount } }, res);
    assert.equal(res.code, 200, JSON.stringify(res.body));
  }
  assert.equal((await Debt.findById(receivable._id)).remainingAmount, 0);
  assert.equal((await Debt.findById(payable._id)).remainingAmount, 0);
  const now = new Date(Date.now() + 7 * 3600000);
  const scope = { userId: String(user._id), year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const overview = await ReportService.getDashboardOverview(scope);
  assert.equal(overview.month.income, 3000000001);
  assert.equal(overview.month.expense, 987654321);
  assert.equal(overview.balance, 2012345680);
  const daily = await ReportService.getDailyChartData(scope);
  assert.equal(daily.reduce((sum, day) => sum + day.income - day.expense, 0), overview.balance);
  const tx = await Transaction.findOne({ debtId: receivable._id });
  const edited = response(); await updateTransaction({ user, params: { id: tx._id }, body: { amount: receivable.amount + 1 } }, edited);
  assert.equal(edited.code, 400);
  const removed = response(); await softDeleteTransaction({ user, params: { id: tx._id } }, removed);
  assert.equal(removed.code, 400);
  const removedDebt = response(); await deleteDebt({ user, params: { id: receivable._id } }, removedDebt);
  assert.equal(removedDebt.code, 400);
});

test('Concurrent debt requests cannot overcollect, and retrying the same request cannot duplicate cash', async () => {
  const user = { _id: new mongoose.Types.ObjectId() };
  const debt = await Debt.create({ ownerId: user._id, type: 'receivable', amount: 1000000000, remainingAmount: 1000000000, counterparty: 'Concurrent' });
  const settle = async requestId => { const res = response(); await recordDebtPayment({ user, params: { id: debt._id }, body: { amount: 600000000, requestId } }, res); return res; };
  const requests = await Promise.all([settle('payment-request-0001'), settle('payment-request-0001')]);
  assert.deepEqual(requests.map(res => res.code), [200, 200]);
  assert.equal(await Transaction.countDocuments({ debtId: debt._id }), 1);
  const other = await Promise.all([settle('payment-request-0002'), settle('payment-request-0003')]);
  assert.deepEqual(other.map(res => res.code), [400, 400]);
  assert.equal((await Debt.findById(debt._id)).remainingAmount, 400000000);
  assert.equal(await Transaction.countDocuments({ debtId: debt._id }), 1);
});

test('Warranty receipts and expenses roll back when saving the linked sale fails', async () => {
  const ownerId = new mongoose.Types.ObjectId();
  const customer = await Customer.create({ name: 'Warranty rollback', ownerId });
  const sale = await Sale.create({ ownerId, customerId: customer._id, productName: 'Warranty', price: 2000000000, cost: 1000000000, quantity: 1, profit: 1000000000, warrantyDays: 30, warrantyStart: new Date(), warrantyEnd: new Date(Date.now() + 30 * 86400000) });
  await CategoryService.getSystemCategory(ownerId, null, 'income', 'Gia hạn');
  await CategoryService.getSystemCategory(ownerId, null, 'expense', 'Chi phí bảo hành');
  const originalSave = Sale.prototype.save;
  Sale.prototype.save = async function () { throw new Error('Simulated sale save failure'); };
  try {
    await assert.rejects(WarrantyService.extendWarranty({ saleId: String(sale._id), additionalDays: 10, price: 100000001, userId: ownerId }), /Simulated/);
    await assert.rejects(WarrantyService.addClaimRecord({ saleId: String(sale._id), issue: 'Failed part', resolution: '', cost: 50000001, userId: ownerId }), /Simulated/);
  } finally { Sale.prototype.save = originalSave; }
  assert.equal(await Transaction.countDocuments({ saleId: sale._id }), 0);
  const unchanged = await Sale.findById(sale._id);
  assert.equal(unchanged.renewals.length, 0);
  assert.equal(unchanged.claims.length, 0);
});

test('Billion-VND sale reconciles receipts, cost and profit down to one dong', async () => {
  const user = { _id: new mongoose.Types.ObjectId(), name: 'Large sale' };
  const customer = await Customer.create({ ownerId: user._id, name: 'Large customer' });
  const created = response();
  await createSale({ user, body: { customerId: customer._id, productName: 'Large sale', price: 1234567891, cost: 987654321, quantity: 3, paymentStatus: 'partial', paidAmount: 1000000001 } }, created);
  assert.equal(created.code, 201, JSON.stringify(created.body));
  const sale = await Sale.findOne({ ownerId: user._id });
  const collected = response();
  await recordPayment({ user, params: { id: sale._id }, body: { amount: 2703703672, method: 'cash' } }, collected);
  assert.equal(collected.code, 200);
  const totals = await ReportService.getDashboardOverview({ userId: String(user._id) });
  assert.equal(totals.month.income, 3703703673);
  assert.equal(totals.month.expense, 2962962963);
  assert.equal(totals.balance, 740740710);
  assert.equal((await Sale.findById(sale._id)).profit, 740740710);
  assert.equal((await Sale.findById(sale._id)).paymentStatus, 'paid');
  assert.equal((await Transaction.findOne({ saleId: sale._id, amount: 2703703672 })).method, 'cash');
});

test('Debt receipt rolls back if debt history cannot be saved', async () => {
  const user = { _id: new mongoose.Types.ObjectId() };
  const debt = await Debt.create({ ownerId: user._id, type: 'receivable', amount: 100000001, remainingAmount: 100000001, counterparty: 'Rollback' });
  const originalSave = Debt.prototype.save;
  Debt.prototype.save = async function () { throw new Error('Simulated debt save failure'); };
  try {
    const res = response();
    await recordDebtPayment({ user, params: { id: debt._id }, body: { amount: 100000001 } }, res);
    assert.equal(res.code, 400);
  } finally { Debt.prototype.save = originalSave; }
  assert.equal(await Transaction.countDocuments({ debtId: debt._id }), 0);
  assert.equal((await Debt.findById(debt._id)).remainingAmount, 100000001);
});

test('Manual entries cannot attach foreign categories or forge sale-linked receipts', async () => {
  const user = { _id: new mongoose.Types.ObjectId() };
  const foreign = await Category.create({ ownerId: new mongoose.Types.ObjectId(), name: 'Foreign', type: 'income' });
  const own = await Category.create({ ownerId: user._id, name: 'Own expense', type: 'expense' });
  for (const body of [{ categoryId: foreign._id }, { categoryId: own._id }, { saleId: new mongoose.Types.ObjectId() }]) {
    const res = response();
    await createTransaction({ user, body: { amount: 1000000001, type: 'income', ...body } }, res);
    assert.equal(res.code, 400, JSON.stringify(res.body));
  }
  assert.equal(await Transaction.countDocuments({ ownerId: user._id }), 0);
});

test('Correcting yesterday expense from 50k to 150k updates reports and preserves date and audit history', async () => {
  const user = { _id: new mongoose.Types.ObjectId() };
  const category = await Category.create({ ownerId: user._id, name: 'Expense correction', type: 'expense' });
  const date = new Date('2026-09-15T03:00:00Z');
  const tx = await Transaction.create({ ownerId: user._id, categoryId: category._id, type: 'expense', amount: 50000, title: 'Mistyped', date });
  const res = response();
  await updateTransaction({ user, params: { id: tx._id }, body: { amount: 150000 } }, res);
  assert.equal(res.code, 200);
  const corrected = await Transaction.findById(tx._id);
  assert.equal(corrected.date.toISOString(), date.toISOString());
  assert.deepEqual(corrected.history[0].changes.amount, { from: 50000, to: 150000 });
  const overview = await ReportService.getDashboardOverview({ userId: String(user._id), month: 9, year: 2026 });
  assert.equal(overview.month.expense, 150000);
  assert.equal(overview.balance, -150000);
  const chart = await ReportService.getDailyChartData({ userId: String(user._id), month: 9, year: 2026 });
  assert.equal(chart[14].expense, 150000);
});

test('Correcting debt payments updates linked cash, remaining debt and audit trail; total debt is editable', async () => {
  const user = { _id: new mongoose.Types.ObjectId() };
  const debt = await Debt.create({ ownerId: user._id, counterparty: 'Correction', type: 'receivable', amount: 200000, remainingAmount: 200000 });
  const pay = response(); await recordDebtPayment({ user, params: { id: debt._id }, body: { amount: 50000 } }, pay);
  const saved = await Debt.findById(debt._id);
  const payment = saved.payments[0];
  const tx = await Transaction.findById(payment.transactionId);
  const res = response();
  await updateDebtPayment({ user, params: { id: debt._id, paymentId: String(payment._id) }, body: { amount: 150000, expectedAmount: 50000 } }, res);
  assert.equal(res.code, 200, JSON.stringify(res.body));
  const updated = await Debt.findById(debt._id);
  assert.equal(updated.remainingAmount, 50000);
  assert.equal(updated.payments[0].amount, 150000);
  assert.equal(updated.payments[0].date.toISOString(), payment.date.toISOString());
  assert.deepEqual(updated.history[0].changes.amount, { from: 50000, to: 150000 });
  const cash = await Transaction.findById(tx._id);
  assert.equal(cash.amount, 150000);
  assert.equal(cash.date.toISOString(), tx.date.toISOString());
  assert.equal(cash.history.at(-1).changes.amount.from, 50000);
  // Correct from the ledger too, without splitting the two records.
  const ledger = response(); await updateTransaction({ user, params: { id: tx._id }, body: { amount: 100000 } }, ledger);
  assert.equal(ledger.code, 200);
  assert.equal((await Debt.findById(debt._id)).remainingAmount, 100000);
  const total = response(); await updateDebt({ user, params: { id: debt._id }, body: { amount: 300000, expectedAmount: 200000 } }, total);
  assert.equal(total.code, 200);
  assert.equal((await Debt.findById(debt._id)).remainingAmount, 200000);
  const invalid = response(); await updateDebt({ user, params: { id: debt._id }, body: { amount: 99999 } }, invalid);
  assert.equal(invalid.code, 400);
  const overview = await ReportService.getDashboardOverview({ userId: String(user._id) });
  assert.equal(overview.balance, 100000);
});

test('Concurrent corrections reject stale edits and failed debt save rolls back the receipt correction', async () => {
  const user = { _id: new mongoose.Types.ObjectId() };
  const debt = await Debt.create({ ownerId: user._id, counterparty: 'Concurrent correction', type: 'receivable', amount: 500000, remainingAmount: 500000 });
  const pay = response(); await recordDebtPayment({ user, params: { id: debt._id }, body: { amount: 50000 } }, pay);
  const payment = (await Debt.findById(debt._id)).payments[0];
  const correct = async amount => { const res = response(); await updateDebtPayment({ user, params: { id: debt._id, paymentId: String(payment._id) }, body: { amount, expectedAmount: 50000 } }, res); return res.code; };
  const outcomes = await Promise.all([correct(150000), correct(200000)]);
  assert.deepEqual(outcomes.sort(), [200, 400]);
  const before = await Debt.findById(debt._id);
  const originalSave = Debt.prototype.save;
  Debt.prototype.save = async function () { throw new Error('Simulated correction failure'); };
  try {
    const res = response();
    await updateDebtPayment({ user, params: { id: debt._id, paymentId: String(payment._id) }, body: { amount: 300000 } }, res);
    assert.equal(res.code, 400);
  } finally { Debt.prototype.save = originalSave; }
  const after = await Debt.findById(debt._id);
  assert.equal(after.remainingAmount, before.remainingAmount);
  assert.equal((await Transaction.findById(payment.transactionId)).amount, before.payments[0].amount);
});

test('Legacy payment corrections preserve their unlinked nature without inventing cash receipts', async () => {
  const user = { _id: new mongoose.Types.ObjectId() };
  const debt = await Debt.create({ ownerId: user._id, counterparty: 'Legacy', type: 'receivable', amount: 200000, remainingAmount: 150000, status: 'partial', payments: [{ amount: 50000 }] });
  const res = response();
  await updateDebtPayment({ user, params: { id: debt._id, paymentId: String(debt.payments[0]._id) }, body: { amount: 150000, expectedAmount: 50000 } }, res);
  assert.equal(res.code, 200);
  assert.equal((await Debt.findById(debt._id)).remainingAmount, 50000);
  assert.equal(await Transaction.countDocuments({ ownerId: user._id }), 0);
});
