# Kỹ thuật dựng deliverable

## 1. Nền tảng chung

- **Single-file HTML tự chứa**, tiếng Việt, tông tối hoặc business-blue. Chart.js + Tabler
  icons từ CDN (`cdn.jsdelivr.net`). Đặt output ở `/mnt/user-data/outputs/`.
- Cấu trúc dashboard: **sidebar nav + nhiều trang** (`.page`), đổi trang bằng `show(p)`.
- **Lazy init biểu đồ theo trang** (`built` map): chỉ dựng chart khi trang được mở lần đầu —
  tránh lỗi Chart.js với canvas trong `display:none` (kích thước 0).
- Hook trang phụ: nếu tách hàm build phụ, gọi `if(EXTRA[p])EXTRA[p]()` trong `show()`.

## 2. Tái dùng template chất lượng (kiểu "ECV")

- Khi có một template tài chính đẹp, **trích nguyên khối `<style>`** của nó (verbatim) để giữ
  đồng bộ nhận diện, rồi viết body + JS mới với nội dung thủy điện.
- Giữ vocabulary component của template: `.kpi/.ttl/.big/.row/.bdg`, `.card/.hd`, bảng
  `.rk` (ranking), `.hm` (heatmap), badge `.bG/.bM`.
- Kiểm tra không sót thuật ngữ ngành cũ (vd "công trình/nghiệm thu/ECV") sau khi customize.

## 3. Các pattern tương tác (đã dùng, tái sử dụng được)

- **Lọc cả trang theo nhà máy**: 1 bộ nút ở titlebar (`data-pl=all/0/1/2`) điều khiển đồng
  thời KPI + mọi biểu đồ + bảng của trang qua một hàm `renderPage()`.
- **Toggle Thực tế / Lũy kế**: `cumize = a => {let s=0; return a.map(v=>+(s+=v).toFixed(2));}`.
- **So sánh Kế hoạch**: thêm dataset `type:'line'` nét đứt (`borderDash:[5,4]`, `pointRadius:0`)
  cho đường KH; per-nhà-máy lấy từ share của KH cụm.
- **Tab toggle dùng chung**:
  `wireTabs(sel,attr,cb)` → bỏ `.on` các nút cùng nhóm, set `.on` nút bấm, gọi `cb(dataset[attr])`.
- **Heatmap ma trận** `heat(thId,tbId,corner,cols,rowL,mat,opt)`: ô đậm theo `|value|/max`.
  Hỗ trợ `opt.totalCol`, `opt.totals` (mảng tổng tuyệt đối), `opt.totFmt`, `opt.fmt`.
  **Đồng bộ cột giữa các chế độ**: luôn truyền `totalCol` + `totals` (giá trị tuyệt đối) để
  khi đổi hiển thị Giá trị ↔ % số cột không đổi.
- **Bảng**: fill bằng `el(id).innerHTML = DATA.map(...).join('')` + 1 dòng `.tot`.

## 4. Chart.js — gotchas quan trọng

- **Đường line bị cắt ở mép trên** → thêm `grace:'12%'` cho trục y + `clip:false` cho dataset line.
- **Combo bar+line 2 trục**: line trên `yAxisID:'y1'` (trục phải, có min/max riêng cho headroom).
- **Stacked**: `scales.x.stacked=true` + mỗi dataset `stack:'s'`.
- **Thanh ngang**: `indexAxis:'y'`.
- Thứ tự vẽ bar dưới line: đặt `order` (line `order:1`, bar `order:2`).
- Đổi dữ liệu khi filter: sửa `chart.data.datasets` rồi `chart.update()` (không dựng lại).

## 5. Deck demo (PPTX) bằng pptxgenjs

- `LAYOUT_WIDE` 13.33×7.5; palette navy `16365C` / blue `2F7ED8` / ice `E8F1FB`.
- **Motif icon-trong-tròn**: render `react-icons/fa` → SVG → PNG bằng `sharp`, cache vào map;
  **preload async xong mới build slide** (bọc toàn bộ trong `(async()=>{await preload(); ...})()`).
- Truyền **data (base64) cho `addImage`, không truyền key string**; chú ý lệch chỉ số mảng khi
  map card (bug hay gặp: dùng `a[4]` thay vì `a[3]`).
- Cấu trúc 12 slide: Bìa → Bối cảnh holding+SPV → Bài toán → Cách tiếp cận (không động SCADA)
  → "Đã dựng — demo chạy được" → từng sản phẩm → Giá trị → Lộ trình 3 GĐ → Closing (mời họp).
- QA: `soffice --convert-to pdf` → `pdftoppm -jpeg` → `view` từng slide; grep sót hex/placeholder.

## 6. Định tuyến deliverable (file vs inline)

- Report/deck/dashboard/blog → **tạo file** trong outputs + `present_files`.
- Chiến lược/tóm tắt/giải thích → **trả lời inline** trong chat.

## 7. Quy trình kiểm thử (bắt buộc)

```bash
# 1) cú pháp JS
sed -n '/<script>/,/<\/script>/p' file.html | sed '1d;$d' > /tmp/s.js
node --check /tmp/s.js
node -e "const s=require('fs').readFileSync('/tmp/s.js','utf8');const c=x=>s.split(x).length-1;console.log(c('{')-c('}'),c('(')-c(')'),c('[')-c(']'));"  # phải 0 0 0

# 2) canvas ↔ chart khớp 1-1
grep -oE 'canvas id=\"[a-z0-9_]+\"' file.html | sed 's/.*\"\\(.*\\)\".*/\\1/' | sort -u
grep -oE 'new Chart\\([a-z0-9_]+' /tmp/s.js | sed 's/new Chart(//' | sort -u
```

- **Chạy thử logic** bằng Node với **stub**: `class Chart{constructor(e,c){this.data=c.data;}update(){}}`,
  `document.getElementById` trả object có setter `innerHTML/textContent`, và khai báo global cho
  mỗi canvas id. Gọi các hàm render/toggle rồi kiểm tra `chart.data.datasets` / nội dung bảng.
- **Không headless-render được Chart.js** ở đây (mạng chặn CDN) → dựa vào kiểm tra cấu trúc;
  luôn nhắc user cần internet khi mở file.
- **Luôn `cp` backup trước khi sửa**; thay chuỗi bằng Python có `assert count==1`.

## 8. Liên kết chéo giữa dashboard (link-card chuẩn)

```html
<div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
  <div><h2 style="margin:0">Tên báo cáo</h2><div class="sub2">mô tả ngắn</div></div>
  <a href="ten_file.html" target="_blank" rel="noopener"
     style="background:#0d2a45;color:#fff;text-decoration:none;font-weight:600;border-radius:9px;padding:9px 16px">Mở ... →</a>
</div>
```
Đường dẫn tương đối → nhắc user đặt các file cùng thư mục khi tải về.
