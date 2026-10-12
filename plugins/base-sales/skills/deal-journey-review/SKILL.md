---
name: deal-journey-review
description: |
  Phân tích & phản biện hành trình deal Enterprise B2B theo playbook "Sales as a Science" (MEDDPICC, B-phase B0–B3, Battle Card, Power Map, Value Case/TCO, POR & SITREP), rồi xuất file HTML review 6 tab. Đầu vào chuẩn là deal_journey_input_TEMPLATE.xlsx kèm trong skill, nhưng vẫn chạy được từ Google Sheets, log touchpoint tự do, hoặc mô tả bằng lời.
  Dùng skill này khi người dùng: đưa file input deal journey; nói "phân tích deal journey", "review hành trình deal", "deal này next step nên làm gì", "tại sao deal chưa chốt", "deal đang tắc ở đâu", "chấm MEDDPICC", "deal có nên nằm trong forecast không", "phản biện hành trình deal", "làm battle card cho khách X"; hoặc đưa log các buổi làm việc với khách doanh nghiệp và hỏi phải làm gì tiếp.
  KHÔNG dùng cho: techmap chuyển đổi số (dùng techmap-casan hoặc value-chain-to-casan), phân tích lương (payroll-analyzer), viết proposal hay demo script.
---

# Deal Journey Review

Phân tích một deal Enterprise đang chạy, chẩn đoán nó **thực sự** đang đứng ở đâu so với chỗ nó **tưởng** mình đang đứng, rồi đề xuất next step có thể bảo vệ được trong buổi review nội bộ.

Nguyên tắc nền: **phản biện, không xác nhận.** Người dùng là Solution Engineer đang ở trong deal; họ đã có sẵn một câu chuyện về lý do deal chậm. Việc của skill này là kiểm tra câu chuyện đó bằng dữ liệu, không phải trang trí cho nó. Một bản review chỉ đồng tình là một bản review vô dụng.

## Quy trình 6 bước

### Bước 1 — Nạp dữ liệu

Nếu người dùng đưa file Excel theo template: chạy script tính toán trước, đừng tính tay.

```bash
python3 scripts/analyze_input.py <đường_dẫn_file.xlsx>
```

Script trả JSON gồm: chỉ số nhịp deal, vị trí % của từng touchpoint trên trục thời gian (dùng thẳng cho biểu đồ), cờ đỏ tự phát hiện, phân bố Power Map, điểm Champion, và danh sách trường còn trống. **Luôn dùng số của script, không tự nhẩm.**

Nếu người dùng đưa Google Sheets / file tự do / mô tả bằng lời: đọc và tự trích ra các trường tương đương. Không bắt họ phải điền template trước — nhưng ở cuối câu trả lời, đề nghị đưa template cho lần sau.

Nếu chưa có file input nào: đưa `assets/deal_journey_input_TEMPLATE.xlsx` cho người dùng và dừng lại ở đó.

### Bước 2 — Đọc engine phân tích

Đọc `references/playbook-engine.md`. Đây là toàn bộ khung phân tích chưng cất từ playbook: B-phase và exit criteria, chấm MEDDPICC, 4 tiêu chí Champion, ma trận Power Map, ngưỡng cờ đỏ, phân loại đối thủ và ảnh hưởng P(Win), nguyên tắc Say No, cấu trúc Value Case/TCO, POR & SITREP.

Không được suy diễn khung từ trí nhớ. Các ngưỡng (14 ngày, 5/8, −20% đến −35%…) đều lấy từ playbook và phải dùng đúng.

### Bước 3 — Chạy 6 phép chẩn đoán

Theo đúng thứ tự này. Mỗi phép phải cho ra một kết luận viết được thành câu, không phải một bảng số.

1. **Nhịp** — khoảng cách giữa các touchpoint đang giãn hay đều? Im lặng hiện tại có vượt 2× khoảng cách trung bình không? Delay lặp lại cùng một lý do bao nhiêu lần?
2. **Cổng B-phase** — deal *tự nhận* đang ở phase nào, và *thực sự* đã qua cổng nào? Có đang chạy hoạt động B3 trước khi mở cổng B2 không?
3. **MEDDPICC** — chấm 8 yếu tố. Dưới 5/8 "Đạt" ⇒ nói thẳng rằng deal chưa đủ điều kiện nằm trong forecast chốt của quý.
4. **Người** — có ai đạt 4/4 hành vi Champion không? Có ai bị nhầm ANI thành IA không? Có ai ở phía khách mà KPI cá nhân đẹp lên nếu deal chạy không? (Câu cuối là câu tìm ra Champion.)
5. **Trao đổi hai chiều** — đếm cam kết Base nợ so với cam kết khách nợ, và đếm số nhượng bộ không đổi lấy ràng buộc nào. Lệch một chiều ⇒ giá trị cảm nhận đang bị bào mòn.
6. **Đối thủ** — nếu không có vendor nào, vẫn phải nêu Incumbent = status quo, kèm ba điều kiện cổng (EB alignment + migration plan + risk reversal).

