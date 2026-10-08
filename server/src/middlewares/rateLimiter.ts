import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // Tối đa 200 requests trên mỗi IP trong 15 phút
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu đăng nhập/đăng ký. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 500, // 500 requests / phút
  message: {
    success: false,
    message: 'Yêu cầu quá nhanh, vui lòng đợi một chút.'
  }
});
