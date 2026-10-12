---
name: "crm-operating-service-map"
description: "Tạo bản đồ/slide kiến trúc CRM Operating Service (kiểu keynote Base.vn) cho một khách hàng/dự án cụ thể — dùng khi user nói 'làm CRM operating service map', 'vẽ kiến trúc CRM cho khách X', hoặc muốn tái tạo mẫu slide keynote1-4.summit.base.vn."
---

# CRM Operating Service Map

Tái tạo mẫu slide/keynote "CRM Operating Service" của Base.vn (nguồn: keynote1-4.summit.base.vn, 12 trang) để áp dụng cho một khách hàng/dự án cụ thể. Output là một file HTML dạng slide toàn màn hình (giống trải nghiệm keynote gốc: điều hướng bằng phím mũi tên, có bộ đếm trang "n/12", thanh điều hướng chặng CRM OS · PROSPECT · LEAD+SALE · COMMERCE · END ở góc trên phải).

## Trước khi bắt đầu

Hỏi hoặc suy luận từ ngữ cảnh:
1. Tên khách hàng / doanh nghiệp minh hoạ (ví dụ gốc dùng "Jasmine Jewelry" — một tiệm trang sức).
2. Ngành nghề và các kênh tiếp cận khách hàng thực tế của họ (Messenger, Zalo, Instagram, WhatsApp, TikTok, Telegram, Live Chat, Hotline, Email...).
3. Các sản phẩm/module Base.vn (hoặc hệ thống tương đương) khách đang dùng hoặc sẽ dùng ở từng khâu.
4. Use case nào là trọng tâm cần đi sâu (Prospect, Lead+Sale, Quote-to-Cash, hay cả ba).

## Cấu trúc chuẩn (giữ nguyên khung, thay số liệu/kênh theo khách hàng)

**Trang 1 — Title**: Logo/tên khách hàng + tagline "KIẾN TRÚC MỚI · VẬN HÀNH CÙNG AI" + tên hệ thống (vd "CRM OPERATING SERVICE").

**Trang 2 — Growth model shift**: So sánh 2 kim tự tháp:
- Trái (ngược, hiện trạng): Super Star → Tools → Skill → Playbook → Processes, có mũi tên "DATA" đi lên từ đáy — tiêu đề "TĂNG TRƯỞNG DỰA VÀO CÁ NHÂN XUẤT SẮC"
- Phải (thuận, mục tiêu): Processes → Technology → Playbook → Skill → Team, có "DATA" chạy xuyên chéo — tiêu đề "TĂNG TRƯỞNG ĐƯỢC THIẾT KẾ BẰNG HỆ THỐNG"

**Trang 3 — 6-stage pipeline overview**: 6 khối nối tiếp bằng mũi tên, mỗi khối có số thứ tự, tên khâu, icon các công cụ/kênh liên quan, và nhãn hành động nhỏ dưới mũi tên nối (vd "đổ lead", "chuyển thành deal", "giữ hàng ⇄ xuất kho", "đơn & thanh toán"):
01 Lead Generation → 02 Lead Management → 03 Deal Management → 04 Order Management → 05 Fulfillment → 06 Customer Success.
Mỗi khâu liệt kê các module/kênh cụ thể của khách hàng (thay vì Ads Manager/Prospect/Social... mặc định, dùng đúng kênh khách đang có). Cuối trang có dải "AGENT ARCHITECTURE: Assistants · Copilots · Workflow agents · Desktop agents".

**Trang 4+ — Đi sâu từng Usecase** (lặp lại khung này cho mỗi usecase được chọn):
- Mở đầu bằng câu hỏi/insight gợi mở (vd "Chúng ta có đang bỏ lỡ điều gì không?") + 2 câu mô tả vấn đề
- Sơ đồ luồng 3 bước: Customer Conversation (Hội thoại khách hàng) → Human Interpretation (Con người diễn giải) → Business Operation (Vận hành doanh nghiệp), minh hoạ bằng danh sách kênh thực tế bên trái và các đoạn hội thoại mẫu bên phải (naturalistic, đúng ngành khách hàng)
- Đánh dấu các tín hiệu kinh doanh bị bỏ lỡ bằng nhãn "NOT IN SYSTEM" trên các câu hội thoại có chứa dữ liệu quý (nhu cầu, khiếu nại, ngân sách...)
- Trang cấu hình sản phẩm: mô phỏng giao diện Base.vn (hoặc hệ thống tương ứng) với danh sách bước cấu hình dịch vụ ở sidebar trái (đánh số 01-0n, chia nhóm "CẤU TRÚC SERVICE" / "THIẾT LẬP SERVICE" / "TÍCH HỢP VÀ BÁO CÁO"), và khung demo giao diện thật bên phải với chú thích "Demo mô phỏng · [Tên khách hàng] là câu chuyện minh hoạ"
- Có thể chèn callout dạng thẻ tối màu góc dưới trái kiểu "• CẤU TRÚC / Ý TƯỞNG N" + mô tả 1 dòng, xuất hiện tuần tự để dẫn dắt mắt người xem

**Trang cuối (END) — Recap toàn cảnh**: quay lại bố cục 6 khâu như trang 3 nhưng giờ mờ dần các khâu chưa nói tới, làm nổi bật (sáng, có viền) các khâu/khối vừa đi sâu ở các usecase, để nhấn mạnh "đây là một phần trong bức tranh tổng thể".

## Nguyên tắc thiết kế

- Nền tối (dark navy/blue gradient), chữ trắng/xanh nhạt, điểm nhấn màu xanh dương sáng (#3b82f6-ish) và các icon màu theo từng thương hiệu kênh (Messenger xanh dương, Instagram hồng/cam, TikTok đen, Zalo xanh dương đậm...).
- Giữ đúng văn phong tiếng Việt ngắn gọn, câu tiêu đề có 1 từ khoá được tô sáng màu khác (vd "Chúng ta có đang **bỏ lỡ** điều gì không?").
- Góc trên phải luôn có thanh điều hướng chặng hiện tại (breadcrumb các usecase), góc dưới phải luôn có bộ đếm "n / tổng số trang".
- Toàn bộ ví dụ số liệu, tên nhân vật, tên khách hàng phải đổi theo đúng khách hàng đang làm — KHÔNG giữ nguyên "Jasmine Jewelry" trừ khi khách hàng thực sự tên đó.
- Nếu không đủ thông tin về kênh/luồng nghiệp vụ thực tế của khách hàng, hỏi trước khi giả định số liệu demo.

## Output

Một file HTML tự chứa (inline CSS/JS), điều hướng bằng phím mũi tên trái/phải hoặc nút bấm, theo đúng tỉ lệ khung hình slide 16:9. Nếu phiên làm việc có Artifact tool và đây là tài liệu khách hàng sẽ xem lại/chia sẻ, publish qua Artifact; nếu chỉ là bản nháp xem nhanh, gửi qua SendUserFile.