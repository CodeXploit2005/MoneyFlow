import { getSocketIO } from '../sockets/socketHandler.js';
import mongoose from 'mongoose';
import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';
import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    return sendSuccess(res, { notifications, unreadCount });
  } catch (error) {
    return sendError(res, 'Lỗi lấy thông báo: ' + error.message, 500);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isRead: true }
    );
    return sendSuccess(res, null, 'Đã đánh dấu đã đọc');
  } catch (error) {
    return sendError(res, 'Lỗi cập nhật thông báo: ' + error.message, 500);
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    return sendSuccess(res, null, 'Đã đánh dấu tất cả là đã đọc');
  } catch (error) {
    return sendError(res, 'Lỗi cập nhật tất cả thông báo: ' + error.message, 500);
  }
};

export const respondToInvite = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Thông báo không hợp lệ', 400);
  const { action } = req.body;
  if (!['accept', 'decline'].includes(action)) return sendError(res, 'Thao tác không hợp lệ', 400);
  const session = await mongoose.startSession();
  try {
    let groupId;
    await session.withTransaction(async () => {
      const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id, type: 'invite' }).session(session);
      if (!notification) throw new Error('Không tìm thấy lời mời');
      if (['accepted', 'declined'].includes(notification.data?.status)) throw new Error('Lời mời đã được xử lý');
      groupId = notification.data?.groupId;
      if (action === 'accept') {
        // Writing the group serializes acceptance with concurrent group deletion.
        const group = await Group.findOneAndUpdate({ _id: groupId, deletedAt: null }, { $inc: { __v: 1 } }, { session });
        if (!group) throw new Error('Nhóm đã bị xóa hoặc không còn hoạt động');
        await GroupMember.updateOne({ groupId, userId: req.user._id }, { $setOnInsert: { role: 'member' } }, { upsert: true, session });
      }
      notification.data = { ...notification.data, status: action === 'accept' ? 'accepted' : 'declined' };
      notification.isRead = true;
      await notification.save({ session });
    });
    getSocketIO()?.to(`user_${req.user._id}`).emit('groups:changed');
    getSocketIO()?.to(`group_${groupId}`).emit('groups:changed');
    return sendSuccess(res, { groupId }, action === 'accept' ? 'Đã tham gia nhóm' : 'Đã từ chối lời mời');
  } catch (error) {
    return sendError(res, error.message, 400);
  } finally { await session.endSession(); }
};
