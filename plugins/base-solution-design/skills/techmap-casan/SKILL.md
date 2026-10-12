---
name: techmap-casan
description: >
  Tạo Technology Solution Map (Techmap) theo phương pháp luận FPT CASAN chính thức (Alpha v1, 19/5/2026), dành cho Solution Engineer Base.vn khi chuẩn bị proposal, demo, hoặc tư vấn giải pháp số hóa cho khách hàng doanh nghiệp. Skill này hướng dẫn: (1) chẩn đoán cấp độ CASAN hiện tại của khách hàng, (2) phân tích bài toán theo 7 chiều trưởng thành, (3) thiết kế kiến trúc giải pháp 5 tầng, (4) xác định mức ủy quyền AI (L0–L5), (5) trình bày dưới dạng HTML interactive chuyên nghiệp.

  Kích hoạt skill này khi người dùng yêu cầu: "làm techmap", "vẽ techmap", "tạo technology map", "thiết kế kiến trúc giải pháp", "lên sơ đồ giải pháp số hóa", "làm roadmap chuyển đổi số", "đánh giá mức độ sẵn sàng AI", "định vị CASAN khách hàng", hoặc khi cần trình bày giải pháp tổng thể cho một khách hàng/ngành cụ thể.
---

# Skill: Techmap CASAN (Phương pháp luận FPT CASAN Alpha v1 — 19/5/2026)

## Mục đích

Tạo một **Technology Solution Map** dạng HTML interactive — trình bày kiến trúc giải pháp số hóa tổng thể theo khung **CASAN 5 cấp độ** (Curious → Augmented → Standard → Automated → Native), tích hợp phân tích chiều sâu từ tài liệu phương pháp luận chính thức của FPT.

Output là file `.html` dùng để trình bày với khách hàng trong buổi demo, proposal, hoặc kick-off.

---

## PHẦN A — NỀN TẢNG LÝ THUYẾT CASAN

### A1. Định nghĩa CASAN và 5 cấp độ chính thức

CASAN = **Curious – Augmented – Standard – Automated – Native**

| Cấp | Tên | Đặc điểm cốt lõi | Ẩn dụ |
|---|---|---|---|
| 1 | **Curious** | AI dùng rời rạc, cá nhân, không chuẩn, không quản trị | Xưởng thủ công |
| 2 | **Augmented** | AI được cấp phép chính thức, tăng năng suất cá nhân/nhóm nhỏ, chưa thay đổi quy trình tổng thể | Dây chuyền lắp ráp |
| 3 | **Standard** | AI tích hợp vào quy trình, dữ liệu chuẩn hóa toàn tổ chức, có quản trị, có vai trò chuyên trách | Nhà máy thông minh |
| 4 | **Automated** | AI Agent vận hành luồng công việc có kiểm soát ở quy mô lớn, có AgentOps, con người chuyển sang xử lý ngoại lệ | Doanh nghiệp tự động hóa |
| 5 | **Native** | AI là hệ điều hành của tổ chức, quy trình lõi được thiết kế lại quanh AI, Multi-Agent, học liên tục | Sinh vật thông minh |

**Nguyên lý quan trọng:**
- Cấp cao kế thừa đặc điểm cấp thấp — không bỏ qua bước nào
- Cấp 4 là **điểm bứt phá giá trị** — AI tạo tác động tài chính đo lường được
- Cấp 5 đòi hỏi cam kết của HĐQT và tái thiết kế toàn bộ mô hình vận hành
- Hầu hết doanh nghiệp Việt Nam đang ở Cấp 1–2

### A2. Bốn lớp tư duy nguyên bản của CASAN

Đây là điểm khác biệt của CASAN so với các khung quốc tế khác (Gartner, BCG, Deloitte...). Khi phân tích techmap, cần xác định khách hàng đang ở đâu trên từng lớp:

**1. Harness Engineering**
Harness = toàn bộ lớp kỹ thuật bao quanh AI model (ngữ cảnh, công cụ, kiểm định, bảo mật, quản trị, AgentOps, điều phối). Không phải prompt, mà là hệ thống giúp AI hành động có kiểm soát. Đây là lớp tạo khác biệt — model có thể thay thế, Harness là tài sản phải làm chủ.

