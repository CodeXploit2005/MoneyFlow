import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import Transaction from '../src/models/Transaction.js';
import Sale from '../src/models/Sale.js';
import Customer from '../src/models/Customer.js';
import '../src/models/Category.js';
import '../src/models/User.js';
import { buildExcelReport, summarizeTransactions } from '../src/services/excelReportService.js';
import { exportExcelReport, getAnnualSummary } from '../src/controllers/reportController.js';

const sales = [329000, 320000, 270000, 189000, 150000, 299000, 270000].map((price, index) => ({
  _id: `order-${index}`, productName: index === 3 ? 'DUOLINGO + CANVA EDU' : index === 4 ? 'GEMINI' : 'CHATGPT',
  customerId: { _id: `customer-${index}`, name: index === 0 ? '=SUM(1,2)' : `Khách ${index}`, phone: '0900123456' },
  price, cost: index === 3 ? 100000 : index === 4 ? 10000 : 150000, quantity: 1, paidAmount: price,
  soldAt: index < 2 ? new Date(`2026-10-0${2 - index}T03:00:00Z`) : new Date('2026-09-25T03:00:00Z'), paymentStatus: 'paid'
}));
const transactions = sales.flatMap(s => [
  { date: s.soldAt, type: 'income', amount: s.price, title: `Bán ${s.productName}`, saleId: s._id },
  { date: s.soldAt, type: 'expense', amount: s.cost, title: `Giá vốn ${s.productName}`, saleId: s._id }
]);

test('Annual totals reconcile seven sales and costs without counting costs twice', () => {
  const annual = summarizeTransactions(transactions, 2026);
  assert.equal(annual.income, 1827000);
  assert.equal(annual.expense, 860000);
  assert.equal(annual.net, 967000);
  assert.equal(annual.months.length, 12);
  assert.equal(annual.months[8].net, 618000);
  assert.equal(annual.months[9].net, 349000);
  assert.equal(annual.months.reduce((sum, m) => sum + m.net, 0), annual.net);
  const boundary = summarizeTransactions([
    { date: '2025-12-31T16:59:59.999Z', type: 'income', amount: 9 },
    { date: '2025-12-31T17:00:00Z', type: 'income', amount: 123 },
    { date: '2026-12-31T17:00:00Z', type: 'income', amount: 999 }
  ], 2026);
  assert.equal(boundary.income, 123);
  assert.equal(boundary.months[0].income, 123);
});

test('XLSX round trip preserves five styled sheets, numeric totals, dates and literal customer names', async () => {
  const book = buildExcelReport({ transactions, sales, period: 'Năm 2026', year: 2026 });
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(await book.xlsx.writeBuffer());
  assert.deepEqual(loaded.worksheets.map(s => s.name), ['Tổng quan', 'Đơn bán', 'Khách hàng', 'Sản phẩm', 'Thu chi']);
  const overview = loaded.getWorksheet('Tổng quan');
  assert.equal(overview.getCell('B22').value.result, 1827000);
  assert.equal(overview.getCell('C22').value.result, 860000);
  assert.equal(overview.getCell('D22').value.result, 967000);
  const orders = loaded.getWorksheet('Đơn bán');
  assert.equal(orders.getCell('B10').value.toISOString(), '2026-10-02T00:00:00.000Z');
  assert.equal(orders.getCell('C10').value, '=SUM(1,2)');
  assert.equal(orders.getCell('G10').value, 329000);
  assert.equal(orders.getCell('I17').value.result, 967000);
  assert.equal(orders.getCell('F17').value, null); // Do not sum unit prices.
  assert.equal(loaded.getWorksheet('Khách hàng').getCell('B10').value, '0900123456');
  for (const sheet of loaded.worksheets) {
    assert.equal(sheet.views[0].state, 'normal');
    assert.equal(sheet.views[0].activeCell, 'A1');
    assert.equal(sheet.views[0].showGridLines, false);
    assert.ok(sheet.autoFilter);
    assert.equal(sheet.getCell('A9').fill.fgColor.argb, '008675');
    assert.equal(sheet.pageSetup.orientation, 'landscape');
    assert.ok(sheet.getColumn(1).width >= 16);
    const titleCells = [];
    sheet.eachRow(row => row.eachCell(cell => {
      if (cell.type !== ExcelJS.ValueType.Merge && typeof cell.value === 'string' && cell.value.startsWith('MoneyFlow | BÁO CÁO')) titleCells.push(cell.address);
    }));
    assert.deepEqual(titleCells, ['A1']);
    assert.equal(sheet.getCell(1, sheet.columnCount + 1).value, null);
  }
  assert.equal(overview.views[0].zoomScale, 100);
  assert.ok(overview.getColumn(4).width >= 40);
  const longBook = buildExcelReport({ transactions: [], sales: Array.from({ length: 30 }, (_, i) => ({ ...sales[0], _id: `long-${i}` })), period: 'Dài' });
  assert.equal(longBook.getWorksheet('Đơn bán').views[0].topLeftCell, 'A10');
  assert.equal(longBook.getWorksheet('Tổng quan').views[0].state, 'normal');
  const empty = buildExcelReport({ transactions: [], sales: [], period: 'Trống', year: 2026 });
  assert.equal(empty.getWorksheet('Đơn bán').getCell('G10').value, 0);
});

