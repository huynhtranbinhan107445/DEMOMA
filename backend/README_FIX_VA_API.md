# Dự án Spring Boot – bản chỉnh sửa demo

## Đã sửa
- Không trả trường `password` trong JSON sinh viên (Jackson WRITE_ONLY).
- Không ghi mật khẩu vào log đăng nhập.
- API đổi mật khẩu admin trả 501 thay vì báo thành công giả.
- Đổi mật khẩu sinh viên phải dài ít nhất 8 ký tự.
- Tra cứu sinh viên trực tiếp bằng Mongo repository, không tải toàn bộ dữ liệu.
- Kiểm tra trùng mã sinh viên/email khi thêm, trùng email khi sửa.
- Sửa cập nhật số điện thoại để giữ giá trị cũ nếu trường bị bỏ qua.
- Thông báo lưu vào MongoDB thay vì bộ nhớ tạm.
- Thêm CRUD học phần `/api/courses`.

## API học phần
- GET `/api/courses`
- GET `/api/courses/{id}`
- POST `/api/courses`
- PUT `/api/courses/{id}`
- DELETE `/api/courses/{id}`

Ví dụ JSON POST: `{"code":"IT101","name":"Lập trình Java","credits":3,"department":"CNTT","semester":"2026-1"}`

## Chạy
Cài JDK 21 và MongoDB đang chạy tại `localhost:27017`. Mở thư mục `demo` và chạy `./mvnw.cmd spring-boot:run` trong PowerShell (Windows). Truy cập http://localhost:8083.

## CẢNH BÁO: CHƯA AN TOÀN ĐỂ TRIỂN KHAI THẬT
Đây vẫn là bản DEMO học tập. Đăng nhập hiện dùng mật khẩu mặc định và so sánh chuỗi; các API ghi dữ liệu chưa có kiểm soát quyền server; localStorage không phải phiên xác thực; CORS đang rộng; HTML có các chỗ ghép `innerHTML` không an toàn. Cần triển khai Spring Security, BCrypt, tài khoản admin trong DB, session/JWT với phân quyền, validation toàn diện, escape HTML và kiểm thử trước khi dùng dữ liệu thật. Không dùng dữ liệu sinh viên thật.

## Kiểm thử
Chưa thể xác minh chạy tích hợp MongoDB/Maven trong môi trường tạo file. Hãy chạy local và gửi log nếu có lỗi để kiểm tra tiếp.
