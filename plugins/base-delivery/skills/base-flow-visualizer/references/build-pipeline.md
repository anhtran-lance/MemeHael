# Build Pipeline

Các bước biến file HTML thành PDF A4 ngang gửi được, kèm QC tự động. Chạy trong
môi trường có Node (Playwright) và Python (PIL, pypdf). Copy lệnh chạy trực tiếp.

## 0. Chuẩn bị môi trường (một lần)

```bash
cd /home/claude
# Font tiếng Việt có subset vietnamese
npm i @fontsource/inter @fontsource/barlow-semi-condensed --silent
# Playwright để render PDF (thường đã có); nếu chưa:
# npm i playwright --silent && npx playwright install chromium
# Python libs
pip install fonttools pypdf --break-system-packages -q
```

Kiểm tra font mặc định của hệ thống thường **không đủ dấu tiếng Việt** (ví dụ
Poppins thiếu ư/ơ/ệ…), nên luôn nhúng Inter + Barlow từ @fontsource.

## 1. Nhúng font vào HTML (embed base64)

Lưu script này thành `embed_fonts.py`, chạy `python3 embed_fonts.py <in.html> <out.html>`:

```python
import base64, re, pathlib, sys
src, out = sys.argv[1], sys.argv[2]
def face(fam, path, weight):
    b = base64.b64encode(pathlib.Path(path).read_bytes()).decode()
    return (f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{weight};"
            f"font-display:block;src:url(data:font/woff2;base64,{b}) format('woff2');}}")
faces=[]
for w in [400,500,600,700]:
    for sub in ['latin','vietnamese']:
        faces.append(face('Inter',
            f'node_modules/@fontsource/inter/files/inter-{sub}-{w}-normal.woff2', w))
for w in [500,600,700]:
    for sub in ['latin','vietnamese']:
        faces.append(face('Barlow Semi Condensed',
            f'node_modules/@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-{sub}-{w}-normal.woff2', w))
html = pathlib.Path(src).read_text()
html = re.sub(r'<link rel="preconnect".*?>\n?', '', html, flags=re.S)
html = re.sub(r'<link href="https://fonts\.googleapis\.com.*?>\n?', '', html, flags=re.S)
html = html.replace('<style>', '<style>\n' + "\n".join(faces) + "\n", 1)
pathlib.Path(out).write_text(html)
print('embedded ->', out)
```

## 2. QC tự động — tràn trang & cắt chữ

Lưu `qc.js`, chạy `node qc.js <embedded.html>`. Phải đạt: mọi `overflow = 0` và
`clipped`/`narrow` rỗng.

```javascript
const { chromium } = require('playwright');  // hoặc đường dẫn tuyệt đối tới playwright
const file = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:1123,height:794}});
  await p.goto('file://' + require('path').resolve(file), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const out = {sheets:[], clipped:[], narrow:[]};
    document.querySelectorAll('.sheet').forEach((s,i)=>
      out.sheets.push({i, overflow: s.scrollHeight - s.clientHeight}));
    document.querySelectorAll('.step,.bcond,.fk2-cond,.lane-name,.m-name,td,.note,li')
      .forEach(e=>{ if(e.scrollHeight > e.clientHeight+1)
        out.clipped.push(e.textContent.trim().slice(0,40)); });
    document.querySelectorAll('.step').forEach(e=>{
      const w = e.getBoundingClientRect().width;
      if(w < 44) out.narrow.push(e.textContent.trim().slice(0,30)+' w='+Math.round(w)); });
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
```

Đọc kết quả:
- `overflow > 0` → trang tràn. Giảm dần: `min-height` của `.step`, `gap`/`margin`
  giữa lane, padding card, `line-height` của bullet. Giảm từng ~1-2px, chạy lại.
- `narrow` không rỗng → có block bị bóp hẹp (< 44px). Nguyên nhân thường là quá
  nhiều bước trên một hàng. Chuyển nhánh đó sang **layout dọc** (component-library
  mục 5) thay vì nhồi ngang.
- `clipped` không rỗng → chữ bị cắt trong block. Tăng `min-height` hoặc giảm cỡ chữ.

## 3. Render PDF

Lưu `pdf.js`, chạy `node pdf.js <embedded.html> <out.pdf>`:

```javascript
const { chromium } = require('playwright');
const [file, outPdf] = [process.argv[2], process.argv[3]];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + require('path').resolve(file), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);
  await p.pdf({ path: outPdf, width: '297mm', height: '210mm', printBackground: true });
  await b.close();
})();
```

## 4. Soi lại bằng ảnh (rà nội dung trước khi giao)

```bash
pdftoppm -png -r 110 <out.pdf> preview   # tạo preview-1.png, preview-2.png…
```
Mở ảnh xem đúng bố cục, đủ dấu, không cắt chữ. Phóng to vùng cần soi bằng PIL nếu
chữ nhỏ:

```python
from PIL import Image
im = Image.open('preview-1.png'); w,h = im.size
im.crop((0, int(h*0.1), w, int(h*0.55))).resize((int(w*1.5), int(h*0.45*1.5))).save('zoom.png')
```

## 5. Đối chiếu text (chống sai tên bước)

```bash
pdftotext -layout <out.pdf> - | sed -n '1,80p'
```
So từng tên bước với input gốc: đúng nguyên văn, đúng thứ tự, cú pháp kết thúc
thống nhất. Đây là chốt chặn cuối trước khi `present_files`.

## 6. Giao file

`present_files` cả `.pdf` (bản gửi KH) và `.html` (bản nguồn để chỉnh sau).

## Gộp nhiều bộ thành 1 PDF (khi cần)

```python
from pypdf import PdfWriter, PdfReader
w = PdfWriter()
for f in ['bo1.pdf','bo2.pdf','bo3.pdf']:
    for pg in PdfReader(f).pages: w.add_page(pg)
with open('tong-hop.pdf','wb') as o: w.write(o)
```

## Lưu ý đường dẫn Playwright

Nếu `require('playwright')` không thấy, dùng đường dẫn tuyệt đối tới
`node_modules/playwright` (ví dụ global: `/home/claude/.npm-global/lib/node_modules/playwright`).
