import mongoose from 'mongoose';

const BudgetSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Hạn mức ngân sách không được để trống'],
      min: 0,
      set: (v) => Math.round(Number(v))
    },
    month: {
      type: Number, // 1 - 12
      required: true
    },
    year: {
      type: Number,
      required: true
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
    }
  },
  {
    timestamps: true
  }
);

BudgetSchema.index({ ownerId: 1, month: 1, year: 1, categoryId: 1 }, { unique: true });

export default mongoose.model('Budget', BudgetSchema);
