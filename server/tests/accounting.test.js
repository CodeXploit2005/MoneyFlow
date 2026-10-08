import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Customer from '../src/models/Customer.js';
import '../src/models/User.js';
import Sale from '../src/models/Sale.js';
import Transaction from '../src/models/Transaction.js';
import { createSale, recordPayment } from '../src/controllers/saleController.js';
import { startOfDayVN, getEndOfMonthVN } from '../src/utils/dateUtils.js';
import { ReportService } from '../src/services/reportService.js';
import { CategoryService } from '../src/services/categoryService.js';
import Category from '../src/models/Category.js';

let db;
test.before(async () => { db = await MongoMemoryServer.create(); await mongoose.connect(db.getUri()); });
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
