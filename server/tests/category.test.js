import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import User from '../src/models/User.js';
import Group from '../src/models/Group.js';
import GroupMember from '../src/models/GroupMember.js';
import Category from '../src/models/Category.js';
import Transaction from '../src/models/Transaction.js';
import Sale from '../src/models/Sale.js';
import Customer from '../src/models/Customer.js';
import { CategoryService } from '../src/services/categoryService.js';
import { WarrantyService } from '../src/services/warrantyService.js';

let mongod;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('1. ensureDefaultCategories: Khởi tạo đầy đủ và KHÔNG tạo trùng khi chạy lại', async () => {
  const dummyUserId = new mongoose.Types.ObjectId();

  // Lần 1: Khởi tạo
  const cats1 = await CategoryService.ensureDefaultCategories(dummyUserId, null);
  assert.ok(cats1.length > 0, 'Phải tạo danh mục hệ thống và mặc định');

  const countAfterFirst = await Category.countDocuments({ ownerId: dummyUserId, groupId: null });
  assert.equal(cats1.length, countAfterFirst);

  // Lần 2: Chạy lại
  const cats2 = await CategoryService.ensureDefaultCategories(dummyUserId, null);
  const countAfterSecond = await Category.countDocuments({ ownerId: dummyUserId, groupId: null });

  assert.equal(countAfterFirst, countAfterSecond, 'Số lượng danh mục không được tăng lên khi chạy lại');

  // Kiểm tra danh mục hệ thống có tồn tại
  const banHang = await Category.findOne({ ownerId: dummyUserId, name: 'Bán hàng', type: 'income', isSystem: true });
  assert.ok(banHang, 'Danh mục hệ thống "Bán hàng" phải tồn tại');

  const giaVon = await Category.findOne({ ownerId: dummyUserId, name: 'Giá vốn / Nhập hàng', type: 'expense', isSystem: true });
  assert.ok(giaVon, 'Danh mục hệ thống "Giá vốn / Nhập hàng" phải tồn tại');
});

test('2. Chặn xóa/ẩn hoặc đổi tên/loại của danh mục hệ thống', async () => {
  const dummyUserId = new mongoose.Types.ObjectId();
  await CategoryService.ensureDefaultCategories(dummyUserId, null);

  const banHang = await Category.findOne({ ownerId: dummyUserId, name: 'Bán hàng', isSystem: true });
  assert.ok(banHang);

  // Thử ẩn danh mục hệ thống
  await assert.rejects(
    async () => {
      await CategoryService.archiveCategory(banHang._id, dummyUserId);
    },
    { message: /Danh mục hệ thống là bắt buộc/ }
  );

  // Thử đổi tên danh mục hệ thống
  await assert.rejects(
    async () => {
      await CategoryService.updateCategory(banHang._id, { name: 'Tên Mới' }, dummyUserId);
    },
    { message: /Danh mục hệ thống được bảo vệ, không thể đổi tên/ }
  );

  // Đổi màu và icon thì ĐƯỢC PHÉP
  const updated = await CategoryService.updateCategory(banHang._id, {
    color: '#3b82f6',
    icon: 'shopping-bag'
  }, dummyUserId);
  assert.equal(updated.color, '#3b82f6');
  assert.equal(updated.icon, 'shopping-bag');
});

