import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ==========================================
// 1. User & Auth Types
// ==========================================
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
  groupId?: string;
  groupRole?: 'owner' | 'admin' | 'member';
}

// ==========================================
// 2. Category Types
// ==========================================
export type CategoryType = 'income' | 'expense';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  isSystem: boolean;
  isArchived: boolean;
  userId?: Types.ObjectId | null;
  groupId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 3. Transaction Types
// ==========================================
export type TransactionType = 'income' | 'expense';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  groupId?: Types.ObjectId | null;
  type: TransactionType;
  amount: number;
  title: string;
  categoryId?: Types.ObjectId | null;
  saleId?: Types.ObjectId | null;
  date: Date;
  receiptUrl?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 4. Sale & Warranty Types
// ==========================================
export type WarrantyStatus = 'active' | 'expiring_soon' | 'expired' | 'claimed';

export interface ISale extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  groupId?: Types.ObjectId | null;
  customerId?: Types.ObjectId | null;
  productName: string;
  price: number;
  cost: number;
  quantity: number;
  warrantyPeriodDays: number;
  warrantyExpireDate?: Date;
  warrantyStatus: WarrantyStatus;
  credentials?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 5. Customer Types
// ==========================================
export interface ICustomer extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  groupId?: Types.ObjectId | null;
  name: string;
  phone?: string;
  socialLink?: string;
  bankAccount?: string;
  bankName?: string;
  note?: string;
  totalSpent: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 6. Group & Collaboration Types
// ==========================================
export type GroupRole = 'owner' | 'admin' | 'member';

export interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  ownerId: Types.ObjectId;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupMember extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  role: GroupRole;
  joinedAt: Date;
}

// ==========================================
// 7. Budget & Debt Types
// ==========================================
export interface IBudget extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  groupId?: Types.ObjectId | null;
  categoryId: Types.ObjectId;
  amount: number;
  period: 'monthly' | 'yearly';
  month?: number;
  year?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DebtType = 'receivable' | 'payable'; // receivable = cho nợ (phải thu), payable = vay nợ (phải trả)

export interface IDebt extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  groupId?: Types.ObjectId | null;
  type: DebtType;
  personName: string;
  phone?: string;
  amount: number;
  paidAmount: number;
  dueDate?: Date;
  note?: string;
  isSettled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 8. API Response Helpers
// ==========================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: Record<string, any>;
}
