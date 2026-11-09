# UNI PORTAL – dự án đã gộp mã nguồn

## Cấu trúc

```text
PhongDaoTao_ReactTS/
├── backend/            # Spring Boot + MongoDB
├── frontend/           # React + TypeScript
├── package.json
├── package-lock.json
└── HUONG_DAN_DU_AN_DA_GOP.md
```

Các module Điều kiện tốt nghiệp, Lịch sinh viên, Lịch giảng & Công việc, Khoa & Lớp, Xếp lịch tín chỉ đã nằm trong `backend/src` và `frontend/src`. Không cần giữ các thư mục `*_Patch` để chạy.

## Quan trọng trước khi dùng

Bản này là ảnh chụp mã nguồn tổng hợp từ lần cập nhật **15 tiết / tín chỉ** gần nhất, **không phải bản đọc trực tiếp từ máy của bạn**. Nếu bạn đã tự sửa mã nguồn sau khi nhận bản đó, hãy giữ nguyên bản gốc và so sánh thay đổi trước khi thay thế. Không giải nén đè trực tiếp lên dự án đang chạy.

## Cài đặt thử an toàn trên Windows

1. Dừng ứng dụng đang chạy và sao lưu thư mục dự án cũ.
2. Giải nén ZIP ra một thư mục **mới**, ví dụ `D:\Hoc\UNI_PORTAL_GOP\PhongDaoTao_ReactTS`.
3. Đảm bảo MongoDB đang chạy. Kiểm tra cấu hình kết nối trong `backend/src/main/resources/application.properties`.
4. Mở PowerShell tại thư mục `PhongDaoTao_ReactTS` mới, chạy:

```powershell
npm install
npm --prefix frontend install
npm run dev
```

5. Mở `http://localhost:5173` và kiểm tra: Sinh viên, Giảng viên, Khoa & Lớp, Điều kiện tốt nghiệp, Lịch giảng & Công việc, lịch sinh viên, xếp lịch theo tín chỉ.

Nếu mọi chức năng chạy đúng, bạn có thể dùng thư mục mới thay thư mục cũ. Giữ lại bản sao lưu cho đến khi chắc chắn dữ liệu và mã nguồn ổn định.

## Dọn các thư mục Patch của dự án cũ

Chỉ dọn sau khi đã kiểm tra các chức năng và xác nhận bản chính đã có các file tương ứng. Nên **di chuyển** các thư mục `*_Patch` vào một thư mục lưu trữ thay vì xóa ngay. Giữ nguyên các thư mục `backup_*` vì chúng chứa bản sao lưu mã nguồn.

## Kiểm thử

- Kiểm tra TypeScript `tsc --noEmit`: đạt.
- Kiểm thử Node cho phép tính lịch học: đạt (5 phép thử).
- Chưa chạy kiểm thử tích hợp backend với MongoDB trên máy người dùng.
