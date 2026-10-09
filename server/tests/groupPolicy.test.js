import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Group from '../src/models/Group.js';
import GroupMember from '../src/models/GroupMember.js';
import Sale from '../src/models/Sale.js';
import Customer from '../src/models/Customer.js';
import Transaction from '../src/models/Transaction.js';
import Invite from '../src/models/Invite.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { CategoryService } from '../src/services/categoryService.js';
let db, server, origin, owner, member, outsider, group, customer, ownerSale, memberSale;
const id = value => String(value._id || value);
async function request(user, path, method = 'GET', body) {
 const response = await fetch(origin + '/api' + path, { method, headers: { Authorization: 'Bearer ' + generateAccessToken({ userId: id(user) }), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
 const text = await response.text();
 let data; try { data = JSON.parse(text).data; } catch { data = text; }
 return { status: response.status, data, text };
}
test.before(async () => {
 db = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(db.getUri()); await GroupMember.init();
 [owner, member, outsider] = await User.create(['owner', 'member', 'outsider'].map(name => ({ name, email: name + '@policy.test', password: 'secret123' })));
 group = await Group.create({ name: 'Policy team', ownerId: owner._id, settings: { hideAmountsForMembers: true, allowMemberInvite: false } });
 await GroupMember.create([{ groupId: group._id, userId: owner._id, role: 'owner' }, { groupId: group._id, userId: member._id, role: 'member' }]);
 await CategoryService.ensureDefaultCategories(owner._id, group._id);
 customer = await Customer.create({ name: 'Same name', ownerId: owner._id, groupId: group._id });
 ownerSale = await Sale.create({ ownerId: owner._id, groupId: group._id, customerId: customer._id, productName: 'Owner item', price: 100, cost: 20, profit: 80, paidAmount: 0, paymentStatus: 'unpaid', warrantyEnd: new Date(Date.now() + 86400000) });
 memberSale = await Sale.create({ ownerId: member._id, groupId: group._id, customerId: customer._id, productName: 'Member item', price: 100, cost: 20, profit: 80, warrantyEnd: new Date(Date.now() + 86400000) });
 const category = await CategoryService.getSystemCategory(owner._id, group._id, 'Bán hàng', 'income');
 await Transaction.create([{ ownerId: owner._id, groupId: group._id, categoryId: category._id, amount: 100, title: 'Private owner transaction', type: 'income' }, { ownerId: member._id, groupId: group._id, categoryId: category._id, amount: 50, title: 'Own member transaction', type: 'income' }]);
 server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); origin = 'http://127.0.0.1:' + server.address().port;
});
test.after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); await db?.stop(); });
test('Outsiders cannot list, read, export or rank another group', async () => {
 for (const path of [`/groups/${group._id}`, `/sales?groupId=${group._id}`, `/sales/${ownerSale._id}`, `/transactions?groupId=${group._id}`, `/reports/export-csv?groupId=${group._id}`, `/reports/export-excel?groupId=${group._id}`, `/reports/annual-summary?groupId=${group._id}&year=2026`, `/leaderboard/${group._id}`]) assert.equal((await request(outsider, path)).status, 403, path);
});
test('Private details apply across sales, warranties, activity, transactions and CSV while shared aggregates remain available', async () => {
 const sales = await request(member, `/sales?groupId=${group._id}`); assert.equal(sales.status, 200); assert.deepEqual(sales.data.sales.map(item => item.productName), ['Member item']);
 assert.equal((await request(member, `/sales/${ownerSale._id}`)).status, 403);
 const warranties = await request(member, `/warranties?groupId=${group._id}`); assert.equal(warranties.status, 200); assert.equal(warranties.data.length, 1);
 const activity = await request(member, `/groups/${group._id}/activity`); assert.equal(activity.status, 200); assert.ok(activity.data.every(item => item.actor === 'member'));
 const transactions = await request(member, `/transactions?groupId=${group._id}`); assert.equal(transactions.data.transactions.length, 1);
 const csv = await request(member, `/reports/export-csv?groupId=${group._id}`); assert.ok(csv.text.includes('Own member transaction')); assert.ok(!csv.text.includes('Private owner transaction'));
 assert.equal((await request(member, `/leaderboard/${group._id}`)).data.length, 2);
 assert.equal((await request(owner, `/sales?groupId=${group._id}`)).data.sales.length, 2);
});
test('Members cannot edit another persons money, shared budgets, or privacy settings', async () => {
 assert.equal((await request(member, `/sales/${ownerSale._id}/payments`, 'POST', { amount: 10 })).status, 403);
 assert.equal((await request(member, `/groups/${group._id}/settings`, 'PUT', { hideAmountsForMembers: false })).status, 403);
 const category = await CategoryService.getSystemCategory(owner._id, group._id, 'Khác', 'expense');
 assert.equal((await request(member, '/budgets', 'POST', { groupId: id(group), categoryId: id(category), amount: 100 })).status, 403);
});
test('Invite policy consistently covers codes and emails', async () => {
 assert.equal((await request(member, `/groups/${group._id}/invites`, 'POST', {})).status, 403);
 assert.equal((await request(member, `/groups/${group._id}/invite-email`, 'POST', { email: outsider.email })).status, 403);
 assert.equal((await request(owner, `/groups/${group._id}/settings`, 'PUT', { allowMemberInvite: true })).status, 200);
 assert.equal((await request(member, `/groups/${group._id}/invites`, 'POST', {})).status, 201);
 assert.equal((await request(member, `/groups/${group._id}/invite-email`, 'POST', { email: outsider.email })).status, 200);
});
test('Concurrent receipts cannot overcollect or create unlinked ledger entries', async () => {
 const results = await Promise.all([request(owner, `/sales/${ownerSale._id}/payments`, 'POST', { amount: 100 }), request(owner, `/sales/${ownerSale._id}/payments`, 'POST', { amount: 100 })]);
 assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
 assert.equal((await Sale.findById(ownerSale._id)).paidAmount, 100);
 const ledger = await Transaction.find({ saleId: ownerSale._id }); assert.equal(ledger.length, 1); assert.equal(ledger[0].amount, 100);
});
test('Customer detail never includes matching counterparties from another workspace', async () => {
 const personal = await Customer.create({ name: 'Same name', ownerId: member._id });
 const result = await request(member, `/customers/${personal._id}`); assert.equal(result.status, 200); assert.equal(result.data.transactions.length, 0);
});
test('Leaderboard supports historical months, excludes void orders and gives equal metrics equal rank', async () => {
 const history = new Date(Date.UTC(2025, 2, 10));
 await Sale.create([{ ownerId: owner._id, groupId: group._id, customerId: customer._id, productName: 'Historical owner', price: 500, profit: 100, soldAt: history, warrantyEnd: history }, { ownerId: member._id, groupId: group._id, customerId: customer._id, productName: 'Historical member', price: 500, profit: 100, soldAt: history, warrantyEnd: history }, { ownerId: owner._id, groupId: group._id, customerId: customer._id, productName: 'Void', price: 900, profit: 900, status: 'void', soldAt: history, warrantyEnd: history }]);
 const result = await request(member, `/leaderboard/${group._id}?period=month&year=2025&month=3&sortBy=profit`); assert.equal(result.status, 200);
 assert.ok(result.data.every(item => item.rank === 1 && item.profit === 100 && item.orders === 1));
 assert.equal((await request(member, `/leaderboard/${group._id}?month=13&year=2025`)).status, 400);
});
test('One-use invite is consumed atomically when different users join concurrently', async () => {
 const invited = await User.create({ name: 'Another', email: 'another@policy.test', password: 'secret123' });
 await Invite.create({ code: 'ONCE1234', groupId: group._id, createdBy: owner._id, maxUses: 1, expiresAt: new Date(Date.now() + 86400000) });
 const results = await Promise.all([request(outsider, '/groups/join', 'POST', { code: 'ONCE1234' }), request(invited, '/groups/join', 'POST', { code: 'ONCE1234' })]);
 assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
 assert.equal((await Invite.findOne({ code: 'ONCE1234' })).usedCount, 1);
});

