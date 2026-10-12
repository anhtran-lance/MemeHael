# Component Library

Các khối HTML tái sử dụng. CSS đầy đủ nằm trong `assets/template.html`. File này
giải thích **dùng component nào cho tình huống nào** và cho snippet mẫu.

Mũi tên giữa các bước dùng SVG inline (xem template). Để gọn, bên dưới viết tắt
mũi tên là `<ARROW/>`.

## 1. Lane quy trình tổng (master)

Một hàng = một quy trình tổng (hoặc một nhánh/loại). Gồm: `m-head` (tag + tên +
mô tả ngắn) và `m-body` (chuỗi bước).

```html
<div class="master">
  <div class="m-head">
    <span class="tag">QT (A)</span>
    <div class="m-name">Tên quy trình tổng</div>
    <div class="m-sub">Mô tả ngắn / góc nhìn</div>
  </div>
  <div class="m-body">
    <div class="track">
      <div class="step entry"><span class="num">1</span>Bước bắt đầu</div>
      <ARROW/>
      <div class="step"><span class="num">2</span>Bước bắt buộc</div>
      <ARROW/>
      <div class="step end"><span class="num">3</span>Bước kết thúc</div>
    </div>
  </div>
</div>
```

Lane độc lập (QT chạy trực tiếp, không QT con): thêm class `indep` vào `.master` →
đổi sang tông teal.

## 2. Lane quy trình con (trang 2)

```html
<div class="lane">
  <div class="lane-head"><span class="tag">QT con · 1</span>
    <div class="lane-name">Tên QT con</div></div>
  <div class="lane-body">
    <div class="step"><span class="num">1</span>Bước 1</div>
    <ARROW/>
    <div class="step end"><span class="num">2</span>Chuyển bước ở QT tổng</div>
    <div style="flex:3.1"></div> <!-- spacer đẩy các bước về trái -->
  </div>
</div>
```

Dùng `<div style="flex:N"></div>` cuối lane làm spacer khi lane có ít bước, để các
block không bị kéo giãn quá rộng.

## 3. Các kiểu block bước (class trên `.step`)

- (mặc định) — bước bắt buộc, nền màu chủ đạo.
- `entry` — điểm bắt đầu: nền trắng, viền màu chủ đạo.
- `end` — bước kết thúc / chuyển bước: nền màu nhấn.
- `opt` — bước tùy chọn: nền teal nhạt, viền đứt teal, chữ teal đậm.
- `back` — bước quay lại: nền trắng, viền đứt, thêm ký hiệu `↺` đầu chữ.
- `merge` — điểm chuyển Unit / tổng hợp: nền đỏ.
- `gdn` — khâu ngoài hệ thống: nền trắng viền đỏ.
- `direct` — thao tác trực tiếp đặc thù: nền tím.
- `split` — bước rẽ/phân đôi phiếu: nền tím.

Số thứ tự: `<span class="num">N</span>` (vòng tròn góc trên trái). Bỏ `num` cho
block không đánh số (ngoài hệ thống, nhãn).

## 4. Vạch ngăn ngoài / trên hệ thống

Chia `m-body` thành 2 vùng: `seg-real` (trái, nền đỏ nhạt) và `seg-base` (phải, có
vạch dọc). Thêm dải tiêu đề `phase-band` phía trên để ghi Unit mỗi vùng.

```html
<div class="phase-band">
  <div class="pb-spacer"></div>
  <div class="pb-real"><span class="pb-tag">Ngoài Base</span> Unit = N GĐN</div>
  <div class="pb-base"><span class="pb-tag">Trên Base</span> Unit = 1 gói thầu / …</div>
</div>
...
<div class="trow">
  <div class="tlab"><span class="th">Tên loại</span></div>
  <div class="seg-real">
    <div class="step gdn">Bước ngoài hệ thống</div>
  </div>
  <div class="seg-base">
    <div class="step merge">Tổng hợp / Gộp-Tách (bước đầu trên hệ thống)</div>
    <ARROW/>
    <div class="step">Bước tiếp theo</div>
  </div>
</div>
```

