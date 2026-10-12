---
name: value-chain-to-casan
description: >
  Dựng 1 file HTML duy nhất kể mạch số hoá khách hàng qua 3 trang liền mạch: (1) Chuỗi giá trị &
  quy trình vận hành → (2) Techmap số hoá theo quy trình (quy trình nguồn → dữ liệu vào Data
  Warehouse → báo cáo đầu ra) → (3) Đánh giá CASAN & danh mục báo cáo AI theo lát cắt hợp nhất.
  Dùng khi Solution Engineer Base.vn cần tổng hợp bản đồ chuỗi giá trị + danh mục số hoá + đánh
  giá CASAN của MỘT khách hàng thành 1 tài liệu, hoặc khi user yêu cầu "làm techmap từ chuỗi giá
  trị đến CASAN", "tổng hợp thành 1 file", "kể câu chuyện số hoá cho khách hàng X" — kể cả khi chỉ
  đưa input rời rạc chưa nói rõ muốn gộp. Kết hợp `techmap-casan` khi chỉ cần 1 trang techmap độc
  lập, hoặc `so-hoa-thuy-dien` khi ngành thủy điện/năng lượng (khung 4 nhóm BSC).
---

# Skill: Từ Chuỗi giá trị đến Số hoá & Đánh giá CASAN

## Mục đích

Dựng **một file HTML tự chứa, 3 trang điều hướng bằng thanh nav trên cùng**, kể mạch lập luận:

```
Trang 1                    Trang 2                          Trang 3
Chuỗi giá trị      →       Techmap số hoá theo quy trình →  Đánh giá CASAN
& quy trình vận hành       (quy trình → dữ liệu → báo cáo)  & Báo cáo AI
```

Mỗi trang là bằng chứng cho trang sau: Trang 1 cho biết quy trình nào đang chạy; Trang 2 cho biết
quy trình đó sinh ra dữ liệu gì và dữ liệu đi đâu; Trang 3 chốt phương án — khách đang ở cấp CASAN
nào, cần báo cáo/AI gì để lên cấp tiếp theo. Không trang nào được đứng độc lập — số liệu (số quy
trình, số báo cáo, % quá hạn...) phải khớp nhau xuyên suốt cả 3 trang.

Output: 1 file `.html` để gửi khách hàng, demo, hoặc dùng trong buổi tư vấn.

## Khi nào dùng / không dùng

- **Dùng**: khách hàng đã có (hoặc Solution Engineer tự dựng) tối thiểu 2 trong 3 input sau:
  (a) bản đồ/tên các quy trình theo chuỗi giá trị ngành, (b) báo cáo thống kê quy trình workflow/BPM
  (Excel: tên quy trình, Workflow ID, nhiệm vụ, quá hạn, SLA...), (c) đánh giá CASAN có sẵn hoặc cần
  dựng mới. Nếu thiếu input nào, tự suy ra hoặc hỏi khách theo Bước 0 dưới đây.
- **Không dùng**: chỉ cần 1 trang techmap đơn lẻ không có bối cảnh chuỗi giá trị/CASAN đầy đủ → dùng
  thẳng skill `techmap-casan`. Khách ngành thủy điện/năng lượng có holding+SPV → ưu tiên khung 4 nhóm
  BSC của `so-hoa-thuy-dien`, chỉ mượn quy ước thiết kế (single-file HTML, kiểm thử) từ skill này.

## Bước 0 — Thu thập input

1. **Chuỗi giá trị ngành**: các giai đoạn chính (thường 4–7 giai đoạn tuỳ ngành) + danh sách quy
   trình tiêu biểu mỗi giai đoạn + khối phụ trợ (Nhân sự–Hành chính, Kế toán–Tài chính...). Nếu khách
   đã có file HTML/Excel dạng "value chain map", đọc và tái dùng CSS/nội dung; nếu chưa có, dựng mới
   dựa trên hiểu biết ngành + xác nhận với khách.
2. **Danh mục số hoá theo quy trình** (nguồn quan trọng nhất): file Excel/báo cáo thống kê workflow
   với tối thiểu các cột: tên quy trình, Workflow ID, nhiệm vụ, quá hạn, hoàn thành, SLA, trạng thái
   số hoá, cơ hội AI, mức uỷ quyền đề xuất (L0–L5).
