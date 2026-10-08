import mongoose from 'mongoose';

const DebtPaymentSchema = new mongoose.Schema(
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
    requestId: { type: String, default: null },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
    note: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const DebtSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['payable', 'receivable'], // payable: mình nợ ai, receivable: ai nợ mình
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền công nợ không được để trống'],
      min: 0,
      set: (v) => Math.round(Number(v))
    },
    remainingAmount: {
      type: Number,
      default: 0,
      set: (v) => Math.round(Number(v))
    },
    counterparty: {
      type: String,
      required: [true, 'Đối tác/Người liên quan không được để trống'],
      trim: true
    },
    dueDate: {
      type: Date,
      default: null
    },
    note: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid'
    },
    payments: [DebtPaymentSchema],
    history: [{
      modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      modifiedAt: { type: Date, default: Date.now },
      action: String,
      changes: mongoose.Schema.Types.Mixed
    }],
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null
    }
  },
  {
    timestamps: true
  }
);

DebtSchema.index({ ownerId: 1, status: 1 });

export default mongoose.model('Debt', DebtSchema);
