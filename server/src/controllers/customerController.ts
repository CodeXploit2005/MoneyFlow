import { cleanCustomerName, cleanCustomerPhone, customerContactFilter } from '../utils/customerIdentity.js';
import { searchPattern, textSearch } from '../utils/search.js';
import { ownDetailsFilter } from '../utils/groupPolicy.js';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import Transaction from '../models/Transaction.js';
import { sendSuccess, sendError } from '../utils/response.js';


const customerInput = (body: any) => {
  const data: any = {};
  for (const key of ['name', 'phone', 'zalo', 'email', 'note']) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== 'string') throw new Error('Thông tin khách hàng phải là văn bản');
    data[key] = body[key].trim();
  }
  if (data.name !== undefined) data.name = cleanCustomerName(data.name);
  if (data.name !== undefined && (!data.name || data.name.length > 160)) throw new Error('Tên khách hàng phải có từ 1 đến 160 ký tự');
  if (data.phone !== undefined) {
    data.phone = cleanCustomerPhone(data.phone);
    if (data.phone && !/^\+?\d{7,15}$/.test(data.phone)) throw new Error('Số điện thoại phải có từ 7 đến 15 chữ số');
  }
  if (data.email !== undefined) {
    data.email = data.email.toLowerCase();
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('Email không hợp lệ');
  }
  if ((data.zalo?.length || 0) > 500 || (data.note?.length || 0) > 5000) throw new Error('Thông tin liên hệ hoặc ghi chú quá dài');
  return data;
};
const duplicateContact = async (scope: any, data: any, excludeId?: any) => {
  const contact = customerContactFilter(data.phone || '', data.email || '');
  return contact ? Customer.findOne({ ...scope, ...contact, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select('_id name') : null;
};

export const getCustomers = async (req, res) => {
  try {
    const { groupId, keyword, sort = 'newest' }: any = req.query;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) return sendError(res, 'Trang và số khách mỗi trang không hợp lệ (tối đa 100)', 400);
    if (!['newest', 'name_asc', 'name_desc'].includes(sort)) return sendError(res, 'Cách sắp xếp không hợp lệ', 400);
    if (keyword !== undefined && (typeof keyword !== 'string' || keyword.length > 200)) return sendError(res, 'Từ khóa tối đa 200 ký tự', 400);

    const filter: any = {};

    if (groupId) {
      filter.groupId = groupId;
      Object.assign(filter, ownDetailsFilter(req));
    } else {
      filter.ownerId = req.user._id;
      filter.groupId = null;
    }

    const pattern = searchPattern(keyword);
    if (pattern) Object.assign(filter, textSearch(['name', 'phone', 'zalo', 'email'], pattern));

    const skip = (Number(page) - 1) * Number(limit);

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort(sort === 'name_asc' ? { name: 1, _id: 1 } : sort === 'name_desc' ? { name: -1, _id: -1 } : { createdAt: -1, _id: -1 })
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
    const sameNameCount = await Customer.countDocuments({ ...scope, name: customer.name });
    const legacyCounterparties = [
      ...(sameNameCount === 1 ? [{ counterparty: customer.name }] : []),
      ...(customer.phone ? [{ counterparty: `${customer.name} (${customer.phone})` }] : [])
    ];
    const txFilter: any = {
      ...scope,
      isDeleted: false,
      $or: [
        { saleId: { $in: saleIds } },
        ...(legacyCounterparties.length ? [{ saleId: null, $or: legacyCounterparties }] : [])
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
    let data;
    try { data = customerInput(req.body); if (!data.name) throw new Error('Vui lòng nhập tên khách hàng'); }
    catch (error) { return sendError(res, error.message, 400); }
    const groupId = req.body.groupId || null;
    const scope = groupId ? { groupId } : { ownerId: req.user._id, groupId: null };
    if (await duplicateContact(scope, data)) return sendError(res, 'SĐT hoặc email đã có trong danh bạ. Hãy tìm và chọn khách đã có.', 409);
    const customer = await Customer.create({ ...data, ownerId: req.user._id, groupId });

    return sendSuccess(res, customer, 'Thêm khách hàng thành công', 201);
  } catch (error) {
    return sendError(res, 'Lỗi thêm khách hàng: ' + error.message, 500);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Customer.findById(id);
    if (!existing) return sendError(res, 'Không tìm thấy khách hàng', 404);
    let data;
    try { data = customerInput(req.body); } catch (error) { return sendError(res, error.message, 400); }
    const scope = existing.groupId ? { groupId: existing.groupId } : { ownerId: existing.ownerId, groupId: null };
    if (await duplicateContact(scope, data, id)) return sendError(res, 'SĐT hoặc email đã thuộc một khách hàng khác.', 409);
    const customer = await Customer.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    return sendSuccess(res, customer, 'Cập nhật khách hàng thành công');
  } catch (error) {
    return sendError(res, 'Lỗi cập nhật khách hàng: ' + error.message, 500);
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (await Sale.exists({ customerId: id })) return sendError(res, 'Khách hàng đã có đơn hàng. Hãy giữ hồ sơ để bảo toàn lịch sử mua và bảo hành.', 409);
    await Customer.findByIdAndDelete(id);
    return sendSuccess(res, null, 'Xóa khách hàng thành công');
  } catch (error) {
    return sendError(res, 'Lỗi xóa khách hàng: ' + error.message, 500);
  }
};
