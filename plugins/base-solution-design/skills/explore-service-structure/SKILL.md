---
name: "explore-service-structure"
description: "Khảo sát một app Base.vn (HRIS, Timesheets, Payrolls, CRM…) qua Chrome/API, dựng cây Service 6 tầng (App → Service Group → Service Line → Service Model → Service → Record), danh mục Input→Output, cấu hình nền, bản đồ dữ liệu, case study, và xuất tài liệu HTML."
---

# Explore Service Structure

Dùng khi cần học và trình bày một app của Base.vn theo kiến trúc Service, để triển khai cho khách theo tinh thần "service hoá vận hành". Kết quả chuẩn là một tài liệu HTML đọc được cho cả khách hàng lẫn đội triển khai, đi từ nghiệp vụ → service hoá → cây Service 6 tầng → danh mục Input→Output → chi tiết cấu hình → case study.

Bản mẫu đầy đủ (app HRIS): folder `AI Summit 2026/HRIS-Service-Architecture/` trên máy người dùng (HTML, `img/`, `source/` chứa bộ dựng, `github-pages/`). Nếu có, đọc `source/README.md` và tái sử dụng `build.py`, `style.css`, `app.js`, `anatomy.py`, `tiers.py`, `flowmap.py`, `casestudy.py`; chỉ viết lại các file dữ liệu (`content.py`, `meta.py`, `TREE`/`IO2`/`IO4` trong `tiers.py`). Không có thì dựng lại theo đặc tả ở mục "Dựng HTML".

## 0. Trước khi bắt đầu (hỏi bằng AskUserQuestion nếu chưa rõ)

- App nào, tên miền nào (ví dụ `hris.base.com.vn`), tenant nào.
- Có được tạo dữ liệu mẫu trên hệ thống thử không. Mọi thứ tạo ra phải gắn nhãn `[DEMO]` trong tên và mô tả.
- Case study: dùng đề bài người dùng đưa, hay tự đề xuất một case gần nghiệp vụ.
- Folder lưu kết quả trên máy người dùng.

## 1. Khung khái niệm: cây Service 6 tầng

| Tầng | Tên gọi | Câu hỏi trả lời | Trường dữ liệu | Ai quyết định | Ví dụ HRIS |
|---|---|---|---|---|---|
| T0 | **App** | Thuộc app nào? | app key | Hệ thống | HRIS |
| T1 | **Service Group** | Loại vận hành gì? (Event: việc xảy ra, tạo bản ghi có trạng thái · Policy: quy định kéo dài, ghi danh) | nhóm model | Hệ thống | Event · Policy |
| T2 | **Service Line** (dòng nghiệp vụ) | Thuộc line nghiệp vụ nào? Có **Input / Output rõ ràng** | `metatype` | Hệ thống (khách chỉ bật/chọn) | Contracts, Documents, Taxes, Benefits |
| T3 | **Service Model** | Hình thức nào? (không phải Service Line nào cũng có; có model mặc định) | `model` | Hệ thống (khách chọn) | Benefits → `hris.benefit.payroll` / `hris.benefit.inkind`; Documents → announcement / submission |
| T4 | **Service** | Service cụ thể nào? Có **Input / Output rõ ràng** | bản ghi service/policy | **Khách tạo và cấu hình sâu** | "HĐLĐ 12 tháng – Amber", "Phụ cấp tiếng Anh – Rework" |
| T5 | **Record** (Event) / **Enrollment** (Policy) | Một lần chạy / một lần ghi danh | bản ghi | Người vận hành | HĐ ABTV-2026-0001 |

