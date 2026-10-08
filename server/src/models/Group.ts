import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên nhóm không được để trống'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    deletedAt: { type: Date, default: null },
    avatar: {
      type: String,
      default: ''
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    settings: {
      // Chủ nhóm có thể chọn thành viên thường chỉ xem tổng/leaderboard hay xem chi tiết số tiền của người khác
      hideAmountsForMembers: {
        type: Boolean,
        default: false
      },
      allowMemberInvite: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Group', GroupSchema);
