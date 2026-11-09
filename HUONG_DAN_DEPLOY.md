# UNI PORTAL - Deploy MongoDB Atlas + Render + Vercel

Bản patch dành cho cấu trúc repo `backend/`, `frontend/` của UNI PORTAL MongoDB đã chia sẻ.

## Cách áp dụng
1. Sao lưu dự án hiện tại.
2. Giải nén file patch vào thư mục gốc chứa `backend/`, `frontend/` (cho phép ghi đè file tương ứng).
3. Nếu `DemoApplication.java` của bạn đã được sửa riêng, hãy đối chiếu trước khi ghi đè. Bản patch chỉ thay đổi bean tạo dữ liệu mẫu: chỉ chạy khi `APP_DEMO_SEED=true`.
4. Git commit và push lên main.

## MongoDB Atlas
- Tạo cluster và Database User với mật khẩu mạnh, chỉ cấp quyền cần thiết.
- Lấy URI `mongodb+srv://USER:PASSWORD@HOST/student_db?retryWrites=true&w=majority`.
- Vào Atlas Network Access, cho phép các dải Outbound IP của Render (Render service > Connect > Outbound).
- Không đưa URI có mật khẩu vào GitHub.

## Render Backend
- New > Web Service, kết nối repo GitHub.
- Branch `main`, Root Directory `backend`, Language `Docker`, Dockerfile `Dockerfile`.
- Environment variables: `MONGODB_URI` = URI Atlas; `APP_ADMIN_PASSWORD` = mật khẩu mạnh; `APP_ADMIN_USERNAME` = admin (tuỳ chọn); `APP_DEMO_SEED` = false (tuỳ chọn, mặc định false).
- Render tự cung cấp `PORT`; Spring Boot dùng `server.port=${PORT:8083}`.
- Sau khi live, kiểm tra `https://TEN-APP.onrender.com/api/public/school`.

## Vercel Frontend
- Trước khi deploy, sửa `frontend/vercel.json`: thay `REPLACE-WITH-YOUR-RENDER-APP` bằng tên thật của Render service.
- Push thay đổi.
- Vercel > New Project > import cùng repo; Root Directory `frontend`, Framework `Vite`, Build `npm run build`, Output `dist`.
- Rewrites: `/api/:path*` proxy tới Render, còn các đường dẫn frontend về `/index.html`. Không cần đổi fetch('/api/...') trong React.
- Kiểm tra giao diện và `/api/public/school` qua domain Vercel.

## Bảo mật
- Không triển khai dữ liệu sinh viên thật trước khi kiểm tra phân quyền, sao lưu, bảo vệ tài khoản và quyền riêng tư.
- Không dùng `APP_DEMO_SEED=true` trên website công khai: dữ liệu mẫu dùng mật khẩu có thể đoán được.
- Nếu đã push mật khẩu/URI thật lên GitHub, cần đổi mật khẩu và làm sạch lịch sử git nếu cần.
- Render Free có thể ngủ khi không có truy cập; xem điều kiện hiện hành.
