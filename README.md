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
Trong client: `npm run typecheck` để kiểm tra kiểu; `npm run build` kiểm tra kiểu trước khi tạo bản production. Toàn bộ mã ứng dụng trong `client/src` dùng TypeScript với `strict: true`, không nhận tệp JavaScript. Backend đã dùng TypeScript. Service worker, script chạy và cấu hình công cụ giữ JavaScript theo môi trường thực thi.

Test tự động dùng MongoDB tạm riêng, không sửa dữ liệu thật. Các dịch vụ ngoài như EmailJS và ngân hàng cần được kiểm tra với cấu hình triển khai thực tế.

## Cách dùng nhóm và quyền dữ liệu

Chọn Ví cá nhân để quản lý riêng; chọn ví nhóm trước khi tạo đơn hoặc ghi thu chi để cộng tác. Dữ liệu cá nhân không tự đưa vào nhóm. Mobile có bộ chuyển ví ở thanh đầu trang và nút về Ví cá nhân trên trang nhóm. Chuyển ví đóng biểu mẫu đang mở để tránh ghi nhầm không gian.

- Chủ nhóm: quản lý quyền riêng tư, quyền mời, vai trò, ngân sách và xóa nhóm.
- Quản trị viên: quản lý thông tin nhóm, dữ liệu tài chính và ngân sách; không đổi vai trò hoặc xóa quản trị viên khác.
- Thành viên: tạo dữ liệu, chỉnh dữ liệu do mình tạo; không thu tiền/gia hạn/bảo hành/xóa khoản nợ thay người khác. Xem hạn mức chung; chỉ chủ nhóm/quản trị viên được sửa hạn mức.
- Khi bật riêng tư, thành viên chỉ xem chi tiết dữ liệu do mình tạo trong thu chi, đơn bán, bảo hành, công nợ, khách hàng, hoạt động và CSV. Tổng nhóm, cơ cấu chi tiêu, hạn mức và bảng xếp hạng vẫn được chia sẻ. Dữ liệu khách hàng dùng chung có thể không hiện trong danh sách riêng của thành viên.
- Quyền mời áp dụng cho cả email và mã. Mã mời có giới hạn lượt dùng được kiểm tra trong database transaction. Thu hồi thành viên chặn truy cập API và rời phòng realtime.

Bảng xếp hạng có trong menu khi chọn nhóm, hoặc nút Hiệu quả bán hàng trên trang nhóm. Có ngày/tuần/tháng tùy chọn/năm/tất cả; chỉ tính đơn chưa hủy của thành viên hiện tại. Doanh thu là giá trị đơn, lãi gộp chưa trừ vận hành/bảo hành, đã thu là tổng thanh toán hiện tại của các đơn bán trong kỳ (khác dòng tiền thu trong kỳ). Đồng điểm cùng thứ hạng; không trao hạng cho người chưa có đơn. Dữ liệu lịch sử cập nhật khi sửa đơn hoặc thay đổi thành viên; chưa có chốt kỳ bất biến, duyệt chứng từ hay chia hoa hồng tự động.

Tạo đơn bán và các khoản thu/giá vốn liên kết, thu thêm tiền đơn, và dùng mã mời đều cần MongoDB replica set/Atlas. Những thao tác này dùng transaction để tránh lưu một nửa dữ liệu hoặc vượt số dư khi thao tác đồng thời. Trang ngân sách có chọn tháng, tổng hạn mức/đã chi/còn lại và số danh mục vượt mức. Cảnh báo hạn mức tính theo các khoản chi chưa bị xóa trong tháng, tách khỏi xếp hạng lợi nhuận bán hàng.

### Chạy frontend và backend cùng lúc

Tại thư mục gốc `Money`, chạy `npm run dev`. Lệnh này kiểm tra backend/database ở cổng 5000 trước khi bật frontend ở cổng 5173; nếu dịch vụ đang chạy thì sử dụng lại. Giữ terminal của dịch vụ đang chạy mở. Lần đầu cần `npm install` trong cả `server` và `client`, cùng cấu hình `server/.env`. Backend do lệnh chạy chung khởi động mặc định chạy ổn định, không dừng mỗi lần lưu mã. Sau khi sửa backend, khởi động lại lệnh để áp dụng thay đổi. Khi lập trình và cần tự tải lại backend, dùng `npm run dev:watch` tại thư mục gốc; chế độ này sẽ ngắt kết nối ngắn khi lưu mã backend. Nếu dùng lại backend đã chạy từ terminal khác, chế độ chạy phụ thuộc lệnh ở terminal đó; cần dừng phiên watch cũ trước khi chuyển sang chế độ ổn định.

`[vite] hmr update` là thông báo cập nhật giao diện bình thường. `ECONNREFUSED 127.0.0.1:5000` nghĩa là backend chưa nhận kết nối; `ECONNRESET` có thể xảy ra khi backend khởi động lại. Trong vài giây khởi động lại có thể xuất hiện lỗi proxy; nếu lỗi kéo dài, kiểm tra terminal backend và chạy `npm run dev` ở thư mục gốc để kiểm tra và khởi động dịch vụ còn thiếu. Không bật thêm backend nếu cổng 5000 đã có MoneyFlow hoạt động.

Khi Vite báo 500 cho cả `/api` và `/socket.io`, kiểm tra terminal backend và `/api/health`: proxy không thể phục vụ khi backend dừng. Biểu đồ xếp hạng dùng cùng bộ lọc kỳ và tiêu chí với bảng, hiển thị tối đa 10 thành viên đầu; bảng bên dưới giữ đầy đủ thành viên. Lãi gộp âm hiển thị màu đỏ, tiền cá nhân ngoài nhóm không tính vào thành tích nhóm.

### Đối soát dòng tiền và công nợ

Thanh toán công nợ mới tự tạo khoản thu (phải thu) hoặc chi (phải trả) cùng lúc cập nhật dư nợ. Không nhập thêm khoản thu/chi thủ công cho cùng lần thanh toán. Mỗi lần trả nợ từ giao diện có mã yêu cầu để gửi lại không ghi trùng. Công nợ ở trang này là sổ riêng, không tự liên kết đơn bán; thanh toán đơn bán phải ghi ở đơn bán. Tạo sổ nợ chỉ ghi số dư nợ, không tự ghi dòng tiền vay/cho vay ban đầu. Thanh toán cũ không được tự bổ sung chứng từ nhằm tránh trùng số liệu đã ghi thủ công; cần đối soát riêng.

Có thể sửa tổng nợ và từng lần thanh toán tại Sổ công nợ → Lịch sử → Sửa tiền, hoặc sửa số tiền chứng từ liên kết ở Sổ thu chi. Số dư nợ và chứng từ liên kết được cập nhật cùng giao dịch database, giữ ngày thanh toán và lịch sử trước/sau. Bản ghi cũ chưa liên kết chứng từ chỉ cập nhật sổ nợ; không tự tạo khoản thu/chi mới. Không xóa trực tiếp chứng từ hoặc khoản nợ đã có thanh toán. Thu/chi bảo hành được lưu cùng cập nhật đơn trong giao dịch MongoDB, lỗi giữa chừng sẽ rollback. Database phải hỗ trợ transactions (replica set/Atlas). Dashboard “Chênh lệch thu chi” là dòng tiền thu trừ chi, không phải lợi nhuận ròng; số dư chỉ phản ánh các khoản đã ghi nhận, chưa có nghiệp vụ số dư đầu kỳ riêng.
