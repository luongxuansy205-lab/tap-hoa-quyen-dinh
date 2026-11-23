# Tạp Hoá Quyên Định – Hướng dẫn cài đặt

## 1. Các thư mục quan trọng
- `src/`: mã nguồn giao diện website.
- `src/lib/`: kết nối Supabase.
- `public/`: biểu tượng và tài nguyên tĩnh.
- `supabase/schema.sql`: cấu trúc bảng sản phẩm và đơn hàng.
- `.env.example`: mẫu cấu hình kết nối.

## 2. Chạy thử trên máy tính
Cài Node.js bản LTS, mở Terminal tại thư mục dự án rồi chạy:
```bash
npm install
npm run dev
```
Mở địa chỉ mà Terminal hiển thị (thường là http://localhost:5173).

## 3. Kết nối Supabase miễn phí
1. Tạo dự án tại https://supabase.com.
2. Vào SQL Editor > New query, dán nội dung `supabase/schema.sql` và bấm Run.
3. Vào Storage, tạo bucket tên `product-images`, bật Public bucket để hiển thị ảnh sản phẩm.
4. Vào Project Settings > API, sao chép Project URL và anon/public key.
5. Tạo tệp `.env` ở thư mục gốc (cùng cấp `package.json`), dựa trên `.env.example`, điền:
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
6. Vào Authentication > Users, tạo tài khoản quản trị bằng email và mật khẩu.
7. Khi đưa lên Vercel, khai báo hai biến môi trường trên tại Settings > Environment Variables rồi triển khai lại.

## 4. Đưa lên GitHub
Tải toàn bộ nội dung bên trong thư mục dự án lên thư mục gốc của kho GitHub. Không tải file ZIP thay cho nội dung đã giải nén. Sau khi tải, ở trang chính GitHub phải nhìn thấy `src`, `public`, `supabase`, `package.json`, `index.html`.

## 5. Đưa lên Vercel
Import kho GitHub trong Vercel. Framework chọn Vite (hoặc để tự nhận), Build Command `npm run build`, Output Directory `dist`. Thêm biến môi trường Supabase trước khi Deploy.

## 6. Chức năng hiện có
- Danh mục, tìm kiếm, hiển thị sản phẩm.
- Giỏ hàng, chọn số lượng, đặt hàng COD.
- Phí giao hàng: lựa chọn trong 3km miễn phí hoặc ngoài 3km 20.000đ. Khách chọn khu vực, cửa hàng cần xác nhận địa chỉ.
- Trang quản trị đăng nhập Supabase, thêm/sửa/xóa sản phẩm, nhập URL ảnh hoặc tải ảnh qua Storage.
- Đơn hàng lưu vào Supabase khi cấu hình xong.

## Lưu ý quan trọng
- Sản phẩm ban đầu chỉ là dữ liệu mẫu, cần thay bằng tên, giá và ảnh hàng thật trước khi mở bán.
- Bản đồ đang dùng liên kết Google Maps cửa hàng đã cung cấp.
- Đây là bộ mã nguồn khởi đầu; trước khi kinh doanh thật cần kiểm tra chính sách bảo mật/RLS, luồng đơn hàng và thông báo điện thoại. Website hiện chưa tích hợp gửi SMS/push notification tự động.
- Giao diện hiện lưu bản dự phòng ở trình duyệt nếu chưa cấu hình Supabase; chế độ này không đồng bộ đơn hàng giữa các thiết bị.
