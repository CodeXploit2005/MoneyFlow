import { ENV } from '../config/env.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import Transaction from '../models/Transaction.js';
import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';
import Debt from '../models/Debt.js';
import Budget from '../models/Budget.js';
import { addDays, determineWarrantyStatus } from './dateUtils.js';
import { CategoryService } from '../services/categoryService.js';

export const autoSeedIfEmpty = async () => {
  if (ENV.USE_IN_MEMORY_DB !== 'true' || ENV.NODE_ENV === 'production') throw new Error('Demo seeding is restricted to temporary development databases');
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return;
    }

    console.log('🌱 Database is empty. Auto-seeding initial demo data...');

    // 1. Tạo Users
    const userAdmin = await User.create({
      name: 'Nguyễn Văn Minh (Chủ Shop)',
      email: 'admin@moneyflow.vn',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bankInfo: {
        bankName: 'MBBank - Ngân hàng Quân Đội',
        bankCode: 'MB',
        accountNumber: '0988888888',
        accountName: 'NGUYEN VAN MINH'
      }
    });

    const userHoang = await User.create({
      name: 'Trần Quốc Hoàng (CTV Sale)',
      email: 'hoang@moneyflow.vn',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bankInfo: {
        bankName: 'Techcombank',
        bankCode: 'TCB',
        accountNumber: '19033333333019',
        accountName: 'TRAN QUOC HOANG'
      }
    });

    const userLan = await User.create({
      name: 'Lê Thị Ngọc Lan (CTV Sale)',
      email: 'lan@moneyflow.vn',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bankInfo: {
        bankName: 'Vietcombank',
        bankCode: 'VCB',
        accountNumber: '0011004445555',
        accountName: 'LE THI NGOC LAN'
      }
    });

    // 2. Tạo Group
    const demoGroup = await Group.create({
      name: 'Team MMO & Bản Quyền Số',
      description: 'Nhóm cộng tác kinh doanh tài khoản AI, bản quyền phần mềm và bảo hành',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      ownerId: userAdmin._id,
      settings: {
        hideAmountsForMembers: false,
        allowMemberInvite: true
      }
    });

    await GroupMember.create([
      { groupId: demoGroup._id, userId: userAdmin._id, role: 'owner' },
      { groupId: demoGroup._id, userId: userHoang._id, role: 'admin' },
      { groupId: demoGroup._id, userId: userLan._id, role: 'member' }
    ]);

    // 3. Khởi tạo Danh Mục Chuẩn cho Users và Group
    await CategoryService.ensureDefaultCategories(userAdmin._id, null);
    await CategoryService.ensureDefaultCategories(userHoang._id, null);
    await CategoryService.ensureDefaultCategories(userLan._id, null);
    await CategoryService.ensureDefaultCategories(userAdmin._id, demoGroup._id);

    // Bổ sung danh mục chi tùy chỉnh cho group
    await Category.create([
      { name: 'Server / VPS / Proxy', type: 'expense', icon: 'server', color: '#ec4899', isSystem: false, isArchived: false, sortOrder: 9, ownerId: userAdmin._id, groupId: demoGroup._id },
      { name: 'Quảng cáo & Marketing', type: 'expense', icon: 'megaphone', color: '#3b82f6', isSystem: false, isArchived: false, sortOrder: 10, ownerId: userAdmin._id, groupId: demoGroup._id }
    ]);

    const groupCats = await Category.find({ groupId: demoGroup._id });
    const catSales = groupCats.find(c => c.name === 'Bán hàng');
    const catCost = groupCats.find(c => c.name === 'Giá vốn / Nhập hàng');
    const catServer = groupCats.find(c => c.name === 'Server / VPS / Proxy');
    const catAds = groupCats.find(c => c.name === 'Quảng cáo & Marketing');

    // 4. Tạo Khách Hàng
    const cust1 = await Customer.create({
      name: 'Phạm Tuấn Anh',
      phone: '0912345678',
      zalo: '0912345678',
      email: 'tuananh@gmail.com',
      note: 'Khách quen, hay mua tài khoản AI',
      ownerId: userAdmin._id,
      groupId: demoGroup._id
    });

    const cust2 = await Customer.create({
      name: 'Đỗ Thuỳ Dung',
      phone: '0987654321',
      zalo: '0987654321',
      email: 'thuydung.design@gmail.com',
      note: 'Designer, thích dùng Canva và ChatGPT',
      ownerId: userHoang._id,
      groupId: demoGroup._id
    });

    const cust3 = await Customer.create({
      name: 'Bùi Quang Huy',
      phone: '0901234567',
      zalo: '0901234567',
      email: 'quanghuy.dev@gmail.com',
      note: 'Dev mua key bản quyền',
      ownerId: userLan._id,
      groupId: demoGroup._id
    });

    // 5. Tạo Các Đơn Bán Mẫu (Sales)
    const now = new Date();

    // Đơn 1: Active
    const sale1Date = now;
    const sale1End = addDays(now, 365);
    const sale1 = await Sale.create({
      productName: 'Tài khoản Gemini Advanced (1 Năm)',
      customerId: cust1._id,
      price: 450000,
      cost: 150000,
      quantity: 1,
      profit: 300000,
      soldAt: sale1Date,
      warrantyDays: 365,
      warrantyStart: sale1Date,
      warrantyEnd: sale1End,
      status: 'active',
      paymentStatus: 'paid',
      paidAmount: 450000,
      notes: 'Email: gemini_cust1@gmail.com | Pass: gemini2026',
      ownerId: userAdmin._id,
      groupId: demoGroup._id
    });
    await Transaction.create({
      type: 'income',
      amount: 450000,
      title: 'Bán Tài khoản Gemini Advanced (1 Năm)',
      categoryId: catSales._id,
      date: sale1Date,
      counterparty: cust1.name,
      ownerId: userAdmin._id,
      groupId: demoGroup._id,
      saleId: sale1._id
    });
    await Transaction.create({
      type: 'expense',
      amount: 150000,
      title: 'Giá vốn: Tài khoản Gemini Advanced (1 Năm)',
      categoryId: catCost._id,
      date: sale1Date,
      counterparty: 'Nhà cung cấp AI',
      ownerId: userAdmin._id,
      groupId: demoGroup._id,
      saleId: sale1._id
    });

    // Đơn 2: Sắp hết hạn trong 2 ngày
    const sale2Date = addDays(now, -28);
    const sale2End = addDays(now, 2);
    const sale2 = await Sale.create({
      productName: 'ChatGPT Plus 1 Tháng (Chính Chủ)',
      customerId: cust2._id,
      price: 250000,
      cost: 90000,
      quantity: 1,
      profit: 160000,
      soldAt: sale2Date,
      warrantyDays: 30,
      warrantyStart: sale2Date,
      warrantyEnd: sale2End,
      status: determineWarrantyStatus(sale2End, now),
      paymentStatus: 'paid',
      paidAmount: 250000,
      notes: 'Tài khoản OpenAI dung@outlook.com',
      ownerId: userHoang._id,
      groupId: demoGroup._id
    });
    await Transaction.create({
      type: 'income',
      amount: 250000,
      title: 'Bán ChatGPT Plus 1 Tháng',
      categoryId: catSales._id,
      date: sale2Date,
      counterparty: cust2.name,
      ownerId: userHoang._id,
      groupId: demoGroup._id,
      saleId: sale2._id
    });
    await Transaction.create({
      type: 'expense',
      amount: 90000,
      title: 'Giá vốn: ChatGPT Plus',
      categoryId: catCost._id,
      date: sale2Date,
      counterparty: 'Kho Thẻ US',
      ownerId: userHoang._id,
      groupId: demoGroup._id,
      saleId: sale2._id
    });

    // Đơn 3: Hết hạn
    const sale3Date = addDays(now, -45);
    const sale3End = addDays(now, -15);
    const sale3 = await Sale.create({
      productName: 'Canva Pro Nâng Cấp Email 30 Ngày',
      customerId: cust3._id,
      price: 120000,
      cost: 30000,
      quantity: 2,
      profit: 180000,
      soldAt: sale3Date,
      warrantyDays: 30,
      warrantyStart: sale3Date,
      warrantyEnd: sale3End,
      status: 'expired',
      paymentStatus: 'paid',
      paidAmount: 240000,
      notes: 'Đã join Edu Team',
      ownerId: userLan._id,
      groupId: demoGroup._id
    });
    await Transaction.create({
      type: 'income',
      amount: 240000,
      title: 'Bán 2x Canva Pro',
      categoryId: catSales._id,
      date: sale3Date,
      counterparty: cust3.name,
      ownerId: userLan._id,
      groupId: demoGroup._id,
      saleId: sale3._id
    });

    // Chi phí Server & Ads
    await Transaction.create([
      {
        type: 'expense',
        amount: 320000,
        title: 'Gia hạn VPS chạy bot tự động',
        categoryId: catServer._id,
        date: addDays(now, -5),
        counterparty: 'Hetzner Cloud',
        note: 'Gói CX21 Đức',
        ownerId: userAdmin._id,
        groupId: demoGroup._id
      },
      {
        type: 'expense',
        amount: 500000,
        title: 'Chạy quảng cáo Facebook tìm khách mua Gemini',
        categoryId: catAds._id,
        date: addDays(now, -3),
        counterparty: 'Meta Ads',
        note: 'Chiến dịch Messenger 3 ngày',
        ownerId: userAdmin._id,
        groupId: demoGroup._id
      }
    ]);

    // Giao dịch ví cá nhân với nhiều danh mục khác nhau
    const personalCats = await Category.find({ ownerId: userAdmin._id, groupId: null });
    const catFood = personalCats.find(c => c.name === 'Ăn uống & Sinh hoạt') || personalCats[0];
    const catTransport = personalCats.find(c => c.name === 'Di chuyển') || personalCats[0];
    const catShopping = personalCats.find(c => c.name === 'Mua sắm') || personalCats[0];
    const catSalary = personalCats.find(c => c.name === 'Lương') || personalCats[0];

    await Transaction.create([
      {
        type: 'expense',
        amount: 85000,
        title: 'Ăn trưa cơm văn phòng & cà phê',
        categoryId: catFood?._id,
        date: addDays(now, -1),
        counterparty: 'Quán cơm Phố Cổ',
        ownerId: userAdmin._id,
        groupId: null
      },
      {
        type: 'expense',
        amount: 120000,
        title: 'Đổ xăng xe máy',
        categoryId: catTransport?._id,
        date: addDays(now, -2),
        counterparty: 'Cây xăng Petrolimex',
        ownerId: userAdmin._id,
        groupId: null
      },
      {
        type: 'expense',
        amount: 350000,
        title: 'Mua chuột bàn phím không dây',
        categoryId: catShopping?._id,
        date: addDays(now, -4),
        counterparty: 'Shopee Mall',
        ownerId: userAdmin._id,
        groupId: null
      },
      {
        type: 'income',
        amount: 15000000,
        title: 'Nhận lương tháng',
        categoryId: catSalary?._id,
        date: addDays(now, -6),
        counterparty: 'Công ty Công nghệ',
        ownerId: userAdmin._id,
        groupId: null
      }
    ]);

    // Công nợ
    await Debt.create([
      {
        type: 'receivable',
        amount: 450000,
        remainingAmount: 450000,
        counterparty: 'Phạm Tuấn Anh',
        dueDate: addDays(now, 5),
        note: 'Nợ tiền mua thêm 1 gói Youtube Family',
        status: 'unpaid',
        ownerId: userAdmin._id,
        groupId: demoGroup._id
      },
      {
        type: 'payable',
        amount: 800000,
        remainingAmount: 400000,
        counterparty: 'Nhà cung cấp Account US',
        dueDate: addDays(now, 10),
        note: 'Tiền nhập lô key ChatGPT, đã trả trước 400k',
        status: 'partial',
        payments: [{ amount: 400000, date: addDays(now, -2), note: 'Chuyển khoản cọc đợt 1' }],
        ownerId: userAdmin._id,
        groupId: demoGroup._id
      }
    ]);

    // Ngân sách
    await Budget.create([
      {
        categoryId: catServer._id,
        amount: 1000000,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        ownerId: userAdmin._id,
        groupId: demoGroup._id
      },
      {
        categoryId: catAds._id,
        amount: 1500000,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        ownerId: userAdmin._id,
        groupId: demoGroup._id
      }
    ]);

    console.log('✅ Auto-seed completed successfully!');
  } catch (err) {
    console.error('Error auto-seeding:', err);
  }
};
