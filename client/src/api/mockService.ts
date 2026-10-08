import {
  User,
  Category,
  Transaction,
  Customer,
  Sale,
  Group,
  GroupMember,
  Budget,
  Debt,
  LeaderboardItem
} from '../types';

const STORAGE_KEY_PREFIX = 'mf_mock_';

const getStore = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
  if (!item) {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    return defaultValue;
  }
};

const setStore = <T>(key: string, value: T): void => {
  localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
};

// Dữ liệu ban đầu mặc định
const INITIAL_USERS: User[] = [
  {
    _id: 'usr_admin',
    name: 'Nguyễn Văn Minh (Chủ Shop)',
    email: 'admin@moneyflow.vn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bankInfo: {
      bankName: 'MBBank - Ngân hàng Quân Đội',
      bankCode: 'MB',
      accountNumber: '0988888888',
      accountName: 'NGUYEN VAN MINH'
    }
  },
  {
    _id: 'usr_hoang',
    name: 'Trần Quốc Hoàng (CTV Sale)',
    email: 'hoang@moneyflow.vn',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bankInfo: {
      bankName: 'Techcombank',
      bankCode: 'TCB',
      accountNumber: '19033333333019',
      accountName: 'TRAN QUOC HOANG'
    }
  },
  {
    _id: 'usr_lan',
    name: 'Lê Thị Ngọc Lan (CTV Sale)',
    email: 'lan@moneyflow.vn',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    bankInfo: {
      bankName: 'Vietcombank',
      bankCode: 'VCB',
      accountNumber: '0011004445555',
      accountName: 'LE THI NGOC LAN'
    }
  }
];

const INITIAL_GROUPS: Group[] = [
  {
    _id: 'grp_mmo',
    name: 'Team MMO & Bản Quyền Số',
    description: 'Nhóm cộng tác kinh doanh tài khoản AI, bản quyền phần mềm và bảo hành',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    ownerId: 'usr_admin',
    settings: {
      hideAmountsForMembers: false,
      allowMemberInvite: true
    },
    memberCount: 3
  }
];

const INITIAL_CATEGORIES: Category[] = [
  { _id: 'cat_sales', name: 'Bán tài khoản & Key', type: 'income', icon: 'shopping-cart', color: '#10b981' },
  { _id: 'cat_renew', name: 'Gia hạn dịch vụ', type: 'income', icon: 'refresh-cw', color: '#06b6d4' },
  { _id: 'cat_vip', name: 'Dịch vụ nâng cấp VIP', type: 'income', icon: 'award', color: '#8b5cf6' },
  { _id: 'cat_cost', name: 'Giá vốn sản phẩm', type: 'expense', icon: 'package', color: '#ef4444' },
  { _id: 'cat_claim', name: 'Chi phí bảo hành / Đổi', type: 'expense', icon: 'shield-alert', color: '#f97316' },
  { _id: 'cat_vps', name: 'Server / VPS / Proxy', type: 'expense', icon: 'server', color: '#ec4899' },
  { _id: 'cat_ads', name: 'Quảng cáo & Marketing', type: 'expense', icon: 'megaphone', color: '#3b82f6' },
  { _id: 'cat_living', name: 'Ăn uống & Sinh hoạt', type: 'expense', icon: 'coffee', color: '#6b7280' }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    _id: 'cust_1',
    name: 'Phạm Tuấn Anh',
    phone: '0912345678',
    zalo: '0912345678',
    email: 'tuananh@gmail.com',
    note: 'Khách quen, hay mua tài khoản AI dài hạn'
  },
  {
    _id: 'cust_2',
    name: 'Đỗ Thuỳ Dung',
    phone: '0987654321',
    zalo: '0987654321',
    email: 'thuydung.design@gmail.com',
    note: 'Designer, dùng Canva Pro và ChatGPT Plus'
  },
  {
    _id: 'cust_3',
    name: 'Bùi Quang Huy',
    phone: '0901234567',
    zalo: '0901234567',
    email: 'quanghuy.dev@gmail.com',
    note: 'Dev mua key Windows & JetBrains'
  }
];

