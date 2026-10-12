---
name: so-hoa-thuy-dien
description: >
  Playbook số hóa vận hành & báo cáo hợp nhất cho doanh nghiệp thủy điện (holding +
  nhiều SPV), đúc kết từ case Moonlight — cụm thủy điện Nậm Na. Gồm: khung "báo cáo về
  công ty mẹ" 4 nhóm BSC, nguyên tắc KHÔNG động SCADA, phân lớp Base + Data Service, mô
  hình tài chính thủy điện (doanh thu PPA, khấu hao/lãi vay lớn, EBITDA vs LNTT, dòng
  tiền, công nợ EVN), và 5 mẫu deliverable (bản đồ luồng vận hành, dashboard công ty mẹ,
  đánh giá nhân sự BSC, báo cáo tài chính HTML kiểu ECV, deck demo PPTX). Kích hoạt khi
  user muốn số hóa/dựng dashboard/báo cáo cho công ty thủy điện hoặc holding năng lượng,
  tư vấn Base.vn ngành điện, dựng báo cáo hợp nhất công ty mẹ, hoặc lặp lại case tương tự
  Nậm Na — kể cả khi chỉ nói ngắn như "số hóa thủy điện", "dashboard nhà máy điện", "báo
  cáo tài chính thủy điện", "làm giống Moonlight/Nậm Na". Ngành khác chỉ mượn phương pháp
  chung, bỏ số liệu Nậm Na.
---

# Số hóa thủy điện — Playbook (holding + SPV)

Skill này gói toàn bộ know-how của một dự án số hóa thủy điện thực tế (Moonlight — cụm
thủy điện Nậm Na) để tái sử dụng cho các case tương tự: từ hiểu bối cảnh khách → kiến
trúc báo cáo → dựng deliverable → kiểm thử → bàn giao.

Triết lý: **cho khách thấy "demo chạy được" sớm, số hóa phần "vết" thủ công quanh SCADA,
và giải đúng bài toán số 1 của holding là báo cáo hợp nhất về công ty mẹ.**

## Khi nào dùng / không dùng

- **Dùng**: khách là công ty thủy điện hoặc holding năng lượng (1 công ty mẹ + nhiều
  SPV nhà máy); cần dashboard/báo cáo vận hành, tài chính, nhân sự, pháp lý; cần báo cáo
  hợp nhất lên công ty mẹ; pre-sales/tư vấn Base.vn cho ngành điện.
- **Mượn một phần**: holding ngành khác (BĐS, sản xuất) — lấy khung "báo cáo công ty mẹ",
  phân lớp Base+Data Service, quy trình kiểm thử; bỏ số liệu & mô hình tài chính thủy điện.
- **Không dùng**: yêu cầu không liên quan số hóa/báo cáo doanh nghiệp.

## Bước 0 — Hiểu bối cảnh khách (hỏi trước khi dựng)

1. Cấu trúc: 1 holding + mấy SPV? Mỗi SPV bao nhiêu nhà máy / tổ máy / MW? Sông/bậc thang
   có ghép thủy lực không (nhà máy trên xả → nhà máy dưới)?
2. Bài toán đau nhất? (thường là **báo cáo hợp nhất về công ty mẹ** — gom Excel thủ công
   từ nhiều pháp nhân, lãnh đạo kiêm nhiệm thiếu màn nhìn real-time).
3. Đang dùng gì: SCADA (hãng nào), Base.vn (Wework/Service/HRM), Excel, ERP?
4. Nguồn số thật lấy được tới đâu (chỉ đọc SCADA? công tơ đo đếm? bảng chấm công?).
5. Phạm vi demo lần này: 1–2 sản phẩm minh họa hay full bộ?

Nếu chưa có số thật → dùng **"số minh họa"** và ghi rõ nguồn giả định, đừng bịa như số thật.

## Mô hình miền — thủy điện & holding (dùng chung mọi case)

