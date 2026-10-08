import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../src/models/User.js';
import Sale from '../src/models/Sale.js';
import Transaction from '../src/models/Transaction.js';
import { register, updateProfile } from '../src/controllers/authController.js';
import { autoSeedIfEmpty } from '../src/utils/autoSeed.js';
import { ENV } from '../src/config/env.js';
import Customer from '../src/models/Customer.js';
import { getCustomers } from '../src/controllers/customerController.js';
import { requireResourceAccess } from '../src/middlewares/resourceGuard.js';

let db;
test.before(async () => { db = await MongoMemoryServer.create(); await mongoose.connect(db.getUri()); });
test.after(async () => { await mongoose.disconnect(); await db.stop(); });
const response = () => ({ code: 200, status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; }, cookie() {} });

test('Profile saves an uploaded avatar in database and rejects unsupported or oversized data', async () => {
  const user = await User.create({name:'Avatar test',email:'avatar-test@example.com',password:'test-password'});
  const avatar = 'data:image/jpeg;base64,/9j/2Q==';
  const done = response();await updateProfile({user,body:{avatar}},done);assert.equal(done.code,200);assert.equal((await User.findById(user._id)).avatar,avatar);
  for (const invalid of ['data:image/svg+xml;base64,PHN2Zz4=', 'javascript:alert(1)', 'https://example.com/'+'a'.repeat(500000)]) {
    const denied=response();await updateProfile({user,body:{avatar:invalid}},denied);assert.equal(denied.code,400);assert.equal((await User.findById(user._id)).avatar,avatar);
  }
  const removed=response();await updateProfile({user,body:{avatar:''}},removed);assert.equal(removed.code,200);assert.equal((await User.findById(user._id)).avatar,'');
});
test('Self-registration creates a normal account and categories, with no example sales or transactions', async () => {
  const res = response();
  await register({ body: { name: 'Test user', email: ' TEST@EXAMPLE.COM ', password: 'test-password', role: 'admin' } }, res);
  assert.equal(res.code, 201, JSON.stringify(res.body));
  const user = await User.findOne({ email: 'test@example.com' });
  assert.ok(user);
  assert.equal(user.toObject().role, undefined);
  assert.equal(await Sale.countDocuments(), 0);
  assert.equal(await Transaction.countDocuments(), 0);
});
test('Retired demo emails cannot create new accounts', async () => {
  const res = response();
  await register({ body: { name: 'Test', email: ' ADMIN@MONEYFLOW.VN ', password: 'test-password' } }, res);
  assert.equal(res.code, 400);
  assert.equal(await User.countDocuments({ email: 'admin@moneyflow.vn' }), 0);
});
test('Demo seed refuses persistent database mode before creating records', async () => {
  const previous = ENV.USE_IN_MEMORY_DB;
  ENV.USE_IN_MEMORY_DB = 'false';
  try { await assert.rejects(autoSeedIfEmpty(), /restricted to temporary/); }
  finally { ENV.USE_IN_MEMORY_DB = previous; }
});
test('Personal customer list and ID access are isolated between users', async () => {
  const mine = new mongoose.Types.ObjectId();
  const other = new mongoose.Types.ObjectId();
  const customer = await Customer.create({ name: 'My customer', ownerId: mine });
  await Customer.create({ name: 'Other customer', ownerId: other });
  const list = response();
  await getCustomers({ user: { _id: mine }, query: {}, body: {} }, list);
  assert.equal(list.body.data.customers.length, 1);
  assert.equal(list.body.data.customers[0].name, 'My customer');
  for (const write of [false, true]) {
    let allowed = false;
    const denied = response();
    await requireResourceAccess(Customer, write)({ user: { _id: other }, params: { id: customer._id }, userRoleInGroup: 'admin' }, denied, () => { allowed = true; });
    assert.equal(denied.code, 403);
    assert.equal(allowed, false);
  }
});
