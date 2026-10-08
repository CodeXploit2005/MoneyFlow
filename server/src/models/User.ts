import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên người dùng không được để trống'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email không được để trống'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu không được để trống'],
      minlength: 6,
      select: false
    },
    avatar: {
      type: String,
      default: ''
    },
    authVersion: { type: Number, default: 0 },
    bankInfo: {
      bankName: { type: String, default: 'MBBank' },
      bankCode: { type: String, default: 'MB' }, // VietQR bank code e.g. MB, VCB, TCB, VPB, ICB
      accountNumber: { type: String, default: '' },
      accountName: { type: String, default: '' }
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);