- **Mô hình tổ chức**: "1 holding + N SPV". Holding là công ty mẹ đầu tư; mỗi nhà máy/mảng
  là một pháp nhân riêng (SPV). Lãnh đạo thường kiêm nhiệm → càng cần dashboard hợp nhất.
- **SCADA = lớp OT lõi. KHÔNG động vào.** Chỉ đọc dữ liệu qua pipeline; số hóa phần "vết"
  thủ công *trước/sau* SCADA (phân ca, phiếu, đối soát...). Đây là ranh giới an toàn phải
  nói rõ với khách và thể hiện trong mọi bản trình bày.
- **Sản lượng thanh toán** lấy từ **công tơ đo đếm** (SCADA chỉ để đối chiếu). Đối soát
  PPA: đo đếm (chính thức) ↔ SCADA ↔ EVN/NSMO, ngưỡng khớp ≤ ~0,5%.
- **Luồng thị trường điện**: GỬI chào giá (D-1, trước ~11h30) → NSMO lập lịch → NHẬN lịch
  (~16h D-1) → vận hành ngày D → lệnh điều độ realtime.
- **Mùa vụ**: mùa nước về cao (thường Q3) → sản lượng & dòng tiền tăng mạnh; mùa khô ngược lại.

### 4 nhóm báo cáo lên công ty mẹ (BSC-aligned) — xương sống mọi dashboard hợp nhất

| Nhóm | Nội dung lõi |
|---|---|
| ① Tài chính & sản lượng | Sản lượng KH/TT, doanh thu PPA, chi phí, BCTC hợp nhất |
| ② Vận hành & kỹ thuật | Hệ số khả dụng, hồ chứa, sự cố/downtime, kiểm định |
| ③ Nhân sự & lao động | Ca 24/7, OT, phụ cấp vùng, BHXH, đào tạo, đánh giá BSC |
| ④ Pháp lý & tuân thủ | Môi trường, an toàn đập (NĐ 114), giấy phép, quan hệ EVN/NSMO |

## Phân lớp công cụ

- **BASE** (quy trình & con người): Wework · Service · HRM — phân ca, chấm công, lương,
  luồng phê duyệt, theo dõi hạn.
- **DATA SERVICE** (lớp dữ liệu): Pipeline · BI · AppSheet — chuẩn hóa, hợp nhất, dashboard
  real-time về công ty mẹ.

## Bộ deliverable chuẩn (5 sản phẩm)

Chọn theo nhu cầu; không nhất thiết làm hết. Chi tiết kỹ thuật ở
`references/build-patterns.md`.

1. **Bản đồ luồng vận hành** — công cụ HTML 7 luồng (vận hành phát điện → điều tiết hồ →
   giám sát → bảo trì/sửa chữa → xử lý sự cố → công ca & đánh giá → báo cáo công ty mẹ),
   2 chế độ (Luồng vận hành / Phương án triển khai). Mỗi luồng có nút thắt + link-card mở
   dashboard tương ứng.
2. **Dashboard "Báo cáo về công ty mẹ"** — 4 nhóm ở trên, mỗi nhóm có trang tổng quan +
   phân tích sâu; tô màu theo ngưỡng để tự đánh giá. Đây là sản phẩm giải "bài toán số 1".
3. **Đánh giá nhân sự theo BSC** — 4 khía cạnh (Kết quả 40% · Khách hàng 20% · Quy trình
   25% · Học hỏi 15%), heatmap drill đơn vị → phòng ban → người, KPI theo ngày, cảnh báo
   nhân sự dưới ngưỡng.
4. **Báo cáo tài chính chi tiết (HTML kiểu ECV)** — sidebar + 5 trang (Tổng quan / Doanh
   thu / Chi phí / Công nợ / Dòng tiền), Chart.js. Xem `references/financial-model.md` cho
   mô hình số và `references/build-patterns.md` cho kỹ thuật.
5. **Deck demo (PPTX)** — ~12 slide "khoe năng lực + mở đường buổi meeting", dựng bằng
   pptxgenjs, motif icon-tròn, tông navy/xanh business.

