import mongoose from 'mongoose';

const InviteSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    code: {
      type: String,
      required: true,
      unique: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    maxUses: {
      type: Number,
      default: 10
    },
    usedCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

InviteSchema.index({ code: 1 });
InviteSchema.index({ groupId: 1 });

export default mongoose.model('Invite', InviteSchema);
