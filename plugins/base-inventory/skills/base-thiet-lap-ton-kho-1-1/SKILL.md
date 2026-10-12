---
name: "base-thiet-lap-ton-kho-1-1"
description: "Thiết lập trên Base.vn quy trình nhận đơn mua/bán 1 sản phẩm mỗi đơn và theo dõi tồn kho bằng lô hàng (phương án 1-1), dùng khi cấu hình workflow, dataset và automation tồn kho."
---

# Thiết lập tồn kho theo phương án 1-1 trên Base.vn

Skill này dựng luồng: đơn được tạo trong workflow → một bản ghi dòng đơn trong dataset → một lô hàng tồn kho. Tồn kho của một sản phẩm = tổng số lượng các lô của sản phẩm đó (đơn mua dương, đơn bán âm).

## Nguyên tắc

Mỗi đơn chỉ có một sản phẩm và một số lượng. Không dùng bảng (Table) nhiều dòng trong workflow vì automation hiện chưa đọc được sub-field của bảng. Nếu khách cần nhiều sản phẩm trong một đơn, tạo nhiều đơn hoặc chuyển sang phương án nhiều dòng sau khi đã kiểm tra Loop đọc được sub-field.

## Bước 1: Dataset

Tạo hoặc kiểm tra các dataset sau trong ứng dụng Datasets.

1. Dataset Sản phẩm (nếu chưa có) để làm nguồn cho dropdown.
2. Dataset Dòng đơn mua với các trường: Sản phẩm (chọn) là dropdown, lấy từ danh sách sản phẩm; Số lượng là số nguyên; Mã đơn mua là văn bản.
3. Dataset Dòng bán hàng với cấu trúc tương tự, số lượng nhập dương và automation sẽ đổi dấu.
4. Dataset Lô hàng tồn kho với các trường: Sản phẩm (chọn) là dropdown; Số lượng mua là số nguyên (dương khi mua, âm khi bán); Trạng thái là dropdown gồm Chưa về kho, Đã về kho một phần, Đã về kho; Mã đơn mua là văn bản.

Kiểm tra mỗi dropdown có đúng các lựa chọn cần thiết trước khi nối automation. Thêm lựa chọn mới vào dataset gốc, không thêm tạm trong automation.

## Bước 2: Workflow đơn mua và đơn bán

Ở mục Cài đặt > Trường của workflow "Quản lý đơn mua hàng" và "Quản lý đơn bán hàng":

1. Giữ trường Mã đơn mua (hoặc Mã đơn bán) kiểu Text.
2. Thêm trường Sản phẩm kiểu Dropdown, hoặc kiểu Link dataset record trỏ tới dataset Sản phẩm nếu cần chọn từ dữ liệu có sẵn.
3. Thêm trường Số lượng kiểu Integer.
4. Xóa hoặc không dùng trường Dòng hàng kiểu Table trong luồng 1-1.

Lưu ý: kiểu Link dataset record chỉ liên kết bản ghi có sẵn, không tự tạo bản ghi mới.

## Bước 3: Automation nối workflow với dataset

Tạo automation cho đơn mua:

1. Trigger: Job event với sự kiện Job created, workflow Quản lý đơn mua hàng.
2. Action: Create record vào Dòng đơn mua, ánh xạ Sản phẩm (chọn) ← trường Sản phẩm của job, Số lượng ← trường Số lượng của job, Mã đơn mua ← trường Mã đơn mua của job, Name ← tên sản phẩm hoặc mã đơn.
3. Lưu, rồi Publish.

Automation đơn bán làm tương tự, trỏ tới Dòng bán hàng.

Automation "Tồn kho - đơn mua (theo dòng)" đã có sẵn: khi có bản ghi mới trong Dòng đơn mua, tạo một lô trong Lô hàng tồn kho với Số lượng mua dương, Trạng thái Chưa về kho và Sản phẩm (chọn) được ánh xạ từ trigger. Không sửa automation này trừ khi có lỗi.

Automation "Phân bổ tồn kho - đơn bán (theo dòng)" đã có sẵn: tạo lô với số lượng âm từ Dòng bán hàng.

## Bước 4: Kiểm thử

1. Xóa các bản ghi thử cũ trong Lô hàng tồn kho và Dòng đơn mua trước khi test.
2. Tạo một đơn mua trong workflow với một sản phẩm và số lượng dương. Kiểm tra: có đúng một bản ghi Dòng đơn mua, có đúng một lô hàng với số lượng dương và đúng sản phẩm.
3. Tạo một đơn bán cùng sản phẩm với số lượng nhỏ hơn. Kiểm tra: có một lô âm, tổng tồn kho của sản phẩm bằng mua trừ bán.
4. Kiểm tra Runs của từng automation để xem có lỗi "400 Enter a name or at least one field value" không. Lỗi này thường do một trường bắt buộc chưa được ánh xạ.

## Bước 5: Bàn giao

Ghi lại tên dataset, tên workflow, tên automation và danh sách dropdown đã dùng. Nêu rõ các bản ghi test đã xóa và các bản nháp không dùng (ví dụ automation Tồn kho theo bảng) để người dùng xóa thủ công, vì skill không xóa dữ liệu.

## Giới hạn đã biết

- Automation không đọc được sub-field của trường Table trong workflow tại thời điểm thiết lập.
- Transform và Transformers node không tách được chuỗi JSON của trường Table.
- Không xóa bản ghi hoặc automation thay người dùng; các thao tác xóa phải do người dùng thực hiện.