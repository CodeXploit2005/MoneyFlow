import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 Server Error:', err);

  // Mongoose duplicate key error
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return sendError(res, `${field ? `Giá trị ${field}` : 'Dữ liệu'} đã tồn tại trong hệ thống`, 409);
  }

  // Mongoose validation error
  if (err?.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val: any) => val.message);
    return sendError(res, messages.join(', '), 400);
  }

  // CastError (invalid ObjectId)
  if (err?.name === 'CastError') {
    return sendError(res, 'Mã định danh không hợp lệ', 400);
  }

  const statusCode = err?.statusCode || 500;
  const message = err?.message || 'Lỗi hệ thống máy chủ';
  return sendError(res, message, statusCode);
};
