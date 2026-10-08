import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import User from '../models/User.js';
import Group from '../models/Group.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import { CategoryService } from '../services/categoryService.js';

export async function migrateCategories() {
  console.log('--- BẮT ĐẦU MIGRATION DANH MỤC (CATEGORY MIGRATION) ---');

  // 1. Tạo danh mục cho tất cả Users cá nhân
  const users = await User.find({});
  console.log(`Tìm thấy ${users.length} người dùng.`);
  for (const user of users) {
    await CategoryService.ensureDefaultCategories(user._id, null);
  }
  console.log('✓ Đã khởi tạo danh mục hệ thống & mặc định cho tất cả Users.');

  // 2. Tạo danh mục cho tất cả Groups
  const groups = await Group.find({});
  console.log(`Tìm thấy ${groups.length} nhóm.`);
  for (const group of groups) {
    await CategoryService.ensureDefaultCategories(group.ownerId, group._id);
  }
  console.log('✓ Đã khởi tạo danh mục hệ thống & mặc định cho tất cả Groups.');

  // 3. Chuẩn hóa & gán categoryId cho các Transaction cũ chưa có categoryId hoặc categoryId không hợp lệ
  const transactions = await Transaction.find({});
  console.log(`Kiểm tra ${transactions.length} giao dịch...`);
  let updatedCount = 0;

  for (const tx of transactions) {
    let needsUpdate = false;
    let validCat = null;

    if (tx.categoryId) {
      validCat = await Category.findById(tx.categoryId);
    }

    if (!validCat) {
      needsUpdate = true;
      const ownerId = tx.ownerId;
      const groupId = tx.groupId || null;

      if (tx.type === 'income') {
        if (tx.saleId) {
          validCat = await CategoryService.getSystemCategory(ownerId, groupId, 'income', 'Bán hàng');
        } else {
          validCat = await CategoryService.getOtherCategory(ownerId, groupId, 'income');
        }
      } else {
        if (tx.saleId) {
          validCat = await CategoryService.getSystemCategory(ownerId, groupId, 'expense', 'Giá vốn / Nhập hàng');
        } else {
          validCat = await CategoryService.getOtherCategory(ownerId, groupId, 'expense');
        }
      }
    }

    if (needsUpdate && validCat) {
      tx.categoryId = validCat._id;
      await tx.save();
      updatedCount++;
    }
  }

  console.log(`✓ Đã cập nhật categoryId cho ${updatedCount} giao dịch.`);
  console.log('--- HOÀN TẤT MIGRATION DANH MỤC THÀNH CÔNG ---');
}

import { connectDB } from '../config/db.js';

// Chạy trực tiếp nếu script được gọi qua CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  connectDB()
    .then(async () => {
      await migrateCategories();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Lỗi khi chạy migration:', err);
      process.exit(1);
    });
}