3. **Bảng "Nguồn báo cáo"** (nếu có) — ánh xạ Lát cắt → Báo cáo → Quy trình nguồn (tên + Workflow ID)
   → Trường dữ liệu sử dụng → Trạng thái dữ liệu (Đã có / Một phần / Cần thu thập). Đây là nguồn dữ
   liệu chính xác nhất cho Trang 2; nếu khách chưa có, tự tổng hợp từ file đánh giá CASAN (mục "Danh
   mục Báo cáo theo lát cắt") + suy luận quy trình nguồn từ danh mục số hoá.
4. **Đánh giá CASAN có sẵn** (nếu có): cấp hiện tại/mục tiêu, điểm 8 trục, KPI vận hành tổng, danh
   mục báo cáo theo lát cắt kèm cơ hội AI + mức uỷ quyền. Nếu chưa có, dựng theo Phần A của skill
   `techmap-casan` (7 chiều đánh giá, khung L0–L5).

**Nguyên tắc số liệu**: mọi con số hiển thị (số quy trình, tổng nhiệm vụ, % quá hạn...) phải lấy
đúng từ nguồn, không suy diễn/làm tròn tuỳ tiện. Nếu một con số xuất hiện ở nhiều trang, nó phải
giống hệt nhau — đối chiếu lại trước khi xuất file.

## Bước 1 — Trang 1: Chuỗi giá trị & Quy trình vận hành

Bố cục: tiêu đề căn giữa → khối "quy trình chính" (3 cột, theo giai đoạn CGT) → dải chuỗi giá trị
ngang (icon tròn + tên từng giai đoạn, mũi tên nối) → khối "quy trình phụ trợ" (số cột bằng đúng số
nhóm phụ trợ, căn giữa nếu lệch — xem lưu ý CSS ở Bước 4). Đây là bản đồ tĩnh, không cần tương tác.

## Bước 2 — Trang 2: Techmap số hoá theo quy trình (3 cột)

**Đây là phần lõi khác biệt của skill này** — không dùng dashboard 4 tầng nghiệp vụ trừu tượng như
`techmap-casan` gốc, mà dùng bảng 3 cột cụ thể, đọc thẳng từ dữ liệu thật:

```
CỘT 1                      CỘT 2                        CỘT 3
Quy trình nguồn      →     Dữ liệu → Data Warehouse →   Báo cáo đầu ra
(tên + Workflow ID)        (trường dữ liệu trích ra)     (tên báo cáo, chấm màu trạng thái)
```

Mỗi **hàng** = 1 Data Mart (thường 4–8 mart, đặt tên trùng với các "lát cắt báo cáo hợp nhất" đã
dùng ở Trang 3 — bắt buộc khớp tên để người đọc lần theo được). Với mỗi mart:

- **Cột 1**: chip liệt kê quy trình nguồn duy nhất (dedup theo tên+ID) đóng góp dữ liệu cho mart đó.
  Không cần hiện `#WorkflowID` nếu khách không cần chi tiết kỹ thuật — chỉ hiện tên quy trình (xem
  lưu ý ở Bước 4). Nếu một trường hợp áp dụng cho toàn bộ hệ thống (ví dụ "tất cả N quy trình"), dùng
  1 chip riêng thay vì liệt kê hết.
- **Cột 2**: chip trường dữ liệu (dedup), lấy đúng tên trường trong nguồn (Nhiệm vụ, Quá hạn, SLA...).
- **Cột 3**: danh sách báo cáo, mỗi dòng có chấm màu theo trạng thái dữ liệu (xanh=đã có, vàng=một
  phần, đỏ=cần thu thập) — tra từ bảng "Nguồn báo cáo" ở Bước 0.3.

Header 3 cột có badge số 1/2/3 màu khác nhau (cam/xanh navy/tím) giống mẫu tham chiếu; cuối bảng có
legend giải thích 3 mức trạng thái dữ liệu.

**Không mặc định thêm** các tab "Tổng quan" (lặp lại đánh giá CASAN) hay "Giám sát & Kết quả"
(Dashboard/Alert/AI cards) trừ khi khách yêu cầu — mục tiêu của Trang 2 là trả lời đúng câu hỏi
"quy trình nào → dữ liệu gì → thành báo cáo gì", không lặp nội dung Trang 3.

## Bước 3 — Trang 3: Đánh giá CASAN & Báo cáo AI

Tái sử dụng cấu trúc chuẩn (xem `techmap-casan` Phần A–D nếu cần dựng từ đầu):
- Mục A — Kết quả đánh giá CASAN: badge cấp hiện tại → mục tiêu, thanh 5 cấp (lvlbar), bảng điểm
  8 trục kèm nhận xét.
- Mục B — Bức tranh vận hành từ dữ liệu: KPI tổng (số quy trình, tổng nhiệm vụ, % quá hạn...) + thẻ
  cảnh báo điểm nghẽn lớn nhất.
- Mục C — Danh mục báo cáo theo lát cắt hợp nhất: mỗi lát cắt = 1 thẻ 2 cột (Báo cáo vận hành | Báo
  cáo AI kèm tag mức uỷ quyền L0–L5).
- Mục D (lộ trình 90 ngày / 12–24 tháng) là **tuỳ chọn** — chỉ giữ nếu khách muốn bản đề xuất đầy đủ;
  nhiều khách chỉ cần A–C để dùng làm tài liệu đánh giá hiện trạng, hỏi trước khi thêm.

## Bước 4 — Thiết kế & quy ước kỹ thuật

- **Single-file HTML tự chứa**, tiếng Việt, palette business-blue nhất quán 3 trang:
  `--navy:#1B3F72 --mid:#2563A8 --orange:#F26522 --bg:#F0F6FF --bd:#C5D9F0 --soft:#F7FAFE`.
  **Toàn bộ 3 trang dùng nền sáng** — không dùng dark-navy cho bất kỳ trang nào trừ khi khách yêu
  cầu rõ ràng (dark theme dễ lạc tông với 2 trang còn lại và khó đọc khi in).
- **Thanh nav trên cùng** (không dùng sidebar trái): nền gradient
  `linear-gradient(120deg, var(--navy) 0%, var(--mid) 48%, var(--orange) 100%)`, 3 tab tương ứng
  3 trang, tab active có nền trắng + số thứ tự màu cam. Nội dung `.main` căn giữa
  (`max-width:1180px; margin:0 auto`) — không để lệch trái do dấu vết của layout sidebar cũ.
- **Không hiển thị ngày/giờ xuất file cụ thể** trong nav trừ khi khách cần — ưu tiên gọn.
- **Grid lệch khi số cột không chia hết**: nếu một hàng chỉ có 2 khối trong lưới 3 cột (ví dụ khối
  phụ trợ ở Trang 1), đặt `grid-template-columns` riêng cho hàng đó + `max-width` + `margin:auto`
  để tự căn giữa, đừng để nó dính lề trái do kế thừa layout hàng trên.
- **Chip quy trình nguồn**: mặc định hiện tên quy trình. Chỉ thêm `#WorkflowID` nếu khách xác nhận
  cần độ chi tiết kỹ thuật đó; nếu không chắc, hỏi trước khi thêm nhiều số ID rối mắt.
- **Tên brand đối tác**: dùng đúng tên Solution Engineer đang đại diện (mặc định Base.vn) — không
  để sót tên khung phương pháp gốc (vd "FPT Alpha v1") nếu khách muốn thay bằng thương hiệu của họ.
- **Liên kết chéo giữa 3 trang**: đầu mỗi trang (trừ trang 1 nếu không cần) có 1 khối "linkline"
  ngắn (2–3 câu) giải thích trang này kế thừa gì từ trang trước — xem mẫu trong
  `references/build-patterns.md`.

## Bước 5 — Quy trình kiểm thử bắt buộc

Sau mỗi lần chỉnh sửa (đặc biệt khi cắt/ghép HTML bằng string replace):

```bash
python3 -c "
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.stack=[]; self.errors=0
    def handle_starttag(self, tag, attrs):
        if tag=='div': self.stack.append(1)
    def handle_endtag(self, tag):
        if tag=='div':
            if self.stack: self.stack.pop()
            else: self.errors+=1
s = open('file.html', encoding='utf-8').read()
p=P(); p.feed(s)
print('unclosed:', len(p.stack), 'errors:', p.errors)
"
```

Dùng **`html.parser` thật**, không dùng đếm chuỗi `s.count('<div')` — đếm chuỗi cho kết quả sai lệch
khi có div tự đóng hoặc text chứa `<div`/`</div>` giả, và khi lệch chỉ 1 div, việc dò bằng regex thủ
công dễ báo hàng loạt lỗi giả (đã gặp trong quá trình dựng case mẫu — xem `references/build-patterns.md`
mục "Bẫy kiểm thử div"). Sau đó kiểm tra JS:

```bash
sed -n '/<script>/,/<\/script>/p' file.html | sed '1d;$d' > /tmp/s.js
node --check /tmp/s.js
```

**Luôn `cp` backup trước khi sửa nhiều**; ưu tiên `str_replace`/`memory_str_replace`-style thay
chuỗi có ngữ cảnh đủ dài để chỉ khớp đúng 1 vị trí, tránh sửa nhầm đoạn lặp lại (các trang có
nhiều class tên giống nhau như `.card`, `.kpi`, `.tag`).

## Reference files

- `references/build-patterns.md` — chi tiết kỹ thuật dựng: cách tách/gộp HTML bằng Python, cách
  dedup dữ liệu Excel thành chip cột 1/2, cách viết CSS 3-cột kiểu Techmap, bẫy thường gặp khi
  splice nhiều lần (div lệch, CSS đè scope).
- `references/tatcons-case.md` — case mẫu đầy đủ (nhà thầu xây dựng TATCONS): cấu trúc 6 giai đoạn
  CGT, 6 Data Mart theo lát cắt CASAN, số liệu minh hoạ (57 quy trình, 1.513 nhiệm vụ, 297 quá hạn).
  Đọc khi cần ví dụ cụ thể hoặc khách hàng thuộc ngành xây dựng/nhà thầu.