let db;
test.before(async () => {
  db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(db.getUri());
});
test.after(async () => { await mongoose.disconnect(); await db.stop(); });
const response = () => ({ code: 200, headers: {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, send(body) { this.body = body; return this; }, setHeader(key, value) { this.headers[key] = value; } });

test('Export and annual summary respect personal/group privacy, deletion, void sales and VN cutoffs', async () => {
  const ownerId = new mongoose.Types.ObjectId(), otherId = new mongoose.Types.ObjectId(), groupId = new mongoose.Types.ObjectId();
  const categoryId = new mongoose.Types.ObjectId();
  for (const [owner, group, amount, deleted, date] of [
    [ownerId, null, 329000, false, '2026-10-01T03:00:00Z'],
    [ownerId, null, 150000, true, '2026-10-01T03:00:00Z'],
    [otherId, null, 999, false, '2026-10-01T03:00:00Z'],
    [ownerId, groupId, 123, false, '2026-10-01T03:00:00Z'],
    [otherId, groupId, 456, false, '2026-10-01T03:00:00Z'],
    [ownerId, null, 17, false, '2025-12-31T17:00:00Z'],
    [ownerId, null, 7, false, '2025-12-31T16:59:59.999Z']
  ]) await Transaction.create({ ownerId: owner, groupId: group, categoryId, type: 'income', amount, isDeleted: deleted, date, title: 'Test' });
  const customer = await Customer.create({ name: 'Khách', ownerId });
  for (const status of ['active', 'void']) await Sale.create({ ownerId, customerId: customer._id, productName: 'CHATGPT', price: 329000, cost: 150000, quantity: 1, paidAmount: 329000, soldAt: '2026-10-01T03:00:00Z', warrantyEnd: '2027-01-01', status });
  const personal = response();
  await getAnnualSummary({ user: { _id: ownerId }, query: { year: '2026' } }, personal);
  assert.equal(personal.code, 200);
  assert.equal(personal.body.data.annual.income, 329017);
  assert.equal(personal.body.data.allTime.income, 329024);
  const memberReq = { user: { _id: ownerId }, query: { groupId: String(groupId), year: '2026' }, userRoleInGroup: 'member', group: { settings: { hideAmountsForMembers: true } } };
  const member = response(); await getAnnualSummary(memberReq, member);
  assert.equal(member.body.data.annual.income, 123);
  const manager = response(); await getAnnualSummary({ ...memberReq, userRoleInGroup: 'owner' }, manager);
  assert.equal(manager.body.data.allTime.income, 579);
  const exported = response();
  await exportExcelReport({ user: { _id: ownerId }, query: { startDate: '2026-10-01', endDate: '2026-10-31' } }, exported);
  assert.equal(exported.code, 200);
  assert.match(exported.headers['Content-Type'], /spreadsheetml/);
  const book = new ExcelJS.Workbook(); await book.xlsx.load(exported.body);
  assert.equal(book.getWorksheet('Đơn bán').getCell('G11').value.result, 329000);
  assert.equal(book.getWorksheet('Thu chi').getCell('D11').value.result, 329000);
  const privateExport = response(); await exportExcelReport(memberReq, privateExport);
  const privateBook = new ExcelJS.Workbook(); await privateBook.xlsx.load(privateExport.body);
  assert.equal(privateBook.getWorksheet('Thu chi').getCell('D11').value.result, 123);
  for (const query of [{ startDate: '2026-02-30', endDate: '2026-03-01' }, { startDate: '2026-10-01' }, { startDate: '2026-10-31', endDate: '2026-10-01' }]) {
    const invalid = response(); await exportExcelReport({ user: { _id: ownerId }, query }, invalid);
    assert.equal(invalid.code, 400);
  }
});