### Bước 4 — Tìm ít nhất một chỗ người dùng có thể đang sai

Bắt buộc. Nếu chưa tìm được, chưa phân tích đủ sâu. Các chỗ hay sai nhất:

- Coi delay là sự cố lịch thay vì là mức ưu tiên thật của khách.
- Coi "không có vendor cạnh tranh" là "không có đối thủ".
- Nhầm người chủ trì buổi họp tốt với Champion.
- Chọn hành động khắc phục làm hài lòng người phản đối thay vì phân loại xem phản đối đó là nhu cầu thật hay tiêu chí chặn.
- Tính deal đang ở giai đoạn muộn vì đã làm nhiều việc, trong khi khối lượng việc không phải là tiến độ.

Viết phần này thành một khối riêng, đặt tên rõ ("Đính chính", "Chỗ có thể đang đọc sai"), không giấu trong đoạn văn.

### Bước 5 — Dựng kế hoạch 4 tuần bằng ngôn ngữ playbook

Mỗi tuần phải có deliverable gọi đúng tên nội bộ: Power Map, Battle Header, Value Case & ROI, POC Plan có KPI, Biên bản Đáp ứng, EB Alignment, POR v1, SITREP. Không dùng từ chung chung như "gửi tài liệu bổ sung".

Luôn kèm **tiêu chí dừng** phát biểu bằng luật của chính playbook: *không có EB Alignment ⇒ không lên B3*. Không được cắt phần này đi cho dễ nghe.

### Bước 6 — Xuất HTML

Đọc `references/output-spec.md` rồi dựng file theo `assets/report_template.html`. Ghi ra `/mnt/user-data/outputs/` và gọi `present_files`.

## Nguyên tắc viết

- **Tiếng Việt.** Thuật ngữ playbook giữ nguyên tiếng Anh (Economic Buyer, Champion, exit criteria, POR) vì đó là ngôn ngữ người dùng phải dùng trong họp nội bộ.
- **Trích nguyên văn dữ liệu của khách.** Một câu khách nói — kể cả ghi chú lệch lạc trong file — có sức nặng hơn ba đoạn phân tích. Đặt trong khối trích dẫn, ghi rõ nguồn là touchpoint nào.
- **Số phải kiểm chứng được.** Mỗi con số trong bản review phải truy được về một ô trong file input hoặc một phép tính từ script. Không ước lượng.
- **Không an ủi.** Không viết "deal vẫn còn cơ hội tốt" nếu dữ liệu không nói vậy. Nếu deal nên bị hạ khỏi forecast, viết ra.
- **Nêu chỗ tự mâu thuẫn trong dữ liệu.** Ngày không khớp, dashboard hỏng, red flag gắn sai touchpoint — nêu hết, vì người khác sẽ mở file gốc.
- **Không bịa dữ liệu.** Trường nào trống thì nói là trống và biến nó thành câu hỏi ở tab cuối, không suy đoán rồi trình bày như sự thật.

## Xử lý dữ liệu thiếu

| Thiếu gì | Làm gì |
|---|---|
| Chỉ có sheet 01 + 02 | Vẫn chạy đủ 6 tab. MEDDPICC suy ra từ hành trình, đánh dấu rõ là "suy luận, cần xác nhận". |
| Không có stakeholder nào | Đây tự nó là phát hiện lớn nhất — viết thành lỗ hổng số 1, không phải là lý do dừng phân tích. |
| Không có ngày review | Lấy ngày hôm nay. |
| Không có compelling event | Xử lý như một cờ đỏ, không phải một ô trống. |
| Dữ liệu mâu thuẫn | Nêu cả hai phiên bản, chỉ ra chỗ vênh, hỏi lại — không tự chọn một bên rồi im lặng. |

## Tài nguyên

| File | Khi nào đọc |
|---|---|
| `references/playbook-engine.md` | Luôn luôn, ở bước 2. |
| `references/output-spec.md` | Trước khi dựng HTML ở bước 6. |
| `scripts/analyze_input.py` | Chạy ở bước 1 khi có file Excel. |
| `assets/deal_journey_input_TEMPLATE.xlsx` | Khi người dùng chưa có file input, hoặc xin file mẫu. |
| `assets/report_template.html` | Khung CSS + cấu trúc tab cho output. |
