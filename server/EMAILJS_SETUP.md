# EmailJS cho khôi phục mật khẩu

Thêm vào `server/.env` và khởi động lại backend:

```env
EMAILJS_SERVICE_ID=
EMAILJS_TEMPLATE_ID=
EMAILJS_PUBLIC_KEY=
EMAILJS_PRIVATE_KEY=
```

Tạo template với To Email là `{{email}}`, nội dung chứa `{{passcode}}` và giờ hết hạn `{{time}}` (giờ Việt Nam), thời hạn 15 phút. Backend cũng gửi các biến tương thích `{{to_email}}`, `{{otp_code}}`, `{{expires_minutes}}`. Biến `{{app_name}}` là MoneyFlow. Bật cho phép API từ ứng dụng ngoài trình duyệt theo cấu hình tài khoản EmailJS. Private Key chỉ đặt ở backend, không dùng biến VITE và không đưa vào Git.

Backend tạo mã 6 số, lưu HMAC thay vì mã gốc, hết hạn sau 15 phút, tối đa 5 lần nhập, gửi lại sau 60 giây. OTP và mật khẩu mới không trả về response hoặc in log. Reset cần MongoDB replica set/Atlas để đổi mật khẩu và tiêu thụ OTP trong cùng transaction.

Khi chưa cấu hình, API trả 503 và giao diện báo chưa gửi được mã. Không có mã mẫu hay chế độ tự bỏ qua xác minh. Sau khi cấu hình, thử gửi đến một tài khoản thử nghiệm thật và kiểm tra cả spam trước khi đưa vào sử dụng.

Tài liệu: https://www.emailjs.com/docs/rest-api/send/

Luồng: POST /api/auth/forgot-password → POST /api/auth/verify-reset-otp (email, code) → POST /api/auth/reset-password (email, resetToken, password). Chỉ khi OTP hợp lệ mới cấp resetToken ngẫu nhiên; database lưu hash token. Token chỉ nằm trong bộ nhớ giao diện, dùng một lần và hết hạn cùng OTP.
