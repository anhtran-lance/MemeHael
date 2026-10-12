---
name: "base-appscript-bao-cao-ngay"
description: "Dựng báo cáo ngày Google Sheet + Apps Script đồng bộ từ Base.vn CRM (account/list, account/get, Daily note, nhật ký chuyển giai đoạn, nhân sự) cho phòng ban như CHEM Sales/Sourcing, kèm bộ mã mẫu đầy đủ."
---

# Báo cáo ngày Google Sheet + Apps Script từ Base.vn CRM

Dùng khi cần dựng, sửa hoặc nhân bản một Google Sheet báo cáo ngày cho một phòng ban, dữ liệu lấy từ Base CRM bằng Apps Script gắn vào Sheet (container-bound). Đã làm thật cho CHEM Sales (service 10603, viewer 10062) và CHEM Sourcing (service 11139), mỗi phòng một Sheet + một script riêng, tenant `ctcptldvn.base.vn`. Người dùng nói tiếng Việt: trả lời tiếng Việt, ngắn gọn.

Giao hàng = MỘT file `.gs` hoàn chỉnh (gửi bằng SendUserFile) + hướng dẫn dán đè vào Apps Script. Không giao mảnh vá rời rạc: lần nào sửa cũng gửi lại cả file đã chạy qua kiểm thử (mục 9).

## 0. Quy trình làm việc
1. Hỏi (AskUserQuestion) các điểm chưa rõ: phòng ban, service_id, viewer user_id, tenant, các khối báo cáo, bảng giai đoạn CRM (xin ảnh cột pipeline), cách tính KPI/target, nhóm nhân sự. Nếu người dùng gửi ảnh Sheet hiện tại thì giữ nguyên bố cục.
2. Viết script từ bộ mã mẫu mục 3–7 (copy rồi chỉnh cấu hình, không viết lại từ đầu).
3. Chạy kiểm thử (mục 9), gửi file, nói rõ phần chưa kiểm chứng trên Sheet thật.
4. Người dùng dán, chạy menu, gửi ảnh/output chẩn đoán: đọc kỹ ảnh, đối chiếu với mục 8 trước khi kết luận. Chẩn đoán trên dữ liệu thật (ảnh) trước, đoán mò sau.

## 1. Sự thật về API Base đã kiểm chứng
- Sales API v1: `POST https://apis.base.vn/sales/v1/account/list` (tham số `access_token`, `page`, `limit`, `service_id`, tuỳ chọn `user_id`) và `/account/get` (`id`, `user_id`). Token + (nếu có) `password` lưu Script Properties; **token lưu theo từng Sheet** nên mỗi Sheet mới phải lưu lại qua menu (lỗi `INVALID TOKEN APPKEY` = chưa lưu/ sai Sheet).
- `account/list` chỉ trả bản nhẹ: id, name, owner_id, stage_id, since, last_update, last_activity_ts, content, stats. Trường tuỳ chỉnh chỉ có trong `account/get` → `account.form[]` (mỗi phần tử: id, code, name, value, display, type, gs_key). Gộp: `a = Object.assign({}, a0, d.account)`. Gọi `account/get` cho từng account.
- **Daily note** là trường `input-table` (cột Date, Update): `value` = base64 URL-safe KHÔNG padding của JSON `[[unix_ts,"nội dung"],...]`; `display` = các dòng `dd-mm-yyyy|nội dung`. Có thể có nhiều trường tên có "ghi chú" → xếp hạng, ưu tiên đúng tên "Daily note".
- Giai đoạn: Sourcing có trường select `Status` (display = tên giai đoạn, ví dụ Newly added, Contacting, Đúng hàng/ Tiềm năng, Verified, Quality Approved, Ordered, Sai hàng/ Không tiềm năng, Hold); `stage_id` chỉ là mã số (2294, 2295=Contacting, 2298, 2300, 2301=Đúng hàng/ Tiềm năng). **API không có lịch sử chuyển giai đoạn** → script tự ghi log (mục 5).
- `last_activity_ts` thường = 0 vì ghi chú nằm trong form, không phải mục activity; đừng dựa vào nó để lọc.
- **Phân trang bị lặp**: API có lúc trả cùng một trang cho trang 0 và trang 1 (12 account hiện thành 24 dòng, mọi thống kê bị double). Luôn dedupe theo id.
- Nhân sự: `POST https://{tenant}.base.vn/account/extapi/v1/user/all` với `access_token` (không cần password). `account.base.vn/extapi/v1/user/all` → "File Not Found"; `account.base.vn/extapi/v1/users` → `access_token_invalid_2` (token CRM không có quyền app Account; cần token app Account). Chưa lấy được thì người dùng gõ tên tay vào cột B sheet nhân sự. Chưa chứng minh response dạng nào: dùng `firstArray_` tìm mảng đầu tiên, trường `id|user_id`, `name|fullname|username`.
- `deal/list` không khả dụng ở Sales: nói rõ phần chưa có dữ liệu.
- Chẩn đoán nhanh: menu `★ Chẩn đoán tổng hợp` in số account, mỗi giai đoạn, danh sách trường `form`, mẫu Daily note. Luôn có menu debug để người dùng dán output về.