7 thành phần Harness:
- Harness ngữ cảnh (RAG, knowledge layer, context window)
- Harness công cụ (tool registry, quyền tối thiểu, audit log)
- Harness kiểm định (bộ dữ liệu vàng, LLM-as-judge, hồi quy)
- Harness bảo mật (prompt injection, jailbreak, DLP)
- Harness quản trị (luồng phê duyệt, sổ đăng ký rủi ro, kiểm toán)
- Harness AgentOps (giám sát chi phí, độ trễ, ảo giác, lỗi)
- Harness điều phối (workflow engine, Multi-Agent, retry, rollback)

**2. Computational × Inferential Blend**
Không thay ERP/SAP bằng LLM. Kết hợp:
- Tầng tính toán (ERP, rule engine, hệ thống giao dịch) — chính xác, kiểm toán được
- Tầng suy luận (LLM, AI Agent) — hiểu ngữ cảnh, xử lý phi cấu trúc, điều phối

Ranh giới: AI suy luận → hệ thống tính toán xác nhận → governance giữ kỷ luật.

**3. Human-led, AI-first**
Con người giữ: mục tiêu, giá trị, đạo đức, phán đoán, trách nhiệm giải trình, quyết định cuối.
AI là: lớp năng lực thực thi đầu tiên, mở rộng năng lực con người trong Harness có kiểm soát.
Tránh 2 cực đoan: (a) AI chỉ là công cụ phụ trợ nhỏ → mắc kẹt Cấp 2; (b) trao quyền quá nhanh không kiểm soát → sự cố trong môi trường thật.

**4. AI Delegation Architecture (Kiến trúc ủy quyền L0–L5)**
Xác định rõ AI được phép làm gì, dùng gì, ai duyệt, hoàn tác thế nào:

| Mức | Tên | Ý nghĩa | Ví dụ |
|---|---|---|---|
| L0 | Observe | AI quan sát, tóm tắt, phân loại — không thay đổi hệ thống | Tóm tắt cuộc họp |
| L1 | Draft | AI tạo bản nháp, người duyệt 100% | Soạn nháp email |
| L2 | Recommend | AI đề xuất, người quyết định | Đề xuất giá, danh sách NCC |
| L3 | Execute bounded | AI thực thi tác vụ rủi ro thấp trong giới hạn rõ | Tạo test case, phân tuyến ticket |
| L4 | Operate workflow | AI vận hành luồng công việc có hàng rào kiểm soát | Xử lý khiếu nại tuyến 1 |
| L5 | Restricted autonomy | AI tự động hóa vùng phức tạp, governance nghiêm ngặt | Giám sát gian lận |

### A3. Bảy chiều đánh giá mức độ trưởng thành (dùng khi chẩn đoán khách hàng)

Mỗi chiều được đánh giá từ Cấp 1–5 tương ứng CASAN:
1. **Chiến lược & kết quả kinh doanh** — AI có gắn với KPI tài chính không?
2. **Dữ liệu & tích hợp** — Dữ liệu đạt 6 tiêu chuẩn: Đúng, Đủ, Sạch, Sống, Thống nhất, Dùng chung?
3. **Quy trình & luồng công việc** — AI đã vào quy trình hay chỉ dùng bên lề?
4. **Công nghệ, nền tảng & kiến trúc** — Có Harness tự chủ không?
5. **Quản trị, bảo mật & tuân thủ** — Có kiến trúc ủy quyền, audit log, kill switch không?
6. **Con người, kỹ năng & vai trò mới** — Có Harness Engineer, Validator, AgentOps không?
7. **Đo lường giá trị & rủi ro** — Có AgentOps dashboard, ROI, incident rate không?

### A4. Kiến trúc kỹ thuật tham chiếu 5 tầng (Technical Reference Architecture)

Đây là kiến trúc kỹ thuật nền của mọi techmap CASAN, khác với 5 tầng nghiệp vụ:

