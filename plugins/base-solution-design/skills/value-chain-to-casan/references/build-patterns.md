# Kỹ thuật dựng: từ Chuỗi giá trị đến CASAN

## 1. Quy trình dựng bằng Python (khuyến nghị)

Với tài liệu 3 trang dài (thường 800–1500 dòng HTML), đừng viết tay toàn bộ trong 1 lần — dựng
từng mảnh bằng script Python rồi ghép, dễ kiểm soát và sửa lại từng phần:

1. Đọc input (Excel bằng `openpyxl`, HTML tham chiếu bằng `view`/đọc text) → trích xuất dữ liệu
   thô thành cấu trúc Python (dict/list), lưu tạm ra `/tmp/*.json` để tái dùng giữa các script.
2. Viết script riêng cho từng khối lớn: `build_page1.py` (nếu cần dựng mới bản đồ CGT),
   `build_techmap_tab2.py` (bảng 3 cột), `build_page3.py` (nếu cần dựng mới đánh giá CASAN).
   Mỗi script ghi output ra 1 file HTML fragment tạm (`/tmp/xxx.html`).
3. Script cuối cùng ghép toàn bộ: đọc CSS gốc + 3 fragment → nhét vào template tổng → ghi ra
   `/mnt/user-data/outputs/`.

Lý do tách nhỏ: khi khách yêu cầu sửa 1 phần (ví dụ "đổi tab 2 sang 3 cột"), chỉ cần viết lại script
tương ứng và ghép lại, không phải sửa tay trong 1 file HTML khổng lồ dễ gây lệch thẻ.

## 2. Dedup dữ liệu Excel thành chip cột 1/cột 2 (Trang 2)

Từ bảng "Nguồn báo cáo" (Lát cắt | Báo cáo | Quy trình nguồn | Trường dữ liệu | Trạng thái), dữ liệu
thô có nhiều báo cáo dùng lại cùng quy trình/trường dữ liệu. Dedup bằng dict trước khi render:

```python
def dedup_mart_data(reports):
    procs = {}   # workflow_id -> tên quy trình (dict tự động dedup theo key)
    fields = []  # list giữ thứ tự xuất hiện, dedup bằng set phụ
    seen_f = set()
    for r in reports:
        for p in r['src'].split(';'):
            m = re.match(r'(.*)\(#(\d+)\)\s*$', p.strip())
            if m: procs[m.group(2)] = m.group(1).strip()
        for f in r['fields'].split('·'):
            f = f.strip()
            if f and f not in seen_f:
                seen_f.add(f); fields.append(f)
    return procs, fields
```

Nếu số quy trình dedup được > ~12, cắt bớt và thêm 1 chip `+N quy trình khác` — liệt kê hết sẽ vỡ
layout và không ai đọc hết.

## 3. CSS bảng 3 cột kiểu Techmap

```css
.tm3-hd{display:grid; grid-template-columns:1fr 1fr 1fr; border:1px solid var(--bd); border-bottom:none;}
.tm3-hcell{padding:10px 12px; text-align:center; font-size:10.5px; font-weight:800; text-transform:uppercase;}
.tm3row{border:1px solid var(--bd); border-top:none;}
.tm3-martlbl{display:flex; align-items:center; gap:10px; padding:10px 14px; border-bottom:1px dashed var(--bd);}
.tm3grid{display:grid; grid-template-columns:1fr 1fr 1fr;}
.tm3cell{padding:12px 14px; border-right:1px solid var(--bg);}
.tm3cell.arrow-l::before{content:"→"; position:absolute; left:-11px; top:16px; background:#fff;}
```

Mỗi hàng (`.tm3row`) = 1 Data Mart, có nhãn màu riêng (badge `M1`, `M2`... với màu khác nhau) để mắt
dễ theo dõi khi kéo dài xuống. Dùng `color-mix(in srgb, var(--mc) 10%, white)` cho nền nhãn mart để
tint nhẹ theo màu mart mà không cần khai báo nhiều biến CSS.

## 4. Bẫy kiểm thử div (đã gặp thực tế)

Khi splice HTML nhiều lần bằng `str.index()` + nối chuỗi, rất dễ để sót hoặc thừa 1 thẻ `</div>` ở
điểm nối — đặc biệt khi cấu trúc wrapper thay đổi giữa các lần sửa (ví dụ bỏ bớt 1 lớp `<div
id="page2">` ở lần sửa sau nhưng đoạn code nối vẫn giữ nguyên số lượng `</div>` đóng của lần trước).

**Đừng dùng đếm chuỗi** `s.count('<div')` vs `s.count('</div>')` để định vị lỗi — nó chỉ cho biết
CÓ lệch hay không (và lệch bao nhiêu), không cho biết lệch Ở ĐÂU. Tệ hơn, nếu dùng regex tự viết để
dò từng cặp mở/đóng, một lỗi lệch 1 thẻ ở giữa file sẽ khiến toàn bộ phần còn lại bị báo "extra
close" hàng loạt (vì stack rỗng sớm) — dễ hiểu nhầm là lỗi lan rộng trong khi thực chất chỉ có 1 chỗ
sai. Luôn dùng `html.parser.HTMLParser` thật để có vị trí (dòng, cột) chính xác của lỗi:

```python
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.stack=[]; self.errors=[]
    def handle_starttag(self, tag, attrs):
        if tag=='div': self.stack.append(self.getpos())
    def handle_endtag(self, tag):
        if tag=='div':
            if self.stack: self.stack.pop()
            else: self.errors.append(self.getpos())
p = P(); p.feed(html_text)
print('unclosed:', len(p.stack), 'extra-close at:', p.errors)
```

`p.errors` cho vị trí chính xác của thẻ đóng thừa; `p.stack` còn lại sau khi feed hết cho vị trí các
thẻ mở chưa đóng. Sửa xong, chạy lại đến khi cả hai đều rỗng.

## 5. CSS scope khi nhiều trang dùng class trùng tên

3 trang thường tái dùng class tên giống nhau (`.card`, `.kpi`, `.tag`, `h2`) từ các file nguồn khác
nhau. Nếu không scope, CSS của trang này sẽ đè CSS trang khác. Luôn prefix selector bằng ID trang
(`#page1 .card{...}`, `#page3 .card{...}`) khi 2 trang có cùng tên class nhưng style khác nhau. Nếu
2 trang cố ý dùng chung 1 style (ví dụ Trang 2 tái dùng nguyên bảng đánh giá CASAN của Trang 3), copy
nguyên khối CSS sang scope `.techmap-wrap` thay vì để nó phụ thuộc ngầm vào `#page3` — đảm bảo nội
dung vẫn đúng style dù bị di chuyển vị trí trong DOM.

## 6. Định tuyến deliverable

Report/techmap tổng hợp 3 trang → luôn tạo file `.html` trong `/mnt/user-data/outputs/` +
`present_files`. Không trả lời bằng text mô tả nội dung — khách cần file mở được ngay.