Quy tắc:
- T0–T3 do hệ thống quyết định, khách chỉ chọn; từ T4 trở đi mới được tạo và cấu hình sâu.
- **Service Group riêng từng app**, không dùng chung giữa các app (Event của HRIS khác Event của CRM).
- T3 khác T4: T3 là *hình thức* do sản phẩm định nghĩa (đổi model = đổi cách tính/ luồng); T4 là *cấu hình của khách* trong một hình thức. Service Line không có T3 thì T4 treo thẳng dưới T2 (ghi "model mặc định").
- Kiểm chứng ánh xạ bằng dữ liệu: `metatype` ↔ T2, `model` ↔ T3. Kiểm tra Service có gắn workspace hay dùng chung toàn tenant.
- **Những gì không vận hành, chỉ là dữ liệu → Cấu hình nền (workspace)**, để ngoài cây Service: danh mục, workspace & trường, offices, phân quyền, tích hợp, AI. Không có Record riêng nhưng mọi Service dựa vào.
- **3 lớp chung / riêng**: A chung mọi Service (định danh, owners, quyền, tích hợp) · B chung trong Group (Event: defaults, duyệt/ký, mã số, mẫu văn bản, trường, trạng thái; Policy: tham số tính, ghi danh, độ phủ, chi phí) · C riêng của Service Line (2–4 tham số đặc trưng).
- **4 câu hỏi đi từ T1 → T4** (dùng khi thiết kế cho khách): vận hành kiểu gì (T1) → Service Line nào (T2) → hình thức nào (T3) → khác gì để tách Service riêng (T4). Dấu hiệu tách T4: khác pháp nhân, mẫu văn bản, mặc định, người duyệt, tham số đãi ngộ. Khác dữ liệu hồ sơ → trường workspace; khác người được xem → role / scope (đều là cấu hình nền, không tách Service).

## 2. Quy trình

### Bước 1 — Khám phá app (Chrome + API)
1. Mở app, lấy menu chính: `a.master-menu-item[href]`. Vào Settings, click lần lượt `button.page-layout-nav-item` và ghi lại URL từng mục.
2. Tải bundle JS (`/assets/index-*.js`) và lọc `/api/<model>/<action>` để biết model và thao tác thật.
3. Gọi API bằng helper: lấy `csrfToken` từ `/auth/me`, POST JSON với header `X-CSRF-Token`. Hàm hay dùng: `workspace/list`, `<service line>/services/list`, `policy/list`, `field/list-all`, `hris-role/list`, `service-registry/models`. Tạo demo: `workspace/create|update`, `hris-role/create`, `office/create`, `employee/create`, `contract/services/create`, `policy/create`.
4. Với mỗi Service: mở dialog cấu hình (`.svc-settings-dialog`, tab `.svc-settings-sidebar__item`), đọc từng tab, chụp ảnh. Dialog không có URL riêng → ghi "Làm theo: <trang> → Edit dòng … → tab …". Tab workspace có URL: `/settings/workspace/<id>[/fields|/salary|/permissions]`.
5. Kiểm chứng những gì phải suy luận. Không chắc thì ghi vào "Điểm cần xác minh", không khẳng định.

### Bước 2 — Dựng cây 6 tầng
Lập `TREE`: Group → [(Service Line, chặng, metatype, [(model, model_id, mặc định?, [Service mẫu], Record)])].

Cây trong tài liệu là **sơ đồ cấu trúc**, không phải danh sách ví dụ (ví dụ cụ thể đã nằm ở danh mục Input→Output):
- SVG vẽ trên → dưới, hàm `tree_svg()` trong `tiers.py`. Mỗi tầng là một dải ngang, nhãn T0…T5 ở cột trái. Màu dải: T0–T3 xám (hệ thống quyết định, khách chỉ chọn), T4 xanh lá (khách tạo, cấu hình), T5 tím (người vận hành tạo).
- T0 là một nút gốc. T1 là các khối Group, rộng bằng số Service Line bên dưới. T2 là mỗi Service Line một cột (icon, tên, `metatype`), bấm được để nhảy tới mục chi tiết.
- T3 là các pill model xếp dọc trong cột. Line chỉ có 1 hình thức dùng pill nét đứt "mặc định"; tên model dài thì rút gọn, tên đầy đủ để ở `<title>`.
- T4 là thẻ chồng "Service 1…n" (khuôn, kèm số Service mẫu), không liệt kê tên. T5 là "Record" (Event) hoặc "Enrollment" (Policy).
- Phần chưa kiểm chứng vẽ nét đứt. Dưới sơ đồ có chú giải màu và một dòng "Ngoài cây: cấu hình nền".
- Bọc trong `.zbtn.svgz` để mở lightbox. Trên điện thoại cho cuộn ngang trong khung (`min-width` ~900px).

Chụp ảnh minh hoạ từng tầng: danh sách Service, dialog cấu hình T4, form tạo Record T5, Record đã tạo.

