export interface BankInfo {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bankInfo?: BankInfo;
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  ownerId?: string;
  groupId?: string | null;
  isDefault?: boolean;
}

export interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  categoryId: Category | string;
  date: string;
  note?: string;
  method?: 'cash' | 'transfer' | 'ewallet';
  counterparty?: string;
  receiptUrl?: string;
  ownerId?: User | any;
  groupId?: string | null;
  saleId?: any;
  isDeleted?: boolean;
  history?: Array<{
    modifiedBy?: any;
    modifiedAt?: string;
    action?: string;
  }>;
}

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  zalo?: string;
  email?: string;
  note?: string;
  ownerId?: string;
  groupId?: string | null;
}

export interface WarrantyClaim {
  _id?: string;
  date: string;
  issue: string;
  resolution?: string;
  cost?: number;
  handledBy?: any;
}

export interface Renewal {
  _id?: string;
  days: number;
  price: number;
  renewedAt: string;
  oldEnd: string;
  newEnd: string;
}

export interface Sale {
  _id: string;
  productName: string;
  customerId: Customer | any;
  price: number;
  cost: number;
  quantity: number;
  profit: number;
  soldAt: string;
  warrantyDays: number;
  warrantyStart: string;
  warrantyEnd: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'void';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paidAmount?: number;
  notes?: string;
  ownerId?: User | any;
  groupId?: string | null;
  claims?: WarrantyClaim[];
  renewals?: Renewal[];
}

export interface GroupSettings {
  hideAmountsForMembers?: boolean;
  allowMemberInvite?: boolean;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  settings?: GroupSettings;
  myRole?: 'owner' | 'admin' | 'member';
  memberCount?: number;
}

export interface GroupMember {
  _id: string;
  groupId: string;
  userId: User;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface LeaderboardItem {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  revenue: number;
  profit: number;
  orders: number;
  growthRate: number;
  rank: number;
}

export interface Budget {
  _id: string;
  categoryId: Category;
  amount: number;
  month: number;
  year: number;
  spent?: number;
  remaining?: number;
  percent?: number;
}

export interface Debt {
  _id: string;
  type: 'payable' | 'receivable';
  amount: number;
  remainingAmount: number;
  counterparty: string;
  dueDate?: string;
  note?: string;
  status: 'unpaid' | 'partial' | 'paid';
}

export interface ActivityItem { id: string; type: string; actor: string; createdAt: string; productName?: string; title?: string; action?: string; amount: number; }
