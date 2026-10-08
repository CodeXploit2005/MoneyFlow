import { startOfDayVN, endOfDayVN, getStartOfMonthVN, getEndOfMonthVN } from '../utils/dateUtils.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import mongoose from 'mongoose';

// Danh mục HỆ THỐNG (isSystem = true, khóa: không xóa, không đổi loại, chỉ cho đổi icon/màu)
export const SYSTEM_CATEGORIES = [
  // Thu hệ thống
  { name: 'Bán hàng', type: 'income', icon: 'shopping-bag', color: '#10b981', isSystem: true, isDefault: true, sortOrder: 1 },
  { name: 'Gia hạn', type: 'income', icon: 'refresh-cw', color: '#06b6d4', isSystem: true, isDefault: true, sortOrder: 2 },
  { name: 'Khác', type: 'income', icon: 'plus-circle', color: '#8b5cf6', isSystem: true, isDefault: true, sortOrder: 99 },
  // Chi hệ thống
  { name: 'Giá vốn / Nhập hàng', type: 'expense', icon: 'package', color: '#ef4444', isSystem: true, isDefault: true, sortOrder: 1 },
  { name: 'Chi phí bảo hành', type: 'expense', icon: 'shield-alert', color: '#f97316', isSystem: true, isDefault: true, sortOrder: 2 },
  { name: 'Khác', type: 'expense', icon: 'more-horizontal', color: '#9ca3af', isSystem: true, isDefault: true, sortOrder: 99 }
];

// Danh mục MẶC ĐỊNH người dùng (sửa / ẩn được)
export const DEFAULT_USER_CATEGORIES = [
  // Chi mặc định (8)
  { name: 'Ăn uống & Sinh hoạt', type: 'expense', icon: 'coffee', color: '#f97316', isSystem: false, isDefault: true, sortOrder: 10 },
  { name: 'Di chuyển', type: 'expense', icon: 'car', color: '#3b82f6', isSystem: false, isDefault: true, sortOrder: 11 },
  { name: 'Hóa đơn & Tiện ích', type: 'expense', icon: 'receipt', color: '#06b6d4', isSystem: false, isDefault: true, sortOrder: 12 },
  { name: 'Mua sắm', type: 'expense', icon: 'shopping-bag', color: '#ec4899', isSystem: false, isDefault: true, sortOrder: 13 },
  { name: 'Giải trí', type: 'expense', icon: 'gamepad-2', color: '#8b5cf6', isSystem: false, isDefault: true, sortOrder: 14 },
  { name: 'Sức khỏe', type: 'expense', icon: 'heart-pulse', color: '#ef4444', isSystem: false, isDefault: true, sortOrder: 15 },
  { name: 'Giáo dục', type: 'expense', icon: 'graduation-cap', color: '#10b981', isSystem: false, isDefault: true, sortOrder: 16 },
  { name: 'Quà tặng & Từ thiện', type: 'expense', icon: 'gift', color: '#f59e0b', isSystem: false, isDefault: true, sortOrder: 17 },
  // Thu mặc định (3)
  { name: 'Lương', type: 'income', icon: 'wallet', color: '#10b981', isSystem: false, isDefault: true, sortOrder: 10 },
  { name: 'Thưởng', type: 'income', icon: 'award', color: '#f59e0b', isSystem: false, isDefault: true, sortOrder: 11 },
  { name: 'Tiền được tặng', type: 'income', icon: 'gift', color: '#8b5cf6', isSystem: false, isDefault: true, sortOrder: 12 }
];

