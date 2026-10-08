import { Router } from 'express';
import { z } from 'zod';
import { register, login, logout, refreshToken, getMe, updateProfile, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import rateLimit from 'express-rate-limit';
import { forgotPassword, verifyPasswordOtp, resetPassword } from '../controllers/passwordResetController.js';

const router = Router();
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Bạn yêu cầu quá nhiều lần. Thử lại sau 15 phút.' } });
const emailSchema = z.string().trim().toLowerCase().email('Email không đúng định dạng');
router.post('/forgot-password', resetLimiter, validate(z.object({ body: z.object({ email: emailSchema }) })), forgotPassword);
router.post('/verify-reset-otp', resetLimiter, validate(z.object({ body: z.object({ email: emailSchema, code: z.string().regex(/^\d{6}$/, 'Nhập mã OTP gồm 6 chữ số') }) })), (req,res,next) => { verifyPasswordOtp(req,res).catch(next); });
router.post('/reset-password', resetLimiter, validate(z.object({ body: z.object({ email: emailSchema, resetToken: z.string().regex(/^[a-f0-9]{64}$/), password: z.string().min(6).max(72) }) })), (req, res, next) => { resetPassword(req, res).catch(next); });

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Tên phải có ít nhất 2 ký tự'),
    email: z.string().trim().toLowerCase().email('Email không đúng định dạng'),
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    bankInfo: z.object({
      bankName: z.string().optional(),
      bankCode: z.string().optional(),
      accountNumber: z.string().optional(),
      accountName: z.string().optional()
    }).optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Email không đúng định dạng'),
    password: z.string().min(1, 'Mật khẩu không được để trống')
  })
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
