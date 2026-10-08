import mongoose from 'mongoose';

const HistoryEntrySchema = new mongoose.Schema(
  {
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String, // 'update', 'delete', 'restore'
      default: 'update'
    },
    changes: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { _id: false }
);

const TransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Loại giao dịch không được để trống']
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền không được để trống'],
      min: [0, 'Số tiền phải là số nguyên dương'],
      set: (v) => Math.round(Number(v)) // Đảm bảo số nguyên VND
    },
    title: {
      type: String,
      required: [true, 'Tên khoản thu/chi không được để trống'],
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Danh mục không được để trống']
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      default: ''
    },
    method: {
      type: String,
      enum: ['cash', 'transfer', 'ewallet'],
      default: 'transfer'
    },
    counterparty: {
      type: String,
      default: ''
    },
    receiptUrl: {
      type: String,
      default: ''
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null
    },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    history: [HistoryEntrySchema]
  },
  {
    timestamps: true
  }
);

// Indexes for high performance queries
TransactionSchema.index({ ownerId: 1, isDeleted: 1, date: -1 });
TransactionSchema.index({ groupId: 1, isDeleted: 1, date: -1 });
TransactionSchema.index({ categoryId: 1 });
TransactionSchema.index({ saleId: 1 });

export default mongoose.model('Transaction', TransactionSchema);
