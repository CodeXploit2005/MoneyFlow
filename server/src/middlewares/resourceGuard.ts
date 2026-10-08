import mongoose from 'mongoose';
import GroupMember from '../models/GroupMember.js';
import { sendError } from '../utils/response.js';

// Derive permissions from the saved resource, never a client-supplied groupId.
export const requireResourceAccess = (model: any, write = false) => async (req, res, next) => {
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
      const member = await GroupMember.findOne({ groupId: resource.groupId, userId: req.user._id });
      if (!member || (write && !own && !['owner', 'admin'].includes(member.role))) return sendError(res, 'Không có quyền truy cập dữ liệu này', 403);
      req.userRoleInGroup = member.role;
    }
    next();
  } catch {
    return sendError(res, 'Không thể kiểm tra quyền dữ liệu', 500);
  }
};
