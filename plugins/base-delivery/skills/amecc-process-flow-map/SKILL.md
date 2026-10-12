---
name: "amecc-process-flow-map"
description: Cập nhật link AMECC - BASE | THE INTELLIGENT MANAGEMENT PLATFORM (dashboard, lưu đồ quy trình, trạng thái vận hành, báo cáo quản trị, hướng dẫn) mà không làm mất trạng thái đã lưu.
---

# AMECC - BASE | THE INTELLIGENT MANAGEMENT PLATFORM

Skill này dùng để sửa/bổ sung **một artifact duy nhất** phục vụ dự án triển khai Base cho khách hàng AMECC:

- Link gốc: `https://claude.ai/artifact/28XTQzsF6nPrH9vGg5nGKW`
- Link đẹp (redirect Cloudflare 302 do người dùng tự cấu hình): `amecc.report/platform` → link gốc. Không đổi URL artifact, nếu đổi thì redirect hỏng.
- 5 trang (tab): Trang 0 Dashboard tiến trình · Trang 1 Lưu đồ quy trình · Trang 2 Trạng thái vận hành · Trang 3 Báo cáo quản trị · Trang 4 Hướng dẫn sử dụng.
- Trang 2 do người dùng (PM phía Base) cập nhật hằng ngày; Trang 3 do team Data cập nhật. Trạng thái được lưu **bên trong chính file HTML** (trang tự publish lại).

## 0. Luật sống còn (đọc trước mọi việc)

1. **Không bao giờ dựng lại từ đầu.** Artifact live chính là mã nguồn. Mọi sửa đổi làm trên bản live mới nhất.
2. **Quy trình sửa:**
   1. Nhắc người dùng (và team Data nếu cần) bấm "Lưu cập nhật" cho mọi thay đổi đang dở trước khi bạn publish, vì publish sẽ ghi đè thay đổi chưa lưu trên trình duyệt của họ.
   2. `Artifact` action `read`, `url` = link gốc, `path: "index.html"` để lấy file vào máy; ghi nhận version id.
   3. Sửa bằng script Python thay chuỗi có `assert old in s` (mỗi chỗ thay phải khớp đúng 1 lần). Không gõ lại toàn file.
   4. Ngay trước khi publish: `read` lại (không `path`) để so version. Nếu version đã đổi (có người vừa lưu), lấy lại khối `<script id="state">` từ bản mới, ghép vào file của bạn rồi mới publish.
   5. Publish với **cùng `url`**, không truyền `capabilities` và `icon` (giữ nguyên `{artifact:{}, user:{}}`).
3. **Chỉ vẽ liên kết người dùng đã xác nhận.** Liên kết giả định: nét đứt cam + ghi vào ghi chú nội bộ.
4. Không mở link `service.base.vn` (cần đăng nhập); dựng theo mô tả của người dùng và nói rõ.
5. Sửa chính tả tiếng Việt rõ ràng trong tên quy trình và báo lại.

## 1. Cấu trúc file

Nền tảng tự bọc nội dung trong skeleton `<!doctype html><html><head><meta charset=utf8>…<style>:root{color-scheme:light}body{…}</style></head><body>\n … \n</body></html>`. Hàm `build()` trong trang tái tạo skeleton này (hằng `SKEL`) khi tự publish, nên không sửa phần đó.

Thứ tự khối trong body:
- `<title>`, link Google Fonts **Lexend**
- `<style id="css">` toàn bộ CSS
- `<template id="tpl">`: `canvas#sky`, header (h1 "AMECC - BASE | THE INTELLIGENT MANAGEMENT PLATFORM" viết hoa, logo AMECC + Base base64 ở góc phải trên), `nav.tabs`, các `section` `#p0` `#p1` `#p2` `#p3` `#p4`
- `<script id="state" type="application/json">` dữ liệu trạng thái
- `<script id="boot">`: clone template; tab `TABS=['dash','flow','status','reports','guide']`, mặc định `dash`, nhớ qua `location.hash` và `sessionStorage['amecc-tab']` (bọc try/catch); bộ lọc vai trò và cuộn `data-go` của Trang 4
- `<script id="flowjs">`: vẽ mũi tên lưu đồ (`window.__drawFlow`) + nền sao/mưa sao băng
- `<script id="main">`: `render()` (Trang 2) → `render3()` (Trang 3) → `render0()` (Trang 0), `openPop`, `save`, `build`

