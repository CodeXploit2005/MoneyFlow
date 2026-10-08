import User from '../models/User.js';
import Category from '../models/Category.js';
import { CategoryService } from '../services/categoryService.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ENV } from '../config/env.js';
import { isDemoAccountEmail } from '../utils/demoAccounts.js';

// Danh mục mặc định khi tạo tài khoản mới
const DEFAULT_CATEGORIES = [
  { name: 'Bán hàng / Dịch vụ', type: 'income', icon: 'shopping-cart', color: '#10b981' },
  { name: 'Gia hạn dịch vụ', type: 'income', icon: 'refresh-cw', color: '#06b6d4' },
  { name: 'Tiền thưởng / Hoa hồng', type: 'income', icon: 'award', color: '#f59e0b' },
  { name: 'Thu nhập khác', type: 'income', icon: 'plus-circle', color: '#8b5cf6' },
  { name: 'Giá vốn sản phẩm', type: 'expense', icon: 'package', color: '#ef4444' },
  { name: 'Chi phí bảo hành', type: 'expense', icon: 'shield-alert', color: '#f97316' },
  { name: 'Server / VPS / Proxy', type: 'expense', icon: 'server', color: '#ec4899' },
  { name: 'Marketing / Quảng cáo', type: 'expense', icon: 'megaphone', color: '#3b82f6' },
  { name: 'Ăn uống / Sinh hoạt', type: 'expense', icon: 'coffee', color: '#6b7280' },
  { name: 'Chi phí khác', type: 'expense', icon: 'more-horizontal', color: '#9ca3af' }
];

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = ENV.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 ngày
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
  });
};

export const register = async (req, res) => {
  try {
    const { name, password, bankInfo } = req.body;
    const email = String(req.body.email).trim().toLowerCase();
    if (isDemoAccountEmail(email)) return sendError(res, 'Email này dành cho dữ liệu mẫu đã ngừng sử dụng. Vui lòng dùng email của bạn.', 400);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'Email này đã được sử dụng', 400);
    }

    const user = await User.create({
      name,
      email,
      password,
      bankInfo: bankInfo || { bankName: 'MBBank', bankCode: 'MB', accountNumber: '', accountName: name }
    });

    // Tự động tạo toàn bộ danh mục hệ thống + mặc định cho người dùng mới
    await CategoryService.ensureDefaultCategories(user._id, null);

    const accessToken = generateAccessToken({ userId: user._id, authVersion: user.authVersion || 0 });
    const refreshToken = generateRefreshToken({ userId: user._id, authVersion: user.authVersion || 0 });

    setAuthCookies(res, accessToken, refreshToken);

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, { user: userObj, accessToken }, 'Đăng ký tài khoản thành công', 201);
  } catch (error) {
    return sendError(res, 'Đăng ký thất bại: ' + error.message, 500);
  }
};

export const login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = String(req.body.email).trim().toLowerCase();

    const user: any = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 'Tài khoản hoặc mật khẩu không đúng. Xin vui lòng nhập lại.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Tài khoản hoặc mật khẩu không đúng. Xin vui lòng nhập lại.', 401);
    }

    const accessToken = generateAccessToken({ userId: user._id, authVersion: user.authVersion || 0 });
    const refreshToken = generateRefreshToken({ userId: user._id, authVersion: user.authVersion || 0 });

    setAuthCookies(res, accessToken, refreshToken);

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, { user: userObj, accessToken }, 'Đăng nhập thành công');
  } catch (error) {
    return sendError(res, 'Đăng nhập thất bại: ' + error.message, 500);
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return sendSuccess(res, null, 'Đã đăng xuất thành công');
  } catch (error) {
    return sendError(res, 'Đăng xuất thất bại: ' + error.message, 500);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return sendError(res, 'Không tìm thấy refresh token', 401);
    }

    const decoded: any = verifyRefreshToken(token);
    if (!decoded || !decoded.userId) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return sendError(res, 'Refresh token đã hết hạn hoặc không hợp lệ', 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user || (decoded.authVersion || 0) !== (user.authVersion || 0)) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return sendError(res, 'Người dùng không tồn tại', 401);
    }

    const newAccessToken = generateAccessToken({ userId: user._id, authVersion: user.authVersion || 0 });
    const newRefreshToken = generateRefreshToken({ userId: user._id, authVersion: user.authVersion || 0 });

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return sendSuccess(res, { accessToken: newAccessToken }, 'Làm mới token thành công');
  } catch (error) {
    return sendError(res, 'Làm mới token thất bại: ' + error.message, 401);
  }
};

export const getMe = async (req, res) => {
  try {
    return sendSuccess(res, req.user);
  } catch (error) {
    return sendError(res, 'Lỗi lấy thông tin cá nhân: ' + error.message, 500);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatar, bankInfo } = req.body;
    const user = req.user;

    if (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > 500000 || (avatar !== '' && !/^https?:\/\//i.test(avatar) && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(avatar)))) {
      return sendError(res, 'Ảnh đại diện không hợp lệ. Chọn ảnh JPG, PNG, WebP hoặc nhập đường dẫn http(s).', 400);
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (bankInfo) {
      user.bankInfo = {
        bankName: bankInfo.bankName || user.bankInfo.bankName,
        bankCode: bankInfo.bankCode || user.bankInfo.bankCode,
        accountNumber: bankInfo.accountNumber || user.bankInfo.accountNumber,
        accountName: bankInfo.accountName || user.bankInfo.accountName
      };
    }

    await user.save();
    return sendSuccess(res, user, 'Cập nhật thông tin thành công');
  } catch (error) {
    return sendError(res, 'Cập nhật thất bại: ' + error.message, 500);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user: any = await User.findById((req as any).user._id).select('+password');

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return sendError(res, 'Mật khẩu hiện tại không đúng', 400);
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, null, 'Đổi mật khẩu thành công');
  } catch (error) {
    return sendError(res, 'Đổi mật khẩu thất bại: ' + error.message, 500);
  }
};
