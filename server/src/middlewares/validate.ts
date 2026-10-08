import { sendError } from '../utils/response.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!parsed.success) {
      const errorFormatted = parsed.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      return sendError(res, 'Dữ liệu đầu vào không hợp lệ', 400, errorFormatted);
    }

    // Gán dữ liệu đã validate/sanitize vào req
    if (parsed.data.body) req.body = parsed.data.body;
    if (parsed.data.query) req.query = parsed.data.query;
    if (parsed.data.params) req.params = parsed.data.params;

    next();
  } catch (err) {
    return sendError(res, 'Lỗi kiểm tra dữ liệu: ' + err.message, 400);
  }
};
