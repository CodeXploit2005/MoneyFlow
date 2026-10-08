import { ENV } from './src/config/env.js';
import User from './src/models/User.js';
import Category from './src/models/Category.js';
import Customer from './src/models/Customer.js';
import Sale from './src/models/Sale.js';
import Transaction from './src/models/Transaction.js';
import Group from './src/models/Group.js';
import GroupMember from './src/models/GroupMember.js';
import Debt from './src/models/Debt.js';
import Budget from './src/models/Budget.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { autoSeedIfEmpty } from './src/utils/autoSeed.js';

const seedData = async () => {
  try {
    if (ENV.USE_IN_MEMORY_DB !== 'true' || ENV.NODE_ENV === 'production') throw new Error('Seed is disabled for persistent databases. Use a separate temporary development database.');
    console.log('🌱 Starting temporary demo database seeding...');
    await connectDB();

    // Chỉ reset dữ liệu trong database RAM kiểm thử
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Customer.deleteMany({}),
      Sale.deleteMany({}),
      Transaction.deleteMany({}),
      Group.deleteMany({}),
      GroupMember.deleteMany({}),
      Debt.deleteMany({}),
      Budget.deleteMany({})
    ]);

    console.log('🧹 Cleaned existing database.');

    // Chạy nạp dữ liệu hoàn chỉnh chuẩn hóa cho hệ thống
    await autoSeedIfEmpty();

    console.log('🎉 Demo data created in temporary database.');
    console.log('--------------------------------------------------');
    console.log('Tài khoản mẫu:');
    console.log('1. admin@moneyflow.vn (Mật khẩu: password123) - Chủ nhóm');
    console.log('2. hoang@moneyflow.vn (Mật khẩu: password123) - Quản trị viên nhóm');
    console.log('3. lan@moneyflow.vn   (Mật khẩu: password123) - Thành viên nhóm');
    console.log('--------------------------------------------------');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedData();
