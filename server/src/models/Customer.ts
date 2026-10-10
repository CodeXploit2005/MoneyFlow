import { cleanCustomerName, cleanCustomerPhone } from '../utils/customerIdentity.js';
import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên khách hàng không được để trống'],
      maxlength: 160,
      set: cleanCustomerName,
      trim: true
    },
    phone: {
      type: String,
      maxlength: 30,
      set: cleanCustomerPhone,
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
CustomerSchema.index({ groupId: 1, createdAt: -1, _id: -1 });
CustomerSchema.index({ ownerId: 1, groupId: 1, createdAt: -1, _id: -1 });
CustomerSchema.index({ groupId: 1, name: 1, _id: 1 });
CustomerSchema.index({ ownerId: 1, groupId: 1, name: 1, _id: 1 });
CustomerSchema.index({ groupId: 1, phone: 1 });
CustomerSchema.index({ groupId: 1, email: 1 });

export default mongoose.model('Customer', CustomerSchema);