## 2. Quy tắc nghiệp vụ đã chốt với người dùng
- Ngày báo cáo = ô `C3` (date validation, đặt bằng `todayMid_()`); trigger `setReportDateToday` 0h hàng ngày đưa về hôm nay.
- Bảng "KH/NCC đàm phán" **không phụ thuộc giai đoạn CRM**: chỉ lấy account có dòng Daily note **đúng ngày báo cáo**, hiển thị nội dung update của ngày đó (cột U của sheet dữ liệu: `dd/mm/yyyy: nội dung`). Đã từng sai khi dùng giai đoạn → người dùng yêu cầu bỏ.
- Sourcing KHÔNG có khối đơn chờ/xác nhận. Thêm khối "NCC MỚI & CHUYỂN GIAI ĐOẠN TRONG NGÀY": 3 chỉ số (NCC Newly added = dòng Loại "Thêm mới" trong ngày; NCC chuyển sang Đúng hàng/ Tiềm năng = dòng đến giai đoạn đó, trừ "Cập nhật tên"; tổng data mới/chuyển = mọi dòng trừ "Cập nhật tên") + danh sách (Supplier, Từ, Đến, Owner, Country, Product, Loại, Owner ID) + dòng tổng.
- Bảng đàm phán có cột Owner = tên nhân sự (cột S sheet dữ liệu), không phải ID.
- Chỉ hiển thị nhân sự thật trên hệ thống; **không seed nhân sự mẫu** (ferrie, sourcing_b... đã bị người dùng yêu cầu xóa). Owner ID lạ → tự thêm vào sheet nhân sự với tên = ID để người dùng sửa.
- Bảng giai đoạn → nhóm (NEG/PEND/CONF/LOST) là do script điền mặc định (`fillStageMap_`), không đè lựa chọn của người dùng.
- Ghi chú cho người dùng: ngày của dòng "Chuyển giai đoạn" = ngày đồng bộ; dòng "Thêm mới" lấy ngày tạo account; chọn ngày không có NCC tạo thì số = 0 là đúng.

## 3–4. Bộ mã mẫu (cấu hình, locale vi_VN, đọc form, Daily note, syncAccounts, nhật ký giai đoạn, nhân sự, syncActivities, trigger & menu)
Đọc `references/code-samples.md` khi dựng hoặc sửa mã. Locale Sheet vi_VN (mục 3.1) là BẮT BUỘC.

## 5. Công thức báo cáo (viết dạng en-US, bọc `fx_`)
Quy ước: `D_`/`S_`/`A_` là tiền tố `'Tên sheet'!`; `RPT!$C$3` = ngày báo cáo; `$K$6` = tiêu chí nhân sự (`=IF($F$3="Tất cả","?*",$F$3)`).
- S (tên nhân sự): `=ARRAYFORMULA(IF($A$2:$A="","",IFERROR(VLOOKUP($D$2:$D,FILTER({S_!$A$2:$A,S_!$B$2:$B},S_!$E$2:$E="Có"),2,0),"")))`
- T (nhóm): `=ARRAYFORMULA(IF($A$2:$A="","",IFERROR(IF(VLOOKUP($N$2:$N,S_!$L$2:$M,2,0)="","Khác",VLOOKUP($N$2:$N,S_!$L$2:$M,2,0)),"Khác")))`
- U (Daily note đúng ngày): `=MAP($A$2:$A,LAMBDA(id,IF(id="","",IFERROR(TEXT(INT(RPT!$C$3),"dd/mm/yyyy")&": "&TEXTJOIN(CHAR(10),TRUE,FILTER(A_!$H$2:$H,ARRAYFORMULA(TO_TEXT(A_!$D$2:$D))=TO_TEXT(id),A_!$B$2:$B>=INT(RPT!$C$3),A_!$B$2:$B<INT(RPT!$C$3)+1)),""))))`
- Danh sách đàm phán (`supplierBlock_`): FILTER trên cột `{name,potential,country,ctype,product,contact,id,U,S}` với điều kiện `(S=$F$3 hoặc Tất cả)*(S<>"")*(U<>"")`, SORT theo tên, `ARRAY_CONSTRAIN(...,cap,9)`, `HSTACK(CHOOSECOLS(t,1,2,3,4,5),INDEX(t,0,8),CHOOSECOLS(t,6),INDEX(t,0,9))` (Daily note = U, Owner = S). Tổng: `COUNTIFS(U,"?*",S,$K$6)`.
- KPI giai đoạn trong ngày (log = sheet `Chuyển giai đoạn`, `g(c)` = `STG!$c$2:$c`): `=COUNTIFS(g(A),">="&$C$3,g(A),"<"&$C$3+1,g(H),$K$6,g(K),"Thêm mới")`; đến Đúng hàng: thêm `g(F),"Đúng hàng/ Tiềm năng",g(K),"<>Cập nhật tên"`; tổng: `g(K),"<>Cập nhật tên"`.
- Danh sách data được chuyển: `=IFERROR(ARRAY_CONSTRAIN(SORT(FILTER({g(D),g(E),g(F),g(H),g(I),g(J),g(K),g(G)},(g(A)>=$C$3)*(g(A)<$C$3+1)*((g(H)=$F$3)+($F$3="Tất cả")>0)*(g(K)<>"Cập nhật tên")*(g(C)<>"")),7,TRUE,1,TRUE),14,8),"")`.
- Khối hiệu suất nhân sự: `COUNTIFS` theo tên nhân sự (cột S) + nhóm (cột T), % hoàn thành = Quantity chốt / target (sheet nhân sự F:J), cột đánh giá so với `K8` = `DAY($C$3)/DAY(EOMONTH($C$3,0))` (% tiến độ kỳ vọng).

