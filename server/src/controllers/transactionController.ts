import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import Customer from '../models/Customer.js';
import { correctLinkedAmount } from '../services/TransactionCorrectionService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getSocketIO } from '../sockets/socketHandler.js';

export const getTransactions = async (req, res) => {
  try {
    const {
      groupId,
      type,
      categoryId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      keyword,
      includeDeleted = 'false',
      page = 1,
      limit = 20
    } = req.query;

    const filter: any = {};

    // Group or Personal
    if (groupId) {
      filter.groupId = groupId;
      // Nếu nhóm có cài đặt ẩn số tiền với thành viên thường và user này chỉ là member:
      if ((req as any).userRoleInGroup === 'member' && (req as any).group?.settings?.hideAmountsForMembers) {
        // Chỉ xem giao dịch của chính mình trong nhóm
        filter.ownerId = (req as any).user._id;
      }
    } else {
      filter.ownerId = (req as any).user._id;
      filter.groupId = null;
    }

    // Soft delete filter
    if (includeDeleted === 'true') {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = false;
    }

    // Type filter
    if (type) {
      filter.type = type;
    }

    // Category filter (hỗ trợ 1 ID hoặc nhiều ID cách nhau bằng dấu phẩy)
    if (categoryId) {
      const catIds = String(categoryId).split(',').map(id => id.trim()).filter(id => mongoose.Types.ObjectId.isValid(id));
      if (catIds.length === 1) {
        filter.categoryId = catIds[0];
      } else if (catIds.length > 1) {
        filter.categoryId = { $in: catIds };
      }
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    // Keyword search (title, note, counterparty)
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { note: { $regex: keyword, $options: 'i' } },
        { counterparty: { $regex: keyword, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('categoryId', 'name icon color type')
        .populate('ownerId', 'name avatar email')
        .populate({
          path: 'saleId',
          select: 'productName warrantyDays warrantyEnd status price customerId',
          populate: { path: 'customerId', select: 'name phone' }
        })
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return sendError(res, 'Lỗi lấy danh sách giao dịch: ' + error.message, 500);
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await Transaction.findById(id)
      .populate('categoryId')
      .populate('ownerId', 'name avatar')
      .populate('saleId')
      .populate('history.modifiedBy', 'name');

    if (!tx) {
      return sendError(res, 'Không tìm thấy giao dịch', 404);
    }

    // Kiểm tra quyền truy cập nếu là giao dịch cá nhân
    if (!tx.groupId && tx.ownerId._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Bạn không có quyền xem giao dịch này', 403);
    }

    return sendSuccess(res, tx);
  } catch (error) {
    return sendError(res, 'Lỗi lấy giao dịch: ' + error.message, 500);
  }
};

export const createTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      title,
      categoryId,
      date,
      note,
      method,
      counterparty,
      receiptUrl,
      groupId,
      saleId
    } = req.body;

    if (!Number.isSafeInteger(Number(amount)) || Number(amount) <= 0) return sendError(res, 'Số tiền phải là số nguyên lớn hơn 0', 400);

    let targetCategoryId = categoryId;

    // Đảm bảo categoryId luôn là ObjectId hợp lệ, tránh lỗi CastError 500
    if (!targetCategoryId || !mongoose.Types.ObjectId.isValid(targetCategoryId)) {
      let existingCat = await Category.findOne({
        ownerId: req.user._id,
        type: type || 'income'
      });

      if (!existingCat) {
        existingCat = await Category.create({
          name: type === 'income' ? 'Bán hàng & Doanh thu' : 'Chi phí',
          type: type || 'income',
          icon: type === 'income' ? 'shopping-bag' : 'package',
          color: type === 'income' ? '#10b981' : '#ef4444',
          ownerId: req.user._id,
          groupId: groupId || null,
          isDefault: true
        });
      }
      targetCategoryId = existingCat._id;
    }

    const tx = await Transaction.create({
      type: type || 'income',
      amount: Math.round(Number(amount) || 0),
      title: title || 'Giao dịch',
      categoryId: targetCategoryId,
      date: date ? new Date(date) : new Date(),
      note: note || '',
      method: method || 'transfer',
      counterparty: counterparty || '',
      receiptUrl: receiptUrl || '',
      ownerId: req.user._id,
      groupId: groupId || null,
      saleId: saleId || null
    });

    // Tự động đồng bộ khách hàng/đối tác vào Danh bạ Khách hàng
    if (counterparty && typeof counterparty === 'string' && counterparty.trim().length >= 2) {
      try {
        const raw = counterparty.trim();
        if (!['Nhà cung cấp / Giá vốn', 'Chuyển tiền', 'Ngân hàng'].includes(raw)) {
          let parsedName = raw;
          let parsedPhone = '';
          const match = raw.match(/^(.*?)\s*\(?([0-9]{9,11})\)?$/);
          if (match && match[1]) {
            parsedName = match[1].trim();
            parsedPhone = match[2].trim();
          }

          const existingCust = await Customer.findOne({
            ownerId: req.user._id,
            $or: [
              { name: parsedName },
              ...(parsedPhone ? [{ phone: parsedPhone }] : [])
            ]
          });

          if (!existingCust) {
            await Customer.create({
              name: parsedName,
              phone: parsedPhone,
              ownerId: req.user._id,
              groupId: groupId || null,
              note: 'Tạo tự động từ Sổ Thu Chi'
            });
          }
        }
      } catch (custErr) {
        console.warn('Auto create customer from transaction error:', custErr);
      }
    }

    await tx.populate('categoryId', 'name icon color type');
    await tx.populate('ownerId', 'name avatar email');

    // Realtime notification qua Socket.IO nếu thuộc nhóm
    if (groupId) {
      const io = getSocketIO();
      if (io) {
        io.to(`group_${groupId}`).emit('transaction:created', {
          transaction: tx,
          actor: { _id: req.user._id, name: req.user.name }
        });
      }
    }

    return sendSuccess(res, tx, 'Tạo giao dịch thành công', 201);
  } catch (error) {
    console.error('Lỗi tạo giao dịch:', error);
    return sendError(res, 'Lỗi tạo giao dịch: ' + error.message, 500);
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['type', 'amount', 'title', 'categoryId', 'date', 'note', 'method', 'counterparty', 'receiptUrl'];
    const updateData = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if ('amount' in updateData && (!Number.isSafeInteger(Number(updateData.amount)) || Number(updateData.amount) <= 0)) return sendError(res, 'Số tiền phải là số nguyên lớn hơn 0', 400);

    let tx = await Transaction.findById(id);
    if (!tx) {
      return sendError(res, 'Không tìm thấy giao dịch', 404);
    }

    // Chỉ chủ giao dịch hoặc admin/owner nhóm mới được sửa
    const isOwner = tx.ownerId.toString() === req.user._id.toString();
    const isGroupAdmin = req.userRoleInGroup === 'owner' || req.userRoleInGroup === 'admin';

    if (!isOwner && !isGroupAdmin) {
      return sendError(res, 'Bạn không có quyền chỉnh sửa giao dịch này', 403);
    }

    if (tx.saleId) {
      const metadata = ['amount', 'title', 'note', 'method', 'counterparty', 'receiptUrl'];
      // Keep the sale's type/category/date intact; amount corrections are
      // synchronized with the sale in a database transaction below.
      for (const key of Object.keys(updateData).filter(key => !metadata.includes(key))) {
        const value = updateData[key];
        const unchanged = key === 'amount' ? Number(value) === tx.amount
          : key === 'date' ? new Date(value as any).getTime() === tx.date.getTime()
          : key === 'categoryId' ? String((value as any)?._id || value) === String(tx.categoryId)
          : value === tx[key];
        if (!unchanged) return sendError(res, 'Số tiền, ngày và danh mục của giao dịch này được đồng bộ từ đơn bán. Vui lòng chỉnh sửa tại đơn bán.', 400);
        delete updateData[key];
      }
      if ('amount' in updateData && Number(updateData.amount) !== tx.amount) {
        try {
          const sale = await correctLinkedAmount(id, Number(updateData.amount), req.user._id);
          const io = getSocketIO();
          if (io && sale.groupId) io.to(`group_${sale.groupId}`).emit('sale:updated', {sale, actor: {_id: req.user._id, name: req.user.name}});
          tx = await Transaction.findById(id);
        } catch (error) {
          return sendError(res, error.message, 400);
        }
      }
      delete updateData.amount;
    }
    // Ghi lại lịch sử chỉnh sửa
    const changes = {};
    for (const key of Object.keys(updateData)) {
      if (tx[key] !== undefined && tx[key] !== updateData[key]) {
        changes[key] = { from: tx[key], to: updateData[key] };
      }
    }

    tx.history.push({
      modifiedBy: req.user._id,
      modifiedAt: new Date(),
      action: 'update',
      changes
    });

    // Cập nhật các trường
    Object.assign(tx, updateData);
    await tx.save();

    await tx.populate('categoryId', 'name icon color type');
    await tx.populate('ownerId', 'name avatar email');

    if (tx.groupId) {
      const io = getSocketIO();
      if (io) {
        io.to(`group_${tx.groupId}`).emit('transaction:updated', {
          transaction: tx,
          actor: { _id: req.user._id, name: req.user.name }
        });
      }
    }

    return sendSuccess(res, tx, 'Cập nhật giao dịch thành công');
  } catch (error) {
    return sendError(res, 'Lỗi cập nhật giao dịch: ' + error.message, 500);
  }
};

