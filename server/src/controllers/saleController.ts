import mongoose from 'mongoose';
import GroupMember from '../models/GroupMember.js';
import Sale from '../models/Sale.js';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import { CategoryService } from '../services/categoryService.js';
import { ProfitService } from '../services/profitService.js';
import { WarrantyService } from '../services/warrantyService.js';
import { addDays, determineWarrantyStatus } from '../utils/dateUtils.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getSocketIO } from '../sockets/socketHandler.js';

export const getSales = async (req, res) => {
  try {
    const {
      groupId,
      status,
      paymentStatus,
      customerId,
      keyword,
      page = 1,
      limit = 20
    } = req.query;

    const filter: any = {};

    if (groupId) {
      filter.groupId = groupId;
    } else {
      filter.ownerId = (req as any).user._id;
      filter.groupId = null;
    }

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (customerId) filter.customerId = customerId;

    if (keyword) {
      filter.$or = [
        { productName: { $regex: keyword, $options: 'i' } },
        { notes: { $regex: keyword, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('customerId', 'name phone zalo email')
        .populate('ownerId', 'name avatar')
        .sort({ soldAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Sale.countDocuments(filter)
    ]);

    // Đồng bộ lại trạng thái bảo hành thực tế
    const now = new Date();
    sales.forEach(s => {
      const realStatus = determineWarrantyStatus(s.warrantyEnd, now);
      if (s.status !== realStatus && s.status !== 'void') {
        s.status = realStatus;
        s.save();
      }
    });

    return sendSuccess(res, {
      sales,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return sendError(res, 'Lỗi lấy danh sách bán hàng: ' + error.message, 500);
  }
};

export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findById(id)
      .populate('customerId')
      .populate('ownerId', 'name avatar')
      .populate('incomeTransactionId')
      .populate('costTransactionId')
      .populate('claims.handledBy', 'name');

    if (!sale) {
      return sendError(res, 'Không tìm thấy đơn bán', 404);
    }

    if (!await canAccessSale(sale, req.user._id)) return sendError(res, 'Không có quyền truy cập đơn', 403);
    return sendSuccess(res, sale);
  } catch (error) {
    return sendError(res, 'Lỗi lấy thông tin đơn bán: ' + error.message, 500);
  }
};

export const createSale = async (req, res) => {
  try {
    const {
      productName,
      customerId,
      newCustomer, // { name, phone, zalo, email } nếu tạo khách nhanh
      price,
      cost = 0,
      quantity = 1,
      soldAt,
      warrantyDays = 30,
      warrantyStart,
      paymentStatus = 'paid',
      notes = '',
      groupId
    } = req.body;

    const numbers = [price, cost, quantity, warrantyDays].map(Number);
    if (!numbers.every(Number.isSafeInteger) || Number(price) < 0 || Number(cost) < 0 || Number(quantity) < 1 || Number(warrantyDays) < 0 || !Number.isSafeInteger(Number(price) * Number(quantity)) || !Number.isSafeInteger(Number(cost) * Number(quantity))) {
      return sendError(res, 'Giá tiền, số lượng và số ngày phải là số nguyên hợp lệ', 400);
    }
    const initialPaid = paymentStatus === 'paid' ? Number(price) * Number(quantity) : paymentStatus === 'unpaid' ? 0 : Number(req.body.paidAmount);
    if (!['paid', 'partial', 'unpaid'].includes(paymentStatus) || !Number.isSafeInteger(initialPaid) || initialPaid < 0 || (paymentStatus === 'partial' && (initialPaid <= 0 || initialPaid >= Number(price) * Number(quantity)))) {
      return sendError(res, 'Số tiền đặt cọc phải lớn hơn 0 và nhỏ hơn tổng đơn', 400);
    }
    if ([soldAt, warrantyStart].some(d => d && !Number.isFinite(new Date(d).getTime()))) return sendError(res, 'Ngày không hợp lệ', 400);
    let finalCustomerId = customerId;
    if (customerId && !await Customer.exists({ _id: customerId, ...(groupId ? { groupId } : { ownerId: req.user._id, groupId: null }) })) return sendError(res, 'Khách hàng không thuộc không gian làm việc', 403);

    // Nếu tạo khách mới ngay trong form bán
    if (!finalCustomerId && newCustomer && newCustomer.name) {
      const createdCust = await Customer.create({
        name: newCustomer.name,
        phone: newCustomer.phone || '',
        zalo: newCustomer.zalo || '',
        email: newCustomer.email || '',
        ownerId: req.user._id,
        groupId: groupId || null
      });
      finalCustomerId = createdCust._id;
    }

    if (!finalCustomerId) {
      return sendError(res, 'Vui lòng chọn hoặc nhập thông tin khách hàng', 400);
    }

    const saleDate = soldAt ? new Date(soldAt) : new Date();
    const wStart = warrantyStart ? new Date(warrantyStart) : saleDate;
    const wDays = Number(warrantyDays) >= 0 ? Number(warrantyDays) : 30;
    const wEnd = addDays(wStart, wDays);
    const wStatus = determineWarrantyStatus(wEnd);

    const profit = ProfitService.calculateProfit(price, cost, quantity);
    const totalRevenue = Math.round(Number(price) * Number(quantity));
    const totalCost = Math.round(Number(cost) * Number(quantity));

    // 1. Tạo bản ghi Sale
    const sale = new Sale({
      productName,
      customerId: finalCustomerId,
      price: Math.round(Number(price)),
      cost: Math.round(Number(cost)),
      quantity: Number(quantity) || 1,
      profit,
      soldAt: saleDate,
      warrantyDays: wDays,
      warrantyStart: wStart,
      warrantyEnd: wEnd,
      status: wStatus,
      paymentStatus,
      paidAmount: initialPaid,
      notes,
      ownerId: req.user._id,
      groupId: groupId || null
    });

    const customer = await Customer.findById(finalCustomerId);

    // 2. Tự động sinh khoản THU tương ứng gắn danh mục hệ thống "Bán hàng"
    const saleCategory = await CategoryService.getSystemCategory(req.user._id, groupId || null, 'Bán hàng', 'income');

    if (initialPaid > 0) {
    const incomeTx = await Transaction.create({
      type: 'income',
      amount: initialPaid,
      title: `Bán ${quantity > 1 ? `${quantity}x ` : ''}${productName}`,
      categoryId: saleCategory._id,
      date: saleDate,
      note: `Tự động tạo từ đơn bán: ${productName}. Khách: ${customer?.name || ''}`,
      counterparty: customer?.name || '',
      ownerId: req.user._id,
      groupId: groupId || null,
      saleId: sale._id
    });
    sale.incomeTransactionId = incomeTx._id;
    }

    // 3. Tự động sinh khoản CHI (giá vốn) nếu có chi phí nhập gắn danh mục "Giá vốn / Nhập hàng"
    if (totalCost > 0) {
      const costCategory = await CategoryService.getSystemCategory(req.user._id, groupId || null, 'Giá vốn / Nhập hàng', 'expense');

      const costTx = await Transaction.create({
        type: 'expense',
        amount: totalCost,
        title: `Giá vốn: ${productName}`,
        categoryId: costCategory._id,
        date: saleDate,
        note: `Giá vốn cho đơn bán ${productName} (SL: ${quantity})`,
        counterparty: 'Nhà cung cấp / Giá vốn',
        ownerId: req.user._id,
        groupId: groupId || null,
        saleId: sale._id
      });
      sale.costTransactionId = costTx._id;
    }

    await sale.save();
    await sale.populate('customerId', 'name phone zalo email');
    await sale.populate('ownerId', 'name avatar');

    // Socket realtime notify group
    if (groupId) {
      const io = getSocketIO();
      if (io) {
        io.to(`group_${groupId}`).emit('sale:created', {
          sale,
          actor: { _id: req.user._id, name: req.user.name }
        });
      }
    }

    return sendSuccess(res, sale, 'Tạo đơn bán và đồng bộ sổ thu chi thành công', 201);
  } catch (error) {
    return sendError(res, 'Lỗi tạo đơn bán: ' + error.message, 500);
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method = 'transfer', note = '' } = req.body;

    const sale = await Sale.findById(id);
    if (sale && !await canAccessSale(sale, req.user._id)) return sendError(res, 'Không có quyền truy cập đơn', 403);
    if (!sale) return sendError(res, 'Không tìm thấy đơn bán', 404);

    if (sale.status === 'void') return sendError(res, 'Đơn đã hủy', 400);
    const payAmount = Number(amount);
    if (!Number.isSafeInteger(payAmount) || payAmount > sale.price * sale.quantity - sale.paidAmount || payAmount <= 0) return sendError(res, 'Số tiền thanh toán phải lớn hơn 0', 400);

    const category = await CategoryService.getSystemCategory(sale.ownerId, sale.groupId, 'Bán hàng', 'income');
    await Transaction.create({ type: 'income', amount: payAmount, title: 'Thu tiền đơn: ' + sale.productName, categoryId: category._id, date: new Date(), ownerId: sale.ownerId, groupId: sale.groupId, saleId: sale._id, note });
    sale.payments.push({
      amount: payAmount,
      date: new Date(),
      method,
      note
    });

    sale.paidAmount = (sale.paidAmount || 0) + payAmount;
    const totalOrder = sale.price * sale.quantity;

    if (sale.paidAmount >= totalOrder) {
      sale.paymentStatus = 'paid';
    } else {
      sale.paymentStatus = 'partial';
    }

    await sale.save();
    return sendSuccess(res, sale, 'Ghi nhận thanh toán thành công');
  } catch (error) {
    return sendError(res, 'Lỗi ghi nhận thanh toán: ' + error.message, 500);
  }
};

async function canAccessSale(sale, userId) {
  return sale.groupId ? Boolean(await GroupMember.exists({ groupId: sale.groupId, userId })) : String(sale.ownerId?._id || sale.ownerId) === String(userId);
}
