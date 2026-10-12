# Case Nậm Na / Moonlight (dữ kiện riêng)

Chỉ dùng khi làm tiếp trên chính case này. Với khách thủy điện khác, bỏ số liệu ở đây.

## Cấu trúc tổ chức

- **Holding**: CT CP Đầu tư Moonlight (MST 0109865562, trụ sở Hà Nội). Mô hình "1 holding + 6 SPV".
- **Mảng thủy điện**: 3 nhà máy trên sông Nậm Na (Lai Châu), **~180 MW / 8 tổ máy**, ghép thủy lực
  NM1 → NM2 → NM3:
  - NM1 — CT CP Điện lực Tây Bắc: 30 MW / 2 tổ.
  - NM2 — CT CP Năng lượng Nậm Na 2: 66 MW / 3 tổ.
  - NM3 — CT CP Năng lượng Nậm Na 3: 84 MW / 3 tổ.
- **Mảng điện mặt trời**: 3 SPV Sơn La (đang triển khai).
- **Mảng BĐS & dịch vụ**: Moonlight Building, Nhà Gia Lâm, IPD VN.
- Lãnh đạo kiêm nhiệm. **Bài toán số 1 = báo cáo hợp nhất về công ty mẹ.**

## Hằng số tài chính minh họa (tháng 6/2026, "số minh họa", ĐVT tỷ đồng)

- Doanh thu PPA cụm **77,0** (KH 79,2 → đạt **97,2%**); sản lượng **70.000 MWh** (KH 72.000);
  giá PPA **1.100 đ/kWh**.
- Per nhà máy (SL MWh / DT / CP / EBITDA / LNTT / biên):
  - NM1: 11.800 / 12,98 / 7,2 / 9,6 / 5,78 / 44,5%
  - NM2: 26.000 / 28,60 / 15,6 / 21,1 / 13,0 / 45,5%
  - NM3: 32.200 / 35,42 / 18,7 / 26,3 / 16,72 / 47,2%
- Cụm: CP **41,5** · EBITDA **64,0** (biên 83,1%) · LNTT **35,5** (biên 46,1%).
- Cơ cấu chi phí tháng 6: Khấu hao 22,0 · Lãi vay 6,5 · O&M 4,3 · Nhân công 4,0 · Sửa chữa lớn
  2,5 · Thuế TN & phí DVMTR 1,8 · Khác 0,4.
- Chi bằng tiền 17,8 → **dòng tiền thuần +59,2**. Phải thu EVN/EPTC **31,2** (kỳ thu ~42 ngày;
  quá 60N 1,2). Phải trả 12,8 → công nợ ròng +18,4. Dòng tiền Q3 dự kiến +165.
- 8 tổ máy (công suất MW / SL MWh / DT tỷ, tháng 6): NM1 mỗi tổ 15/5.900/6,49; NM2 mỗi tổ
  22/~8.667/9,53; NM3 mỗi tổ 28/~10.733/11,81. Khả dụng ~98–99%.

## Nhân sự (BSC)

- 122 CBCNV (NM1 28 · NM2 34 · NM3 38 · HQ Hà Nội 22), 8 phòng ban.
- BSC 4 khía cạnh: Kết quả 40% · Khách hàng 20% · Quy trình 25% · Học hỏi 15%.
  Xếp loại: A≥90 / B 82–90 / C 75–82 / D<75. Điểm cụm b/q ≈ 88,3.
- Điểm yếu minh họa: NM2 / PX Vận hành thấp nhất (Quy trình ~81); HQ yếu ở Học hỏi.

## Danh mục deliverable đã dựng (trong /mnt/user-data/outputs/)

- `luong_van_hanh_nam_na.html` — bản đồ 7 luồng (luồng 6 "Công ca & Đánh giá hiệu suất" trỏ
  sang dashboard đánh giá; luồng 7 trỏ sang dashboard công ty mẹ).
- `dashboard_bao_cao_cong_ty_me_moonlight.html` — holding 4 nhóm; tab ① có link-card mở báo
  cáo tài chính; tab ③ có link-card mở đánh giá nhân sự.
- `dashboard_danh_gia_nhan_su_moonlight.html` — BSC nhân sự (heatmap drill, KPI theo ngày, cảnh báo).
- `dashboard_dieu_hanh_cum_nam_na.html`, `dashboard_muc7_phan_tich_nam_na.html` — điều hành & sản
  lượng tới tổ máy.
- `bao_cao_tai_chinh_thuy_dien_moonlight.html` — báo cáo tài chính 5 trang kiểu ECV (đã có: lọc
  cả trang theo nhà máy, Thực tế/Lũy kế, so kế hoạch, heatmap ma trận đồng bộ cột, bảng hóa đơn
  đến hạn, thu/chi theo đối tượng, run-rate...).
- `Moonlight_Demo_BaoCao_SoHoa.pptx` — deck demo 12 slide (nhớ điền liên hệ thật ở slide cuối).

## Lưu ý vận hành

- SCADA không động, chỉ đọc; số hóa "vết" quanh SCADA.
- Đối soát PPA: công tơ đo đếm (chính thức) ↔ SCADA ↔ EVN/NSMO.
- An toàn đập theo NĐ 114; phí DVMTR nộp Quỹ BV&PT rừng.
