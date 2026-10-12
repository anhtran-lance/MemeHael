---
name: "rework-keynote-style"
description: "Dùng khi làm slide, tài liệu hoặc báo cáo (HTML/artifact) cho Meme: áp dụng chuẩn giao diện keynote Rework AI Summit 2026, gồm token màu, font, hiệu ứng và quy tắc sáng/tối."
---

# Chuẩn Rework keynote (eric.summit.rework.com)

Áp dụng làm mặc định cho mọi slide, tài liệu, báo cáo của người dùng, trừ khi họ yêu cầu khác đi cho một phần cụ thể (ví dụ cụm slide game kiểu tarot). Viết nội dung bằng tiếng Việt nếu người dùng viết tiếng Việt.

## Định dạng
- Slide: một trang HTML tự chứa, publish bằng Artifact. Không dùng file .pptx trừ khi người dùng đòi rõ.
- Sân khấu cố định 1920x960 (tỉ lệ 2:1), co giãn theo cửa sổ bằng JS (`fit()`).
- Điều khiển bằng bàn phím: → hoặc Space = build kế tiếp, ← = lùi, s = danh sách slide, r = chạy lại slide, f = toàn màn hình, h = ẩn thanh điều khiển, Esc = danh sách.
- Mỗi slide có "builds": phần tử hiện dần theo từng lần bấm (class `.b` + `data-b`), chấm chỉ báo số build, thanh tiến độ dưới đáy. Hash routing để mở thẳng một slide.
- Thanh điều khiển giữa-dưới: trước/sau, trang n/N, chấm build, replay, danh sách slide, toàn màn hình, ẩn. Tự ẩn ở chế độ sạch.

## Màu (tối là mặc định, màu nền navy)
- navy-950 #030A1F, navy-900 #051433 (nền trang), navy-800 #0A2152, navy-700 #143478
- blue-500 #2F7BFF, blue-400 #4F93FF, blue-300 #7FB4FF, blue-200 #B3D2FF, blue-100 #D9E9FF
- cyan-300 #5EE7FF (nhấn chính), amber-300 #FFC46B (điểm nhấn phụ), chữ trắng #F4F8FF, muted #9DB3DA, dim #5F7BA8
- Đường kẻ: blue-300 ở độ mờ 22% hoặc 55%.
- Biến thể xanh lá (navy-900 #053318, nhấn #22C55E) và tím (navy-900 #150C34, nhấn #7C5CFF) dùng cùng tên token, chỉ đổi giá trị, qua `data-theme` trên root.
- Panel "giấy" trắng và mockup giao diện sáng chỉ dùng bên trong slide tối, cho ảnh chụp UI, bảng, dữ liệu: nền #FFFFFF, soft #F9FAFB, ink #111827, text #1F2937, muted #6B7280, line #E5E7EB, blue #2563EB, cam #F59E0B, đỏ #DC2626, xanh #16A34A.
- Tài liệu hoặc báo cáo giao diện sáng: suy ra từ token mockup sáng ở trên, giữ nguyên font, nhấn cyan→blue và highlight amber.

## Chữ
- Sora cho tiêu đề, Inter cho thân bài, dự phòng Segoe UI/system-ui. Nạp từ Google Fonts.
- Thang cỡ chữ (px, trên sân khấu 1920): display 124, h1 84, h2 56, lead 38, body 30, small 25, micro 21.
- Lề khung: trên 72, hai bên 140, dưới 64.

## Nội dung và bố cục
- Mỗi slide một ý. Rất ít chữ. Tiêu đề là câu ngắn kết thúc bằng dấu chấm, một cụm chính tô màu cyan.
- Dùng số lớn, thẻ chỉ số, sơ đồ, node map; slide trích dẫn/tuyên bố thì canh giữa.
- Slide bìa: logo góc trên-trái, eyebrow nhỏ, tiêu đề trắng rất lớn, phụ đề xanh nhạt, nền hạt sáng chảy nhẹ.
- Slide nội dung: thanh trên gồm logo | tên bộ slide › tên slide.
- Mạch kể: Mở đầu → Vấn đề → Nguyên tắc → Kiến trúc/giải pháp → Ứng dụng → Lộ trình.

## Chuyển động
- Một easing chung cho mọi thứ: cubic-bezier(.2,.8,.2,1).
- Thời lượng: hover/focus 0.15–0.2s; đổi màu/viền 0.2–0.4s; hiện nội dung (opacity + translateY ~10px) 0.45–0.6s; panel trượt vào (translateX 24px→0) 0.28s.
- Vòng lặp nền, chậm và nhẹ: hạt sáng chảy lên (22s linear), glow, trôi gradient (8s), thẻ nổi lên xuống 8px (5.6s), chấm gõ/loading, con trỏ nhấp nháy.
- Glow = radial-gradient blue-500 ~28% từ một góc. Danh sách cuộn có mask-image mờ hai đầu.
- Luôn tôn trọng `prefers-reduced-motion: reduce`: tắt vòng lặp nền và chuyển động tiến độ.
- Số liệu nên đếm tăng dần (count-up) khi xuất hiện.

## Sáng/tối
- Bộ slide: tối là mặc định, không cần chuyển theo prefers-color-scheme; đặt `color-scheme: dark`.
- Khi publish bằng Artifact vẫn đặt nền `body` bằng token rõ ràng. Tài liệu/báo cáo cần bản sáng thì làm theo token mockup sáng và vẫn cung cấp biến thể tối.

## Khi publish bằng Artifact
- File bắt đầu bằng `<title>`, link Google Fonts và `<style>`; không có doctype/html/head/body.
- Tên title là tên cụ thể của bộ slide, 2–4 từ.
- Nếu cần chỉnh sửa trực tiếp trên slide: khai báo `capabilities: {db:{}, user:{}}`, lưu thay đổi vào db và localStorage, chỉ cho phép định dạng an toàn (em, strong, br).
- Kiểm tra bằng Playwright: tràn chữ, chồng lấp, bấm qua mọi build, và không có lỗi console.

## Ngoại lệ đã dùng
- Cụm slide game "Thuần Sói" được làm phong cách tarot (Cormorant Garamond, nền tối tím, thẻ bài). Thực hiện bằng cách ghi đè biến CSS trong phạm vi `.slide.tarot`, giữ nguyên engine slide.