export class CategoryService {
  /**
   * Đảm bảo các danh mục hệ thống và mặc định luôn tồn tại cho user / group
   * Hàm này idempotent: chạy nhiều lần không bao giờ bị trùng lặp
   */
  static async ensureDefaultCategories(ownerId, groupId = null) {
    const scopeFilter = groupId ? { groupId } : { ownerId, groupId: null };
    const existing = await Category.find(scopeFilter);

    const allToEnsure = [...SYSTEM_CATEGORIES, ...DEFAULT_USER_CATEGORIES];
    const toInsert = [];

    for (const item of allToEnsure) {
      const exists = existing.some(
        c => c.type === item.type && c.name.trim().toLowerCase() === item.name.trim().toLowerCase()
      );
      if (!exists) {
        toInsert.push({
          ...item,
          ownerId,
          groupId: groupId || null
        });
      }
    }

    if (toInsert.length > 0) {
      await Category.insertMany(toInsert);
    }

    return Category.find(scopeFilter).sort({ sortOrder: 1, name: 1 });
  }

  /**
   * Lấy danh mục hệ thống "Khác" mặc định cho loại giao dịch
   */
  static async getOtherCategory(ownerId, groupId = null, type = 'income') {
    const scopeFilter = groupId ? { groupId } : { ownerId, groupId: null };
    let otherCat = await Category.findOne({
      ...scopeFilter,
      type,
      name: 'Khác',
      isSystem: true
    });

    if (!otherCat) {
      // Tự khởi tạo nếu chưa có
      otherCat = await Category.create({
        name: 'Khác',
        type,
        icon: type === 'income' ? 'plus-circle' : 'more-horizontal',
        color: type === 'income' ? '#8b5cf6' : '#9ca3af',
        isSystem: true,
        isDefault: true,
        sortOrder: 99,
        ownerId,
        groupId: groupId || null
      });
    }

    return otherCat;
  }

  /**
   * Lấy danh mục hệ thống theo tên cụ thể (VD: "Bán hàng", "Gia hạn", "Giá vốn / Nhập hàng", "Chi phí bảo hành")
   * Hỗ trợ linh hoạt thứ tự tham số (name, type) hoặc (type, name)
   */
  static async getSystemCategory(ownerId, groupId = null, arg3, arg4) {
    let name, type;
    if (arg3 === 'income' || arg3 === 'expense') {
      type = arg3;
      name = arg4;
    } else {
      name = arg3;
      type = arg4;
    }

    const scopeFilter = groupId ? { groupId } : { ownerId, groupId: null };
    let cat = await Category.findOne({
      ...scopeFilter,
      type,
      name
    });

    if (!cat) {
      // Tìm template từ SYSTEM_CATEGORIES
      const template = SYSTEM_CATEGORIES.find(s => s.name === name && s.type === type) || {
        name,
        type,
        icon: 'tag',
        color: type === 'income' ? '#10b981' : '#ef4444',
        isSystem: true
      };

      cat = await Category.create({
        ...template,
        ownerId,
        groupId: groupId || null
      });
    }

    return cat;
  }

