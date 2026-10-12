# Case mẫu: TATCONS (nhà thầu Thi công & Đầu tư Xây dựng)

Case thực tế đã dựng thành công theo skill này — dùng làm ví dụ tham chiếu khi gặp khách hàng
ngành xây dựng/nhà thầu, hoặc để hiểu cách áp dụng skill cho ngành khác.

## Input gốc

- File HTML bản đồ chuỗi giá trị trilingual (VI/EN/LO) — chỉ giữ lại tiếng Việt khi ghép vào tài
  liệu tổng hợp (xem `references/build-patterns.md` cách strip đa ngôn ngữ).
- File Excel "danh mục số hoá theo CGT": 57 quy trình, các cột Workflow ID, nhiệm vụ, quá hạn,
  hoàn thành, SLA, TG thực tế TB, % quá hạn, trạng thái số hoá, cơ hội AI, mức uỷ quyền — cùng 1
  sheet phụ "Nguồn báo cáo" (Lát cắt → Báo cáo → Quy trình nguồn → Trường dữ liệu → Trạng thái).
- File HTML đánh giá CASAN + báo cáo AI có sẵn (đã dựng ở phiên làm việc trước).

## Cấu trúc chuỗi giá trị (Trang 1)

6 giai đoạn CGT nhà thầu xây dựng: **Phát triển DA & Đầu tư → Đấu thầu & Hợp đồng → Cung ứng & Mua
sắm → Thi công & Quản lý DA → Nghiệm thu & Thanh quyết toán → Bàn giao & Bảo hành**, cùng 2 khối
phụ trợ: Nhân sự – Hành chính, Kế toán – Tài chính.

## 6 Data Mart (Trang 2 — Techmap 3 cột)

Mart đặt tên trùng với 6 lát cắt báo cáo hợp nhất đã dùng ở Trang 3 (bắt buộc khớp tên để liên kết
được giữa 2 trang):

| Mã | Tên mart | Icon | Ghi chú |
|---|---|---|---|
| M1 | Điều hành tổng thể | 🎯 | Áp dụng cho "tất cả 57 quy trình" — không liệt kê từng quy trình |
| M2 | Tiến độ dự án | 📅 | |
| M3 | Ngân sách – Công nợ dự án | 💵 | Pain point lớn nhất — 241/649 nhiệm vụ quá hạn (~37%) |
| M4 | Tài chính | 📈 | |
| M5 | Vật tư – Thiết bị | 🏗️ | |
| M6 | Hỗ trợ & Tuân thủ | 🛡️ | |

Tổng 27 báo cáo cụ thể trải trên 6 mart, mỗi báo cáo gắn trạng thái dữ liệu (Đã có/Một phần/Cần
thu thập) lấy đúng từ sheet "Nguồn báo cáo" — không tự suy diễn trạng thái.

## Đánh giá CASAN (Trang 3)

- Cấp hiện tại: **Cấp 2 — Augmented**. Mục tiêu 6–12 tháng: **Cấp 3 — Standard**.
- Trục mạnh nhất: **Quy trình** (điểm 3/5) — 100% quy trình đã số hoá trên nền BPM.
- Trục yếu nhất kéo cấp tổng thể xuống: **Dữ liệu** và **Quản trị AI** (điểm 2/5) — chưa có
  phân loại/nhãn nhạy dữ liệu, chưa có AUP (chính sách dùng AI an toàn).
- KPI tổng: 57 quy trình đã số hoá · 1.513 nhiệm vụ · 297 quá hạn (19,6%) · 87 thất bại.
- Điểm nghẽn lớn nhất: khối thanh toán/quyết toán — đây là nơi lớp AI tạo giá trị đo được nhanh
  nhất (đối soát chứng từ tự động, nhắc quá hạn tự động, mức uỷ quyền L3–L4).

## Bài học rút ra khi dựng case này

1. **User thường yêu cầu sửa từng phần nhỏ nhiều lần** (đổi màu nav, bỏ tab, bỏ cột ID...) — thiết
   kế script dựng theo từng khối tách biệt (xem `build-patterns.md` mục 1) giúp mỗi lần sửa chỉ cần
   chạy lại 1 script con, không phải viết lại toàn bộ.
2. **Ban đầu dựng Techmap kiểu "5 tầng nghiệp vụ trừu tượng + 3 tab"** (theo mẫu gốc của
   `techmap-casan`), nhưng user muốn cụ thể hơn: "bấm vào xem được quy trình nào, lấy dữ liệu gì,
   chuyển sang báo cáo gì" → phải đổi hẳn sang bảng 3 cột cụ thể (quy trình nguồn → dữ liệu → báo
   cáo), bỏ hẳn tab Tổng quan/Giám sát trừu tượng. Rút kinh nghiệm: khi khách hàng là Solution
   Engineer làm proposal thật, họ thường muốn **truy vết được đến quy trình/Workflow ID cụ thể**,
   không chỉ sơ đồ khái niệm — ưu tiên phương án 3 cột cụ thể này làm mặc định.
3. **Sidebar trái dễ bị yêu cầu đổi thành nav trên** khi tài liệu cần in hoặc trình chiếu — thiết kế
   sẵn layout nav-trên-cùng + `.main` căn giữa làm mặc định thay vì sidebar, để đỡ phải sửa lại.
4. **Luôn hỏi trước khi thêm chi tiết kỹ thuật** (như hiện `#WorkflowID` trong chip) — mặc định để
   gọn, chỉ thêm khi khách xác nhận cần.