const now = new Date();
const addDaysDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const INITIAL_SALES: Sale[] = [
  {
    _id: 'sale_1',
    productName: 'Tài khoản Gemini Advanced (1 Năm)',
    customerId: INITIAL_CUSTOMERS[0],
    price: 450000,
    cost: 150000,
    quantity: 1,
    profit: 300000,
    soldAt: now.toISOString(),
    warrantyDays: 365,
    warrantyStart: now.toISOString(),
    warrantyEnd: addDaysDate(365),
    status: 'active',
    paymentStatus: 'paid',
    paidAmount: 450000,
    notes: 'Email: gemini_cust1@gmail.com | Pass: gemini2026',
    ownerId: INITIAL_USERS[0],
    groupId: 'grp_mmo'
  },
  {
    _id: 'sale_2',
    productName: 'ChatGPT Plus 1 Tháng (Chính Chủ)',
    customerId: INITIAL_CUSTOMERS[1],
    price: 250000,
    cost: 90000,
    quantity: 1,
    profit: 160000,
    soldAt: addDaysDate(-28),
    warrantyDays: 30,
    warrantyStart: addDaysDate(-28),
    warrantyEnd: addDaysDate(2), // Sắp hết hạn trong 2 ngày!
    status: 'expiring_soon',
    paymentStatus: 'paid',
    paidAmount: 250000,
    notes: 'Tài khoản OpenAI: dung@outlook.com',
    ownerId: INITIAL_USERS[1],
    groupId: 'grp_mmo'
  },
  {
    _id: 'sale_3',
    productName: 'Canva Pro Nâng Cấp Email 30 Ngày',
    customerId: INITIAL_CUSTOMERS[2],
    price: 120000,
    cost: 30000,
    quantity: 2,
    profit: 180000,
    soldAt: addDaysDate(-45),
    warrantyDays: 30,
    warrantyStart: addDaysDate(-45),
    warrantyEnd: addDaysDate(-15),
    status: 'expired',
    paymentStatus: 'paid',
    paidAmount: 240000,
    notes: 'Đã join Edu Team',
    ownerId: INITIAL_USERS[2],
    groupId: 'grp_mmo'
  },
  {
    _id: 'sale_4',
    productName: 'Key Windows 11 Pro Retail',
    customerId: INITIAL_CUSTOMERS[0],
    price: 180000,
    cost: 40000,
    quantity: 1,
    profit: 140000,
    soldAt: now.toISOString(),
    warrantyDays: 30,
    warrantyStart: now.toISOString(),
    warrantyEnd: addDaysDate(30),
    status: 'active',
    paymentStatus: 'paid',
    paidAmount: 180000,
    notes: 'Key: W269N-WFGWX-YVC9B-4J6C9-T83GX',
    ownerId: INITIAL_USERS[1],
    groupId: 'grp_mmo'
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    _id: 'tx_1',
    type: 'income',
    amount: 450000,
    title: 'Bán Tài khoản Gemini Advanced (1 Năm)',
    categoryId: INITIAL_CATEGORIES[0],
    date: now.toISOString(),
    counterparty: 'Phạm Tuấn Anh',
    ownerId: INITIAL_USERS[0],
    groupId: 'grp_mmo'
  },
  {
    _id: 'tx_2',
    type: 'expense',
    amount: 150000,
    title: 'Giá vốn: Gemini Advanced (1 Năm)',
    categoryId: INITIAL_CATEGORIES[3],
    date: now.toISOString(),
    counterparty: 'Kho AI',
    ownerId: INITIAL_USERS[0],
    groupId: 'grp_mmo'
  },
  {
    _id: 'tx_3',
    type: 'income',
    amount: 180000,
    title: 'Bán Key Windows 11 Pro',
    categoryId: INITIAL_CATEGORIES[0],
    date: now.toISOString(),
    counterparty: 'Phạm Tuấn Anh',
    ownerId: INITIAL_USERS[1],
    groupId: 'grp_mmo'
  },
  {
    _id: 'tx_4',
    type: 'expense',
    amount: 320000,
    title: 'Gia hạn VPS chạy bot tự động',
    categoryId: INITIAL_CATEGORIES[5],
    date: addDaysDate(-4),
    counterparty: 'Hetzner Cloud',
    ownerId: INITIAL_USERS[0],
    groupId: 'grp_mmo'
  },
  {
    _id: 'tx_5',
    type: 'expense',
    amount: 500000,
    title: 'Chạy quảng cáo Facebook tìm khách mua Gemini',
    categoryId: INITIAL_CATEGORIES[6],
    date: addDaysDate(-2),
    counterparty: 'Meta Ads',
    ownerId: INITIAL_USERS[0],
    groupId: 'grp_mmo'
  }
];

