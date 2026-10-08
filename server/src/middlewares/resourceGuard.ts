import Group from '../models/Group.js';
import mongoose from 'mongoose';
import GroupMember from '../models/GroupMember.js';
import { sendError } from '../utils/response.js';

// Derive permissions from the saved resource, never a client-supplied groupId.
export const requireResourceAccess = (model: any, write = false, adminOnly = false) => async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Mã dữ liệu không hợp lệ', 400);
    const resource = await model.findById(req.params.id);
    if (!resource) return sendError(res, 'Không tìm thấy dữ liệu', 404);
    const own = String(resource.ownerId) === String(req.user._id);
    if (!resource.groupId) {
      if (!own) return sendError(res, 'Không có quyền truy cập dữ liệu này', 403);
      // Prevent an unrelated group role attached earlier from granting personal rights.
      req.userRoleInGroup = undefined;
    } else {
      const group = await Group.findOne({ _id: resource.groupId, deletedAt: null });
      if (!group) return sendError(res, 'Nhóm không còn hoạt động', 403);
      const member = await GroupMember.findOne({ groupId: resource.groupId, userId: req.user._id });
      if (!member || (write && (adminOnly || !own) && !['owner', 'admin'].includes(member.role))) return sendError(res, 'Không có quyền truy cập dữ liệu này', 403);
      if (!write && !own && member.role === 'member' && group.settings?.hideAmountsForMembers) return sendError(res, 'Nhóm chỉ cho phép xem dữ liệu chi tiết do bạn tạo', 403);
      req.group = group;
      req.userRoleInGroup = member.role;
    }
    next();
  } catch {
    return sendError(res, 'Không thể kiểm tra quyền dữ liệu', 500);
  }
};
