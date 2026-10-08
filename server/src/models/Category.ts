import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục không được để trống'],
      trim: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Loại danh mục (income / expense) là bắt buộc']
    },
    icon: {
      type: String,
      default: 'tag'
    },
    color: {
      type: String,
      default: '#10b981'
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    sortOrder: {
      type: Number,
      default: 0
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

// Indexes
CategorySchema.index({ ownerId: 1, groupId: 1, type: 1, isArchived: 1, sortOrder: 1 });
CategorySchema.index({ groupId: 1, isArchived: 1 });

export default mongoose.model('Category', CategorySchema);
