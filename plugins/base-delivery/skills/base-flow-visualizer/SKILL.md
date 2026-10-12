---
name: base-flow-visualizer
description: Biến mô tả/ảnh luồng quy trình nghiệp vụ (QT tổng ↔ QT con, webhook giữa các QT Base Service, nhánh rẽ, bước tùy chọn) thành tài liệu trực quan gửi khách hàng - PDF A4 ngang và/hoặc HTML tương tác nhiều tab có mô phỏng chạy. Dùng khi user gửi ảnh flowchart hoặc text/bảng/SmartArt mô tả quy trình và nói "vẽ lại luồng", "visualize luồng", "lưu đồ liên kết QT", "làm tài liệu mô tả quy trình", "convert flow này cho KH", "thêm tab/chuyển động/tương tác". Hỗ trợ palette theo brand khách hàng. Không dùng cho dashboard số liệu hay slide.
---

# Base Flow Visualizer

Gộp từ `qt-flow-doc-designer` (tài liệu A4 → PDF, hệ thống thiết kế cố định) và `base-service-flow-visualizer` (liên kết QT→QT qua webhook, HTML tương tác). Một quy trình, hai định dạng đầu ra.

Mục tiêu: người chưa vào hệ thống đọc xong **hiểu cơ chế chạy**, **xác nhận đúng các bước đã setup**, **nhớ phải thao tác gì ở đâu**.

## Chọn đầu ra
- **A. PDF A4 ngang** (mặc định, gửi KH): làm theo bước 4–5 bên dưới.
- **B. HTML tương tác** (tab, mô phỏng token chạy qua các bước): thêm `references/interactive-html.md`.
- Có thể xuất cả hai từ cùng một dữ liệu luồng đã chốt ở bước 1–3.

## Quy trình 6 bước
Không vẽ khi chưa đủ thông tin: sai một bước hay một nhánh là phải làm lại cả bản.

### 1. Nhận input
Ảnh sơ đồ (Canva, draw.io, ảnh chụp Base Service) là ưu tiên nhất; cũng nhận text, bảng, SmartArt. Cách đọc từng loại: `references/input-formats.md`. Luôn khuyên user gửi kèm ảnh. Phóng to đọc đúng nguyên văn tên bước; phần bị cắt/mờ thì đánh dấu "chưa rõ", **không đoán**.

Nếu là luồng Base Service nhiều QT gọi nhau qua webhook: đọc `references/base-service-linking.md` để ghi loại bước, lập bảng liên kết QT nguồn → QT đích.

### 2. Hỏi làm rõ trước khi vẽ (gộp một lượt, chỉ hỏi phần thật thiếu)
1. Logo và màu brand KH (hỏi đầu tiên; nếu user đã đưa logo/banner thì dùng luôn).
2. Tên bộ quy trình, mã QT, số QT tổng / QT con.
3. Thứ tự và tên chính xác từng bước; nhánh rẽ và điều kiện; bước tùy chọn; bước quay lại; bước thao tác trực tiếp trên QT tổng.
4. Cơ chế đồng bộ QT tổng ↔ QT con (tự tạo / tự chuyển bước / thủ công); ranh giới ngoài hệ thống ↔ trên hệ thống; đổi đơn vị quản lý.
5. Cú pháp thống nhất cho bước kết thúc QT con.
6. Bố cục: 1 hay nhiều trang.

**Bất di bất dịch:** giữ nguyên 100% từ ngữ và trình tự bước gốc. Muốn rút gọn cho vừa chỗ phải hỏi. Khi user đổi tên QT, sửa mọi nơi tham chiếu.

### 3. Palette theo brand
Đọc `references/design-system.md`. Lấy màu brand làm màu chủ đạo, sinh các màu chức năng đồng bộ, chữ trắng trên nền đặc tương phản ≥ 4.5:1. Chỉ đổi giá trị màu, không đổi ý nghĩa ký hiệu.

### 4. Dựng HTML
Component: `references/component-library.md`. Khung: `assets/template.html`.

### 5. Nhúng font, QC, render
Làm đúng từng lệnh trong `references/build-pipeline.md`: nhúng font tiếng Việt, QC không tràn trang / không cắt chữ (phải về 0), render PDF A4 ngang bằng Playwright, render PNG để tự soi. Với HTML tương tác, QC thêm theo `references/interactive-html.md`.

### 6. Rà soát và giao
Trích text từ PDF đối chiếu tên bước, thứ tự, cú pháp với input. Gửi PDF + HTML bằng SendUserFile. Trả lời tiếng Việt ngắn: có gì trong bản giao, bảng màu → ý nghĩa, và danh sách điểm chưa chắc cần user xác nhận. Tên file gợi ý: `<KH>_<Dự án>_luu_do_QT.pdf/.html`, `..._tuong_tac.html`.

## Quy ước ký hiệu (cố định, chỉ đổi màu theo brand)
- Màu chủ đạo (đặc): bước bắt buộc.
- Màu nhấn (cam): bước kết thúc / chuyển bước.
- Teal viền đứt: bước tùy chọn.
- Trắng viền đứt + ↺: bước quay lại.
- Tím: điều kiện rẽ nhánh / đồng thời / thao tác trực tiếp đặc thù.
- Đỏ: hợp nhất, khâu ngoài hệ thống, điểm chuyển đổi đơn vị.
- Cyan: webhook. Đường đứt: liên kết tự động.
- Vạch dọc ┃: ngoài hệ thống (trái) / trên hệ thống (phải).

Mỗi bản nên có: chú thích ký hiệu, bảng ánh xạ QT tổng ↔ QT con, card giải thích cơ chế.

## Nguyên tắc
Trung thành bản gốc; ghi rõ phần chưa chắc thay vì đoán; một khái niệm một cách viết; clarify trước vẽ sau; QC sạch mới giao; tiếng Việt đủ dấu.
