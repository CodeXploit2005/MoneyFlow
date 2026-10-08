import { z } from 'zod';
import { CategoryService } from '../services/categoryService.js';
import GroupMember from '../models/GroupMember.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Schema Validation bằng Zod
const createCategorySchema = z.object({
  name: z.string({ required_error: 'Tên danh mục không được để trống' }).min(1, 'Tên danh mục không được để trống').max(50, 'Tên danh mục tối đa 50 ký tự'),
  type: z.enum(['income', 'expense'], { required_error: 'Loại danh mục phải là income hoặc expense' }),
  icon: z.string().optional(),
  color: z.string().optional(),
  groupId: z.string().optional().nullable()
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(50).optional(),
  type: z.enum(['income', 'expense']).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional()
});

const reorderSchema = z.object({
  orderedIds: z.array(z.string(), { required_error: 'Danh sách ID cần sắp xếp không được để trống' }).min(1)
});

/**
 * Kiểm tra quyền quản lý danh mục trong nhóm (chỉ owner / admin được tạo/sửa/ẩn)
 */
const verifyGroupPermission = async (userId, groupId, action = 'modify') => {
  if (!groupId) return true; // Danh mục cá nhân luôn hợp lệ

  const membership = await GroupMember.findOne({
    groupId,
    userId
  });

  if (!membership) {
    throw new Error('FORBIDDEN_OUTSIDER'); // 403: Không thuộc nhóm
  }

  if (action === 'modify' && membership.role === 'member') {
    throw new Error('FORBIDDEN_MEMBER'); // 403: Thành viên thường không có quyền sửa
  }

  return true;
};

export const getCategories = async (req, res) => {
  try {
    const { groupId, type, includeArchived = 'false' } = req.query;

    if (groupId) {
      try {
        await verifyGroupPermission(req.user._id, groupId, 'view');
      } catch (err) {
        if (err.message === 'FORBIDDEN_OUTSIDER') {
          return sendError(res, 'Bạn không phải là thành viên của nhóm này', 403);
        }
      }
    }

    const categories = await CategoryService.getCategories({
      ownerId: req.user._id,
      groupId: groupId || null,
      type: type || undefined,
      includeArchived: includeArchived === 'true'
    });

    return sendSuccess(res, categories);
  } catch (error) {
    return sendError(res, 'Lỗi lấy danh mục: ' + error.message, 500);
  }
};

export const createCategory = async (req, res) => {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      const errMsg = parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ';
      return sendError(res, errMsg, 400);
    }

    const { name, type, icon, color, groupId } = parsed.data;

    if (groupId) {
      try {
        await verifyGroupPermission(req.user._id, groupId, 'modify');
      } catch (err) {
        if (err.message === 'FORBIDDEN_OUTSIDER') {
          return sendError(res, 'Bạn không phải là thành viên của nhóm này', 403);
        }
        if (err.message === 'FORBIDDEN_MEMBER') {
          return sendError(res, 'Chỉ Quản trị viên hoặc Chủ nhóm mới được tạo danh mục nhóm', 403);
        }
      }
    }

    const category = await CategoryService.createCategory({
      name,
      type,
      icon,
      color,
      ownerId: req.user._id,
      groupId: groupId || null
    });

    return sendSuccess(res, category, 'Tạo danh mục thành công', 201);
  } catch (error) {
    const status = error.message.includes('đã tồn tại') ? 400 : 500;
    return sendError(res, error.message, status);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupId } = req.body;

    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      const errMsg = parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ';
      return sendError(res, errMsg, 400);
    }

    if (groupId) {
      try {
        await verifyGroupPermission(req.user._id, groupId, 'modify');
      } catch (err) {
        if (err.message === 'FORBIDDEN_OUTSIDER') {
          return sendError(res, 'Bạn không phải là thành viên của nhóm này', 403);
        }
        if (err.message === 'FORBIDDEN_MEMBER') {
          return sendError(res, 'Chỉ Quản trị viên hoặc Chủ nhóm mới được chỉnh sửa danh mục nhóm', 403);
        }
      }
    }

    const updated = await CategoryService.updateCategory(id, parsed.data, req.user._id, groupId || null);
    return sendSuccess(res, updated, 'Cập nhật danh mục thành công');
  } catch (error) {
    const status = (error.message.includes('bảo vệ') || error.message.includes('đã có')) ? 400 : (error.message.includes('quyền') ? 403 : 500);
    return sendError(res, error.message, status);
  }
};

export const archiveCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupId } = req.query;

    if (groupId) {
      try {
        await verifyGroupPermission(req.user._id, groupId, 'modify');
      } catch (err) {
        if (err.message === 'FORBIDDEN_OUTSIDER') {
          return sendError(res, 'Bạn không phải là thành viên của nhóm này', 403);
        }
        if (err.message === 'FORBIDDEN_MEMBER') {
          return sendError(res, 'Chỉ Quản trị viên hoặc Chủ nhóm mới được ẩn danh mục nhóm', 403);
        }
      }
    }

    const archived = await CategoryService.archiveCategory(id, req.user._id, groupId || null);
    return sendSuccess(res, archived, 'Đã ẩn danh mục thành công');
  } catch (error) {
    const status = error.message.includes('hệ thống') ? 400 : 500;
    return sendError(res, error.message, status);
  }
};

export const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupId } = req.query;

    if (groupId) {
      try {
        await verifyGroupPermission(req.user._id, groupId, 'modify');
      } catch (err) {
        if (err.message === 'FORBIDDEN_OUTSIDER') {
          return sendError(res, 'Bạn không phải là thành viên của nhóm này', 403);
        }
        if (err.message === 'FORBIDDEN_MEMBER') {
          return sendError(res, 'Chỉ Quản trị viên hoặc Chủ nhóm mới được khôi phục danh mục', 403);
        }
      }
    }

    const restored = await CategoryService.restoreCategory(id, req.user._id, groupId || null);
    return sendSuccess(res, restored, 'Đã khôi phục danh mục');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const reorderCategories = async (req, res) => {
  try {
    const { groupId } = req.body;
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Danh sách sắp xếp không hợp lệ', 400);
    }

    if (groupId) {
      try {
        await verifyGroupPermission(req.user._id, groupId, 'modify');
      } catch (err) {
        if (err.message === 'FORBIDDEN_OUTSIDER') {
          return sendError(res, 'Bạn không phải là thành viên của nhóm này', 403);
        }
        if (err.message === 'FORBIDDEN_MEMBER') {
          return sendError(res, 'Chỉ Quản trị viên hoặc Chủ nhóm mới được sắp xếp danh mục', 403);
        }
      }
    }

    const categories = await CategoryService.reorderCategories(parsed.data.orderedIds, req.user._id, groupId || null);
    return sendSuccess(res, categories, 'Đã cập nhật thứ tự danh mục');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getExpenseBreakdown = async (req, res) => {
  try {
    const { groupId, startDate, endDate, excludeCogs = 'true' } = req.query;

    if (groupId) {
      try {
        await verifyGroupPermission(req.user._id, groupId, 'view');
      } catch (err) {
        if (err.message === 'FORBIDDEN_OUTSIDER') {
          return sendError(res, 'Bạn không phải là thành viên của nhóm này', 403);
        }
      }
    }

    const breakdown = await CategoryService.getExpenseBreakdown({
      ownerId: req.user._id,
      groupId: groupId || null,
      startDate,
      endDate,
      excludeCogs: excludeCogs !== 'false'
    });

    return sendSuccess(res, breakdown);
  } catch (error) {
    return sendError(res, 'Lỗi lấy cơ cấu chi tiêu: ' + error.message, 500);
  }
};
