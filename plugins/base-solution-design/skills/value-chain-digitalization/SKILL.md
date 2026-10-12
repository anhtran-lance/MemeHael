---
name: value-chain-digitalization
description: >
  Tạo bản đồ số hoá chuỗi giá trị (Value Chain Digitalization Map) cho bất kỳ ngành nào dưới dạng file HTML tương tác, song/đa ngữ (Tiếng Việt / English / ພາສາລາວ). 
  Kích hoạt skill này BẤT CỨ KHI NÀO người dùng yêu cầu: "danh mục số hoá ngành X", "chuỗi giá trị ngành X", "value chain ngành X", "quy trình số hoá ngành X", "vẽ sơ đồ chuỗi giá trị", "phân tích chuỗi giá trị", hoặc bất kỳ yêu cầu nào liên quan đến việc liệt kê/trực quan hoá quy trình vận hành theo ngành — kể cả khi không nhắc đến "HTML" hay "file". 
  Output luôn là file HTML trilingual với toggle Tiếng Việt / English / ພາສາລາວ, layout gồm: (1) hàng trên — các nhóm quy trình chính đem lại doanh thu/chi phí gắn với giai đoạn chuỗi giá trị; (2) dải VC strip ở giữa — các giai đoạn chuỗi giá trị với icon; (3) hàng dưới — các nhóm quy trình phụ trợ (Hành chính, Nhân sự, Kế toán, IT).
---

# Value Chain Digitalization Map

Skill này tạo file HTML tương tác hiển thị **bản đồ số hoá chuỗi giá trị** cho một ngành cụ thể, với toggle chuyển đổi ngôn ngữ Tiếng Việt / English / ພາສາລາວ.

---

## Quy trình thực hiện

### Bước 1 — Xác định ngành và nghiên cứu

Từ yêu cầu của người dùng, xác định:
- **Tên ngành** (ví dụ: bảo hiểm, ngân hàng, bán lẻ, logistics, bệnh viện, sản xuất, bất động sản...)
- **Số lượng giai đoạn VC**: thông thường 5–8 giai đoạn, tối đa 9 (để vừa 1 hàng ngang)
- **Ngôn ngữ output**: mặc định Trilingual (VI + EN + LO). Nếu người dùng chỉ yêu cầu 2 ngôn ngữ thì bỏ bớt

Nếu ngành không rõ, hỏi lại trước khi tiến hành.

### Bước 2 — Lập cấu trúc nội dung

Xây dựng 3 lớp nội dung theo đúng logic:

#### A. Giai đoạn chuỗi giá trị chính (VC Strip — giữa trang)
Các giai đoạn tuần tự tạo ra giá trị cho khách hàng. Mỗi giai đoạn gồm:
- Icon emoji phù hợp
- Tên tiếng Việt (ngắn gọn, 2–4 từ)
- Tên tiếng Anh (thuật ngữ chuẩn ngành quốc tế)
- Tên tiếng Lào

**Ví dụ các ngành phổ biến:**
- Bảo hiểm: Phát triển SP → Phân phối & Bán hàng → Thẩm định rủi ro → Quản lý HĐ → Xử lý bồi thường → DVKH → Tái BH
- Ngân hàng: Huy động vốn → Thẩm định tín dụng → Cấp tín dụng → Quản lý tài khoản → Thanh toán & Chuyển tiền → DVKH → Quản lý rủi ro
- Bệnh viện: Tiếp nhận BN → Khám & Chẩn đoán → Điều trị → Phẫu thuật/Thủ thuật → Dược & Vật tư → Xuất viện → Theo dõi sau viện
- Logistics: Tiếp nhận đơn → Kho & Phân loại → Vận chuyển → Giao hàng → Trả hàng → CSKH
- Bán lẻ: Mua hàng & Sourcing → Kho & Phân phối → Marketing → Bán hàng → Thanh toán → CSKH → Loyalty

#### B. Nhóm quy trình CHÍNH — hàng TRÊN (Primary Processes)
Là các hoạt động **trực tiếp tạo doanh thu hoặc chi phí nghiệp vụ lõi**, gắn với 2–3 giai đoạn VC. Tạo 3 nhóm, mỗi nhóm 6–8 quy trình.

