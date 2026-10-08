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