Schema state:
```json
{"golive":"2026-10-15",
 "days":["2026-10-08","2026-10-09","2026-10-10","2026-10-12","2026-10-13","2026-10-14","2026-10-15"],
 "st":{"KD-01":{"2026-10-08":1}},  "notes":{"KD-01":"…"},
 "rs":{"BC-01":{"2026-10-09":3}}, "rn":{"BC-01":"…"},
 "updated":"ISO time"}
```
- `days` bỏ Chủ nhật (11.10 đã bị loại theo yêu cầu). Thêm ngày mới = thêm vào `days`.
- Ô không có giá trị hiển thị trạng thái **giữ nguyên từ ngày gần nhất** (viền mờ, carry-forward).
- Lưu: `claude.use('artifact').publish(html)`; quyền sửa: `claude.use('user').canEdit()`. Ai không có quyền thấy "Chế độ chỉ xem".

## 2. Các trang

**Trang 0 · Dashboard tiến trình** (`render0`, tự tính từ state): vòng tròn/thanh tiến độ quy trình và báo cáo theo ban, xu hướng theo ngày, chuỗi 10 quy trình trọng yếu với 3 điểm bàn giao, mức cập nhật hôm nay. **Mỗi biểu đồ có 1 khối Nhận định + 1 khối Hành động** sinh tự động bằng hàm `ins(a,b)`; khi thêm biểu đồ phải thêm cả hai. Không có dòng mô tả dưới tiêu đề dashboard.

**Trang 1 · Lưu đồ quy trình**: 5 cột ngang (KD → QLDA → TK → MH, HCNS độc lập viền đứt hồng), vừa màn hình laptop ở zoom 100% (`.board` min-width ≈1.000px). Mũi tên động, chấm sáng chạy ở điểm bàn giao liên ban, nền xanh `#060b3a` có sao + mưa sao băng, tôn trọng `prefers-reduced-motion`. Mỗi thẻ có nhãn app (Base Service / Base Wework) và đánh dấu ★ cho 10 quy trình trọng yếu.
Hàm vẽ trong `draw()`:
- `handoff('nguon','dich', so, 'Tên dữ liệu', 'ghi chú')` bàn giao liên ban
- `down('tren','duoi', giaDinh, 'nhãn')` hai thẻ kề dọc; `true` = nét đứt cam
- `bypass('tren','duoi')` đi vòng bên trái

**Trang 2 · Trạng thái vận hành** (`render`): bảng quy trình × ngày, ô bấm để chọn trạng thái, ghi chú, banner Go-live 15.10 nổi bật, bộ đếm "Chưa cập nhật hôm nay" (đếm trong các quy trình đã từng có trạng thái), thanh lưu `data-save` (không dùng id trùng).

**Trang 3 · Báo cáo quản trị** (`render3`): chỉ 17 báo cáo của các ban (không đưa hạng mục kho dữ liệu/vận hành), cùng format Trang 2, có link "Mở ↗" và "Hướng dẫn ↗".

**Trang 4 · Hướng dẫn sử dụng** (tiếng Việt): Phần I luồng dữ liệu hợp đồng với 5 đầu ra chính (swimlane SVG); Phần II hướng dẫn người dùng cuối theo vai trò KD/QLDA/TK/MH (không có HCNS), 11 bước B1–B11, bảng hỗ trợ, bộ lọc vai trò. Ô ảnh minh họa đang là chỗ trống chờ ảnh chụp Base từ người dùng.

**Checklist khi thêm/sửa một quy trình** (đủ 4 chỗ, nếu thiếu dashboard sẽ lệch):
1. Thẻ trên Trang 1 (+ `id` nếu có mũi tên, cập nhật `.count` của làn)
2. Mảng `D` trong `main` (`[mã, tên, 's'|'w']`, `s`=Base Service, `w`=Base Wework)
3. `KEY` nếu là quy trình trọng yếu (hiện 10 mã)
4. Lệnh vẽ trong `draw()` và ghi chú nội bộ nếu có giả định