Format tên quy trình: **`[Số]. [Tên quy trình ngắn gọn]`**
- Tiếng Việt: `1. QT Tên quy trình`
- Tiếng Anh: `1. Process Name Process`
- Tiếng Lào: `1. ຂະບວນການ...`

Tên quy trình phải là **hành động cụ thể** (động từ + danh từ), không phải tên module phần mềm hay danh mục công nghệ.

**Ví dụ đúng:** `QT Tiếp nhận & khai báo tổn thất`, `QT Cấp đơn bảo hiểm`
**Ví dụ sai:** `Hệ thống quản lý claims`, `AI-powered underwriting`

#### C. Nhóm quy trình PHỤ TRỢ — hàng DƯỚI (Support Processes)
Luôn có 2 nhóm cố định (dạng grid 2 cột):

**Nhóm 1 — Vận hành Nội bộ** (Internal Operations):
Bao gồm: Quản lý văn bản/tài liệu, Tuyển dụng & hội nhập, Đào tạo, Quản lý phần mềm nghiệp vụ, Quản lý kênh truyền thông, Quản lý hiệu suất & OKR, Tuân thủ pháp lý & báo cáo, An toàn thông tin & bảo mật
→ Tuỳ chỉnh 1–2 quy trình đặc thù theo ngành (ví dụ ngành ngân hàng thêm: QT Báo cáo Basel III / Thông tư 36)

**Nhóm 2 — Kế toán & Đầu tư** (Accounting & Finance):
Bao gồm: Thanh toán/tạm ứng, Thanh toán chi phí vận hành, Quản lý ngân sách, Xây dựng & cập nhật chính sách tài chính, Trích lập dự phòng, Đối soát & quyết toán, Báo cáo tài chính
→ Tuỳ chỉnh theo chuẩn kế toán ngành (VAS, IFRS, chuẩn riêng)

### Bước 3 — Sinh file HTML

Đọc template tại `references/html-template.md` và điền nội dung vào.

**Quy tắc bắt buộc khi sinh HTML:**
1. Dùng Python (`python3`) để ghi file — KHÔNG dùng bash heredoc (bị truncate ở 65,536 bytes)
2. Output path: `/mnt/user-data/outputs/value_chain_[tên_ngành]_trilingual.html`
3. Escape tất cả dấu nháy đơn trong Python string bằng `\'`
4. Sau khi ghi file, gọi `present_files` để trả file về cho người dùng
5. Luôn test file tồn tại bằng `ls -lh [path]` trước khi present

### Bước 4 — Present và giải thích

Sau khi present file, tóm tắt ngắn:
- Tên ngành + số giai đoạn VC
- Số quy trình chính / phụ trợ đã đưa vào
- Hướng dẫn dùng: "Nhấn nút góc trên phải để chuyển ngôn ngữ"

---

## Hướng dẫn dịch tiếng Lào

Khi dịch sang tiếng Lào, ưu tiên theo thứ tự:
1. Dùng thuật ngữ tài chính/kinh doanh chuẩn của Lào nếu biết
2. Giữ nguyên từ tiếng Anh cho thuật ngữ quốc tế (STP, NPS, eKYC, IFRS, KYC, CRM, ERP...)
3. Dịch nghĩa tự nhiên, không dịch máy cứng nhắc
4. Prefix quy trình: `ຂະບວນການ` (= "quy trình / process")

---

## Lưu ý quan trọng

- **Không** đặt tên quy trình theo module công nghệ hay buzzword AI
- **Không** dùng mô tả dài — chỉ tên quy trình ngắn gọn như ảnh mẫu
- Số quy trình mỗi nhóm: 6–9 items (không ít hơn 5, không nhiều hơn 10)
- Các giai đoạn VC strip: tối đa 9 để tránh vỡ layout 1 hàng ngang
- Nếu ngành có nhiều hơn 9 giai đoạn, gộp các giai đoạn liên quan lại

---

## Tham khảo thêm

- Xem `references/html-template.md` để lấy full HTML template với placeholder
- Xem `references/industry-examples.md` để tham khảo cấu trúc VC các ngành phổ biến
