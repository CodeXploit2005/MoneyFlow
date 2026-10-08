import crypto from 'crypto';
import mongoose from 'mongoose';
import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';
import Invite from '../models/Invite.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Sale from '../models/Sale.js';
import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';

import { CategoryService } from '../services/categoryService.js';

export const createGroup = async (req, res) => {
  try {
    const { name, description = '', avatar = '' } = req.body;

    const group = await Group.create({
      name,
      description,
      avatar,
      ownerId: req.user._id
    });

    // Thêm người tạo với vai trò owner
    await GroupMember.create({
      groupId: group._id,
      userId: req.user._id,
      role: 'owner'
    });

    // Tự động khởi tạo bộ danh mục hệ thống + mặc định cho nhóm mới
    await CategoryService.ensureDefaultCategories(req.user._id, group._id);

    return sendSuccess(res, group, 'Tạo nhóm thành công', 201);
  } catch (error) {
    return sendError(res, 'Lỗi tạo nhóm: ' + error.message, 500);
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const memberships = await GroupMember.find({ userId: req.user._id })
      .populate('groupId')
      .sort({ joinedAt: -1 });

    const groupsWithStats = await Promise.all(
      memberships
        .filter(m => m.groupId && !(m.groupId as any).deletedAt)
        .map(async m => {
          const group: any = m.groupId;
          const memberCount = await GroupMember.countDocuments({ groupId: group._id });
          return {
            _id: group._id,
            name: group.name,
            description: group.description,
            avatar: group.avatar,
            ownerId: group.ownerId,
            settings: group.settings,
            myRole: m.role,
            memberCount,
            joinedAt: m.joinedAt
          };
        })
    );

    return sendSuccess(res, groupsWithStats);
  } catch (error) {
    return sendError(res, 'Lỗi lấy danh sách nhóm: ' + error.message, 500);
  }
};

export const getGroupDetail = async (req, res) => {
  try {
    const group = req.group;
    const memberCount = await GroupMember.countDocuments({ groupId: group._id });

    return sendSuccess(res, {
      ...group.toObject(),
      myRole: req.userRoleInGroup,
      memberCount
    });
  } catch (error) {
    return sendError(res, 'Lỗi lấy chi tiết nhóm: ' + error.message, 500);
  }
};

export const deleteGroup = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const group = await Group.findOneAndUpdate({ _id: req.params.groupId, ownerId: req.user._id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { session, new: true });
      if (!group) throw new Error('Không tìm thấy nhóm hoặc bạn không phải chủ nhóm');
      await Invite.deleteMany({ groupId: group._id }, { session });
      await GroupMember.deleteMany({ groupId: group._id }, { session });
    });
    return sendSuccess(res, null, 'Đã xóa nhóm khỏi danh sách hoạt động');
  } catch (error) { return sendError(res, error.message, 400); }
  finally { await session.endSession(); }
};

export const updateGroupSettings = async (req, res) => {
  try {
    const group = req.group;
    const { name, description, avatar, hideAmountsForMembers, allowMemberInvite } = req.body;

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (avatar !== undefined) group.avatar = avatar;

    if (hideAmountsForMembers !== undefined) {
      group.settings.hideAmountsForMembers = Boolean(hideAmountsForMembers);
    }
    if (allowMemberInvite !== undefined) {
      group.settings.allowMemberInvite = Boolean(allowMemberInvite);
    }

    await group.save();
    return sendSuccess(res, group, 'Cập nhật thiết lập nhóm thành công');
  } catch (error) {
    return sendError(res, 'Lỗi cập nhật thiết lập nhóm: ' + error.message, 500);
  }
};

export const createInviteCode = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { daysValid = 7, maxUses = 10 } = req.body;

    const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // Mã 8 ký tự
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(daysValid));

    const invite = await Invite.create({
      groupId,
      code,
      createdBy: req.user._id,
      expiresAt,
      maxUses: Number(maxUses) || 10
    });

    return sendSuccess(res, invite, 'Tạo mã mời thành công', 201);
  } catch (error) {
    return sendError(res, 'Lỗi tạo mã mời: ' + error.message, 500);
  }
};

export const joinGroupByCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return sendError(res, 'Vui lòng cung cấp mã mời', 400);

    const invite = await Invite.findOne({ code: code.trim().toUpperCase() });
    if (!invite) {
      return sendError(res, 'Mã mời không tồn tại hoặc đã hết hạn', 404);
    }
    if (!await Group.exists({ _id: invite.groupId, deletedAt: null })) return sendError(res, 'Nhóm đã bị xóa hoặc không còn hoạt động', 404);

    if (new Date() > new Date(invite.expiresAt)) {
      return sendError(res, 'Mã mời đã hết hạn', 400);
    }

    if (invite.usedCount >= invite.maxUses) {
      return sendError(res, 'Mã mời đã đạt giới hạn số lượt tham gia', 400);
    }

    // Kiểm tra đã là thành viên chưa
    const existing = await GroupMember.findOne({
      groupId: invite.groupId,
      userId: req.user._id
    });

    if (existing) {
      return sendError(res, 'Bạn đã là thành viên của nhóm này rồi', 400);
    }

    // Thêm vào nhóm
    await GroupMember.create({
      groupId: invite.groupId,
      userId: req.user._id,
      role: 'member'
    });

    invite.usedCount += 1;
    await invite.save();

    const group = await Group.findById(invite.groupId);

    // Thông báo cho chủ nhóm
    await Notification.create({
      userId: group.ownerId,
      title: 'Thành viên mới tham gia nhóm',
      message: `${req.user.name} vừa tham gia nhóm "${group.name}" qua mã mời.`,
      type: 'group_activity',
      data: { groupId: group._id }
    });

    return sendSuccess(res, group, `Bạn đã tham gia nhóm "${group.name}" thành công!`);
  } catch (error) {
    return sendError(res, 'Lỗi tham gia nhóm: ' + error.message, 500);
  }
};

