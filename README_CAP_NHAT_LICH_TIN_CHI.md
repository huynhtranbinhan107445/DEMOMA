# BẢN CẬP NHẬT: TÍN CHỈ → TỔNG TIẾT → LỊCH HỌC TỰ ĐỘNG

Dùng cho UNI PORTAL (Spring Boot + MongoDB + React TypeScript), dựa trên bản có **Khoa & Lớp** và **Lịch giảng & Công việc**.

## Quy tắc

- 1 tín chỉ = 15 tiết.
- 1 buổi = 3 tiết.
- Số buổi = số tín chỉ × 5 (3 tín chỉ = 45 tiết = 15 buổi).
- Admin/giảng viên chọn học phần, lớp, ngày bắt đầu, số ngày/tuần, **các thứ học cụ thể**, tiết bắt đầu, ca và phòng.
- Hệ thống tính **buổi đầu tiên** và **ngày kết thúc** từ ngày thực tế của buổi thứ N, không tính theo công thức số tuần làm tròn.
- Mỗi thứ học được lưu thành một dòng `schedules` với `ngayBatDau`, `ngayKetThuc`, `planId`. Sinh viên vẫn xem được trong lịch Ngày/Tháng.
- Nếu muốn thay đổi kế hoạch tự động, xóa cả kế hoạch (trên lịch hoặc bảng Admin), rồi tạo lại. Không sửa/xóa riêng một thứ trong kế hoạch vì sẽ sai tổng số buổi.
- Học phần đã có kế hoạch không cho đổi số tín chỉ trước khi xóa kế hoạch.
- Các lịch cũ không có `planId` vẫn được giữ nguyên.

## Cài đặt

1. Sao lưu dự án và dừng server (`Ctrl+C`).
2. Giải nén ZIP **bản vá** vào thư mục gốc `PhongDaoTao_ReactTS` để có `CreditSchedule_Patch/INSTALL.ps1`.
3. Chạy tại thư mục gốc:

```powershell
cd "D:\Học\PhongDaoTao\PhongDaoTao_ReactTS"
powershell -ExecutionPolicy Bypass -File ".\CreditSchedule_Patch\INSTALL.ps1" -ProjectRoot (Get-Location).Path
npm run dev
```

Script kiểm tra `backend/pom.xml` và `frontend/src/main.tsx`, sau đó sao lưu file cũ vào `backup_credit_schedule_YYYYMMDD_HHMMSS` trước khi ghi đè. **Không xóa dữ liệu MongoDB**.

## Sử dụng

- Admin → Học phần: số tín chỉ tự hiển thị tổng tiết và tổng buổi; khi tạo mới sẽ chuyển sang bước xếp lịch với học phần vừa tạo được chọn sẵn.
- Admin → Lịch giảng & Công việc → Tạo mới → Lịch học: chọn học phần, lớp, giảng viên, ngày bắt đầu, số ngày/tuần, thứ học, tiết, phòng; xem trước ngày kết thúc và bấm Tạo đủ N buổi.
- Giảng viên → Lịch giảng & Công việc: thao tác tương tự, chỉ với học phần được phân công.
- Tạo học phần trong mục Lịch giảng & Công việc sẽ chuyển sang bước xếp lịch ngay sau khi lưu.
- Admin → Thời khóa biểu: nút "Xếp lịch tự động theo tín chỉ" chuyển sang màn hình xếp lịch; lịch cũ vẫn có thể chỉnh sửa.
- Sinh viên → Thời khóa biểu: các buổi lặp hàng tuần chỉ hiển thị từ ngày bắt đầu đến ngày kết thúc.

### Ví dụ

3 tín chỉ = 45 tiết = 15 buổi. Bắt đầu 09/11/2026:
- Thứ 2, 4, 6 (3 ngày/tuần) → kết thúc 11/12/2026.
- Thứ 2, 4 (2 ngày/tuần) → kết thúc 28/12/2026.

Ngày bắt đầu là mốc sớm nhất. Nếu mốc này không trùng một thứ đã chọn, buổi học đầu tiên là ngày phù hợp tiếp theo.

## API mới

- `POST /api/schedules/auto-plan` (Admin, Giảng viên): tạo lịch theo tín chỉ.
- `DELETE /api/schedules/auto-plan/{planId}` (Admin, Giảng viên được phân công): xóa cả kế hoạch.

Ví dụ request:

```json
{
  "courseId": "<id học phần>",
  "lecturerId": "<id giảng viên>",
  "lop": "IT24A",
  "phongHoc": "A302",
  "caHoc": "Sáng (7:30 - 11:30)",
  "tietBatDau": 1,
  "ngayBatDau": "2026-11-09",
  "weekdays": ["Thứ 2", "Thứ 4", "Thứ 6"]
}
```

`lecturerId` do Admin chọn; giảng viên đăng nhập sẽ được backend tự gán ID của mình. Phải có học phần, lớp, giảng viên hợp lệ. API kiểm tra xung đột lớp, phòng, giảng viên, và không cho tạo kế hoạch trùng thời gian cho cùng học phần/lớp.

## Kiểm thử

- Frontend TypeScript: `cd frontend; npx tsc --noEmit`.
- Test thuật toán frontend: `cd frontend; node tests/teachingPlan.test.cjs`.
- Backend JUnit: `cd backend; .\mvnw.cmd test` (cần Java/Maven và các thư viện).

Lưu ý: bản này **chưa tự trừ ngày lễ, lịch nghỉ, buổi học bù hoặc thay đổi phòng theo từng ngày**. Để xử lý những trường hợp đó cần module ngoại lệ lịch học. Không tự động sửa dữ liệu lịch cũ. Backend chưa được chạy kiểm thử tích hợp với MongoDB trong môi trường tạo bản vá.