**Liên kết chéo**: nhúng các dashboard vào nhau bằng **link-card** (`<a target="_blank">`
"Mở ... →") theo đúng một style thống nhất — ví dụ tab ① của dashboard công ty mẹ trỏ sang
báo cáo tài chính; luồng 6 trỏ sang đánh giá nhân sự.

## Quy ước & nguyên tắc (áp dụng xuyên suốt)

- **Tiếng Việt** toàn bộ giao diện & nội dung.
- **Ngưỡng màu chuẩn** (Đạt KH / Khả dụng): ≥98% xanh · 95–98% vàng · <95% đỏ. Định nghĩa
  ngưỡng inline ngay tại chỗ dùng.
- **Data-honesty**: mọi số minh họa phải gắn nhãn **"số minh họa"** + nguồn giả định; hiển
  thị số + tín hiệu màu để người xem tự đánh giá, **không** viết sẵn kết luận biên tập.
- **Single-file HTML** tự chứa (CDN Chart.js/Tabler), dễ gửi/tải; ĐVT ghi rõ (tỷ đồng...).
- **Luôn backup file trước khi sửa** (`cp file /tmp/...`), sửa bằng thay chuỗi có assert
  đếm số lần khớp = 1 để tránh sửa nhầm.

## Quy trình kiểm thử BẮT BUỘC sau mỗi thay đổi

Xem chi tiết ở `references/build-patterns.md` §Kiểm thử. Tóm tắt:

1. Trích `<script>` → `node --check` → đếm cân bằng ngoặc `{}`/`()`/`[]` phải = 0/0/0.
2. Chạy thử logic bằng **DOM stub + Chart stub** (Node) cho các hàm render/toggle/lọc.
3. Đối chiếu **canvas id ↔ `new Chart(id)`** khớp 1-1; bảng có nơi đổ dữ liệu.
4. Biểu đồ Chart.js tải từ CDN → **không headless-render được** (mạng chặn) → dựa vào
   kiểm tra cấu trúc; nhắc user cần internet khi mở.
5. PPTX: `soffice --convert-to pdf` → `pdftoppm` → `view` từng slide để QA hình.

## Case Nậm Na (cụ thể)

Toàn bộ số liệu, tên pháp nhân, cấu hình 8 tổ máy, hằng số tài chính minh họa và trạng
thái các deliverable đã dựng nằm ở **`references/nam-na-case.md`**. Đọc file này khi làm
tiếp trên chính case Moonlight/Nậm Na; **bỏ qua** khi làm khách thủy điện khác (chỉ giữ
phương pháp chung).

## Tái sử dụng cho case mới — checklist

1. Chạy Bước 0, điền cấu trúc holding + SPV của khách mới.
2. Copy khung 4 nhóm báo cáo, thay pháp nhân/nhà máy.
3. Dựng mô hình tài chính theo `references/financial-model.md`, thay hằng số bằng số của khách
   (hoặc "số minh họa").
4. Tái dùng template báo cáo tài chính (mượn CSS từ bản mẫu chất lượng), giữ các pattern
   (lọc cả trang, Thực tế/Lũy kế, so kế hoạch, heatmap ma trận đồng bộ cột, bảng hóa đơn đến hạn).
5. Chạy quy trình kiểm thử; gắn link-card liên kết các dashboard.
6. Nếu cần pitch: dựng deck demo theo mẫu, chốt bằng lời mời buổi làm việc.

## Reference files

- `references/financial-model.md` — mô hình tài chính đặc thù thủy điện (PPA, cơ cấu chi
  phí, EBITDA vs LNTT, dòng tiền, công nợ EVN) + logic để dựng lại báo cáo tài chính.
- `references/build-patterns.md` — kỹ thuật dựng: single-file HTML + Chart.js, tái dùng
  template ECV, các pattern tương tác, gotchas Chart.js, PPTX pptxgenjs, quy trình kiểm thử.
- `references/nam-na-case.md` — dữ kiện & số liệu minh họa riêng cho Moonlight/Nậm Na, và
  danh mục deliverable đã dựng.