| Tầng | Tên | Thành phần chính |
|---|---|---|
| T1 | Tầng dữ liệu | Data Lake, DWH, Vector Store, Feature Store, DLP, Data Catalog |
| T2 | Tầng mô hình | Model Registry, Model Gateway, Embedding Service, Fine-tuning Pipeline |
| T3 | Tầng Agent & công cụ | Agent Registry, Tool Registry, MCP Protocol, Agent Identity, Memory Store |
| T4 | Tầng điều phối & Harness | Workflow Engine, Multi-Agent Orchestration, 7 Harness components, Prompt Management |
| T5 | Tầng quản trị, bảo mật & trải nghiệm | Policy Engine, Approval Flow, Risk Registry, Audit Log, UX (chat/voice/API) |

---

## PHẦN B — QUY TRÌNH LÀM TECHMAP

### Bước 1 — Thu thập thông tin và chẩn đoán CASAN

**Thông tin bắt buộc:**

| Thông tin | Câu hỏi khai thác |
|---|---|
| Ngành / lĩnh vực | Dược, sản xuất, bán lẻ, logistics, ngân hàng, xây dựng...? |
| Quy mô | Số nhân sự, chi nhánh, phân xưởng? |
| Hệ thống hiện tại | ERP/SAP/Excel/phần mềm đang dùng? |
| Bài toán cốt lõi | Pain point lớn nhất: tuân thủ, chất lượng, nhân sự, tài chính...? |
| Compliance đặc thù | GMP, ISO, FDA, Basel, PCCC...? |
| Phân hệ quan tâm | HR, QA/QC, SX, SCM, Finance, R&D, Sales...? |
| Mục tiêu 12 tháng | Muốn đạt gì? KPI cụ thể? |

**Chẩn đoán cấp CASAN hiện tại** (hỏi nhanh 5 câu):
- Dữ liệu hiện tại: đang ở Excel, nhiều file, hay đã có hệ thống tập trung?
- AI: đang thử nghiệm rải rác hay đã có chính sách sử dụng?
- Quy trình: AI đã vào workflow hay chỉ dùng bên lề?
- Quản trị: có người chuyên trách AI, có audit log không?
- Kết quả: AI đã tạo ra con số tiết kiệm / tăng trưởng đo được chưa?

→ Xác định khách đang ở Cấp mấy, mục tiêu lên Cấp mấy trong 12–24 tháng.

### Bước 2 — Phân tích và thiết kế nội dung 5 tầng

**Ánh xạ nhu cầu khách hàng vào 5 tầng nghiệp vụ của techmap:**

#### Tầng 1 — Foundation (Nền tảng Dữ liệu) → Cấp Curious–Augmented
- Định nghĩa **data object cốt lõi** của ngành: nhân sự, lô SX, sản phẩm, NCC, hợp đồng...
- Đánh giá 6 tiêu chuẩn dữ liệu: Đúng / Đủ / Sạch / Sống / Thống nhất / Dùng chung
- Câu hỏi chẩn đoán: Dữ liệu master data đã được định nghĩa và chuẩn hóa chưa?

#### Tầng 2 — Operations (Vận hành & Quy trình) → Cấp Standard
- Xác định các **quy trình nghiệp vụ cốt lõi** cần số hóa và chuẩn hóa
- Ánh xạ: BASE ghi nhận gì? ERP/SAP xử lý gì? Ranh giới Computational vs Inferential ở đâu?
- Câu hỏi: AI đã được đưa vào quy trình hay vẫn dùng bên lề?

#### Tầng 3 — Digitize (Số hóa Nguồn Dữ liệu) → Cấp Standard–Automated
- Xác định **nguồn dữ liệu** và cách kết nối: BASE, ERP/SAP, Excel legacy, OCR, API webhook
- Thiết kế luồng đồng bộ: API / Webhook / Batch / ETL
- Câu hỏi: Dữ liệu đang ở đâu? Mỗi nguồn cần kết nối bằng cách nào?

#### Tầng 4 — Data Platform (Kho Dữ liệu Tập trung) → Cấp Automated
- Data Lake (raw, immutable) → ETL/Dataform → BigQuery DWH → Data Mart theo nghiệp vụ
- Mỗi **Data Mart** = 1 domain nghiệp vụ, phục vụ 1 nhóm người dùng cụ thể
- ⚡ đánh dấu chỗ Claude AI làm giàu tự động
- Câu hỏi: Có bao nhiêu domain nghiệp vụ cần Data Mart riêng?

