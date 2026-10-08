import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { sendError } from '../utils/response.js';

export const authenticate = async (req: any, res: Response, next: NextFunction) => {
  try {
    let token: string | null = null;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return sendError(res, 'Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 401);
    }

    const decoded: any = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return sendError(res, 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.', 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user || (decoded.authVersion || 0) !== (user.authVersion || 0)) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return sendError(res, 'Người dùng không còn tồn tại.', 401);
    }

    req.user = user;
    next();
  } catch (error: any) {
    return sendError(res, 'Xác thực không thành công: ' + (error?.message || error), 401);
  }
};
