import { addDays, determineWarrantyStatus, getDaysRemaining } from '../utils/dateUtils.js';
import Sale from '../models/Sale.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { CategoryService } from './categoryService.js';

export class WarrantyService {
  /**
   * Tính ngày kết thúc bảo hành dựa trên ngày bắt đầu và số ngày
   */
  static calculateWarrantyEnd(startDate: Date | string, days: number): Date {
    return addDays(startDate, days);
  }

  /**
   * Cập nhật trạng thái bảo hành cho một đơn bán
   */
  static updateSaleStatus(sale: any, referenceDate: Date = new Date()): string {
    if (sale.status === 'void') return sale.status;
    const currentStatus = determineWarrantyStatus(sale.warrantyEnd, referenceDate);
    sale.status = currentStatus;
    return currentStatus;
  }

  /**
   * Gia hạn bảo hành cho đơn bán
   */
  static async extendWarranty({
    saleId,
    additionalDays,
    price = 0,
    userId
  }: {
    saleId: string;
    additionalDays: number;
    price?: number;
    userId: any;
  }): Promise<any> {
    const sale: any = await Sale.findById(saleId).populate('customerId');
    if (!sale) throw new Error('Không tìm thấy đơn bán để gia hạn');

    const oldEnd = new Date(sale.warrantyEnd);
    // Nếu đơn đã hết hạn thì gia hạn tính từ thời điểm hiện tại, nếu còn hạn thì nối tiếp ngày hết hạn cũ
    const baseDate = oldEnd < new Date() ? new Date() : oldEnd;
    const newEnd = addDays(baseDate, additionalDays);

    let transactionId = null;

    // Nếu gia hạn có tính phí, tự động tạo khoản THU
    if (price > 0) {
      const category: any = await CategoryService.getSystemCategory(userId, sale.groupId, 'income', 'Gia hạn');

      const tx: any = await Transaction.create({
        type: 'income',
        amount: price,
        title: `Gia hạn: ${sale.productName} (+${additionalDays} ngày)`,
        categoryId: category ? category._id : null,
        date: new Date(),
        counterparty: sale.customerId?.name || 'Khách hàng',
        note: `Gia hạn bảo hành đơn ${sale._id} đến ${newEnd.toLocaleDateString('vi-VN')}`,
        ownerId: userId,
        groupId: sale.groupId,
        saleId: sale._id
      });
      transactionId = tx._id;
    }

    sale.warrantyDays += Number(additionalDays);
    sale.warrantyEnd = newEnd;
    sale.status = determineWarrantyStatus(newEnd);

    sale.renewals.push({
      days: additionalDays,
      price,
      renewedAt: new Date(),
      oldEnd,
      newEnd,
      transactionId
    });

    await sale.save();
    return sale;
  }

  /**
   * Ghi nhận bảo hành / đổi tài khoản / xử lý khiếu nại
   */
  static async addClaimRecord({
    saleId,
    issue,
    resolution,
    cost = 0,
    userId
  }: {
    saleId: string;
    issue: string;
    resolution: string;
    cost?: number;
    userId: any;
  }): Promise<any> {
    const sale: any = await Sale.findById(saleId);
    if (!sale) throw new Error('Không tìm thấy đơn hàng cần bảo hành');

    let costTransactionId = null;

    // Nếu xử lý bảo hành có chi phí phát sinh, tự động ghi nhận vào khoản CHI
    if (cost > 0) {
      const expenseCategory: any = await CategoryService.getSystemCategory(userId, sale.groupId, 'expense', 'Chi phí bảo hành');

      const tx: any = await Transaction.create({
        type: 'expense',
        amount: cost,
        title: `Chi phí xử lý bảo hành: ${sale.productName}`,
        categoryId: expenseCategory ? expenseCategory._id : null,
        date: new Date(),
        counterparty: 'Bảo hành / Đổi',
        note: `Lỗi: ${issue}. Cách xử lý: ${resolution}`,
        ownerId: userId,
        groupId: sale.groupId,
        saleId: sale._id
      });
      costTransactionId = tx._id;
    }

    sale.claims.push({
      date: new Date(),
      issue,
      resolution,
      cost,
      handledBy: userId,
      costTransactionId
    });

    await sale.save();
    return sale;
  }

  /**
   * Quét và gửi thông báo cho các đơn bảo hành sắp hết hạn hoặc hết hạn hôm nay
   */
  static async checkExpiringWarranties(): Promise<any[]> {
    const now = new Date();

    // Tìm các đơn đang active hoặc expiring_soon
    const sales: any[] = await Sale.find({
      status: { $in: ['active', 'expiring_soon'] }
    }).populate('customerId ownerId');

    const notificationsCreated: any[] = [];

    for (const sale of sales) {
      const remainingDays = getDaysRemaining(sale.warrantyEnd, now);
      const newStatus = determineWarrantyStatus(sale.warrantyEnd, now);

      if (sale.status !== newStatus) {
        sale.status = newStatus;
        await sale.save();
      }

      // Nếu còn đúng 3 ngày, 1 ngày hoặc 0 ngày (hôm nay)
      if (remainingDays <= 3 && remainingDays >= 0) {
        const title = remainingDays === 0
          ? `⚠️ Đơn hàng ${sale.productName} hết hạn bảo hành hôm nay!`
          : `⏳ Đơn hàng ${sale.productName} còn ${remainingDays} ngày bảo hành`;

        const message = `Khách hàng: ${sale.customerId?.name || 'Khách lẻ'} - SĐT/Zalo: ${sale.customerId?.phone || sale.customerId?.zalo || 'Chưa có'}. Hãy liên hệ gia hạn!`;

        // Tránh tạo thông báo trùng lặp trong ngày
        const startToday = new Date();
        startToday.setHours(0, 0, 0, 0);

        const existingNotification = await Notification.findOne({
          userId: sale.ownerId._id,
          'data.saleId': sale._id,
          createdAt: { $gte: startToday }
        });

        if (!existingNotification) {
          const notif = await Notification.create({
            userId: sale.ownerId._id,
            title,
            message,
            type: 'warranty',
            data: {
              saleId: sale._id,
              remainingDays,
              customerName: sale.customerId?.name
            }
          });
          notificationsCreated.push(notif);
        }
      }
    }

    return notificationsCreated;
  }
}
export default WarrantyService;