### Quy tắc để công thức không hỏng
- So khớp ID bằng text: `ARRAYFORMULA(TO_TEXT(range))=TO_TEXT(id)`; cột ID, owner, tên nhân sự, giai đoạn định dạng `@`.
- COUNTIFS các vùng cùng kích thước, từ hàng 2 (`$X$2:$X`) — dùng cả cột sẽ đếm nhầm header ("1 NCC" cho bảng rỗng).
- Tiêu chí nhân sự "Tất cả" → `"?*"` (khớp mọi chuỗi không rỗng, KHÔNG khớp số thuần → tên phải là text).
- Ngày báo cáo phải là giờ 00:00 (`todayMid_`), lọc khoảng `>= C3` và `< C3+1`.
- Công thức mảng (MAP/LAMBDA/LET/HSTACK) đặt ở ô đầu cột, vùng dưới để trống, không ghi đè từ script.

## 6. Bảng lỗi thường gặp → nguyên nhân → cách sửa
| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| `INVALID TOKEN APPKEY` | Token lưu theo Sheet, chưa lưu | Menu Lưu token CRM trong đúng Sheet |
| "Không tìm thấy hàm tập lệnh syncCrmData" | Trigger cũ trỏ hàm đã đổi tên | `removeAllTriggers` rồi `installTrigger` |
| `#ERROR!` | Dấu `,` trong locale vi | Bọc `fx_()` |
| Tình trạng/ID không khớp | ID số vs chữ | `TO_TEXT` + định dạng `@` |
| Báo cáo 0 dòng | Bản đồ giai đoạn trống hoặc tên nhân sự là số | `fillStageMap_`, tên text |
| "1 NCC" nhưng bảng trống | COUNTIFS đếm header | `$2:$` |
| Không thấy note | Chọn nhầm trường "ghi chú" | Xếp hạng, ưu tiên "Daily note" |
| Dữ liệu bị double | Phân trang trả lặp | dedupe theo id + dừng khi trang lặp / `< limit`; `dedupeStageLog` |
| Số liệu đứng yên, ngày báo cáo cũ | Chưa cài trigger (trang Triggers trống) | `installTrigger` |
| KPI = 0 nhưng danh sách có dòng | KPI đếm điều kiện khác danh sách | Dùng cùng điều kiện (trừ "Cập nhật tên") |
| Owner hiện số | Sheet nhân sự chưa có tên | `syncStaff` hoặc gõ tay cột B |
| API Account `access_token_invalid_2` / "File Not Found" | Token CRM không đủ quyền app Account / sai host | Token app Account + host `{tenant}.base.vn/account/extapi/...`; `probeAccount` in kết quả từng URL |
| Giai đoạn hiện mã số (2300) | `stage_id` chưa có trong `STAGE_NAMES`, trường Status rỗng | Thêm mã vào `STAGE_NAMES`; log sẽ ghi "Cập nhật tên" khi có tên |
| Vượt 6 phút | Nhiều account | `maxMinutes`, trạng thái "CHƯA ĐỦ", chạy lại/trigger |

