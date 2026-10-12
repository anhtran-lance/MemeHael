# Xuất HTML tương tác (một file, offline)

Dùng khi khách/người dùng muốn bản tương tác thay vì (hoặc cùng với) PDF. Gốc từ `base-service-flow-visualizer`.

Một file HTML tự chứa (font + logo base64), khung gồm: header logo + thanh tab (vạch trượt), toolbar, hàng chọn kịch bản, canvas cuộn + panel phải (hướng dẫn, chi tiết bước, lọc loại bước, nhật ký chạy), toast + tooltip.

**Tab:** Tổng quan (các lane QT + panel QT1/QT2 + mũi tên webhook), mỗi QT một tab (0.1, 0.2, 3.1, 1→2, 3.2), Bảng liên kết (bấm dòng → nhảy về Tổng quan). Hash routing, phím tắt: Space chạy/tạm dừng, N bước tiếp, R đặt lại, ←/→ đổi tab.

**Mô hình dữ liệu (JS):** mỗi tab là một graph `G(id,title,short,{sub,starts})`; node `N(g,id,text,kind,col,row)` trên lưới (cột pitch 210px, hàng 74px) hoặc `NX(g,id,text,kind,x,y,w,h)` tọa độ tay (cho tổng quan); cạnh `E(g,a,b,label,{link,type})`; chuỗi `C(g,[ids])`. Cạnh có label = nhánh rẽ (nhãn là pill bấm được để chọn nhánh). Cạnh `link:true` = webhook liên QT (đường cyan + chấm SVG animateMotion).

**Vẽ:** node là HTML định vị tuyệt đối; cạnh là lớp SVG overlay, mỗi cạnh 3 path (base, dash-chạy, trail cam). Routing trực giao có bo góc, phát hiện fan-out/merge để tách đường. Mũi tên marker phải đặt `markerUnits:'userSpaceOnUse'` kích thước ~9px (nếu không sẽ phình theo stroke). Node chữ dài: tăng chiều cao node (vd +16px), đừng cắt chữ.

**Chuyển động:** nét đứt chạy theo chiều luồng (stroke-dashoffset), chấm sáng trên cạnh webhook, ripple ở node webhook, WAAPI vào lần lượt khi mở tab, công tắc bật/tắt hiệu ứng.

**Mô phỏng (async engine):** nút Chạy mô phỏng thả token qua từng bước; Đồng thời tách token song song; Hợp nhất chờ đủ nhánh; Lựa chọn lấy theo select kịch bản hoặc click pill; Tạm dừng, Bước tiếp (step mode), Đặt lại, Ngẫu nhiên, tốc độ 0.5×/1×/2×/4×; tab Tổng quan chọn QT nguồn để chạy và token đi qua webhook sang QT 1 → QT 2. Click node → làm nổi đường vào/ra (upstream/downstream) + panel chi tiết; chú giải lọc theo loại bước; nhật ký chạy.

**QC bắt buộc trước khi giao:** Playwright, bắt console error/warning và pageerror = 0; click lần lượt mọi tab, bấm Chạy mô phỏng trên từng tab, chụp screenshot từng tab; kiểm tra node bị cắt chữ, nhãn chồng, đường nối xuyên node, mũi tên quá to. Sửa rồi chạy lại.