### Bước 3 — Danh mục Input → Output (bắt buộc cho T2 và T4)
- `IO2` cho mỗi Service Line T2: **Input** (dữ liệu/sự kiện đầu vào, lấy từ đâu) → **Output** (bản ghi, trạng thái, văn bản, dữ liệu đẩy sang app khác).
- `IO4` cho Service T4 mẫu: Input cụ thể (tham số khách cấu hình) → Output cụ thể (ví dụ mã HĐ, mẫu văn bản, số tiền).
- Bảng danh mục chính = nhóm theo Group, mỗi dòng: Service Line · model (T3) · Input · Output · số Service đang có · nơi cấu hình. Bảng kiểm kê cũ để trong khối thu gọn.

### Bước 4 — Phân tích từng Service Line
Mỗi Service Line là một khối có cấu trúc cố định. Không đổ chữ liệt kê dài ngay dưới heading. Bố cục từ trên xuống:
1. **Đầu khối**: icon, tên, `*` nếu bắt buộc, tên hệ thống, nút "Mở cấu hình ↗" bên phải.
2. **Một câu "Dùng khi"**.
3. **Thẻ thông số** 4 ô: T1 Service Group · T3 Service Model (code + tag "mặc định") · Chặng vòng đời (mỗi chặng là một tag link) · Triển khai (tag Bắt buộc trước go-live / Tuỳ chọn).
4. **Input → Output (T2)**: hai hộp cạnh nhau, có mũi tên ở giữa.
5. **Thanh tab** (chỉ hiện một phần tại một thời điểm):
   - *Tổng quan*: Mục tiêu và Kết quả tạo ra ở cột trái; Cách vận hành dạng stepper đánh số ở cột phải; "Service đang có" thu gọn.
   - *Cấu hình · n tab*: danh sách tab dọc bên trái. Khung phải gồm tính năng, **ví dụ cụ thể có số**, "Làm theo" có đường dẫn, và ảnh chụp.
   - *Chung – Riêng*: lớp A/B kế thừa và lớp C riêng.
   - *Vận hành & liên kết*: nút mở màn vận hành, thao tác trên Record (API), liên kết sang Service / app khác, ảnh màn vận hành.

### Bước 5 — Cấu hình nền (ngoài cây Service)
Chia nhóm theo thứ tự nên dựng (ví dụ: Khung tổ chức · Vùng dữ liệu & trường · Phân quyền & kiểm soát · Hồ sơ & trải nghiệm · Tích hợp & AI).

Mỗi nhóm hiển thị dạng **danh sách hàng mở rộng** với cột: Mục · Mục tiêu (1 câu) · Mức độ (Bắt buộc `*` / Bắt buộc khi dùng app X `*` / Tuỳ chọn) · Mở trên app ↗. Mọi hàng thu gọn để người đọc thấy toàn cảnh.
- Bấm một hàng để mở ra ba cột: **Impact** (ảnh hưởng tới đâu) · **How** (stepper các bước setup) · ảnh chụp.
- Chân hàng: "Cấu hình tại" dạng tag breadcrumb, link phụ, và khối thu gọn "Chi tiết tính năng + Vì sao không phải Service".
- Link `#id` từ menu phải tự mở hàng tương ứng.

Dấu `*` hiện ở nội dung, menu trái và bảng tra cứu.

### Bước 6 — Tổng quan: vòng đời, kiến trúc, bản đồ dữ liệu
**Vòng đời là góc nhìn đầu tiên của tài liệu — phải chỉn chu và gây ấn tượng.** Vẽ thành **timeline ngang, thẻ so le trên – dưới** (không dùng bảng, không xếp thẻ toàn bộ phía dưới):
- Grid 16 nửa-cột, 5 hàng: thẻ trên · que nối · trục · que nối · thẻ dưới. Mốc n chiếm nửa-cột `2n…2n+1`; thẻ rộng 4 nửa-cột canh giữa mốc (`grid-column: 2n-1 / 2n+3`). Chặng lẻ ở trên, chẵn ở dưới, nên thẻ cùng phía nằm sát nhau mà không chồng.
- **Ngay ngắn**: mọi thẻ cùng hàng cao bằng nhau (`align-self: stretch`), khối chip đẩy xuống đáy (`margin-top: auto`) để các mép thẳng hàng.
- Trục: thanh gradient dày 6px, màu theo app phụ trách; hai đầu có nhãn (HRIS: “Ứng viên” → “Cựu nhân viên”). Mốc là vòng tròn 44px có số, viền halo; app khác phụ trách thì mốc nét đứt. Que nối mảnh từ thẻ tới mốc.
- Thẻ: số lớn `01`… + tên chặng + pill app; hai cột 👔 HR làm / 🙋 Nhân viên (hoặc người dùng cuối); mini-chip Service (Event xanh / Policy cam) + cấu hình nền (xám, class `.nsc`), bấm tới mục chi tiết; lưu ý đưa vào icon ⓘ (tooltip) để thẻ gọn. Thẻ của app khác: viền nét đứt, nền trong, chữ mờ.
- Nền khối: panel bo góc, radial gradient nhẹ màu brand. Hiệu ứng: trục vẽ từ trái sang, mốc pop lần lượt, thẻ fade-up so le, hover nâng thẻ; tắt khi `prefers-reduced-motion`.
- Điện thoại (≤760px): chuyển thành timeline dọc (trục bên trái, thẻ xếp theo thứ tự bằng `order: var(--n)`), hiện lại dòng lưu ý.
- Đặt tên class tránh trùng (từng lỗi `.top` trùng thanh đầu trang → dùng `.up/.dn`). Khối cao ~900px ở 1440px. Bên dưới giữ ma trận Service × chặng.

