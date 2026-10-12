# Liên kết QT→QT trên Base Service (webhook)

Dùng khi input là ảnh luồng Base Service có nhiều QT gọi nhau qua webhook. Gốc từ skill `base-service-flow-visualizer` (dự án TLD Vietnam – Resin Nội địa).

## 1. Đọc luồng từ ảnh
Phóng to từng ảnh, đọc đúng nguyên văn tên bước. Với mỗi QT ghi lại:
- Tên QT + mã (vd [TN]0.1 Nội địa – Mua NĐ), danh sách bước theo thứ tự.
- Loại bước: Bước, Lựa chọn (rẽ nhánh), Đồng thời (fork), Hợp nhất (merge), Chuyển đổi, AI Agent, Biểu mẫu tùy chỉnh, Webhook đầu ra (hout), Webhook đầu vào (hin), Bắt đầu / Hoàn thành.
- Nhãn trên các nhánh rẽ; bước tùy chọn (bỏ qua được).
- Phần ảnh bị cắt → đánh dấu kind `unk` (nét đứt, "chưa rõ"), KHÔNG đoán tên; ghi vào danh sách điểm cần xác nhận.

## 2. Lập bản đồ liên kết QT→QT
Liệt kê mọi cặp: [QT nguồn · bước Webhook ra] → [QT đích · Webhook vào]. Webhook đầu ra của QT nguồn gọi Webhook đầu vào của QT đích. Làm bảng liên kết (nguồn, bước, đích, bước nhận, dữ liệu truyền).
Ví dụ đã chốt (TLD Resin NĐ): 0.1 / 0.2 / 3.1 (nhánh A) → "Chuyển qua QT 1. TBĐH (NĐ)" → QT 1 "Nhận thông tin Sales (áp dụng cho tất cả)"; QT 1 "Chuyển dữ liệu sang QT 2. Sourcing…" → QT 2 "Nhận thông tin từ QT 1 Lập TBĐH"; QT 3.2 chạy độc lập, không webhook.
Lưu ý nghiệp vụ đã được user sửa: KHÔNG còn QT 0.1 "Khởi tạo TBĐH"; chỉ có QT 1. Lập TBĐH. Luôn hỏi/ghi nhận khi user đổi tên QT và sửa mọi nơi tham chiếu.


## Bài học từ lần làm đầu
- Bản lưu đồ SVG tự vẽ bị chê "xấu, khó nhìn" → dùng design system cố định (card QT, panel, màu có nghĩa) thay vì vẽ thô.
- Mô tả sai nhánh Balance của 0.1 → đọc kỹ nhãn nhánh, đối chiếu lại ảnh sau khi viết.
- QT 2 tràn footer ở trang tổng quan → thu gọn panel, chuỗi QT 2 nằm ngang, mở rộng bảng ánh xạ.
- Luôn đối chiếu text xuất ra với tên bước gốc; không rút gọn tên bước khi chưa hỏi.
- Trả lời thẳng và ngắn; user thích có kết quả mở được ngay.

