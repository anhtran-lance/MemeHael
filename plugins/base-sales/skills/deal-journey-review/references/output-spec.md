# Đặc tả output — file HTML review

Dựng từ `assets/report_template.html`. Giữ nguyên toàn bộ CSS và tên class; chỉ thay nội dung.

## Khung bắt buộc

Sáu tab, đúng thứ tự này. Không đổi thứ tự, không gộp, không bỏ.

| Tab | Tên | Nội dung tối thiểu |
|---|---|---|
| 01 | Chẩn đoán | Bảng chỉ số ≥6 dòng · 3 card tín hiệu · ít nhất 1 khối `.quote` nêu chỗ dữ liệu tự mâu thuẫn hoặc trích nguyên văn ghi chú của khách |
| 02 | Đối chiếu cổng | Sơ đồ B0–B3 · ≥1 trích playbook · bảng MEDDPICC đủ 8 dòng · câu kết về forecast |
| 03 | Phản biện | Giả định trung tâm đặt trong `.pull` · ≥3 luận điểm phản biện · **≥1 khối `.correction`** |
| 04 | Lỗ hổng | Danh sách `.gaps` 5–8 mục, xếp theo mức chặn deal, mỗi mục có nhãn `.sev` |
| 05 | Kế hoạch 4 tuần | 4 khối `.week` + 1 khối "Xuyên suốt" · **khối `.stop` bắt buộc** |
| 06 | Câu hỏi mở | 5–6 câu, mỗi câu tương ứng một chỗ dữ liệu còn trống |

## Header

- `h1` = luận điểm chính, viết như một câu người nghe nhớ được, không phải mô tả trung tính. Đây là câu sẽ được trích lại trong họp.
- `.subthesis` = một câu giải thích cơ chế, dùng ngôn ngữ playbook (B-phase, EB Alignment, MEDDPICC).
- Thứ tự này quan trọng: câu dễ nhớ trước, thuật ngữ nội bộ sau. Đặt thuật ngữ lên `h1` sẽ khiến người chưa quen playbook trượt qua ngay dòng đầu.
- `.metastrip` = đúng 5 ô, ưu tiên: độ dài deal · buổi có EB trọn vẹn · ngày không tiếp cận EB · MEDDPICC đạt · trạng thái cổng kế tiếp.

## Trục nhịp — BẮT BUỘC hai lớp

Không bao giờ vẽ trục ngang có nhãn chữ đặt theo vị trí tỉ lệ. Deal thật hay có một khoảng chết rất dài (pending cuối năm, deal ngủ đông) đẩy toàn bộ touchpoint còn lại dồn vào một góc, và nhãn sẽ đè lên nhau thành không đọc được. Dùng đúng hai lớp:

**Lớp 1 — minimap tỉ lệ thật (`.minimap`).** Dải ngang cao 34px, CHỈ có chấm tròn `.mm-dot`, không một chữ nào. `left:%` lấy nguyên từ `timeline_positions[].left_pct`. Chi tiết đặt trong `title=` để hover. Dải im lặng hiện tại là `.mm-silence`. Hai đầu dải ghi ngày bắt đầu và ngày review qua `.mm-scale`. Lớp này giữ nguyên sức nặng tu từ: người xem thấy ngay deal dồn cục ở đâu.

**Lớp 2 — danh sách dọc (`.tline`), đặt trong khung cuộn.** Bọc trong `.tline-box > .tline-scroll#tlPane` (cao tối đa 330px, có thanh cuộn riêng và fade hai mép) để cả khối trục không chiếm quá một màn hình. Mỗi touchpoint một `.tl-row` gồm: số TP · chấm màu theo kết quả · ngày đầy đủ · mô tả một dòng · badge EB · pill kết quả. Giữa hai buổi là một `.tl-gap` với đường nối dọc có chiều cao tỉ lệ số ngày: `max(16, min(16 + days*0.55, 78))px`. Gán class `long` cho gap ≥21 ngày, `dead` cho ≥60 ngày. Kết thúc bằng `.tl-now` cho khoảng im lặng hiện tại.

**Liên kết hai lớp.** Mỗi `.mm-dot` là một `<button data-tp="N">`, mỗi `.tl-row` có `id="tp-N"`. Bấm chấm ở lớp 1 → cuộn mượt tới dòng tương ứng ở lớp 2 và bật `.is-target`; cuộn lớp 2 → chấm gần nhất tự bật `.is-active`. Dùng `<button>` chứ không phải `<span>` để bàn phím và screen reader dùng được; `aria-label` ghi đủ TP, ngày, mô tả. Thêm dòng `.mm-hint` chỉ dẫn thao tác.

Lý do tách: lớp 1 trả lời "nhịp deal trông thế nào", lớp 2 trả lời "chuyện gì đã xảy ra". Gộp vào một hình sẽ hỏng một trong hai.

- Chỉ dùng đúng cấu trúc này. Không thêm biểu đồ tròn, thanh, radar — chúng làm loãng luận điểm.
- `.mm-note` phải nói ra điều biểu đồ *chứng minh*, không mô tả lại điều nó *hiển thị*.
- Mô tả trong `.tl-name` tối đa một dòng (~45 ký tự). Dài hơn thì cắt, chi tiết để dành cho tab 01.

## Quy tắc nội dung

**Trích dẫn.** Mọi `.quote` phải là chữ thật: nguyên văn từ ghi chú touchpoint của người dùng, hoặc nguyên văn từ playbook. Ghi nguồn ở `.src` (số touchpoint hoặc mục playbook). Không diễn giải lại rồi đóng khung như trích dẫn.

**Khối đính chính.** Bắt buộc có ít nhất một `.correction`. Nếu bản review này nối tiếp một bản trước, đây là chỗ ghi rõ điều gì đã đổi và tại sao. Nếu là bản đầu tiên, đây là chỗ chỉ ra chỗ người dùng có thể đang đọc sai dữ liệu của chính họ. Không giấu phần này trong đoạn văn — đóng khung để người đọc bản cũ nhìn thấy ngay.

**Tiêu chí dừng.** Khối `.stop` không bao giờ được bỏ. Đây là phần dễ bị cắt nhất khi trình nội bộ và là phần khiến toàn bộ kế hoạch có sức nặng: đề xuất đầu tư thêm thời gian phải kèm điều kiện thoát.

**Con số.** Mỗi số phải truy được về một ô trong file input hoặc một khoá trong JSON của script. Không có số nào được ước lượng.

**Ngưỡng.** Khi nêu ngưỡng (14 ngày, 5/8, 2× khoảng cách trung bình, −20% đến −35%), luôn hiển thị cả giá trị thực tế bên cạnh để người đọc tự so.

**Giọng.** Trực tiếp, không an ủi, không dùng "có vẻ như" khi dữ liệu đã rõ. Được phép nói deal nên bị hạ khỏi forecast.

## Xuất file

- Đặt tên: `<TenKhachHang>_review_hanh_trinh_deal_v<N>.html`
- Ghi vào `/mnt/user-data/outputs/`
- Gọi `present_files`
- Sau khi trình file, viết 3–5 câu: tab nào nên chiếu trước, chỗ nào cố tình giữ lại dù khó nghe, và chỗ nào bản thân model chưa chắc và cần người dùng xác nhận. Không tóm tắt lại nội dung file — người dùng mở được file.
