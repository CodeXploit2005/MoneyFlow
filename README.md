# MoneyFlow

Ứng dụng quản lý thu chi, bán hàng, bảo hành, khách hàng và nhóm cộng tác. Frontend React/Vite/TypeScript, backend Express/Mongoose, database MongoDB.

## Chạy trên máy

Yêu cầu Node.js 20+ và MongoDB replica set (hoặc MongoDB Atlas). Replica set cần cho các thao tác đồng bộ có transaction, gồm đặt lại mật khẩu, sửa tiền liên kết đơn bán và xóa nhóm.

1. Trong server: chạy npm ci, copy .env.example thành .env, cấu hình MongoDB và các khóa JWT ngẫu nhiên riêng, sau đó npm run dev.
2. Trong client: chạy npm ci, copy .env.example thành .env nếu cần thay API URL, sau đó npm run dev.
3. Mở http://localhost:5173 và đăng ký tài khoản thật. Không tự tạo dữ liệu mẫu khi khởi động.

Không đưa .env, khóa bí mật hoặc bản sao database lên Git. Khi triển khai, cấu hình CLIENT_URL và VITE_API_URL theo địa chỉ thực tế, dùng HTTPS và database bền vững. Mã nguồn này không tự triển khai lên hosting khi push GitHub.

## Chức năng

- Thu/chi có tìm kiếm, lọc, lịch sử chỉnh sửa, thùng rác và CSV.
- Đơn bán tính lãi gộp = (giá bán − giá vốn) × số lượng. Thu chi chỉ ghi tiền thực thu và tổng giá vốn; hỗ trợ thanh toán một phần.
- Sửa số tiền giao dịch liên kết đồng bộ với đơn bán trong database transaction. Tổng giá vốn khi sửa phải chia hết cho số lượng vì đơn lưu giá vốn theo sản phẩm.
- Theo dõi hạn bảo hành, phí gia hạn và chi phí xử lý bảo hành.
- Tổng quan và báo cáo dùng chung tháng chọn theo múi giờ Việt Nam. Chênh lệch thu chi khác với lãi gộp đơn bán.
- Công nợ và hạn mức ngân sách; phân tách dữ liệu cá nhân và nhóm.
- Chủ nhóm có thể xóa nhóm khỏi không gian làm việc, thu hồi thành viên và lời mời; dữ liệu nghiệp vụ được giữ để tránh mất lịch sử.
- Avatar từ URL hoặc tệp; giao diện mobile, light/dark mode.
- Quên mật khẩu: email → OTP → mật khẩu mới. OTP 15 phút, tối đa 5 lần thử, gửi lại sau 60 giây, token đổi mật khẩu dùng một lần. Xem server/EMAILJS_SETUP.md.
- VietQR được tạo từ ngân hàng và số tài khoản người dùng nhập. Ứng dụng không xác minh chủ tài khoản hoặc tự xác nhận giao dịch ngân hàng; người chuyển cần kiểm tra người nhận trong ứng dụng ngân hàng.

## Kiểm tra

Trong server: npm test và npm run build.
Trong client: npm run build; kiểm tra TypeScript bằng npx tsc --noEmit.

Test tự động dùng MongoDB tạm riêng, không sửa dữ liệu thật. Các dịch vụ ngoài như EmailJS và ngân hàng cần được kiểm tra với cấu hình triển khai thực tế.
