import mongoose from 'mongoose';
import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware kiểm tra nghiêm ngặt người dùng có phải thành viên nhóm không
 * @param {Array<string>} [allowedRoles] Ví dụ: ['owner', 'admin'] nếu chỉ cho phép quản lý
 */
export const requireGroupMember = (allowedRoles = ['owner', 'admin', 'member']) => {
  return async (req, res, next) => {
    try {
      const supplied = [req.params?.groupId, req.body?.groupId, req.query?.groupId].filter(value => value !== undefined && value !== null && value !== '');
      if (supplied.some(value => typeof value !== 'string' || !mongoose.isValidObjectId(value)) || new Set(supplied.map(String)).size > 1) return sendError(res, 'Thông tin nhóm không hợp lệ hoặc không khớp', 400);
      const groupId = supplied[0];

      if (!groupId) {
        return sendError(res, 'Thiếu thông tin mã nhóm (groupId)', 400);
      }

      // Tìm membership trong database
      const membership = await GroupMember.findOne({
        groupId,
        userId: req.user._id
      }).populate('groupId');

      if (!membership || !membership.groupId || (membership.groupId as any).deletedAt) {
        return sendError(res, 'Bạn không có quyền truy cập nhóm này (Không phải thành viên)', 403);
      }

      // Kiểm tra vai trò
      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        return sendError(res, 'Bạn không có quyền thực hiện thao tác này trong nhóm', 403);
      }

      // Gắn thông tin nhóm và quyền vào request
      req.group = membership.groupId;
      req.groupMembership = membership;
      req.userRoleInGroup = membership.role;

      next();
    } catch (error) {
      return sendError(res, 'Lỗi kiểm tra quyền thành viên nhóm: ' + error.message, 500);
    }
  };
};

/**
 * Middleware chỉ cho phép Owner hoặc Admin của nhóm
 */
export const requireGroupAdminOrOwner = requireGroupMember(['owner', 'admin']);

/**
 * Middleware chỉ cho phép Owner của nhóm
 */
export const requireGroupOwner = requireGroupMember(['owner']);

export const requireInvitePermission = (req, res, next) => {
  if (req.userRoleInGroup === 'member' && !req.group?.settings?.allowMemberInvite) return sendError(res, 'Chỉ chủ nhóm và quản trị viên được mời thành viên', 403);
  next();
};
