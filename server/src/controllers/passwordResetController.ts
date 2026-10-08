import { randomInt, randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import { ENV } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/response.js';

const hashCode = (userId, code) => createHmac('sha256', ENV.JWT_SECRET).update(`${userId}:${code}`).digest('hex');
const generic = 'Mã xác nhận đã được gửi đến email của bạn. Mã có hiệu lực 15 phút.';
export function emailDeliveryError(status, detail) {
  if (/private key.*invalid|invalid.*private key/i.test(detail)) return 'Khóa Private Key của EmailJS không hợp lệ. Vui lòng cập nhật cấu hình gửi email.';
  if (/public key|user_id|account.*not found/i.test(detail)) return 'Public Key của EmailJS không hợp lệ. Vui lòng kiểm tra cấu hình gửi email.';
  if (/non-browser|disabled.*api|api.*disabled/i.test(detail)) return 'EmailJS chưa cho phép gửi từ server. Hãy bật API cho non-browser applications trong Account → Security.';
  if (/template.*not found|template.*invalid/i.test(detail)) return 'Template EmailJS không hợp lệ. Vui lòng kiểm tra Template ID.';
  if (/service.*not found|service.*invalid/i.test(detail)) return 'Dịch vụ EmailJS không hợp lệ. Vui lòng kiểm tra Service ID.';
  if (status === 429 || /quota|limit.*reach/i.test(detail)) return 'Dịch vụ email đang giới hạn lượt gửi. Vui lòng thử lại sau.';
  return 'Dịch vụ email chưa gửi được mã. Vui lòng kiểm tra cấu hình EmailJS hoặc thử lại sau.';
}
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: String(req.body.email || '').trim().toLowerCase() });
    if (!user) return sendError(res, 'Tài khoản không tồn tại.', 404);
    if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID || !process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY) return sendError(res, 'Chức năng gửi email chưa được cấu hình. Vui lòng liên hệ người vận hành.', 503);
    const now = new Date();
    const code = String(randomInt(100000, 1000000));
    let record;
    try {
      record = await PasswordReset.findOneAndUpdate({ userId: user._id, sentAt: { $lte: new Date(Date.now() - 60000) } },
        { $set: { hash: hashCode(user._id, code), sentAt: now, expiresAt: new Date(Date.now() + 900000), attempts: 0, resetTokenHash: null } }, { upsert: true, new: true });
    } catch (error) { if (error.code === 11000) return sendError(res, 'Vui lòng chờ 60 giây trước khi yêu cầu mã mới.', 429); throw error; }
    try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: process.env.EMAILJS_SERVICE_ID, template_id: process.env.EMAILJS_TEMPLATE_ID, user_id: process.env.EMAILJS_PUBLIC_KEY, accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: { email: user.email, passcode: code, time: record.expiresAt.toLocaleTimeString('vi-VN', {timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'}), to_email: user.email, otp_code: code, expires_minutes: '15', app_name: 'MoneyFlow' } })
    });
    if (!response.ok) {
      const detail = await response.text();
      await PasswordReset.deleteOne({_id:record._id,hash:record.hash});
      return sendError(res, emailDeliveryError(response.status, detail), 503);
    }
    return sendSuccess(res, null, generic);
    } catch {
      await PasswordReset.deleteOne({_id:record._id,hash:record.hash});
      return sendError(res, 'Không kết nối được dịch vụ email. Vui lòng thử lại sau.', 503);
    }
  } catch { return sendError(res, 'Chưa gửi được email. Vui lòng thử lại sau.', 503); }
};

export const verifyPasswordOtp = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const invalid = () => sendError(res, 'Mã xác nhận sai, hết hạn hoặc đã sử dụng. Vui lòng yêu cầu mã mới.', 400);
  if (!user) return invalid();
  // Atomically count every attempt, including concurrent requests.
  const record = await PasswordReset.findOneAndUpdate({ userId: user._id, resetTokenHash: null, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { new: true });
  if (!record) return invalid();
  const expected = Buffer.from(record.hash, 'hex');
  const supplied = Buffer.from(hashCode(user._id, req.body.code), 'hex');
  if (!timingSafeEqual(expected, supplied)) return invalid();
  const resetToken = randomBytes(32).toString('hex');
  const verified = await PasswordReset.updateOne({_id:record._id,hash:record.hash,resetTokenHash:null,attempts:{$lte:5},expiresAt:{$gt:new Date()}},{$set:{resetTokenHash:hashCode(user._id,`reset:${resetToken}`)}});
  if (!verified.modifiedCount) return invalid();
  return sendSuccess(res, {resetToken}, 'Xác thực thành công. Bạn có thể đặt mật khẩu mới.');
};

export const resetPassword = async (req, res) => {
  const invalid = () => sendError(res, 'Phiên đặt lại mật khẩu sai, hết hạn hoặc đã sử dụng. Vui lòng yêu cầu mã mới.', 400);
  if (typeof req.body.resetToken !== 'string' || !/^[a-f0-9]{64}$/.test(req.body.resetToken)) return invalid();
  const user = await User.findOne({email:req.body.email});
  if (!user) return invalid();
  const resetTokenHash = hashCode(user._id,`reset:${req.body.resetToken}`);
  const record = await PasswordReset.findOne({userId:user._id,resetTokenHash,expiresAt:{$gt:new Date()}});
  if (!record) return invalid();
  const password = await bcrypt.hash(req.body.password, 10);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const consumed = await PasswordReset.deleteOne({ _id: record._id, resetTokenHash, expiresAt: { $gt: new Date() } }, { session });
      if (!consumed.deletedCount) throw new Error('Code consumed');
      await User.updateOne({ _id: user._id }, { $set: { password }, $inc: { authVersion: 1 } }, { session });
    });
    res.clearCookie('accessToken'); res.clearCookie('refreshToken');
    return sendSuccess(res, null, 'Đã đổi mật khẩu. Hãy đăng nhập với mật khẩu mới.');
  } catch { return invalid(); } finally { await session.endSession(); }
};
