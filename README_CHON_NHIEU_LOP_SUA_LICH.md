# Cập nhật chọn nhiều lớp trong lịch giảng (MongoDB)

- Khi **tạo lịch mới**: chọn nhiều lớp qua checkbox; API `/api/schedules/auto-plan` tạo đủ số buổi theo tín chỉ cho từng lớp.
- Khi **sửa lịch thủ công cũ**: mục **Lớp** nay cho chọn nhiều lớp, chọn tất cả hoặc bỏ chọn; API `PUT /api/schedules/{id}/classes` cập nhật đồng thời nhóm lớp và lưu mỗi lớp thành một bản ghi riêng trong MongoDB.
- Các lớp cùng một buổi thủ công được liên kết bằng `classGroupId`. Lịch được nhóm trên lịch Admin/Giảng viên, nhưng lịch Sinh viên vẫn lọc theo `lop`.
- Khi bỏ chọn lớp khỏi nhóm và lưu, bản ghi lịch tương ứng bị xóa khỏi nhóm; các bản ghi lịch của lớp khác không bị ảnh hưởng.
- Hệ thống kiểm tra lớp hợp lệ, số tiết, quyền giảng viên và trùng lịch trước khi ghi.
- Lịch tự động cũ (`planId`) vẫn cần xóa cả kế hoạch rồi tạo lại để đảm bảo đủ số buổi.
- **Mỗi sinh viên vẫn chỉ thuộc một lớp.** Thay đổi này chỉ áp dụng cho việc phân lịch học chung cho nhiều lớp.

## Chạy trên Windows

1. Đảm bảo MongoDB đã chạy tại `127.0.0.1:27017`.
2. Giải nén vào đường dẫn không dấu, ví dụ `D:\UNI_PORTAL\PhongDaoTao_ReactTS`.
3. Tại thư mục gốc, chạy `npm install`, `npm --prefix frontend install`, `npm run dev`.
4. Backend dùng Spring Boot 3.2.5 + Java 21, MongoDB `student_db`, cổng `8083`.
5. Frontend đợi cổng TCP 8083, không còn đợi HTTP `/` có thể trả về 404.

Lưu ý: Chưa thực hiện kiểm thử tích hợp với MongoDB thực trên máy người dùng.
