import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên khách hàng không được để trống'],
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    zalo: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    note: {
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
    }
  },
  {
    timestamps: true
  }
);

CustomerSchema.index({ ownerId: 1, phone: 1 });
CustomerSchema.index({ groupId: 1 });

export default mongoose.model('Customer', CustomerSchema);