Thêm báo cáo: thêm phần tử vào `RD` dạng `["BC-xx","bc","Báo cáo","Tên","link","link hướng dẫn","ghi chú"]`.

## 3. Danh mục (trạng thái đã chốt đến 09.10.2026)

Link quy trình: `https://service.base.vn/services/<ID>?view=kanban`.

| Ban (class, màu) | Quy trình |
|---|---|
| Kinh doanh (`kd`, #2f6bff) | KD-01 Sales Management (43060) · KD-02 Quotation Process (7528) · KD-03 Contract Review and Signing (7374) |
| Ban QLDA (`ql`, #12a37f) | QL-01 QT quản lý dự án (7959, QT chính) · QL-02 phê duyệt dự toán (7962) · QL-03 phê duyệt tiến độ dự án (9958) · QL-04 phê duyệt Work Order (9979) · QL-05 lập & phê duyệt kế hoạch hàng tháng (45232) · QL-06 báo cáo sản lượng / nhân lực (**Base Wework**, chưa có link) · QL-07 ghi nhận tiền về (chưa có link) |
| Ban Thiết kế (`tk`, #8b45f5) | TK-01 nhận việc từ Ban QLDA (15180, QT chính) · TK-02 quản lý Item (7918) · TK-03 lập & duyệt MPR (8438) · TK-04 ban hành MPR (45200) |
| Ban Mua hàng (`mh`, #d9760b) | MH-01 nhận & phân công MPR (52906, QT chính) · MH-02 logistics (42428) · MH-03 xuất hàng (42450) · MH-04 duyệt NCC (8175) · MH-05 chuyển đổi vật tư (7912) |
| Ban HCNS (`hr`, viền đứt #ff7eb6, độc lập, không mũi tên, chưa có link) | HC-01 cấp tài khoản & mã nhân sự · HC-02 bổ nhiệm, miễn nhiệm, thăng chức, điều chuyển · HC-03 đề xuất tuyển dụng · HC-04 duyệt kế hoạch đào tạo · HC-05 báo cáo kết quả đào tạo · HC-06 đặt xe / phòng họp |

Liên kết đã chốt: KD-01→KD-02 "Cần báo giá"; KD-01→KD-03 đi vòng; KD-02→KD-03 **giả định**; ① KD-03→QL-01 Dữ liệu hợp đồng; ② QL-04→TK-01 Work Order đã duyệt; ③ TK-04→MH-01 MPR đã ban hành.

10 quy trình trọng yếu cho báo cáo quản trị (`KEY`): KD-03, QL-04, QL-05, QL-06, TK-02, TK-03, TK-04, MH-01, MH-02, MH-03. Trên dashboard, 3 điểm bàn giao (`HOF`) KD-03, QL-04, TK-04 được coi là "đứt" khi quy trình nguồn chưa ở trạng thái Đang vận hành.

Trạng thái Trang 2 (`LV`): 0 Chưa vận hành `#8a93c7` · 1 Đang vận hành `#3ddc97` · 2 Đang UAT `#ffb020`.
Trạng thái Trang 3 (`RLV`): 0 Đã hoàn thiện `#6a7dff` · 1 Đã thống nhất với khách hàng `#ff7ab8` · 2 Đang UAT `#ffb020` · 3 Đã bàn giao `#3ddc97`.

17 báo cáo (BC-01…BC-17) lấy từ file "AMECC - BASE | Data Optimize Vận Hành 2026", sheet Output data, chỉ các dòng loại Báo cáo. Khi người dùng gửi bản mới của file này, đối chiếu lại `RD`.

## 4. Quy ước giao diện

- Nền tối xanh đậm, font Lexend, chữ nhỏ nhất ~10px; vừa laptop ở zoom 100%.
- Tiêu đề viết hoa đúng: `AMECC - BASE | THE INTELLIGENT MANAGEMENT PLATFORM`. Không thêm dòng mô tả dưới tiêu đề.
- Khi đổi bảng màu, chạy kiểm tra độ tương phản/phân biệt màu (dataviz) và không dùng màu làm kênh duy nhất (luôn có chữ nhãn).
- Không dùng localStorage cho dữ liệu; chỉ sessionStorage cho tab đang mở.
- Văn phong tiếng Việt, ngắn, không thuật ngữ kỹ thuật với người dùng cuối.

## 5. Lưu, quyền sửa, team Data

- Lỗi lưu phải hiện mã lỗi trên thanh lưu, không được âm thầm chuyển sang chế độ chỉ xem. Thẻ chế độ ghi "Chế độ chỉnh sửa" / "Chế độ chỉ xem".
- Khi người dùng báo "không lưu được": xin ảnh chụp thẻ chế độ + thông báo lỗi; kiểm tra version live xem lần lưu cuối lúc nào; mô phỏng bằng Playwright (mục 7). Nguyên nhân phổ biến: người xem không có quyền sửa artifact.
- Gói Pro/Max không chia quyền sửa cho người khác; người khác chỉ xem được. Team Data cập nhật qua chủ artifact hoặc qua file xlsx mẫu `AMECC_Trang3_Trang_thai_bao_cao.xlsx` (sheet Trạng thái báo cáo / Tổng hợp / Hướng dẫn / Danh mục) rồi gửi lại để nhập vào state.
- Không có kết nối Google Sheets thì không đồng bộ tự động từ Google Sheet; nói rõ điều này.

## 6. Trang 4 và ảnh minh họa

- Trang 4 được sinh từ script Python (swimlane SVG với `node()`, `arrow()`, `badge()`; danh sách 5 đầu ra `OUT`; `ROLES`, `STEPS` B1–B11; bảng `SUPPORT`). Nếu không còn script, sửa thẳng `#p4` trong template.
- Khi người dùng gửi ảnh chụp Base: nén (WebP/JPEG, rộng ≤1200px), nhúng base64 vào đúng bước, thêm alt mô tả; giữ tổng file dưới vài MB.
- Chỉ viết hướng dẫn dựa trên ảnh/tài liệu người dùng gửi (Work Order, MPR, ảnh màn hình); trường dữ liệu chưa thấy thì ghi "cần xác nhận".

## 7. Kiểm tra trước khi publish

- `node --check` cho từng khối script (tách ra file tạm).
- Playwright (Chromium có sẵn) mở file với stub:
  `window.claude={use:n=>Promise.resolve(n==='artifact'?{publish:h=>{window.__pub=h;return Promise.resolve()}}:n==='user'?{canEdit:()=>true}:null)}`
  Kiểm tra: 5 tab chuyển được, không lỗi console, mũi tên Trang 1 vẽ đủ, bấm ô Trang 2/3 → chọn trạng thái → Lưu → `__pub` chứa state mới, chụp ảnh ở 1440×900.
- Mọi `id` dùng trong `draw()` tồn tại; `.count` khớp số thẻ; số liệu dashboard khớp bảng Trang 2/3.
- Nếu không mở được trình duyệt, nói rõ là chưa kiểm tra hiển thị.

## 8. Điểm còn mở (tại 09.10.2026)

- KD-02 → KD-03 vẫn là giả định; TK-03 → TK-04 chưa vẽ.
- Chưa có link Base cho QL-06, QL-07, toàn bộ HCNS và 2 báo cáo.
- Trang 4 chờ ảnh chụp màn hình cho B1–B11.
- Cần chốt mục tiêu Go-live (bao nhiêu quy trình/báo cáo) và có giữ khối ghi chú nội bộ trên Trang 1 khi gửi khách hàng hay không.
- Chưa rõ nguyên nhân lần người dùng báo không lưu được trạng thái (đã tự xử lý).

Khi một điểm được xác nhận: cập nhật trang và xóa dòng tương ứng ở đây (đề xuất cập nhật skill).

## 9. Báo cáo lại cho người dùng

- 2–4 câu: đổi gì, trang nào, trạng thái đã lưu có được giữ nguyên không (nêu version trước/sau).
- Liệt kê điểm còn hở/giả định mới phát sinh.
- Nhắc nếu link đang chia sẻ với khách hàng mà vẫn còn ghi chú nội bộ.
- Không dán lại URL (thẻ artifact đã có link); nhắc link đẹp `amecc.report/platform` vẫn trỏ đúng.
