# WBS triển khai CRM (Đề 1 · Hội thảo Base 2.0)

Trang WBS nội bộ: https://crm-wbs.vercel.app

- `public/index.html`: giao diện (tab Tổng quan, tab Công việc)
- `public/snapshot.json`: bản dữ liệu dự phòng (chỉ xem) khi kho lưu trữ không đọc được
- `api/wbs.js`: API đọc/ghi dữ liệu, phân quyền theo mã truy cập, lưu thành file JSON trên nhánh `wbs-data` của repo GitHub
- `lib/seed.js`: dữ liệu khởi tạo
- `vercel.json`: rewrite các đường dẫn /tong-quan, /cong-viec

Biến môi trường (đặt trên Vercel, không commit): `WBS_ADMIN_CODE`, `WBS_EDITOR_CODE`, `GH_TOKEN` (fine-grained, Contents: read/write; tùy chọn `GH_REPO`, `GH_BRANCH`).
Triển khai: output directory `public`, framework none.
