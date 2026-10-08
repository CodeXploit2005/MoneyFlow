import mongoose from 'mongoose';

const PaymentRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
      set: (v) => Math.round(Number(v))
    },
    date: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['cash', 'transfer', 'ewallet'],
      default: 'transfer'
    },
    note: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const RenewalRecordSchema = new mongoose.Schema(
  {
    days: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      set: (v) => Math.round(Number(v))
    },
    renewedAt: {
      type: Date,
      default: Date.now
    },
    oldEnd: {
      type: Date,
      required: true
    },
    newEnd: {
      type: Date,
      required: true
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }
  },
  { _id: true }
);

const ClaimRecordSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now
    },
    issue: {
      type: String,
      required: true
    },
    resolution: {
      type: String,
      default: ''
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
      set: (v) => Math.round(Number(v))
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    costTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    }
  },
  { _id: true }
);

const SaleSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Tên sản phẩm/dịch vụ không được để trống'],
      trim: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Khách hàng không được để trống']
    },
    price: {
      type: Number,
      required: [true, 'Giá bán không được để trống'],
      min: 0,
      set: (v) => Math.round(Number(v))
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
      set: (v) => Math.round(Number(v))
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: 'Số lượng phải là số nguyên dương hợp lệ'
      }
    },
    profit: {
      type: Number,
      default: 0,
      set: (v) => Math.round(Number(v))
    },
    soldAt: {
      type: Date,
      default: Date.now
    },
    warrantyDays: {
      type: Number,
      default: 30,
      min: 0
    },
    warrantyStart: {
      type: Date,
      default: Date.now
    },
    warrantyEnd: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'expiring_soon', 'expired', 'void'],
      default: 'active'
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'paid'
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
      set: (v) => Math.round(Number(v))
    },
    payments: [PaymentRecordSchema],
    renewals: [RenewalRecordSchema],
    claims: [ClaimRecordSchema],
    notes: {
      type: String,
      default: '' // ví dụ: tài khoản, mật khẩu, cookie, key
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
    incomeTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    },
    costTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
SaleSchema.index({ ownerId: 1, status: 1, warrantyEnd: 1 });
SaleSchema.index({ groupId: 1, status: 1, warrantyEnd: 1 });
SaleSchema.index({ customerId: 1 });
SaleSchema.index({ soldAt: -1 });

export default mongoose.model('Sale', SaleSchema);
