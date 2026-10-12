---
name: "base-thiet-lap-ton-kho-1-n"
description: "Thiết lập trên Base.vn quy trình đơn nhiều mặt hàng (1 đơn – n dòng) với tồn kho theo lô; dùng khi cấu hình đơn mua/bán có nhiều sản phẩm, dòng đơn và automation tạo lô hàng."
---

# Thiết lập tồn kho theo phương án 1-n (1 đơn – nhiều mặt hàng)

Skill này dùng khi một đơn mua hoặc đơn bán có nhiều sản phẩm. Thay vì nhập danh sách hàng trong một bảng (Table) của workflow, mỗi dòng hàng là một bản ghi riêng trong dataset Dòng đơn, gắn với đơn bằng Mã đơn. Cách này tránh điểm nghẽn hiện tại: automation chưa đọc được sub-field của trường Table trong workflow.

## Mô hình dữ liệu

- Đơn (header): workflow Quản lý đơn mua hàng hoặc Quản lý đơn bán hàng, chỉ chứa thông tin chung (Mã đơn, khách hàng/nhà cung cấp, ngày).
- Dòng đơn (line): dataset Dòng đơn mua hoặc Dòng bán hàng, mỗi bản ghi là một sản phẩm với Sản phẩm (chọn) và Số lượng, cùng Mã đơn để liên kết về đơn.
- Lô hàng tồn kho: mỗi dòng đơn sinh một lô, số lượng dương khi mua và âm khi bán. Tồn kho của một sản phẩm = tổng số lượng các lô của sản phẩm đó.

## Bước 1: Dataset

1. Dataset Sản phẩm để làm nguồn dropdown (nếu chưa có).
2. Dataset Dòng đơn mua: Sản phẩm (chọn) là dropdown; Số lượng là số nguyên; Mã đơn mua là văn bản.
3. Dataset Dòng bán hàng: cấu trúc tương tự, nhưng số lượng nhập dương, automation sẽ đổi dấu.
4. Dataset Lô hàng tồn kho: Sản phẩm (chọn) dropdown; Số lượng mua số nguyên; Trạng thái dropdown gồm Chưa về kho, Đã về kho một phần, Đã về kho; Mã đơn mua văn bản.

Thêm lựa chọn mới vào dataset gốc, không thêm tạm trong automation.

## Bước 2: Workflow đơn (header)

Ở mục Cài đặt > Trường của workflow Quản lý đơn mua hàng và Quản lý đơn bán hàng:

1. Giữ trường Mã đơn ở kiểu Text.
2. Thêm trường Khách hàng hoặc Nhà cung cấp và Ngày nếu cần theo dõi.
3. Không dùng trường Table Dòng hàng cho luồng này. Nếu trường đã có, ẩn khỏi form tạo đơn hoặc để trống khi test.

## Bước 3: Nhập dòng đơn

Người dùng tạo các dòng trong dataset Dòng đơn mua hoặc Dòng bán hàng, mỗi dòng có cùng Mã đơn với header. Có hai cách thực hiện:

- Nhập tay từng dòng trong dataset, phù hợp khi số dòng ít.
- Tạo một workflow con "Dòng đơn" với một sản phẩm và số lượng mỗi job, rồi automation của header tạo job con cho từng dòng. Chỉ làm khi đã kiểm tra được cách truyền dữ liệu từ header sang job con.

## Bước 4: Automation

Automation đã có: Tồn kho - đơn mua (theo dòng) và Phân bổ tồn kho - đơn bán (theo dòng). Cả hai kích hoạt khi một bản ghi mới được tạo trong dataset Dòng đơn, và tạo một lô tương ứng. Không chỉnh sửa khi không cần.

Nếu cần kiểm tra toàn bộ đơn trước khi ghi lô, thêm bước Find records theo Mã đơn để đếm dòng, nhưng chỉ làm khi đã xác định được yêu cầu.

## Bước 5: Kiểm thử

1. Xóa các bản ghi test cũ trong Lô hàng tồn kho và Dòng đơn trước khi test.
2. Tạo một đơn mua header và ba dòng với ba sản phẩm khác nhau. Kiểm tra có đúng ba lô, mỗi lô có số lượng dương và đúng sản phẩm.
3. Tạo một đơn bán có hai dòng cùng sản phẩm. Kiểm tra có hai lô âm và tổng tồn kho của sản phẩm đúng.
4. Xem Runs của các automation. Lỗi "400 Enter a name or at least one field value" nghĩa là một trường bắt buộc chưa được ánh xạ.

## Bước 6: Bàn giao

Ghi lại tên dataset, workflow, automation và danh sách dropdown. Liệt kê các bản ghi test và automation nháp cần người dùng tự xóa, vì skill không xóa dữ liệu.

## Giới hạn đã biết

- Automation không đọc được sub-field của trường Table trong workflow.
- Transform và Transformers node không tách được chuỗi JSON của trường Table.
- Trường Link dataset record chỉ liên kết bản ghi có sẵn, không tự tạo bản ghi mới.