#### Tầng 5 — AI Layer (Tầng Trí tuệ) → Cấp Native
Ba nhóm deliverable:
- **Dashboard (BC)**: báo cáo tự động theo phân quyền, refresh định kỳ
- **Alert (AL)**: cảnh báo realtime gửi Base Message + Email, trigger theo điều kiện cụ thể
- **AI Assistant (AI)**: hỏi đáp dữ liệu (RAG), tóm tắt tự động (7:30 AM), dự báo & xu hướng

Với mỗi Alert và AI, xác định **mức ủy quyền L0–L5** phù hợp:
- Dashboard / báo cáo → L0 (Observe)
- AI tóm tắt / đề xuất → L1–L2 (Draft / Recommend)  
- AI thực thi tác vụ có kiểm soát → L3–L4 (Execute / Operate)

### Bước 3 — Thiết kế Data Mart chi tiết

Với mỗi Data Mart, xác định:
- **Tên & mã** (M1, M2...)
- **Domain nghiệp vụ** và KPI chính cần giám sát
- **Nguồn dữ liệu** đầu vào (từ tầng 3)
- **Dashboard** nào dùng mart này
- **Alert** nào trigger từ mart này
- **AI module** nào kết nối mart này
- **⚡ AI enrichment**: trường nào Claude tự động làm giàu

**Bảng phân quyền** (bắt buộc):
| Bộ phận | Dashboard | Alert | AI | Data Mart |
|---|---|---|---|---|
| BGĐ | tất cả | tất cả | tất cả | tất cả |
| Phòng X | BC01, BC02 | AL01 | AI01 | M1, M2 |
...

### Bước 4 — Build HTML Techmap