export const softDeleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await Transaction.findById(id);

    if (!tx) {
      return sendError(res, 'Không tìm thấy giao dịch', 404);
    }

    const isOwner = tx.ownerId.toString() === req.user._id.toString();
    const isGroupAdmin = req.userRoleInGroup === 'owner' || req.userRoleInGroup === 'admin';

    if (!isOwner && !isGroupAdmin) {
      return sendError(res, 'Bạn không có quyền xóa giao dịch này', 403);
    }

    if (tx.saleId) return sendError(res, 'Giao dịch liên kết đơn bán không thể xóa trực tiếp', 400);
    tx.isDeleted = true;
    tx.deletedAt = new Date();
    tx.history.push({
      modifiedBy: req.user._id,
      modifiedAt: new Date(),
      action: 'delete'
    });

    await tx.save();

    if (tx.groupId) {
      const io = getSocketIO();
      if (io) {
        io.to(`group_${tx.groupId}`).emit('transaction:deleted', {
          transactionId: id,
          actor: { _id: req.user._id, name: req.user.name }
        });
      }
    }

    return sendSuccess(res, null, 'Đã chuyển giao dịch vào thùng rác');
  } catch (error) {
    return sendError(res, 'Lỗi xóa giao dịch: ' + error.message, 500);
  }
};

export const restoreTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await Transaction.findById(id);

    if (!tx) {
      return sendError(res, 'Không tìm thấy giao dịch', 404);
    }

    tx.isDeleted = false;
    tx.deletedAt = null;
    tx.history.push({
      modifiedBy: req.user._id,
      modifiedAt: new Date(),
      action: 'restore'
    });

    await tx.save();

    return sendSuccess(res, tx, 'Đã khôi phục giao dịch thành công');
  } catch (error) {
    return sendError(res, 'Lỗi khôi phục giao dịch: ' + error.message, 500);
  }
};
