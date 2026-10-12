# Cách đọc input mô tả luồng

Người dùng có thể mô tả luồng bằng nhiều cách. Dưới đây là cách xử lý từng loại và
những gì phải hỏi thêm.

## Thứ tự ưu tiên

1. **Ảnh sơ đồ / flowchart** (ưu tiên cao nhất)
2. Bảng
3. Text có cấu trúc (gạch đầu dòng)
4. SmartArt / sơ đồ trong Office

**Luôn khuyến nghị gửi ảnh sơ đồ** kể cả khi đã có mô tả khác. Câu gợi ý:
> "Để bản design chính xác nhất về thứ tự bước và cách rẽ nhánh, bạn gửi thêm ảnh
> sơ đồ luồng (ví dụ export từ Canva) nhé. Nếu chưa có cũng không sao, mình làm
> theo mô tả rồi xác nhận lại với bạn từng bước."

---

## 1. Ảnh sơ đồ / flowchart

- Đọc **từng block** theo thứ tự mũi tên. Ghi lại: tên block (nguyên văn), màu
  block (gợi ý ý nghĩa: xanh = bước thường, cam = kết thúc, đỏ = đặc biệt…), các
  nhãn trên mũi tên (điều kiện rẽ nhánh).
- **Nhánh rẽ:** để ý mũi tên tách ra nhiều hướng, hoặc nhiều dòng song song. Nhãn
  cạnh nhánh (ví dụ "> 50M", "Nếu…") là điều kiện.
- **Bước quay lại:** mũi tên vòng ngược về block trước.
- **Vạch ngăn:** đường kẻ dọc chia 2 vùng (thường trái = ngoài hệ thống, phải =
  trên hệ thống).

**Nếu ảnh bị crop hoặc chữ mờ:**
- Phóng to vùng đó bằng Python/PIL (xem build-pipeline) để đọc.
- Nếu vẫn không chắc, **hỏi lại người dùng** nội dung block / chiều mũi tên. Không
  bao giờ đoán.

**Nhiều ảnh:** một quy trình có thể trải trên nhiều ảnh (QT tổng ở ảnh 1, các QT
con ở ảnh 2, 3…). Ghép lại theo tên quy trình.

---

## 2. Bảng

Thường có dạng: `Bước | Loại/Nhánh | Điều kiện | Ghi chú`. Chuyển mỗi hàng thành
một bước, nhóm theo cột Loại/Nhánh. Hỏi lại:
- Thứ tự các bước trong một nhánh có đúng theo thứ tự hàng không?
- Cột điều kiện ứng với rẽ nhánh ở đâu?

---

## 3. Text có cấu trúc

Đoạn văn hoặc gạch đầu dòng mô tả "A → B → nếu X thì C, nếu không thì D". Bóc tách
thành: danh sách bước, điểm rẽ, điều kiện. Vì text dễ thiếu thông tin thứ tự/nhánh,
**hỏi kỹ phần bước & nhánh** ở Bước 2 của workflow.

---

## 4. SmartArt / sơ đồ trong Excel, Word, PowerPoint

- Nếu là file (.xlsx/.docx/.pptx): mở bằng công cụ tương ứng, nhưng SmartArt
  thường nằm dạng XML/hình — cách chắc chắn nhất là **xin người dùng chụp màn hình
  SmartArt thành ảnh** rồi xử lý như mục 1.
- Nếu người dùng dán nội dung các node dạng text: xử lý như mục 3.

---

## Checklist tối thiểu phải có trước khi vẽ

Dù input là gì, phải nắm chắc:
- [ ] Tên bộ quy trình + mã (nếu có)
- [ ] Danh sách quy trình tổng & quy trình con
- [ ] Thứ tự + tên chính xác (nguyên văn) từng bước
- [ ] Các điểm rẽ nhánh + điều kiện
- [ ] Bước tùy chọn / bước quay lại / bước thao tác trực tiếp
- [ ] Cơ chế liên kết phiếu (tự động / thủ công)
- [ ] Vạch ngăn ngoài/trên hệ thống (nếu có) + khái niệm Unit (nếu có)
- [ ] Cú pháp từ ngữ thống nhất cho bước kết thúc
- [ ] Logo + màu brand KH