test('Invalid sale rolls back both receipts and costs instead of leaving orphan ledger records', async () => {
 const before = await Transaction.countDocuments();
 const result = await request(owner, '/sales', 'POST', { groupId: id(group), customerId: id(customer), price: 100, cost: 20, quantity: 1 });
 assert.ok(result.status >= 400);
 assert.equal(await Transaction.countDocuments(), before);
});
test('Only the owner can promote members and deleting a group revokes direct ID access', async () => {
 const otherGroup = await Group.create({ name: 'Separate team', ownerId: outsider._id });
 await GroupMember.create({ userId: outsider._id, groupId: otherGroup._id, role: 'owner' });
 const hidden = await Sale.create({ ownerId: outsider._id, groupId: otherGroup._id, customerId: customer._id, productName: 'Other team item', price: 100, warrantyEnd: new Date() });
 assert.equal((await request(owner, `/sales/${hidden._id}?groupId=${group._id}`)).status, 403);
 await GroupMember.updateOne({ userId: member._id, groupId: group._id }, { role: 'admin' });
 assert.equal((await request(member, `/groups/${group._id}/members/${outsider._id}/role`, 'PUT', { role: 'admin' })).status, 403);
 otherGroup.deletedAt = new Date(); await otherGroup.save();
 assert.equal((await request(outsider, `/sales/${hidden._id}`)).status, 403);
});

test('Administrators update one shared budget without changing its ownership or duplicating it', async () => {
 const category = await CategoryService.getSystemCategory(owner._id, group._id, 'Khác', 'expense');
 const body = { groupId: id(group), categoryId: id(category), amount: 100000, year: 2025, month: 3 };
 const first = await request(owner, '/budgets', 'POST', body); assert.equal(first.status, 200);
 const changed = await request(member, '/budgets', 'POST', { ...body, amount: 120000 }); assert.equal(changed.status, 200);
 assert.equal(changed.data._id, first.data._id); assert.equal(String(changed.data.ownerId), id(owner));
 const list = await request(member, `/budgets?groupId=${group._id}&month=3&year=2025`); assert.equal(list.data.length, 1); assert.equal(list.data[0].amount, 120000);
});

test('Conflicting query and body group IDs cannot bypass group membership checks on create', async () => {
 const otherGroup = await Group.create({ name: 'Unrelated team', ownerId: outsider._id });
 const result = await request(member, `/sales?groupId=${group._id}`, 'POST', { groupId: id(otherGroup), customerId: id(customer), productName: 'Injected group', price: 100 });
 assert.equal(result.status, 400);
 assert.equal(await Sale.countDocuments({ groupId: otherGroup._id }), 0);
});