  /**
   * Lấy danh sách danh mục theo phạm vi cá nhân hoặc nhóm
   * Kèm số lượng giao dịch đang gắn danh mục này (usageCount)
   */
  static async getCategories({ ownerId, groupId = null, type, includeArchived = false }: { ownerId: any; groupId?: any; type?: any; includeArchived?: boolean }) {
    await this.ensureDefaultCategories(ownerId, groupId);

    const filter: any = groupId ? { groupId } : { ownerId, groupId: null };
    if (type) filter.type = type;
    if (!includeArchived) filter.isArchived = false;

    const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();

    // Thống kê usageCount từ Transaction (chỉ tính giao dịch chưa xóa)
    const categoryIds = categories.map(c => c._id);
    const usageCounts = await Transaction.aggregate([
      { $match: { categoryId: { $in: categoryIds }, isDeleted: false } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    usageCounts.forEach(u => {
      countMap[u._id.toString()] = u.count;
    });

    return categories.map(c => ({
      ...c,
      usageCount: countMap[c._id.toString()] || 0
    }));
  }

  /**
   * Tạo danh mục mới
   */
  static async createCategory({ name, type, icon, color, ownerId, groupId = null }) {
    if (!name || !name.trim()) throw new Error('Tên danh mục không được để trống');
    if (!['income', 'expense'].includes(type)) throw new Error('Loại danh mục phải là income hoặc expense');

    const cleanName = name.trim();
    const scopeFilter = groupId ? { groupId } : { ownerId, groupId: null };

    // Kiểm tra trùng tên trong cùng phạm vi + cùng loại (không phân biệt hoa thường)
    const existing = await Category.findOne({
      ...scopeFilter,
      type,
      name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      isArchived: false
    });

    if (existing) {
      throw new Error(`Danh mục "${cleanName}" (${type === 'income' ? 'Khoản thu' : 'Khoản chi'}) đã tồn tại`);
    }

    // Lấy sortOrder lớn nhất hiện tại + 1
    const lastCat = await Category.findOne(scopeFilter).sort({ sortOrder: -1 });
    const nextSort = (lastCat?.sortOrder || 0) + 1;

    const newCategory = await Category.create({
      name: cleanName,
      type,
      icon: icon || (type === 'income' ? 'shopping-bag' : 'tag'),
      color: color || (type === 'income' ? '#10b981' : '#ef4444'),
      isSystem: false,
      isDefault: false,
      isArchived: false,
      sortOrder: nextSort,
      ownerId,
      groupId: groupId || null
    });

    return newCategory;
  }

  /**
   * Chỉnh sửa danh mục (đổi tên, icon, màu, sortOrder)
   * Khóa danh mục hệ thống: không cho đổi tên, không cho đổi type
   */
  static async updateCategory(id, updateData, userId, groupId = null) {
    const scopeFilter = groupId ? { groupId } : { ownerId: userId, groupId: null };
    const category = await Category.findOne({ _id: id, ...scopeFilter });

    if (!category) {
      throw new Error('Không tìm thấy danh mục hoặc không có quyền thao tác');
    }

    // Nếu là danh mục hệ thống: CHẶN đổi tên & đổi loại
    if (category.isSystem) {
      if (updateData.name && updateData.name.trim() !== category.name) {
        throw new Error('Danh mục hệ thống được bảo vệ, không thể đổi tên');
      }
      if (updateData.type && updateData.type !== category.type) {
        throw new Error('Không thể thay đổi loại của danh mục hệ thống');
      }
    } else if (updateData.name && updateData.name.trim() !== category.name) {
      // Kiểm tra trùng tên với danh mục khác cùng loại
      const cleanName = updateData.name.trim();
      const duplicate = await Category.findOne({
        _id: { $ne: id },
        ...scopeFilter,
        type: category.type,
        name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        isArchived: false
      });

      if (duplicate) {
        throw new Error(`Đã có danh mục khác tên là "${cleanName}" trong danh sách`);
      }
      category.name = cleanName;
    }

    if (updateData.icon) category.icon = updateData.icon;
    if (updateData.color) category.color = updateData.color;
    if (typeof updateData.sortOrder === 'number') category.sortOrder = updateData.sortOrder;

    await category.save();
    return category;
  }

  /**
   * Kiểm tra quyền sửa/ẩn danh mục
   * - Cá nhân: chính chủ
   * - Nhóm: chỉ owner/admin
   */
  static async canModify(category, userId) {
    if (!category || !userId) return false;
    if (!category.groupId) {
      return category.ownerId.toString() === userId.toString();
    }
    const { default: GroupMember } = await import('../models/GroupMember.js');
    const member = await GroupMember.findOne({ groupId: category.groupId, userId });
    return Boolean(member && (member.role === 'owner' || member.role === 'admin'));
  }

  /**
   * Ẩn danh mục (soft delete qua isArchived: true)
   * Danh mục hệ thống: Chặn ẩn!
   */
  static async archiveCategory(id, userId, groupId = null) {
    const scopeFilter = groupId ? { groupId } : { ownerId: userId, groupId: null };
    const category = await Category.findOne({ _id: id, ...scopeFilter });

    if (!category) {
      throw new Error('Không tìm thấy danh mục hoặc không có quyền thao tác');
    }

    if (category.isSystem) {
      throw new Error('Danh mục hệ thống là bắt buộc, không được phép ẩn hoặc xóa');
    }

    category.isArchived = true;
    await category.save();

    // Tự động tắt/xóa ngân sách gắn với danh mục này (nếu có)
    await Budget.deleteMany({ categoryId: category._id });

    return category;
  }

  /**
   * Khôi phục danh mục đã ẩn
   */
  static async restoreCategory(id, userId, groupId = null) {
    const scopeFilter = groupId ? { groupId } : { ownerId: userId, groupId: null };
    const category = await Category.findOne({ _id: id, ...scopeFilter });

    if (!category) {
      throw new Error('Không tìm thấy danh mục hoặc không có quyền thao tác');
    }

    category.isArchived = false;
    await category.save();
    return category;
  }

  /**
   * Sắp xếp lại thứ tự hiển thị của các danh mục
   */
  static async reorderCategories(orderedIds, userId, groupId = null) {
    if (!Array.isArray(orderedIds)) throw new Error('orderedIds phải là một mảng ID');

    const scopeFilter = groupId ? { groupId } : { ownerId: userId, groupId: null };
    const operations = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, ...scopeFilter },
        update: { $set: { sortOrder: index } }
      }
    }));

    if (operations.length > 0) {
      await Category.bulkWrite(operations);
    }

    return this.getCategories({ ownerId: userId, groupId, type: undefined });
  }

  /**
   * Thống kê cơ cấu chi tiêu theo danh mục (Aggregation Pipeline)
   * Tham số excludeCogs=true (mặc định) để loại bỏ "Giá vốn / Nhập hàng" khỏi chi tiêu sinh hoạt cá nhân
   */
  static async getExpenseBreakdown({ ownerId, groupId = null, startDate, endDate, excludeCogs = true }: any) {
    const match: any = {
      type: 'expense',
      isDeleted: false
    };

    if (groupId) {
      match.groupId = new mongoose.Types.ObjectId(groupId);
    } else {
      match.ownerId = new mongoose.Types.ObjectId(ownerId);
      match.groupId = null;
    }

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = /^\d{4}-\d{2}-\d{2}$/.test(String(startDate)) ? startOfDayVN(new Date(startDate)) : new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(endDate))) end.setTime(endOfDayVN(end).getTime());
        match.date.$lte = end;
      }
    } else {
      // Mặc định tháng hiện tại
      const now = new Date();
      match.date = {
        $gte: getStartOfMonthVN(now),
        $lte: getEndOfMonthVN(now)
      };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }
    ];

    const results = await Transaction.aggregate(pipeline);

    // Tính tổng chi để tính %
    let filteredResults = results;
    if (excludeCogs) {
      filteredResults = results.filter(
        r => r.category?.name !== 'Giá vốn / Nhập hàng' && r.category?.name !== 'Giá vốn sản phẩm'
      );
    }

    const totalExpense = filteredResults.reduce((acc, cur) => acc + cur.total, 0);

    const breakdown = filteredResults.map(item => {
      const percentage = totalExpense > 0 ? Number(((item.total / totalExpense) * 100).toFixed(1)) : 0;
      return {
        categoryId: item._id,
        categoryName: item.category?.name || 'Khác',
        icon: item.category?.icon || 'more-horizontal',
        color: item.category?.color || '#9ca3af',
        isSystem: Boolean(item.category?.isSystem),
        total: item.total,
        count: item.count,
        percentage
      };
    });

    // Sắp xếp tổng tiền giảm dần
    breakdown.sort((a, b) => b.total - a.total);

    return {
      totalExpense,
      excludeCogs,
      categories: breakdown
    };
  }
}