Các phần khác:
- Sơ đồ kiến trúc: thực thể lõi giữa, Event trái, Policy phải, app liên quan trên, cấu hình nền dưới. "Vì sao thiết kế như vậy": 4–6 lý do.
- **Bản đồ dữ liệu** (mục cuối của Tổng quan): kiểu CRM Map, chuỗi chính trái → phải (output khâu trước là input khâu sau — khớp với danh mục Input→Output), app nguồn phía trên, sự kiện ghi ngược phía dưới, webhook. Mũi tên đánh số, danh sách giải thích bên dưới.

### Bước 7 — Case study (3 phần, không thêm)
- **A · Phân tích**: khung "5 thành phần hệ thống × Chung / Riêng". Cột là các đơn vị của khách (+ "Toàn tập đoàn"). Hàng dùng đúng tên hệ thống: Workspace · Offices / Employee fields · types · grades / Permissions (Owner · Role · Scope) / Event Service / Policy Service. Tô ô Chung / Riêng, rút ra 3–4 vấn đề (P1…P4).
- **B · Lời giải**: (1) Nguyên tắc: dựng chung trước, chỉ tách T4 khi gặp dấu hiệu. (2) **Cây Service** của khách theo 6 tầng: nhánh dùng chung và nhánh từng đơn vị ("kế thừa, thêm: …"). (3) **Bảng chỉ gồm những gì làm thêm / khác so với chuẩn**, mỗi dòng ghi vấn đề nó giải; một dòng "giữ nguyên chuẩn". (4) Quyết định thiết kế, phương án thay thế.
- **C · Output**: bảng "Ai thấy gì"; thẻ kết quả theo vấn đề (1 câu + 1–3 ảnh cạnh nhau + đường dẫn mở thẳng).
- Nếu được phép, dựng thật trên hệ thống thử (kể cả tạo 1 Record T5 mẫu) để chụp ảnh. Chỉ gán vai trò cho tài khoản demo.

### Bước 8 — Playbook, tra cứu, điểm cần xác minh
Playbook theo chặng vòng đời (câu hỏi khảo sát → cấu hình → loại). Playbook và Case study nằm chung một mục "Triển khai & Case study" (11.1 Playbook, 11.2 Case study). Bảng tra cứu đường dẫn có ô đổi tên miền. Mục cuối liệt kê trung thực những gì chưa kiểm chứng hoặc chưa chụp được.

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

## 5. Giọng văn và độ chính xác

- Tiếng Việt trực diện, dễ hiểu, chuyên nghiệp; giữ nguyên tên khái niệm hệ thống bằng tiếng Anh (Workspace, Event Service, Service Model…).
- Mỗi cấu hình có ví dụ cụ thể có số. Không bịa số liệu; số lấy từ hệ thống hoặc ghi rõ là giả định.
- Phân biệt rõ: đã kiểm chứng / suy luận / chưa kiểm chứng.
- Trước khi gửi: render bằng Playwright (`executablePath: '/opt/pw-browsers/chromium'`) ở 1440px, 1280px và 390px, sáng và tối; kiểm tra không lỗi JS, không tràn ngang, không còn ô "Chưa có ảnh" ngoài dự kiến. Chụp lại sau khi `scrollIntoView` và chờ animation xong rồi tự xem ảnh — đặc biệt mục Vòng đời — trước khi giao.