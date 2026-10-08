import cron from 'node-cron';
import { WarrantyService } from '../services/warrantyService.js';
import { getSocketIO } from '../sockets/socketHandler.js';

export const initWarrantyCron = () => {
  // Chạy mỗi ngày lúc 08:00 sáng theo giờ Việt Nam
  // Trong môi trường dev có thể kiểm tra một lần ngay khi khởi động
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ [Cron Job] Đang quét các đơn bảo hành sắp hết hạn...');
    try {
      const createdNotifications = await WarrantyService.checkExpiringWarranties();
      console.log(`✅ [Cron Job] Đã tạo ${createdNotifications.length} thông báo nhắc hạn.`);

      // Gửi realtime thông báo cho các user tương ứng
      const io = getSocketIO();
      if (io) {
        createdNotifications.forEach(notif => {
          io.to(`user_${notif.userId}`).emit('notification:new', notif);
        });
      }
    } catch (error) {
      console.error('❌ [Cron Job Error]:', error);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh'
  });

  console.log('🕒 Warranty Cron Job scheduled at 08:00 AM (Asia/Ho_Chi_Minh)');
};
