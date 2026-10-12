# Design System

Hệ thống thiết kế cố định cho mọi bản. Chỉ **giá trị màu** đổi theo brand; cấu
trúc, typography, layout, và ý nghĩa ký hiệu giữ nguyên.

## Khổ & layout

- **A4 ngang**: 297mm × 210mm. `@page { size: A4 landscape; margin: 0 }`.
- Padding trang: `11mm 10mm 9mm`.
- Thanh màu trên cùng mỗi trang: gradient màu-chủ-đạo (0→62%) sang màu-nhấn (62→100%).
- Cấu trúc một trang: **header** (eyebrow + H1 + thông tin góc phải) → **vùng luồng**
  (các lane/master) → **vùng notes** (card giải thích) → **footer** (chú thích +
  bảng ánh xạ / lưu ý).
- Nhiều trang: mỗi `.sheet` là một trang, `page-break-after: always`.

## Typography

- Font chữ: **Inter** (thân), **Barlow Semi Condensed** (tiêu đề, tag, nhãn).
- Cả hai phải nhúng bản **có subset `vietnamese`** (xem build-pipeline). Không dùng
  Google Fonts qua link khi render PDF — phải nhúng base64.
- H1: Barlow Semi Condensed 700, uppercase, ~25-29px tùy độ dài tên.
- Chữ trong block bước: Inter 600, ~7.5-8.5px (nhỏ vì nhiều block trên một hàng).

## Bảng màu mặc định (Rework)

```
--navy:    #0B4DA2   /* màu chủ đạo — bước bắt buộc */
--orange:  #F26B21   /* màu nhấn — bước kết thúc / chuyển bước */
--teal:    #0E9384   /* bước tùy chọn (nền --teal-bg #E7F6F4, chữ --teal-ink #0A5F56) */
--cond:    #6D4AC4   /* nhãn điều kiện / bước thao tác trực tiếp (nền --cond-bg #F3EFFC) */
--red:     #D64545   /* khâu ngoài hệ thống / điểm chuyển Unit (nền --red-bg #FCEEEE) */
--ink:     #0A2540   /* chữ chính */
--ink-soft:#5A6B7F   /* chữ phụ */
--line:    #C9D4E0   /* đường kẻ */
--panel:   #F6F8FB   /* nền panel */
--master-bg:#FFF7F2  /* nền lane quy trình tổng */
```

## Sinh palette theo brand KH

Khi KH cung cấp màu chủ đạo (gọi là `BRAND`):

1. **`--navy` = `BRAND`** (màu chủ đạo → bước bắt buộc). Nếu `BRAND` quá sáng khiến
   chữ trắng khó đọc (độ sáng cao), làm tối đi ~15-20% để đủ tương phản.
2. **`--master-bg`**: phiên bản rất nhạt của `BRAND` (tint ~6-8%) — nền lane tổng.
3. **`--orange` (màu nhấn)**: nếu brand có màu phụ/accent, dùng nó; nếu không, chọn
   màu bổ túc (complementary) hoặc cam ấm tương phản tốt với `BRAND`. Đây là màu
   bước kết thúc nên cần nổi bật.
4. **`--teal`, `--cond`, `--red`**: giữ vai trò chức năng. Có thể giữ nguyên 3 màu
   mặc định (teal/tím/đỏ) vì chúng mang ý nghĩa quy ước và ít khi trùng brand. Chỉ
   đổi nếu trùng hoặc chọi với `BRAND`; khi đổi, giữ đúng "họ" màu (tùy chọn = xanh
   lục lam nhạt; điều kiện = tím/chàm; ngoài hệ thống = đỏ/hồng đất).
5. Mỗi màu nền đặc phải có bản `-bg` (nhạt) và `-ink` (đậm) nếu dùng cho block viền
   đứt chữ tối.

**Nguyên tắc tương phản:** mọi block nền đặc dùng chữ trắng → nền phải đủ tối
(contrast ratio ≥ 4.5:1). Kiểm tra nhanh: nếu không chắc chữ trắng đọc được, làm
tối nền.

**Luôn hỏi logo trước khi design.** Nếu có logo: đặt ở góc phải header, cao ~28-32px,
nền trong suốt. Nếu KH không có màu brand rõ ràng, dùng palette mặc định và nói rõ.

## Ý nghĩa ký hiệu (không đổi)

| Thành phần | Ý nghĩa |
|---|---|
| Block màu chủ đạo (đặc) | Bước bắt buộc |
| Block màu nhấn | Bước kết thúc / chuyển bước |
| Block teal viền đứt | Bước tùy chọn |
| Block trắng viền đứt + ↺ | Bước quay lại |
| Nhãn/Block tím | Điều kiện rẽ nhánh / thao tác trực tiếp đặc thù |
| Block đỏ | Ngoài hệ thống / điểm chuyển Unit (Gộp-Tách, Tổng hợp) |
| Đường đứt | Liên kết tự động |
| Vạch dọc ┃ | Ranh giới ngoài / trên hệ thống |