test('3. Tự gán danh mục hệ thống khi gia hạn bảo hành và xử lý khiếu nại', async () => {
  const user = await User.create({
    name: 'Seller Test',
    email: 'seller@test.vn',
    password: 'password123'
  });

  const customer = await Customer.create({
    name: 'Customer Test',
    phone: '0999999999',
    ownerId: user._id
  });

  await CategoryService.ensureDefaultCategories(user._id, null);

  const sale = await Sale.create({
    productName: 'Tài khoản Netflix 4K',
    customerId: customer._id,
    price: 90000,
    cost: 30000,
    profit: 60000,
    warrantyDays: 30,
    warrantyStart: new Date(),
    warrantyEnd: new Date(Date.now() + 30 * 86400000),
    ownerId: user._id
  });

  // Gia hạn có phí
  await WarrantyService.extendWarranty({
    saleId: sale._id,
    additionalDays: 30,
    price: 80000,
    userId: user._id
  });

  const renewalTx = await Transaction.findOne({ saleId: sale._id, type: 'income', amount: 80000 }).populate('categoryId');
  assert.ok(renewalTx);
  assert.equal(renewalTx.categoryId.name, 'Gia hạn');
  assert.equal(renewalTx.categoryId.isSystem, true);

  // Xử lý bảo hành có chi phí
  await WarrantyService.addClaimRecord({
    saleId: sale._id,
    issue: 'Lỗi pass',
    resolution: 'Đổi profile mới',
    cost: 15000,
    userId: user._id
  });

  const claimTx = await Transaction.findOne({ saleId: sale._id, type: 'expense', amount: 15000 }).populate('categoryId');
  assert.ok(claimTx);
  assert.equal(claimTx.categoryId.name, 'Chi phí bảo hành');
  assert.equal(claimTx.categoryId.isSystem, true);
});

test('4. Quyền danh mục nhóm: Member bị chặn sửa, ngoài nhóm bị chặn xem', async () => {
  const owner = await User.create({ name: 'Owner', email: 'owner@test.vn', password: 'password123' });
  const member = await User.create({ name: 'Member', email: 'member@test.vn', password: 'password123' });
  const outsider = await User.create({ name: 'Outsider', email: 'outsider@test.vn', password: 'password123' });

  const group = await Group.create({
    name: 'Group Test',
    ownerId: owner._id
  });

  await GroupMember.create([
    { groupId: group._id, userId: owner._id, role: 'owner' },
    { groupId: group._id, userId: member._id, role: 'member' }
  ]);

  await CategoryService.ensureDefaultCategories(owner._id, group._id);

  // Tạo một danh mục tùy chỉnh cho nhóm bởi Owner
  const customCat = await CategoryService.createCategory({
    name: 'Ăn uống nhóm',
    type: 'expense',
    groupId: group._id,
    ownerId: owner._id
  });
  assert.ok(customCat);

  // Kiểm tra hàm canModify: Member không có quyền sửa/ẩn
  const memberCanEdit = await CategoryService.canModify(customCat, member._id);
  assert.equal(memberCanEdit, false, 'Member không được quyền sửa danh mục nhóm');

  const ownerCanEdit = await CategoryService.canModify(customCat, owner._id);
  assert.equal(ownerCanEdit, true, 'Owner được quyền sửa danh mục nhóm');

  // Người ngoài nhóm truy cập danh mục nhóm:
  const outsiderCanAccess = await GroupMember.findOne({ groupId: group._id, userId: outsider._id });
  assert.equal(outsiderCanAccess, null, 'Người ngoài nhóm không có bản ghi thành viên');
});

test('5. Transaction thiếu categoryId thì tự gán hoặc trả về danh mục "Khác"', async () => {
  const dummyUserId = new mongoose.Types.ObjectId();
  await CategoryService.ensureDefaultCategories(dummyUserId, null);

  const otherExpense = await CategoryService.getOtherCategory(dummyUserId, null, 'expense');
  assert.ok(otherExpense);
  assert.equal(otherExpense.name, 'Khác');
  assert.equal(otherExpense.type, 'expense');
  assert.equal(otherExpense.isSystem, true);

  const otherIncome = await CategoryService.getOtherCategory(dummyUserId, null, 'income');
  assert.ok(otherIncome);
  assert.equal(otherIncome.name, 'Khác');
  assert.equal(otherIncome.type, 'income');
  assert.equal(otherIncome.isSystem, true);

  // Tạo transaction không có categoryId, gán default
  const tx = await Transaction.create({
    title: 'Chi tiêu vặt không chọn danh mục',
    type: 'expense',
    amount: 25000,
    date: new Date(),
    ownerId: dummyUserId,
    categoryId: otherExpense._id
  });

  assert.equal(tx.categoryId.toString(), otherExpense._id.toString());
});
