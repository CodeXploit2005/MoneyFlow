import { ownDetailsFilter } from '../utils/groupPolicy.js';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import Transaction from '../models/Transaction.js';
import GroupMember from '../models/GroupMember.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getCustomers = async (req, res) => {
  try {
    const { groupId, keyword, page = 1, limit = 50 }: any = req.query;

    // Tự động đồng bộ các đối tác/khách hàng từ Sổ Thu Chi sang Danh bạ Khách hàng nếu chưa có
    try {
      const distinctCounterparties = await Transaction.distinct('counterparty', {
        ...(groupId ? { groupId, ...ownDetailsFilter(req) } : { ownerId: (req as any).user._id, groupId: null }),
        isDeleted: false,
        counterparty: { $nin: ['', null, 'Nhà cung cấp / Giá vốn', 'Chuyển tiền'] }
      });

      for (const cp of distinctCounterparties) {
        if (typeof cp === 'string' && cp.trim().length >= 2) {
          const raw = cp.trim();
          let parsedName = raw;
          let parsedPhone = '';
          const match = raw.match(/^(.*?)\s*\(?([0-9]{9,11})\)?$/);
          if (match && match[1]) {
            parsedName = match[1].trim();
            parsedPhone = match[2].trim();
          }

          const existing = await Customer.findOne({
            ...(groupId ? { groupId, ...ownDetailsFilter(req) } : { ownerId: (req as any).user._id, groupId: null }),
            $or: [
              { name: parsedName },
              ...(parsedPhone ? [{ phone: parsedPhone }] : [])
            ]
          });

          if (!existing) {
            await Customer.create({
              name: parsedName,
              phone: parsedPhone,
              ownerId: (req as any).user._id,
              groupId: groupId || null,
              note: 'Đồng bộ từ Sổ Thu Chi'
            });
          }
        }
      }
    } catch (syncErr) {
      console.warn('Sync counterparties warning:', syncErr);
    }

    const filter: any = {};

    if (groupId) {
      filter.groupId = groupId;
      Object.assign(filter, ownDetailsFilter(req));
    } else {
      filter.ownerId = req.user._id;
      filter.groupId = null;
    }

    if (keyword) {
      const keywordFilter = {
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { phone: { $regex: keyword, $options: 'i' } },
          { zalo: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } }
        ]
      };

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, keywordFilter];
        delete filter.$or;
      } else {
        filter.$or = keywordFilter.$or;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Customer.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return sendError(res, 'Lỗi lấy danh sách khách hàng: ' + error.message, 500);
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return sendError(res, 'Không tìm thấy khách hàng', 404);
    }

    // Lấy thống kê đơn hàng của khách
    const scope = customer.groupId ? { groupId: customer.groupId, ...ownDetailsFilter(req) } : { groupId: null, ownerId: req.user._id };
    const sales = await Sale.find({ customerId: id, ...scope }).sort({ soldAt: -1 });

    const totalOrders = sales.length;
    const totalSpentFromSales = sales.reduce((sum, s) => sum + (s.price * s.quantity), 0);
    const activeWarranties = sales.filter(s => s.status === 'active' || s.status === 'expiring_soon');

    // Lấy các giao dịch tương ứng bên mục Sổ Thu Chi (theo saleId hoặc tên/SĐT đối tác)
    const saleIds = sales.map(s => s._id);
    const txFilter: any = {
      ...scope,
      isDeleted: false,
      $or: [
        { saleId: { $in: saleIds } },
        { counterparty: customer.name },
        ...(customer.phone ? [{ counterparty: { $regex: customer.phone, $options: 'i' } }] : [])
      ]
    };
    const transactions = await Transaction.find(txFilter).sort({ date: -1, createdAt: -1 }).limit(15);
    const totalIncomeFromTx = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return sendSuccess(res, {
      customer,
      stats: {
        totalOrders,
        totalSpent: Math.max(totalSpentFromSales, totalIncomeFromTx),
        totalIncomeFromTx,
        transactionCount: transactions.length,
        activeWarrantyCount: activeWarranties.length
      },
      sales,
      transactions
    });
  } catch (error) {
    return sendError(res, 'Lỗi lấy chi tiết khách hàng: ' + error.message, 500);
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { name, phone, zalo, email, note, groupId } = req.body;

    const customer = await Customer.create({
      name,
      phone: phone || '',
      zalo: zalo || '',
      email: email || '',
      note: note || '',
      ownerId: req.user._id,
      groupId: groupId || null
    });

    return sendSuccess(res, customer, 'Thêm khách hàng thành công', 201);
  } catch (error) {
    return sendError(res, 'Lỗi thêm khách hàng: ' + error.message, 500);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, zalo, email, note } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      id,
      { name, phone, zalo, email, note },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return sendError(res, 'Không tìm thấy khách hàng', 404);
    }

    return sendSuccess(res, customer, 'Cập nhật khách hàng thành công');
  } catch (error) {
    return sendError(res, 'Lỗi cập nhật khách hàng: ' + error.message, 500);
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await Customer.findByIdAndDelete(id);
    return sendSuccess(res, null, 'Xóa khách hàng thành công');
  } catch (error) {
    return sendError(res, 'Lỗi xóa khách hàng: ' + error.message, 500);
  }
};
