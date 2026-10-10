import Customer from '../models/Customer.js';
import { searchPattern, textSearch } from '../utils/search.js';
import { ownDetailsFilter } from '../utils/groupPolicy.js';
import Sale from '../models/Sale.js';
import { WarrantyService } from '../services/warrantyService.js';
import { determineWarrantyStatus } from '../utils/dateUtils.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getWarranties = async (req, res) => {
  try {
    const { groupId, status, month, year, keyword }: any = req.query;
    const paginated = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Number(req.query.page ?? 1), limit = Number(req.query.limit ?? 20);
    if (paginated && (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100)) return sendError(res, 'Trang và số mục mỗi trang không hợp lệ (tối đa 100)', 400);
    if (keyword !== undefined && (typeof keyword !== 'string' || keyword.length > 200)) return sendError(res, 'Từ khóa tối đa 200 ký tự', 400);
    const filter: any = {};

    if (groupId) {
      filter.groupId = groupId;
      Object.assign(filter, ownDetailsFilter(req));
    } else {
      filter.ownerId = (req as any).user._id;
      filter.groupId = null;
    }

    const scope = { ...filter };
    const terms = typeof keyword === 'string' ? keyword.trim().split(/\s+/).filter(Boolean) : [];
    if (terms.length) {
      filter.$and = await Promise.all(terms.map(async term => {
        const pattern = searchPattern(term);
        const customers = await Customer.find({ ...scope, ...textSearch(['name', 'phone', 'zalo', 'email'], pattern) }).select('_id');
        return { $or: [...textSearch(['productName', 'notes'], pattern).$or, { customerId: { $in: customers.map(customer => customer._id) } }] };
      }));
    }

    if (status) {
      filter.status = status;
    }

    // Nếu lọc theo tháng cho Calendar view
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      filter.warrantyEnd = { $gte: start, $lte: end };
    }

    const query = Sale.find(filter)
      .populate('customerId', 'name phone zalo email')
      .populate('ownerId', 'name avatar')
      .sort({ warrantyEnd: 1, _id: 1 });
    if (paginated) query.skip((page - 1) * limit).limit(limit);
    const [warranties, total] = await Promise.all([query, paginated ? Sale.countDocuments(filter) : Promise.resolve(0)]);

    // Cập nhật lại status theo thời điểm thực tế
    const now = new Date();
    warranties.forEach(w => {
      const realStatus = determineWarrantyStatus(w.warrantyEnd, now);
      if (w.status !== realStatus && w.status !== 'void') {
        w.status = realStatus;
        // Avoid an unawaited background write while a payment updates this sale.
      }
    });

    return sendSuccess(res, paginated ? { warranties, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } : warranties);
  } catch (error) {
    return sendError(res, 'Lỗi lấy danh sách bảo hành: ' + error.message, 500);
  }
};

export const extendWarranty = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalDays, price = 0 } = req.body;

    if (!Number.isSafeInteger(Number(additionalDays)) || Number(additionalDays) <= 0 || Number(additionalDays) > 36500) {
      return sendError(res, 'Số ngày gia hạn phải lớn hơn 0', 400);
    }
    if (!Number.isSafeInteger(Number(price)) || Number(price) < 0) return sendError(res, 'Phí gia hạn phải là số nguyên không âm', 400);

    const updatedSale = await WarrantyService.extendWarranty({
      saleId: id,
      additionalDays: Number(additionalDays),
      price: Number(price) || 0,
      userId: req.user._id
    });

    return sendSuccess(res, updatedSale, 'Gia hạn bảo hành thành công');
  } catch (error) {
    return sendError(res, 'Lỗi gia hạn bảo hành: ' + error.message, 500);
  }
};

export const addWarrantyClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { issue, resolution = '', cost = 0 } = req.body;
    if (!Number.isSafeInteger(Number(cost)) || Number(cost) < 0) return sendError(res, 'Chi phí bảo hành phải là số nguyên không âm', 400);

    if (!issue) {
      return sendError(res, 'Vui lòng mô tả vấn đề/lỗi cần bảo hành', 400);
    }

    const updatedSale = await WarrantyService.addClaimRecord({
      saleId: id,
      issue,
      resolution,
      cost: Number(cost) || 0,
      userId: req.user._id
    });

    return sendSuccess(res, updatedSale, 'Đã ghi nhận bảo hành / đổi thành công');
  } catch (error) {
    return sendError(res, 'Lỗi ghi nhận bảo hành: ' + error.message, 500);
  }
};