## 7. Giao diện báo cáo (sheet `Báo cáo ngày`, A:I, cột K:M là vùng tính toán)
Hàng 1 tiêu đề (nền navy `#1f3864`, chữ trắng); hàng 2 dòng ngày/tháng/phạm vi/giờ đồng bộ; hàng 3 ô ngày (C3, nền vàng `#fff2cc`) và ô nhân sự F3:G3 (dropdown từ `Danh sách nhân sự!O2:O60`); K4:K8 = đầu tháng, ngày kế tiếp, tiêu chí nhân sự, cuối tháng, % tiến độ. Mỗi khối: dải tiêu đề navy (`sectionBand_` merge 9 cột), nhãn bên trái merge dọc (`sideLabel_`), header `#b4c6e7`, zebra `#eef3fb`, viền `#c9d3e6`, dòng tổng nền xanh nhạt. Font Arial 10. Số dòng mỗi bảng cố định (`CAP`), dòng tổng có cảnh báo "⚠ Còn N dòng chưa hiển thị" khi vượt. Biểu đồ dùng `sh.newChart()`; xoá chart cũ trước khi dựng lại (`getCharts().forEach(removeChart)`), `breakApart().clear()` vùng cũ trước khi merge lại. Khối thêm sau cùng: chen thêm hàng phải cập nhật các số hàng cố định của khối dưới (`last = ...`).

## 8. Quy tắc chẩn đoán khi người dùng báo lỗi
1. Đọc ảnh thật kỹ: số nhật ký, ngày báo cáo, giờ đồng bộ ở hàng 2, dòng/cột đang thiếu.
2. So số dòng sheet dữ liệu với số account thật (12 account → 24 dòng = double phân trang).
3. Kiểm tra định nghĩa KPI với danh sách ngay bên dưới, đối chiếu trực tiếp công thức ô (thanh công thức trong ảnh).
4. Phân biệt "phiên bản code cũ" với "lỗi thật": nếu output người dùng gửi vẫn có dòng cũ (ví dụ danh sách URL không có tenant) thì họ chưa dán code mới — nói rõ và yêu cầu dán lại.
5. Với API/token: yêu cầu `probeAccount`/`diagnoseAll` và đọc mã `code`/`message`; không đán giá không tự đăng nhập Base, không nhập token hộ người dùng, không tự đổi quyền.
6. Nếu chưa lấy được nhân sự qua API: luôn đưa phương án dự phòng gõ tay cột B (báo cáo vẫn chạy).

## 9. Kiểm thử trước khi giao (bắt buộc)
- `cp file.gs /tmp/x.js && node --check /tmp/x.js`.
- Viết mock Node (file `mock.js` đọc bản copy của `.gs`): giả `SpreadsheetApp` (getActive, getSheetByName, insertSheet, getRange… lưu ô trong Map, setFormula/setValues/getValues/clearContent/merge/breakApart…), `PropertiesService`, `UrlFetchApp` (trả JSON giả gồm account/list trả LẶP cùng trang để thử dedupe và account/get có `form` chứa Daily note base64), `Utilities` (base64 web-safe, formatDate, newBlob), `ScriptApp`, `Logger`. Chạy `setupAll` + `syncAccounts` + `syncActivities`; assert: không công thức nào lỗi dấu (`bad 0` = không công thức chứa `,` sai chỗ trong locale `;`), mỗi account chỉ một dòng, log giai đoạn chỉ đúng số dòng cần.
- Test riêng `logStageChanges_` với 3 lần chạy: lần 1 (mới), lần 2 đổi giai đoạn, lần 3 đổi mã số→tên; và truyền `rows` trùng id để chứng minh không ghi trùng.
- Test parser Daily note bằng mẫu base64 thật do người dùng gửi (`debugDailyNote` in mẫu).
- Luôn copy bản `.gs` MỚI NHẤT đè lên file mock trước khi chạy lại (đã từng test nhầm bản cũ).
- Chrome tới Sheet thật chỉ để xem/chụp; không tự đăng nhập, không nhập token.

## 10. Nhân bản cho phòng ban/Sheet khác (checklist)
1. Đổi `serviceId`, `viewerId`, `tenant`, tên menu, tiêu đề báo cáo, `STAGE_NAMES`, `fillStageMap_`.
2. Chạy `★ Chẩn đoán tổng hợp` trên Sheet mới để lấy: danh sách trường `form` (sửa `FIELD_NAMES`), các giai đoạn, mẫu Daily note.
3. Xác nhận với người dùng bố cục khối (Sales: đơn chờ/xác nhận, kênh liên hệ, hiệu suất; Sourcing: NCC mới/chuyển giai đoạn, đàm phán, hiệu suất).
4. Sau khi giao: nhắc người dùng (a) lưu token trong đúng Sheet, (b) `setupAll`, (c) `syncAccounts`, `syncActivities`, (d) `Cài lịch tự động`, (e) điền tên nhân sự/target, (f) kiểm tra ngày báo cáo về hôm nay.
5. Việc còn mở thường gặp: token app Account cho tên nhân sự, KPI target, dữ liệu deal, ánh xạ nhóm (ĐPB1/Care VIP) cho Sales.