#### Yêu cầu thiết kế
- **Màu sắc**: Dark navy `#0a0f1e` nền, gradient xanh-tím, accent vàng/cam (#f59e0b)
- **Font**: Inter hoặc system font
- **Layout**: 3 tab navigation (Tổng quan / Techmap / Giám sát & Kết quả)
- **Interactive**: click Data Mart → xem chi tiết, hover effects, smooth transitions
- **Branding**: Tên khách hàng × Base.vn, tag cấp CASAN hiện tại, năm

#### Cấu trúc HTML
```
Tab 1 — Tổng quan:
  - 5 tầng CASAN dạng card, mỗi card có: tên tầng, công nghệ tag, mô tả ngắn
  - Badge hiển thị cấp CASAN hiện tại của khách hàng
  - Lộ trình: "Hiện tại: Cấp X → Mục tiêu 12 tháng: Cấp Y"

Tab 2 — Techmap:
  - Pipeline ngang 4 cột: Nguồn → Lake/ETL → Data Mart → Giám sát
  - Grid Data Mart (M1–Mx) với click-to-expand
  - Chú thích màu sắc

Tab 3 — Giám sát & Kết quả:
  - Cards Dashboard (BC01, BC02...) với KPI, tần suất, người nhận
  - Cards Alert (AL01...) với trigger condition, kênh gửi, mức ủy quyền
  - Cards AI (AI01...) với loại AI, ví dụ câu hỏi, mart kết nối
  - Bảng phân quyền theo bộ phận
```

#### Ví dụ tham khảo
Xem triển khai thực tế: https://haiyenbase.github.io/stella_pharm_techmap/
- Stella Pharm: Dược / GMP / 6 Data Mart / 6 Dashboard / 3 Alert / 3 AI

### Bước 5 — Checklist trước khi xuất

- [ ] Đã xác định cấp CASAN hiện tại và mục tiêu của khách hàng
- [ ] 5 tầng nghiệp vụ phản ánh đúng bài toán ngành
- [ ] Data Mart đủ và đúng theo domain nghiệp vụ
- [ ] Mỗi Alert có mức ủy quyền L0–L5 phù hợp
- [ ] Dashboard gắn với Data Mart và người nhận cụ thể
- [ ] Bảng phân quyền đủ các bộ phận
- [ ] Ranh giới Computational (BASE/ERP) vs Inferential (AI) rõ ràng
- [ ] Tên khách hàng, ngành, compliance đặc thù, năm đúng
- [ ] HTML mở được không cần server

---

## PHẦN C — NGÀNH MẪU VÀ DATA MART ĐẶC THÙ

| Ngành | Data Mart đặc thù | Compliance | Alert quan trọng |
|---|---|---|---|
| Dược (Pharma) | Chất lượng/Deviation, Lô SX, RA, R&D, SCM, Finance | GMP/FDA | Lô hold, RA hết hạn, NCC giao trễ |
| Sản xuất | Lệnh SX, Chất lượng, Kho, Nhân sự, Thiết bị, Finance | ISO | Máy dừng, lỗi chất lượng, tồn kho thấp |
| Bán lẻ | Bán hàng, Tồn kho, Khách hàng, Nhân sự, Promotion | - | Hàng sắp hết, doanh thu dưới target |
| Xây dựng | Dự án, Nhân công, Vật tư, Thiết bị, Hợp đồng | - | Tiến độ trễ, vật tư thiếu, chi phí vượt |
| Logistics | Đơn hàng, Xe/Tài xế, Kho, Tuyến đường, Finance | - | Giao trễ, xe không có kế hoạch |
| Ngân hàng | KYC/Tuân thủ, Tín dụng, Giao dịch, Nhân sự | Basel/SBV | Giao dịch nghi ngờ, tuân thủ vi phạm |
| Y tế | Bệnh nhân, Lịch hẹn, Thuốc/Vật tư, Nhân sự | Bộ Y tế | Thuốc sắp hết, lịch hẹn quá tải |

---

## PHẦN D — GÓC NHÌN SE KHI TƯ VẤN KHÁCH HÀNG

### Định vị Base.vn trong kiến trúc CASAN
- **Base.vn** = Tầng Operations + Digitize (Cấp 2–3): ghi nhận nghiệp vụ HR, QA/QC, SX, Finance
- **ERP/SAP** = Computational layer: kế hoạch, giao dịch tài chính, tính lương chính xác
- **Data Platform** = Tầng 4: Base.vn là 1 trong nhiều nguồn đổ vào Data Lake
- **AI Layer** = Tầng 5: Claude API kết nối 6 Data Mart, không thay thế Base mà amplify

### Triệu chứng thường gặp và cách chẩn đoán
Nếu khách hàng có các triệu chứng sau → họ đang ở Cấp 1–2 và cần lên Cấp 3:
- Mỗi phòng một bản Excel riêng
- Dữ liệu không thống nhất, nhiều bản, thiếu dòng lịch sử
- AI dùng rải rạc, không có chính sách
- Không biết AI đang dùng thông tin gì để trả lời
- Thử nghiệm AI thành công nhưng không scale được

### Thông điệp chốt cho khách hàng C-level
*"Doanh nghiệp không thất bại vì thiếu ChatGPT hay Claude. Doanh nghiệp thất bại vì dữ liệu không sẵn sàng, quy trình không được thiết kế lại, AI Agent không được kiểm soát, và không đo lường được tác động lên doanh thu và lợi nhuận."*

Techmap là công cụ giúp khách hàng thấy rõ: họ đang ở đâu, cần làm gì tiếp theo, và Base.vn hỗ trợ ở tầng nào trong lộ trình đó.

### Lưu ý quan trọng
- **Không nhảy cấp**: Khách ở Cấp 1–2 không thể triển khai AI Agent ngay — phải lên Cấp 3 trước
- **Không oversell**: Chỉ đề xuất AI feature phù hợp với cấp trưởng thành thực tế
- **Luôn có bảng phân quyền**: C-level rất quan tâm đến ai được xem gì
- **Mức ủy quyền L0–L5**: Với khách hàng nhạy cảm (ngân hàng, dược, y tế), nêu rõ AI chỉ ở L0–L2 giai đoạn đầu
- **6 tiêu chuẩn dữ liệu**: Dùng như công cụ chẩn đoán — khách không đạt đủ 6 tiêu chuẩn thì chưa thể lên Cấp 3
