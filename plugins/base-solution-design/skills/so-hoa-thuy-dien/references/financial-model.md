# Mô hình tài chính đặc thù thủy điện

Dùng để dựng "Báo cáo tài chính chi tiết". Số cụ thể của Nậm Na ở `nam-na-case.md`; file này
là **logic & cơ cấu chung** áp dụng cho mọi nhà máy thủy điện.

## 1. Doanh thu

- **Doanh thu = Sản lượng (MWh) × Giá PPA (đ/kWh).**
- Sản lượng thanh toán lấy từ **công tơ đo đếm** (SCADA chỉ đối chiếu).
- Giá PPA thường ổn định theo hợp đồng/biểu giá EVN (ví dụ minh họa ~1.100 đ/kWh); một phần
  có thể theo thị trường (chào giá D-1).
- Theo dõi **KH vs Thực tế** cho cả sản lượng và doanh thu; % Đạt KH dùng ngưỡng màu chuẩn
  (≥98% xanh / 95–98% vàng / <95% đỏ).

## 2. Cơ cấu chi phí (đặc thù — khấu hao & lãi vay chiếm phần lớn)

Thứ tự tỷ trọng điển hình:

1. **Khấu hao** — lớn nhất (thường ~50%+ tổng chi phí). Không phải chi bằng tiền.
2. **Lãi vay** — lớn, xu hướng **giảm dần** khi trả nợ gốc.
3. **O&M** (vận hành & bảo dưỡng thường xuyên).
4. **Nhân công** (lương + BHXH; có phụ cấp vùng sâu vùng xa).
5. **Sửa chữa lớn** (định kỳ, biến động theo lịch đại tu tổ máy).
6. **Thuế tài nguyên & phí dịch vụ môi trường rừng (DVMTR)** — đặc thù ngành, nộp Quỹ BV&PT rừng.
7. **Khác**.

→ Trong dashboard: stacked bar theo mảng theo tháng; doughnut cơ cấu; bảng nhà máy × mảng
(heatmap "ô đậm = chi phí lớn").

## 3. EBITDA vs LNTT (điểm cần giải thích với khách)

- **EBITDA = LNTT + Khấu hao + Lãi vay.**
- Vì khấu hao + lãi vay rất lớn → **biên EBITDA rất cao (~80%+)** trong khi **biên LNTT vừa
  phải (~45%)**. Đây là đặc trưng thủy điện, đừng để người xem nhầm biên LNTT thấp là kém.

## 4. Dòng tiền (dòng tiền > lợi nhuận)

- **Chi bằng tiền = Tổng chi phí − Khấu hao** (khấu hao không phải chi tiền; lãi vay là chi tiền).
- ⇒ **Dòng tiền thuần từ hoạt động > lợi nhuận kế toán.**
- Trình bày: bar Thu/Chi theo tháng + đường dòng tiền thuần; tách "Chi bằng tiền" vs "Tổng chi phí".
- Dự phóng theo mùa (Q3 nước về cao → dòng tiền tăng mạnh).

## 5. Công nợ

- **Phải thu**: chủ yếu từ **EVN/EPTC (Công ty Mua bán điện)** theo kỳ thanh toán PPA
  (bình quân ~42 ngày). Phân tích theo **tuổi nợ** (≤30 / 31–60 / 61–90 ngày) và theo nhà máy
  (ma trận nhà máy × tuổi nợ).
- **Phải trả**: lãi vay đến hạn, NCC thiết bị/vật tư, thuế & phí DVMTR, lương & BHXH.
- **Công nợ ròng = Phải thu − Phải trả.**
- Thêm **bảng hóa đơn/chứng từ đến hạn** (30 ngày tới & quá hạn): đối tượng, loại, số tiền,
  ngày đến hạn, số ngày còn lại, trạng thái (badge).

## 6. Bố cục báo cáo tài chính (5 trang)

1. **Tổng quan điều hành** — KPI (Doanh thu PPA, EBITDA, LNTT, Dòng tiền thuần, Phải thu EVN);
   biểu đồ doanh thu theo nhà máy + đường KH; chi phí & biên LN; dòng tiền; bảng theo nhà máy.
2. **Doanh thu (PPA)** — doanh thu theo thời gian (đóng góp theo nhà máy) + đường Kế hoạch;
   sản lượng & giá PPA (thêm đường KH sản lượng); đóng góp lũy kế năm TT vs KH; cơ cấu theo NM;
   bảng SL & doanh thu KH/TT theo nhà máy. **Bộ lọc nhà máy áp dụng cho cả trang** + toggle
   **Thực tế / Lũy kế**.
3. **Chi phí** — theo mảng theo thời gian (toggle Thực tế/Lũy kế, lọc nhà máy); cơ cấu
   (doughnut); TH vs Ngân sách; cơ cấu theo nhà máy; **xu hướng tổng CP & chi bằng tiền**;
   **chi phí theo đơn vị/nhà cung cấp**; **bảng dự báo run-rate cả năm**; heatmap nhà máy × mảng.
4. **Công nợ** — toggle **Cả hai / Phải thu / Phải trả**; tuổi nợ phải thu; phải trả theo
   đối tượng; ma trận nhà máy × tuổi nợ; bảng chi tiết; **bảng hóa đơn đến hạn**.
5. **Dòng tiền** — thu/chi theo tháng + dự kiến; dòng tiền theo nhà máy; thu/chi theo đối
   tượng (tab Dòng thu/Dòng chi); ma trận nhà máy × tháng; lịch thu/chi; nhật ký.

## 7. Nguyên tắc số liệu

- Tất cả gắn **"số minh họa"** nếu chưa có số thật; ĐVT **tỷ đồng** (ghi rõ).
- Phân bổ theo nhà máy khi thiếu số chi tiết: dùng **tỷ trọng** (share) từ số tổng — ví dụ
  chi phí theo nhà máy = tổng cụm × share nhà máy; sản lượng/plan theo nhà máy = cụm × share.
