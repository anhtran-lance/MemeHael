# Dựng HTML và mẹo Chrome (mục 3–4 của skill)

## 3. Dựng HTML

Thứ tự mục và nhóm menu:
- **Tổng quan**: 1 Vòng đời · 2 Service hoá · 3 Kiến trúc · 4 Vì sao · 5 Bản đồ dữ liệu
- **Cấu trúc Service**: 6 Cây Service 6 tầng (6.1 bậc thang 6 tầng + ảnh từng tầng · 6.2 sơ đồ cấu trúc cây của app · 6.3 quy tắc · 6.4 Event vs Policy · 6.5 lớp A/B/C · 6.6 ma trận · 6.7 bốn câu hỏi T1→T4) · 7 Danh mục Input → Output
- **Event Service**: 8 · **Policy Service**: 9 · **Cấu hình nền**: 10 · **Triển khai & Case study**: 11 (11.1 Playbook · 11.2 Case study với A/B/C lùi cấp trong menu) · **Tra cứu**: 12 Đường dẫn · 13 Điểm cần xác minh

Cách gọi: T2 = "Service Line" (bản chất là các line nghiệp vụ), T4 = "Service". Không dùng "Kind" / "Type" / "Business Domain". Ở mục Service hoá (tổng quan cho khách) vẫn có thể nói "nghiệp vụ → Service → Bản ghi".

Yêu cầu giao diện:
- Thanh đầu trang: logo Base.vn (`Design System/Logo ngang.png` trong folder AI Summit 2026), tên tài liệu, nút ☰ ẩn menu, zoom −/100%/+, đổi sáng/tối.
- Menu trái chia nhóm thu gọn được (`details`), scrollspy theo scroll (không dùng IntersectionObserver), tự mở nhóm đang đọc, "Mở tất cả / Thu gọn", dấu `*` cho mục bắt buộc.
- Ctrl + lăn chuột thu phóng cả trang; bấm ảnh hoặc sơ đồ mở lightbox (lăn zoom, kéo di chuyển, Esc đóng).
- **Tránh trùng class** với khối có sẵn — đã gặp: `.lb` (lightbox), `.ns` (hộp cấu hình nền làm chip phình to → dùng `.nsc`), `.top` (thanh đầu trang → dùng `.up/.dn`). Trước khi đặt class mới, grep `style.css`.
- Nút "↗" mở thẳng màn hình trên app (`target=_blank`, `data-path` để đổi tên miền).
- Font Be Vietnam Pro; màu: Event xanh `#1e88e5`, Policy cam `#d97706`, cấu hình nền xám, lõi xanh lá `#0e9f6e`, app khác tím nét đứt. Có dark mode, không tràn ngang trên điện thoại (390px); chuỗi model dài dùng `word-break: break-all`.
- Sơ đồ vẽ bằng SVG hoặc HTML/CSS, không dùng ảnh.
- Chống ngợp: mỗi khối nội dung phải có cấu trúc ngay dưới heading (thẻ thông số, Input→Output, tab hoặc hàng mở rộng). Chỉ hiện phần tóm tắt, chi tiết để sau một cú bấm. Tránh đoạn văn dài và bullet dày liên tiếp.
- Đừng lạm dụng bảng: nội dung có dòng chảy (vòng đời, hành trình, luồng) dùng timeline, pipeline, thẻ, sơ đồ. Các khối hình ảnh phải ngay ngắn: cùng chiều cao theo hàng, mép thẳng, khoảng cách đều.
- **Tag cho giá trị ngắn**: mọi liên kết nội bộ hoặc giá trị ngắn (chặng, "mặc định", trạng thái bắt buộc, đường dẫn "Cấu hình tại") hiển thị dạng tag/chip có viền, không để chữ trơn lẫn với văn mô tả. Quy ước: `.tag.lk` (xanh, là link), `.tag` (xám, giá trị), `.tag.crumb` (breadcrumb menu), `.rq` (mức bắt buộc), `.mchip` (Service/cấu hình nền trong thẻ gọn).

Xuất 3 dạng: bản nhẹ (`.html` + `img/`), bản 1 file nhúng ảnh (`--embed`), gói GitHub Pages (`index.html`, `img/` chỉ ảnh có dùng, `README.md`, `.nojekyll`, zip). Kèm `source/` (bộ dựng + README). Lưu vào folder của người dùng; lưu bản nhẹ vào Project (bản nhúng ảnh quá lớn).

## 4. Mẹo kỹ thuật Chrome

- Tab chạy nền làm `setTimeout` bị treo: chờ bằng `for(...) await fetch('/auth/enabled',{cache:'no-store'})`.
- Kết quả JS có query string / token bị chặn: bỏ `? & =`, hoặc lưu vào `window.__x` rồi đọc từng phần.
- Chụp ảnh: `scale: 0.75`, `save_to_disk: true`; lần đầu sau thao tác hay timeout → chụp lại. Cắt theo vùng dialog bằng PIL. Trang bị zoom lạ thì bỏ, chụp màn khác.
- Dropdown tự dựng không nhận `form_input` → click mở rồi click lựa chọn; cẩn thận gõ nhầm vào ô đang focus.
- Chrome / máy mất kết nối: báo người dùng, làm tiếp phần không cần Chrome, đặt nhắc thử lại (send_later), xoá nhắc khi xong.