export const inviteByEmail = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    const userToInvite = await User.findOne({ email: email.trim().toLowerCase() });
    if (!userToInvite) {
      return sendError(res, 'Không tìm thấy người dùng có email này trong hệ thống', 404);
    }

    const existing = await GroupMember.findOne({
      groupId,
      userId: userToInvite._id
    });

    if (existing) {
      return sendError(res, 'Người này đã là thành viên nhóm', 400);
    }

    const group = req.group;

    await Notification.create({
      userId: userToInvite._id,
      title: 'Lời mời tham gia nhóm',
      message: `${req.user.name} đã mời bạn tham gia nhóm "${group.name}".`,
      type: 'invite',
      data: { groupId: group._id }
    });

    return sendSuccess(res, null, 'Đã gửi lời mời tới thành viên');
  } catch (error) {
    return sendError(res, 'Lỗi gửi lời mời: ' + error.message, 500);
  }
};

export const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const members = await GroupMember.find({ groupId })
      .populate('userId', 'name email avatar bankInfo')
      .sort({ joinedAt: 1 });

    return sendSuccess(res, members);
  } catch (error) {
    return sendError(res, 'Lỗi lấy danh sách thành viên: ' + error.message, 500);
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return sendError(res, 'Vai trò không hợp lệ', 400);
    }

    const member = await GroupMember.findOne({ groupId, userId: memberId });
    if (!member) {
      return sendError(res, 'Không tìm thấy thành viên trong nhóm', 404);
    }

    if (member.role === 'owner') {
      return sendError(res, 'Không thể thay đổi vai trò của Chủ nhóm', 400);
    }

    member.role = role;
    await member.save();

    return sendSuccess(res, member, 'Cập nhật vai trò thành công');
  } catch (error) {
    return sendError(res, 'Lỗi cập nhật vai trò: ' + error.message, 500);
  }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;

    const member = await GroupMember.findOne({ groupId, userId: memberId });
    if (!member) {
      return sendError(res, 'Không tìm thấy thành viên trong nhóm', 404);
    }

    if (member.role === 'owner') {
      return sendError(res, 'Không thể xóa chủ nhóm', 400);
    }

    await GroupMember.deleteOne({ _id: member._id });
    return sendSuccess(res, null, 'Đã xóa thành viên khỏi nhóm');
  } catch (error) {
    return sendError(res, 'Lỗi xóa thành viên: ' + error.message, 500);
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const membership = await GroupMember.findOne({ groupId, userId: req.user._id });
    if (!membership) {
      return sendError(res, 'Bạn không ở trong nhóm này', 400);
    }

    if (membership.role === 'owner') {
      return sendError(res, 'Chủ nhóm không thể rời nhóm. Hãy chuyển quyền hoặc giải tán nhóm.', 400);
    }

    await GroupMember.deleteOne({ _id: membership._id });
    return sendSuccess(res, null, 'Bạn đã rời nhóm thành công');
  } catch (error) {
    return sendError(res, 'Lỗi rời nhóm: ' + error.message, 500);
  }
};

export const getActivityFeed = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Lấy 15 giao dịch và 15 đơn bán mới nhất trong nhóm
    const [transactions, sales] = await Promise.all([
      Transaction.find({ groupId, isDeleted: false })
        .populate('ownerId', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(15),
      Sale.find({ groupId })
        .populate('ownerId', 'name avatar')
        .populate('customerId', 'name')
        .sort({ createdAt: -1 })
        .limit(15)
    ]);

    const feed = [
      ...transactions.map(t => ({
        id: t._id,
        type: 'transaction',
        action: t.type === 'income' ? 'thu' : 'chi',
        amount: t.amount,
        title: t.title,
        actor: (t.ownerId as any)?.name || 'Thành viên',
        actorAvatar: (t.ownerId as any)?.avatar,
        createdAt: t.createdAt
      })),
      ...sales.map(s => ({
        id: s._id,
        type: 'sale',
        action: 'bán',
        productName: s.productName,
        customerName: (s.customerId as any)?.name,
        amount: s.price * s.quantity,
        profit: s.profit,
        actor: (s.ownerId as any)?.name || 'Thành viên',
        actorAvatar: (s.ownerId as any)?.avatar,
        createdAt: s.createdAt
      }))
    ];

    feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return sendSuccess(res, feed.slice(0, 25));
  } catch (error) {
    return sendError(res, 'Lỗi lấy dòng hoạt động nhóm: ' + error.message, 500);
  }
};