const INITIAL_DEBTS: Debt[] = [
  {
    _id: 'debt_1',
    type: 'receivable',
    amount: 450000,
    remainingAmount: 450000,
    counterparty: 'Phạm Tuấn Anh',
    dueDate: addDaysDate(5),
    note: 'Nợ tiền mua thêm 1 gói Youtube Family',
    status: 'unpaid'
  },
  {
    _id: 'debt_2',
    type: 'payable',
    amount: 800000,
    remainingAmount: 400000,
    counterparty: 'Nhà cung cấp Account US',
    dueDate: addDaysDate(10),
    note: 'Tiền nhập lô key ChatGPT, đã cọc 400k',
    status: 'partial'
  }
];

const INITIAL_BUDGETS: Budget[] = [
  {
    _id: 'bgt_1',
    categoryId: INITIAL_CATEGORIES[5],
    amount: 1000000,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    spent: 320000,
    remaining: 680000,
    percent: 32
  },
  {
    _id: 'bgt_2',
    categoryId: INITIAL_CATEGORIES[6],
    amount: 1500000,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    spent: 500000,
    remaining: 1000000,
    percent: 33
  }
];

export const MockService = {
  // Auth
  login: async (email: string, pass: string) => {
    const users = getStore('users', INITIAL_USERS);
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Nếu chưa có, tự tạo user demo mới
      user = {
        _id: 'usr_' + Date.now(),
        name: email.split('@')[0],
        email: email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bankInfo: {
          bankName: 'MBBank',
          bankCode: 'MB',
          accountNumber: '0988888888',
          accountName: email.split('@')[0].toUpperCase()
        }
      };
      users.push(user);
      setStore('users', users);
    }
    return { user, accessToken: 'demo_token_' + Date.now() };
  },

  register: async (data: any) => {
    const users = getStore('users', INITIAL_USERS);
    const newUser: User = {
      _id: 'usr_' + Date.now(),
      name: data.name,
      email: data.email,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bankInfo: data.bankInfo || {
        bankName: 'MBBank',
        bankCode: 'MB',
        accountNumber: '',
        accountName: data.name.toUpperCase()
      }
    };
    users.push(newUser);
    setStore('users', users);
    return { user: newUser, accessToken: 'demo_token_' + Date.now() };
  },

  // Transactions
  getTransactions: async (params?: any) => {
    let list = getStore('transactions', INITIAL_TRANSACTIONS);
    if (params?.type) list = list.filter(t => t.type === params.type);
    if (params?.keyword) {
      const q = params.keyword.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.counterparty && t.counterparty.toLowerCase().includes(q)));
    }
    return {
      transactions: list,
      pagination: { page: 1, limit: 20, total: list.length, totalPages: 1 }
    };
  },

  createTransaction: async (data: any) => {
    const list = getStore('transactions', INITIAL_TRANSACTIONS);
    const cats = getStore('categories', INITIAL_CATEGORIES);
    const cat = cats.find(c => c._id === data.categoryId) || cats[0];

    const newTx: Transaction = {
      _id: 'tx_' + Date.now(),
      type: data.type,
      amount: Number(data.amount),
      title: data.title,
      categoryId: cat,
      date: data.date || new Date().toISOString(),
      note: data.note || '',
      method: data.method || 'transfer',
      counterparty: data.counterparty || '',
      ownerId: INITIAL_USERS[0],
      groupId: data.groupId || null
    };

    list.unshift(newTx);
    setStore('transactions', list);
    return newTx;
  },

  updateTransaction: async (id: string, data: any) => {
    const list = getStore('transactions', INITIAL_TRANSACTIONS);
    const idx = list.findIndex(t => t._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setStore('transactions', list);
      return list[idx];
    }
    throw new Error('Không tìm thấy giao dịch');
  },

  deleteTransaction: async (id: string) => {
    let list = getStore('transactions', INITIAL_TRANSACTIONS);
    list = list.filter(t => t._id !== id);
    setStore('transactions', list);
    return true;
  },

  // Categories
  getCategories: async () => {
    return getStore('categories', INITIAL_CATEGORIES);
  },

  createCategory: async (data: any) => {
    const list = getStore('categories', INITIAL_CATEGORIES);
    const newCat: Category = {
      _id: 'cat_' + Date.now(),
      name: data.name,
      type: data.type,
      icon: data.icon || 'tag',
      color: data.color || '#10b981'
    };
    list.push(newCat);
    setStore('categories', list);
    return newCat;
  },

  // Sales
  getSales: async (params?: any) => {
    let list = getStore('sales', INITIAL_SALES);
    if (params?.paymentStatus) list = list.filter(s => s.paymentStatus === params.paymentStatus);
    if (params?.keyword) {
      const q = params.keyword.toLowerCase();
      list = list.filter(s => s.productName.toLowerCase().includes(q) || (s.notes && s.notes.toLowerCase().includes(q)));
    }
    return { sales: list, pagination: { page: 1, limit: 20, total: list.length, totalPages: 1 } };
  },

  createSale: async (data: any) => {
    const sales = getStore('sales', INITIAL_SALES);
    const customers = getStore('customers', INITIAL_CUSTOMERS);

    let cust = customers.find(c => c._id === data.customerId);
    if (!cust && data.newCustomer) {
      cust = {
        _id: 'cust_' + Date.now(),
        name: data.newCustomer.name,
        phone: data.newCustomer.phone || '',
        zalo: data.newCustomer.zalo || ''
      };
      customers.push(cust);
      setStore('customers', customers);
    }

    const price = Number(data.price);
    const cost = Number(data.cost) || 0;
    const qty = Number(data.quantity) || 1;
    const profit = (price - cost) * qty;

    const start = new Date(data.soldAt || new Date());
    const days = Number(data.warrantyDays ?? 30);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const newSale: Sale = {
      _id: 'sale_' + Date.now(),
      productName: data.productName,
      customerId: cust || INITIAL_CUSTOMERS[0],
      price,
      cost,
      quantity: qty,
      profit,
      soldAt: start.toISOString(),
      warrantyDays: days,
      warrantyStart: start.toISOString(),
      warrantyEnd: end.toISOString(),
      status: 'active',
      paymentStatus: data.paymentStatus || 'paid',
      paidAmount: (data.paymentStatus || 'paid') === 'paid' ? price * qty : data.paymentStatus === 'partial' ? Number(data.paidAmount) : 0,
      notes: data.notes || '',
      ownerId: INITIAL_USERS[0],
      groupId: data.groupId || null
    };

    sales.unshift(newSale);
    setStore('sales', sales);

    // Đồng bộ tạo 1 khoản thu và 1 khoản chi (nếu có giá vốn)
    if (newSale.paidAmount !== undefined && newSale.paidAmount > 0) await MockService.createTransaction({
      type: 'income',
      amount: newSale.paidAmount,
      title: `Bán ${data.productName}`,
      categoryId: 'cat_sales',
      date: start.toISOString(),
      counterparty: cust?.name || '',
      groupId: data.groupId
    });

    if (cost > 0) {
      await MockService.createTransaction({
        type: 'expense',
        amount: cost * qty,
        title: `Giá vốn: ${data.productName}`,
        categoryId: 'cat_cost',
        date: start.toISOString(),
        counterparty: 'Kho hàng / Giá vốn',
        groupId: data.groupId
      });
    }

    return newSale;
  },

  recordPayment: async (saleId: string, amount: number) => {
    const sales = getStore('sales', INITIAL_SALES);
    const s = sales.find(item => item._id === saleId);
    if (s) {
      if (!Number.isSafeInteger(Number(amount)) || Number(amount) <= 0 || Number(amount) > s.price * s.quantity - (s.paidAmount || 0)) throw new Error('Số tiền thanh toán không hợp lệ');
      await MockService.createTransaction({ type: 'income', amount: Number(amount), title: 'Thu tiền đơn: ' + s.productName, categoryId: 'cat_sales', date: new Date().toISOString(), groupId: s.groupId });
      s.paidAmount = (s.paidAmount || 0) + Number(amount);
      if (s.paidAmount >= s.price * s.quantity) {
        s.paymentStatus = 'paid';
      } else {
        s.paymentStatus = 'partial';
      }
      setStore('sales', sales);
      return s;
    }
    throw new Error('Không tìm thấy đơn bán');
  },

  // Warranty
  getWarranties: async (params?: any) => {
    let sales = getStore('sales', INITIAL_SALES);
    if (params?.status) sales = sales.filter(s => s.status === params.status);
    return sales;
  },

  extendWarranty: async (saleId: string, days: number, price: number) => {
    const sales = getStore('sales', INITIAL_SALES);
    const s = sales.find(item => item._id === saleId);
    if (s) {
      const oldEnd = new Date(s.warrantyEnd);
      const newEnd = new Date(oldEnd);
      newEnd.setDate(newEnd.getDate() + Number(days));

      s.warrantyDays += Number(days);
      s.warrantyEnd = newEnd.toISOString();
      s.status = 'active';

      if (!s.renewals) s.renewals = [];
      s.renewals.push({
        days,
        price,
        renewedAt: new Date().toISOString(),
        oldEnd: oldEnd.toISOString(),
        newEnd: newEnd.toISOString()
      });

      setStore('sales', sales);

      if (price > 0) {
        await MockService.createTransaction({
          type: 'income',
          amount: price,
          title: `Gia hạn: ${s.productName} (+${days} ngày)`,
          categoryId: 'cat_renew',
          counterparty: s.customerId?.name || 'Khách hàng',
          groupId: s.groupId
        });
      }

      return s;
    }
    throw new Error('Không tìm thấy đơn để gia hạn');
  },

  claimWarranty: async (saleId: string, issue: string, resolution: string, cost: number) => {
    const sales = getStore('sales', INITIAL_SALES);
    const s = sales.find(item => item._id === saleId);
    if (s) {
      if (!s.claims) s.claims = [];
      s.claims.push({
        date: new Date().toISOString(),
        issue,
        resolution,
        cost
      });
      setStore('sales', sales);

      if (cost > 0) {
        await MockService.createTransaction({
          type: 'expense',
          amount: cost,
          title: `Chi phí bảo hành: ${s.productName}`,
          categoryId: 'cat_claim',
          counterparty: 'Bảo hành / Đổi',
          groupId: s.groupId
        });
      }

      return s;
    }
    throw new Error('Không tìm thấy đơn hàng');
  },

  // Groups
  getMyGroups: async () => {
    return getStore('groups', INITIAL_GROUPS);
  },

  createGroup: async (data: any) => {
    const groups = getStore('groups', INITIAL_GROUPS);
    const newGroup: Group = {
      _id: 'grp_' + Date.now(),
      name: data.name,
      description: data.description || '',
      ownerId: INITIAL_USERS[0]._id,
      memberCount: 1,
      myRole: 'owner',
      settings: { hideAmountsForMembers: false, allowMemberInvite: true }
    };
    groups.push(newGroup);
    setStore('groups', groups);
    return newGroup;
  },

  getGroupDetail: async (groupId: string) => {
    const groups = getStore('groups', INITIAL_GROUPS);
    const g = groups.find(item => item._id === groupId) || groups[0];
    return { ...g, myRole: 'owner', memberCount: 3 };
  },

  getGroupMembers: async () => {
    return [
      { _id: 'm1', groupId: 'grp_mmo', userId: INITIAL_USERS[0], role: 'owner', joinedAt: now.toISOString() },
      { _id: 'm2', groupId: 'grp_mmo', userId: INITIAL_USERS[1], role: 'admin', joinedAt: now.toISOString() },
      { _id: 'm3', groupId: 'grp_mmo', userId: INITIAL_USERS[2], role: 'member', joinedAt: now.toISOString() }
    ];
  },

  getGroupActivity: async () => {
    return [
      { id: 'act_1', type: 'sale', productName: 'Tài khoản Gemini Advanced (1 Năm)', amount: 450000, actor: 'Nguyễn Văn Minh', createdAt: now.toISOString() },
      { id: 'act_2', type: 'sale', productName: 'Key Windows 11 Pro', amount: 180000, actor: 'Trần Quốc Hoàng', createdAt: addDaysDate(-1) },
      { id: 'act_3', type: 'transaction', action: 'chi', title: 'Chạy quảng cáo Facebook', amount: 500000, actor: 'Nguyễn Văn Minh', createdAt: addDaysDate(-2) },
      { id: 'act_4', type: 'sale', productName: 'ChatGPT Plus 1 Tháng', amount: 250000, actor: 'Trần Quốc Hoàng', createdAt: addDaysDate(-3) }
    ];
  },

  // Leaderboard
  getLeaderboard: async () => {
    const ranking: LeaderboardItem[] = [
      {
        userId: INITIAL_USERS[0]._id,
        name: INITIAL_USERS[0].name,
        email: INITIAL_USERS[0].email,
        avatar: INITIAL_USERS[0].avatar,
        role: 'owner',
        revenue: 450000,
        collected: 450000,
        outstanding: 0,
        profit: 300000,
        orders: 1,
        growthRate: 45.5,
        rank: 1
      },
      {
        userId: INITIAL_USERS[1]._id,
        name: INITIAL_USERS[1].name,
        email: INITIAL_USERS[1].email,
        avatar: INITIAL_USERS[1].avatar,
        role: 'admin',
        revenue: 430000,
        collected: 430000,
        outstanding: 0,
        profit: 300000,
        orders: 2,
        growthRate: 20.0,
        rank: 2
      },
      {
        userId: INITIAL_USERS[2]._id,
        name: INITIAL_USERS[2].name,
        email: INITIAL_USERS[2].email,
        avatar: INITIAL_USERS[2].avatar,
        role: 'member',
        revenue: 240000,
        collected: 240000,
        outstanding: 0,
        profit: 180000,
        orders: 1,
        growthRate: 10.0,
        rank: 3
      }
    ];
    return ranking;
  },

  // Reports
  getDashboardOverview: async () => {
    const txs = getStore('transactions', INITIAL_TRANSACTIONS);
    const sales = getStore('sales', INITIAL_SALES);

    let totalIncome = 0;
    let totalExpense = 0;

    txs.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') totalExpense += t.amount;
    });

    const activeWarranties = sales.filter(s => s.status === 'active').length;
    const expiringSoon = sales.filter(s => s.status === 'expiring_soon').length;

    return {
      today: { income: 630000, expense: 150000, net: 480000 },
      month: { income: totalIncome, expense: totalExpense, profit: totalIncome - totalExpense, incomeGrowth: 68.5, expenseGrowth: -15.2 },
      balance: totalIncome - totalExpense,
      warranty: { activeCount: activeWarranties, expiringSoonCount: expiringSoon }
    };
  },

  getDailyChart: async () => {
    const daysInMonth = 30;
    const chart = [];
    for (let i = 1; i <= daysInMonth; i++) {
      let income = 0;
      let expense = 0;
      if (i === 1) { income = 450000; expense = 150000; }
      else if (i === 2) { income = 180000; expense = 0; }
      else if (i === 15) { income = 650000; expense = 200000; }
      else if (i === 20) { income = 900000; expense = 320000; }
      else if (i % 3 === 0) { income = 250000; expense = 90000; }

      chart.push({
        day: `${i}/10`,
        income,
        expense,
        profit: income - expense
      });
    }
    return chart;
  },

  getCategoryBreakdown: async () => {
    return [
      { categoryName: 'Giá vốn sản phẩm', total: 150000, color: '#ef4444' },
      { categoryName: 'Server / VPS / Proxy', total: 320000, color: '#ec4899' },
      { categoryName: 'Quảng cáo & Marketing', total: 500000, color: '#3b82f6' }
    ];
  },

  getTopProducts: async () => {
    return [
      { productName: 'Tài khoản Gemini Advanced (1 Năm)', totalQuantity: 1, totalRevenue: 450000, totalProfit: 300000, margin: 66.7 },
      { productName: 'Canva Pro Vĩnh Viễn / Edu', totalQuantity: 2, totalRevenue: 240000, totalProfit: 180000, margin: 75.0 },
      { productName: 'ChatGPT Plus 1 Tháng', totalQuantity: 1, totalRevenue: 250000, totalProfit: 160000, margin: 64.0 },
      { productName: 'Key Windows 11 Pro Retail', totalQuantity: 1, totalRevenue: 180000, totalProfit: 140000, margin: 77.8 }
    ];
  },

  getSmartInsights: async () => {
    return [
      {
        type: 'warning',
        title: 'Cảnh báo bảo hành sắp hết hạn',
        message: 'Đơn hàng "ChatGPT Plus 1 Tháng" của khách Đỗ Thuỳ Dung chỉ còn 2 ngày bảo hành. Hãy liên hệ gia hạn ngay!'
      },
      {
        type: 'success',
        title: 'Sản phẩm biên lợi nhuận cao nhất',
        message: '"Key Windows 11 Pro" và "Canva Pro" có tỷ suất lợi nhuận trên 75%. Hãy đẩy mạnh marketing danh mục này!'
      }
    ];
  },

  // Customers, Budgets, Debts
  getCustomers: async () => {
    return { customers: getStore('customers', INITIAL_CUSTOMERS), pagination: { page: 1, limit: 50, total: 3, totalPages: 1 } };
  },

  getBudgets: async () => {
    return getStore('budgets', INITIAL_BUDGETS);
  },

  getDebts: async () => {
    const debts = getStore('debts', INITIAL_DEBTS);
    return {
      debts,
      summary: { totalReceivable: 450000, totalPayable: 400000 }
    };
  }
};
