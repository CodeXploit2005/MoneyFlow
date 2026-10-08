import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  hash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  sentAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  resetTokenHash: { type: String, default: null }
});
export default mongoose.model('PasswordReset', schema);