## 5. Rẽ nhánh theo điều kiện (layout dọc — dùng cho nhánh dài)

Khi một luồng rẽ 2+ nhánh mà mỗi nhánh nhiều bước, **không nhồi ngang** (sẽ bị bóp
chữ). Thay vào đó: phần chung một hàng (`sb-common`), rồi mỗi nhánh một hàng riêng
(`fk2-row`) chiếm trọn chiều rộng.

```html
<div class="seg-base seg-col">
  <div class="sb-common">
    <div class="step merge">Bước chung A</div><ARROW/>
    <div class="step">Bước chung B</div>
    <div class="sb-forklbl">rẽ theo giá trị ›</div>
  </div>
  <div class="fk2-row">
    <div class="fk2-cond">&gt; 50M</div>
    <div class="step">Nhánh 1 bước 1</div><ARROW/>
    <div class="step end">Kết thúc</div>
  </div>
  <div class="fk2-row">
    <div class="fk2-cond">&lt; 50M</div>
    <div class="step">Nhánh 2 bước 1</div><ARROW/>
    <div class="step end">Kết thúc</div>
    <div style="flex:4"></div>
  </div>
</div>
```

## 6. Panel rẽ nhánh từ một bước (trang QT con)

Khi một bước trong QT con rẽ nhiều hướng (ví dụ "Đăng tải HSMT" → Mở thầu / Hiệu
chỉnh / Hủy…):

```html
<div class="branch">
  <div class="branch-hd">Rẽ nhánh từ bước N — Tên bước</div>
  <div class="brow">
    <div class="bcond">Điều kiện 1</div><ARROW/>
    <div class="step back">↺ Quay về bước 1</div>
    <div class="bsp"></div>
  </div>
  <div class="brow">
    <div class="bcond">Điều kiện 2</div><ARROW/>
    <div class="step end">Chuyển bước ở QT tổng</div>
    <div class="bsp"></div>
  </div>
</div>
```

## 7. Card giải thích cơ chế

Vùng `notes` chứa 1-3 card. Mỗi card: tiêu đề + danh sách gạch đầu dòng (hoặc sơ đồ
mini). Dùng để giải thích "vì sao tách 2 QT", "cơ chế đồng bộ", "điểm đặc thù"…

```html
<div class="notes">
  <div class="card c1">
    <div class="ctitle">Tiêu đề cơ chế</div>
    <ul class="tick"><li>Điểm giải thích…</li></ul>
  </div>
</div>
```

Class `c1/c2/c3` đổi màu viền trái card (đỏ / tím / teal) theo chủ đề.

## 8. Chú thích + bảng ánh xạ (footer)

```html
<footer>
  <div class="legend">
    <div class="ftitle">Chú thích</div>
    <div class="lg-item"><span class="sw navy"></span><span><b>Bước bắt buộc</b></span></div>
    <!-- … các dòng chú thích khác … -->
  </div>
  <div class="mech">
    <div class="ftitle">Ánh xạ bước QT tổng ↔ QT con</div>
    <table class="map">
      <tr><th>Bước trên QT tổng</th><th>QT con tương ứng</th></tr>
      <tr><td>Tên bước</td><td><b>QT: Tên QT con</b></td></tr>
    </table>
  </div>
</footer>
```

## Mẹo canh chỉnh

- `min-height` của `.step` quyết định độ cao hàng — giảm khi cần nhồi nhiều lane
  vào một trang.
- Luôn chạy QC (build-pipeline) sau khi dựng: nếu `narrow` có phần tử → block bị
  bóp, cần giảm số bước trên một hàng hoặc chuyển sang layout dọc (mục 5). Nếu
  `overflow > 0` → tràn trang, giảm `min-height`/padding/margin từng chút.
