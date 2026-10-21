/**
 * BÁO CÁO NGÀY – SOURCING (CHEM)   |   Apps Script dựng toàn bộ file Google Sheet
 * ----------------------------------------------------------------------------------
 * Bố cục theo form "Daily Report 2026 – Sourcing" + dashboard biểu đồ theo template quản lý chỉ tiêu.
 *
 *  Sheet 1  Báo cáo ngày        KPI Target/Hoàn thành, 4 biểu đồ, Đơn chờ xác nhận, Đơn xác nhận,
 *                               NCC đàm phán, Kênh liên hệ, Hiệu suất theo nhân sự
 *  Sheet 2  Thông tin dữ liệu   Dữ liệu account (nhà cung cấp) đổ từ CRM Base bằng Apps Script
 *  Sheet 3  Danh sách nhân sự   Đối chiếu / lọc nhân sự + target + ánh xạ giai đoạn CRM
 *  Sheet 4  Activity theo ngày  Note / activity theo ngày (đổ từ API get.activities)
 *
 * CẤU HÌNH: service CHEM (SOURCING) = 11139 | user_id người xem = 10062 | API Base Sales v1
 *
 * CÁCH DÙNG
 *  1. Tiện ích > Apps Script > dán toàn bộ file này > Lưu.
 *  2. Chạy hàm setupAll (cấp quyền lần đầu) > tải lại Sheet để hiện menu "Báo cáo Sourcing".
 *  3. Kết nối: Lưu token (v1) > Lưu password > Kiểm tra kết nối API > Xem trường tuỳ chỉnh account
 *     > điền FIELD_MAP bên dưới > Đồng bộ account > Đồng bộ activity > Cài lịch tự động.
 *
 * GIAI ĐOẠN (Stage): lấy từ stage_id của CRM, ánh xạ qua STAGE_NAMES bên dưới. Trường "Status" KHÔNG dùng.
 *  Account không có stage_id => "Unstaged". Mã stage_id chưa khai báo sẽ hiện số: thêm vào STAGE_NAMES.
 */

/* ===================== CẤU HÌNH ===================== */
/* ===================== TƯƠNG THÍCH NGÔN NGỮ SHEET (dấu phân cách công thức) =====================
   Sheet đặt ngôn ngữ Việt Nam dùng dấu ";" giữa các đối số và "\" giữa cột trong {..}, số thập phân là ",".
   setFormula KHÔNG tự đổi dấu, nên mọi công thức đi qua fx_() để chuyển cho đúng ngôn ngữ của Sheet. */
let SEMI_ = null;
function semi_() {
  if (SEMI_ !== null) return SEMI_;
  const ss = SpreadsheetApp.getActive();
  const tmp = ss.insertSheet('_tmp_locale');
  try {
    tmp.getRange('A1').setFormula('=SUM(1,2)');
    SpreadsheetApp.flush();
    SEMI_ = tmp.getRange('A1').getValue() !== 3;      // lỗi => Sheet dùng dấu ";"
  } finally { ss.deleteSheet(tmp); }
  return SEMI_;
}
function fx_(f) {
  if (typeof f !== 'string' || !semi_()) return f;
  let out = '', i = 0;
  const stack = [];                                  // ngăn xếp ngoặc: '{' (mảng) hay '(' (hàm)
  while (i < f.length) {
    const c = f[i];
    if (c === '"' || c === "'") {                       // chuỗi / tên sheet: giữ nguyên (trừ mẫu định dạng số như #,##0.0)
      let j = i + 1;
      while (j < f.length) { if (f[j] === c) { if (f[j + 1] === c) { j += 2; continue; } break; } j++; }
      let body = f.slice(i + 1, j);
      if (c === '"' && /^[#0,.]+$/.test(body)) body = body.replace(/[,.]/g, m => (m === ',' ? '.' : ','));
      out += c + body + c; i = j + 1; continue;
    }
    if (c === '{' || c === '(') stack.push(c);
    if (c === '}' || c === ')') stack.pop();
    if (c === ',') out += stack[stack.length - 1] === '{' ? '\\' : ';';
    else if (c === '.' && /\d/.test(f[i - 1] || '') && /\d/.test(f[i + 1] || '')) out += ',';
    else out += c;
    i++;
  }
  return out;
}

const SH = { RPT: 'Báo cáo ngày', DATA: 'Thông tin dữ liệu', STAFF: 'Danh sách nhân sự', ACT: 'Activity theo ngày', STG: 'Chuyển giai đoạn' };
const GRP = { PEND: 'Đơn chờ xác nhận', CONF: 'Đơn đã xác nhận', NEG: 'NCC đàm phán', LOST: 'Đã loại' };
const CAP = { PEND: 8, CONF: 8, NEG: 15, STAFF: 8 };          // số dòng hiển thị mỗi bảng
const CH = ['LinkedIn', 'Wechat/Zalo', 'Email', 'Whatsapp'];     // các kênh liên hệ trong báo cáo
const PIPELINE = ['Unstaged', 'Newly added', 'Contacting', 'Đúng hàng/ Tiềm năng', 'Verified', 'Quality Approved', 'Ordered', 'Sai hàng/ Không tiềm năng', 'Hold'];   // các cột pipeline CRM Sourcing (đúng thứ tự)
const COLOR = { navy: '#1f3864', blue: '#b4c6e7', mid: '#8eaadb', band: '#eef3fb', line: '#c9d3e6',
                ok: '#d9ead3', bad: '#f4cccc', warn: '#fff2cc', helper: '#7f6000', text: '#1f2937' };

/* API Base Account (danh sách nhân sự). Dùng token riêng của app Account, lưu bằng menu "Lưu token Account". */
const ACCOUNT_API = {
  tenant: 'ctcptldvn',                                        // phần {{tenant_path}} (tên miền con công ty, vd 'abc' trong abc.base.vn); để trống thì dò tự động
  domain: 'base.vn',
  path: '/account/extapi/v1/user/all',               // https://{{tenant_path}}.{{domain}}/account/extapi/v1/user/all
  tokenParam: 'access_token',
  extra: {}
};
function accountUrls_() {
  const d = ACCOUNT_API.domain, u = [];
  const cached = PropertiesService.getScriptProperties().getProperty('ACCOUNT_URL');
  if (cached) u.push(cached);
  if (ACCOUNT_API.tenant) u.push('https://' + ACCOUNT_API.tenant + '.' + d + ACCOUNT_API.path);
  ['account', 'apis'].forEach(t => u.push('https://' + t + '.' + d + ACCOUNT_API.path));
  u.push('https://account.' + d + '/extapi/v1/user/all');
  return u.filter((x, i) => u.indexOf(x) === i);
}

const SALES_API = {
  domain: 'base.vn',                 // phần {{domain}} trong https://apis.{{domain}}/...
  tokenParam: 'access_token',        // tên tham số token của API v1
  version: 'v1',                     // phiên bản API danh sách account
  activitiesVersion: 'v1',           // phiên bản API activities
  accountList: '/account/list',      // endpoint danh sách account v1 (chạy debugSales)
  activities: '/account/get',            // API get account detail: nội dung đàm phán / note của account
  viewerId: 10062,                   // user_id người xem (ID số của @hienvu)
  serviceId: 11139,                  // ID service account CHEM (SOURCING)
  serviceParam: 'service_id',        // TODO: tên tham số chọn service — sửa nếu API báo sai
  pageSize: 50,
  lookbackDays: 2,                   // activity: chỉ giữ N ngày gần nhất mỗi lần chạy
  maxMinutes: 4                      // dừng sớm để không vượt giới hạn 6 phút của Apps Script
};

/* Ánh xạ trường account CRM -> cột dữ liệu. Mỗi mục là danh sách đường dẫn ứng viên (thử lần lượt).
   Chạy menu "Xem trường tuỳ chỉnh account mẫu" để biết tên khóa thật, rồi sửa các dòng dưới đây. */
const FIELD_MAP = {
  country:     ['data.country', 'country'],
  ctype:       ['data.company_type'],
  product:     ['data.product', 'data.kind_of_product'],
  potential:   ['data.potential'],
  qty:         ['data.quantity'],
  value:       ['data.total_sourcing_value'],
  ref:         ['data.ref_sc_no'],
  contact:     ['data.contact'],
  confirmDate: ['data.confirm_date']
};

/* ===================== CỘT DỮ LIỆU ===================== */
const D_ = "'" + SH.DATA + "'!";
const S_ = "'" + SH.STAFF + "'!";
const A_ = "'" + SH.ACT + "'!";
const DATA_HEADERS = ['ID account', 'Ngày tạo', 'Ngày cập nhật', 'Chủ sở hữu (ID)', 'Nhà cung cấp', 'NCC mới (Có/Không)',
  'Quốc gia', 'Loại hình công ty', 'Loại sản phẩm', 'Tiềm năng', 'Quantity', 'Total Sourcing Value', 'Ref/SC no.',
  'Giai đoạn CRM', 'Note / Daily note', 'Liên hệ', 'Ngày xác nhận đơn'];
const DC = { id: 'A', created: 'B', updated: 'C', owner: 'D', name: 'E', isNew: 'F', country: 'G', ctype: 'H',
  product: 'I', potential: 'J', qty: 'K', value: 'L', ref: 'M', stage: 'N', note: 'O', contact: 'P', confirm: 'Q',
  person: 'S', group: 'T', upd: 'U' };
const ACT_HEADERS = ['Activity ID', 'Ngày', 'Giờ', 'Account ID', 'Tên account', 'Người tạo (ID)', 'Loại',
  'Nội dung / Note', 'Kênh liên hệ'];
const AC = { id: 'A', date: 'B', acc: 'D', user: 'F', chan: 'I', person: 'L' };

const dCol_ = (k) => D_ + '$' + DC[k] + ':$' + DC[k];            // cả cột sheet dữ liệu
const dRng_ = (k) => D_ + '$' + DC[k] + '$2:$' + DC[k];          // từ hàng 2 (dùng cho FILTER)
const aCol_ = (k) => A_ + '$' + AC[k] + ':$' + AC[k];            // cả cột sheet activity

/* ===================== MENU ===================== */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Báo cáo Sourcing')
    .addItem('1. Dựng / dựng lại giao diện', 'setupAll')
    .addItem('Xóa lịch tự động cũ', 'removeAllTriggers')
    .addItem('3. Lưu token CRM (v1)', 'saveToken')
    .addItem('3b. Lưu password API Sales', 'savePassword')
    .addItem('3c. Lưu token Account (lấy nhân sự)', 'saveAccountToken')
    .addItem('3c-2. Lưu password Account', 'saveAccountPassword')
    .addItem('3d. Đồng bộ danh sách nhân sự', 'syncStaff')
    .addItem('Kiểm tra API Account (debug)', 'debugStaff')
    .addItem('Dò cách gọi API Account', 'probeAccount')
    .addItem('Kiểm tra kết nối API (debug)', 'debugSales')
    .addItem('Xem trường tuỳ chỉnh account mẫu', 'debugAccount')
    .addItem('★ Chẩn đoán tổng hợp (1 lần chạy)', 'diagnoseAll')
    .addItem('Xem Daily note của 1 account', 'debugDailyNote')
    .addItem('Xem các giai đoạn CRM (stage_id)', 'debugStages')
    .addItem('4. Đồng bộ account (CHEM Sourcing)', 'syncAccounts')
    .addItem('4b. Đồng bộ activity / note theo account', 'syncActivities')
    .addItem('4c. Làm mới nhật ký giai đoạn (xóa log + đồng bộ lại)', 'resetStageLog')
    .addItem('5. Cài lịch đồng bộ tự động (mỗi giờ)', 'installTrigger')
    .addSeparator()
    .addItem('Xóa dữ liệu (giữ tiêu đề)', 'clearData')
    .addToUi();
}

/* ===================== DỰNG TOÀN BỘ ===================== */
function setupAll() {
  const ss = SpreadsheetApp.getActive();
  // Tạo đủ sheet theo thứ tự trước (để công thức tham chiếu không bị #REF!)
  [SH.RPT, SH.DATA, SH.STAFF, SH.ACT, SH.STG].forEach(n => getOrCreate_(ss, n));
  buildDataSheet_(ss);
  buildStaffSheet_(ss);
  buildActSheet_(ss);
  buildStageSheet_(ss);
  buildReportSheet_(ss);
  ss.setActiveSheet(ss.getSheetByName(SH.RPT));
}

function getOrCreate_(ss, name) {
  let s = ss.getSheetByName(name);
  if (s) return s;
  const def = ss.getSheetByName('Trang tính1') || ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length === 1) { def.setName(name); return def; }
  return ss.insertSheet(name);
}

function styleHeader_(range, color, fontColor) {
  range.setBackground(color || COLOR.navy).setFontColor(fontColor || '#ffffff').setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
}

function border_(range) {
  range.setBorder(true, true, true, true, true, true, COLOR.line, SpreadsheetApp.BorderStyle.SOLID);
}

/* ---------- Sheet 2: Thông tin dữ liệu ---------- */
function buildDataSheet_(ss) {
  const sh = getOrCreate_(ss, SH.DATA);
  sh.getRange(1, 1, 1, DATA_HEADERS.length).setValues([DATA_HEADERS]);
  styleHeader_(sh.getRange(1, 1, 1, DATA_HEADERS.length));
  sh.getRange('S1:T1').setValues([['Nhân sự (đối chiếu)', 'Nhóm báo cáo']]);
  styleHeader_(sh.getRange('S1:T1'), COLOR.helper);
  // Cột tính tự động – script đồng bộ KHÔNG ghi đè
  sh.getRange('S2').setFormula(fx_('=ARRAYFORMULA(IF($A$2:$A="","",IFERROR(VLOOKUP($D$2:$D,FILTER({' +
    S_ + '$A$2:$A,' + S_ + '$B$2:$B},' + S_ + '$E$2:$E="Có"),2,0),"")))'));
  const vl = 'VLOOKUP($N$2:$N,' + S_ + '$L$2:$M,2,0)';
  sh.getRange('T2').setFormula(fx_('=ARRAYFORMULA(IF($A$2:$A="","",IFERROR(IF(' + vl + '="","Khác",' + vl + '),"Khác")))'));
  // Cột O = công thức: nội dung đàm phán (Daily note) MỚI NHẤT tại thời điểm <= ngày báo cáo, lấy từ sheet Activity theo ngày
  const A_ = "'" + SH.ACT + "'!", RP_ = "'" + SH.RPT + "'!";
  sh.getRange('O2').setFormula(fx_('=MAP($A$2:$A,LAMBDA(id,IF(id="","",IFERROR(LET(r,INDEX(SORT(FILTER({' + A_ + '$B$2:$B,' + A_ + '$H$2:$H},' +
    'ARRAYFORMULA(TO_TEXT(' + A_ + '$D$2:$D))=TO_TEXT(id),' + A_ + '$B$2:$B<' + RP_ + '$C$3+1),1,FALSE),1,0),TEXT(INDEX(r,1),"dd/mm")&": "&INDEX(r,2)),""))))'));
  const A2_ = "'" + SH.ACT + "'!", RP2_ = "'" + SH.RPT + "'!";
  sh.getRange('R1').setValue('Ngày đàm phán gần nhất (≤ ngày báo cáo)');
  styleHeader_(sh.getRange('R1'), COLOR.helper);
  sh.getRange('R2').setFormula(fx_('=MAP($A$2:$A,LAMBDA(id,IF(id="","",IFERROR(INDEX(SORT(FILTER(' + A2_ + '$B$2:$B,' + 'ARRAYFORMULA(TO_TEXT(' + A2_ + '$D$2:$D))=TO_TEXT(id),' + A2_ + '$B$2:$B<' + RP2_ + '$C$3+1),1,FALSE),1,1),0))))'));
  sh.getRange('R2:R').setNumberFormat('dd/mm/yyyy;;;');
  // Cột U = Daily note được điền ĐÚNG ngày báo cáo (không phụ thuộc giai đoạn CRM). Có nội dung => NCC thuộc bảng "đàm phán" của ngày đó.
  sh.getRange('U1').setValue('Daily note đúng ngày báo cáo');
  styleHeader_(sh.getRange('U1'), COLOR.helper);
  sh.getRange('U2').setFormula(fx_('=MAP($A$2:$A,LAMBDA(id,IF(id="","",IFERROR(TEXT(INT(' + RP2_ + '$C$3),"dd/mm/yyyy")&": "&TEXTJOIN(CHAR(10),TRUE,FILTER(' + A2_ + '$H$2:$H,ARRAYFORMULA(TO_TEXT(' + A2_ + '$D$2:$D))=TO_TEXT(id),' + A2_ + '$B$2:$B>=INT(' + RP2_ + '$C$3),' + A2_ + '$B$2:$B<INT(' + RP2_ + '$C$3)+1)),""))))'));
  sh.getRange('V1:V4').setValues([['Cập nhật lần cuối'], ['Bản ghi chưa ánh xạ giai đoạn'],
    ['Bản ghi chưa đối chiếu nhân sự'], ['Trạng thái đồng bộ']]).setFontWeight('bold');
  sh.getRange('W2').setFormula(fx_('=COUNTIF($T$2:$T,"Khác")'));
  sh.getRange('W3').setFormula(fx_('=COUNTIFS($S$2:$S,"",$A$2:$A,"<>")'));
  sh.getRange('W1').setNumberFormat('dd/mm/yyyy hh:mm');
  sh.getRange('B2:C').setNumberFormat('dd/mm/yyyy hh:mm');
  sh.getRange('Q2:Q').setNumberFormat('dd/mm/yyyy');
  sh.getRange('K2:K').setNumberFormat('#,##0.##');
  sh.getRange('L2:L').setNumberFormat('#,##0');
  sh.getRange('D2:D').setNumberFormat('@');
  sh.getRange('N2:N').setNumberFormat('@');
  [90, 110, 110, 100, 240, 90, 100, 130, 150, 90, 90, 130, 110, 130, 380, 150, 110, 140, 150, 130, 20, 210, 220]
    .forEach((x, i) => sh.setColumnWidth(i + 1, x));
  sh.setRowHeight(1, 42);
  sh.setFrozenRows(1);
  if (!sh.getFilter()) sh.getRange('A1:Q').createFilter();
  sh.setTabColor('#6fa8dc');
}

/* ---------- Sheet 3: Danh sách nhân sự ---------- */
function buildStaffSheet_(ss) {
  const sh = getOrCreate_(ss, SH.STAFF);
  const h = ['ID chủ sở hữu trên CRM (owner_id)', 'Họ tên hiển thị', 'Chức danh', 'Nhóm', 'Tính vào báo cáo? (Có/Không)',
    'Target Quantity (tháng)', 'Target Total Sourcing Value', 'Target New Supplier'];
  sh.getRange(1, 1, 1, h.length).setValues([h]);
  styleHeader_(sh.getRange(1, 1, 1, h.length));
  sh.getRange('L1:M1').setValues([['Giai đoạn trên CRM', 'Nhóm báo cáo']]);
  styleHeader_(sh.getRange('L1:M1'), '#2f5597');
  sh.getRange('O1').setValue('Danh sách chọn (tự sinh)');
  styleHeader_(sh.getRange('O1'), COLOR.helper);
  sh.getRange('O2').setFormula(fx_('={"Tất cả";IFERROR(FILTER($B$2:$B,$E$2:$E="Có"),"")}'));
  sh.getRange('A2:A200').setNumberFormat('@');          // ID lưu dạng chữ để khớp với dữ liệu CRM
  sh.getRange('L2:L200').setNumberFormat('@');
  if (sh.getRange('L2').getValue() === '') {
    const map = [['Newly added', GRP.NEG], ['Contacting', GRP.NEG], ['Đúng hàng/ Tiềm năng', GRP.NEG], ['Verified', GRP.NEG],
      ['Quality Approved', GRP.PEND], ['Ordered', GRP.CONF], ['Sai hàng/ Không tiềm năng', GRP.LOST], ['Hold', GRP.LOST]];
    sh.getRange(2, 12, map.length, 2).setValues(map);
  }
  fillStageMap_(sh);
  sh.getRange('E2:E200').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Có', 'Không'], true).build());
  sh.getRange('M2:M200').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList([GRP.PEND, GRP.CONF, GRP.NEG, GRP.LOST], true).build());
  sh.getRange('F2:H200').setNumberFormat('#,##0');
  sh.getRange('I1:J200').clearContent();            // cột Sending/Receiving Samples cũ (đã bỏ)
  sh.getRange('Q1').setValue('HƯỚNG DẪN').setFontWeight('bold');
  sh.getRange('Q2:Q6').setValues([
    ['- Cột A: ID số của chủ sở hữu account trên CRM (owner_id) hoặc đúng giá trị cột "Chủ sở hữu" ở sheet dữ liệu.'],
    ['- Cột E = "Không" để loại nhân sự khỏi báo cáo (nghỉ việc, không thuộc Sourcing...).'],
    ['- Cột F:H là target tháng; báo cáo tự cộng theo nhân sự được chọn.'],
    ['- Bảng L:M: ghi đúng tên (hoặc ID) giai đoạn của CRM và chọn nhóm báo cáo tương ứng.'],
    ['- Giai đoạn chưa ánh xạ được tính là "Khác" và không lên báo cáo (xem ô kiểm tra ở sheet dữ liệu).']
  ]).setFontColor('#666666');
  [190, 150, 150, 110, 130, 120, 140, 120, 130, 130, 20, 160, 160, 20, 170, 20, 560].forEach((x, i) => sh.setColumnWidth(i + 1, x));
  sh.setRowHeight(1, 48);
  sh.setFrozenRows(1);
  sh.setTabColor('#f1c232');
}

/* ---------- Sheet 4: Activity theo ngày ---------- */
function buildActSheet_(ss) {
  const sh = getOrCreate_(ss, SH.ACT);
  sh.getRange(1, 1, 1, ACT_HEADERS.length).setValues([ACT_HEADERS]);
  styleHeader_(sh.getRange(1, 1, 1, ACT_HEADERS.length));
  sh.getRange('J1:J').clearContent();            // cột Mẫu (Gửi/Nhận) cũ (đã bỏ)
  sh.getRange('L1').setValue('Nhân sự (đối chiếu)');
  styleHeader_(sh.getRange('L1'), COLOR.helper);
  sh.getRange('L2').setFormula(fx_('=ARRAYFORMULA(IF($A$2:$A="","",IFERROR(VLOOKUP($F$2:$F,FILTER({' +
    S_ + '$A$2:$A,' + S_ + '$B$2:$B},' + S_ + '$E$2:$E="Có"),2,0),"")))'));
  sh.getRange('B2:B').setNumberFormat('dd/mm/yyyy');
  sh.getRange('F2:F').setNumberFormat('@');
  sh.getRange('H2:H').setWrap(true);
  [110, 90, 60, 90, 240, 110, 100, 520, 120, 110, 20, 160, 20, 230].forEach((x, i) => sh.setColumnWidth(i + 1, x));
  sh.setRowHeight(1, 42);
  sh.setFrozenRows(1);
  sh.setTabColor('#93c47d');
}

/* ---------- Sheet 1: Báo cáo ngày ---------- */
/* ---------- Sheet "Chuyển giai đoạn": nhật ký NCC mới thêm / NCC đổi giai đoạn (script tự ghi mỗi lần đồng bộ account) ---------- */
function buildStageSheet_(ss) {
  const sh = getOrCreate_(ss, SH.STG);
  const h = ['Ngày', 'Thời điểm ghi nhận', 'ID account', 'Tên NCC', 'Từ giai đoạn', 'Đến giai đoạn', 'Owner (ID)', 'Owner', 'Country', 'Product', 'Loại'];
  sh.getRange(1, 1, 1, h.length).setValues([h]);
  styleHeader_(sh.getRange(1, 1, 1, h.length), COLOR.blue, COLOR.navy);
  sh.getRange('A2:A').setNumberFormat('dd/mm/yyyy');
  sh.getRange('B2:B').setNumberFormat('dd/mm/yyyy hh:mm');
  sh.getRange('C2:C').setNumberFormat('@');
  sh.getRange('G2:G').setNumberFormat('@');
  // Cột H = tên nhân sự theo owner_id (không có trong danh sách nhân sự thì hiện lại owner_id)
  sh.getRange('H2').setFormula(fx_('=ARRAYFORMULA(IF($C$2:$C="","",IFERROR(VLOOKUP($G$2:$G,FILTER({' + S_ + '$A$2:$A,' + S_ + '$B$2:$B},' + S_ + '$E$2:$E="Có"),2,0),$G$2:$G)))'));
  [90, 130, 90, 260, 150, 150, 90, 130, 110, 110, 130].forEach((x, i) => sh.setColumnWidth(i + 1, x));
  sh.setFrozenRows(1);
  sh.getRange('M1').setValue('Sheet này do script ghi: mỗi lần đồng bộ account, NCC mới xuất hiện hoặc đổi giai đoạn so với lần trước sẽ thêm 1 dòng. Cột Loại: Thêm mới / Chuyển giai đoạn / Cập nhật tên (đổi mã số thành tên giai đoạn, không tính vào thống kê).')
    .setFontColor('#7f7f7f');
  sh.setTabColor('#6fa8dc');
}
function lastRowCol_(sh, col) {
  const v = sh.getRange(1, col, sh.getMaxRows(), 1).getValues();
  for (let i = v.length - 1; i >= 0; i--) if (v[i][0] !== '') return i + 1;
  return 1;
}
/* So giai đoạn hiện tại của từng account với lần ghi nhận trước; ghi dòng mới nếu là NCC mới hoặc đã đổi giai đoạn. */
function logStageChanges_(rows) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SH.STG);
  if (!sh) return 0;
  const last = {};
  const lr = lastRowCol_(sh, 1);
  if (lr > 1) sh.getRange(2, 1, lr - 1, 11).getValues().forEach(r => { if (r[2] !== '') last[String(r[2])] = String(r[5]); });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const now = new Date();
  const out = [];
  rows.forEach(r => {
    const id = String(r[0]), st = String(r[13] || '').trim();
    if (!id || !st) return;
    const prev = last[id];
    if (prev === undefined) {
      const c = (r[1] instanceof Date) ? new Date(r[1].getFullYear(), r[1].getMonth(), r[1].getDate()) : today;
      out.push([c, now, id, r[4], '(mới)', st, String(r[3]), r[6], r[8], 'Thêm mới']);
      last[id] = st;
    } else if (prev !== st) {
      const rename = /^\d+$/.test(prev) && !/^\d+$/.test(st);
      out.push([today, now, id, r[4], prev, st, String(r[3]), r[6], r[8], rename ? 'Cập nhật tên' : 'Chuyển giai đoạn']);
      last[id] = st;
    }
  });
  if (!out.length) return 0;
  const start = lr + 1;
  sh.getRange(start, 1, out.length, 7).setValues(out.map(o => o.slice(0, 7)));
  sh.getRange(start, 9, out.length, 3).setValues(out.map(o => o.slice(7)));
  return out.filter(o => o[9] === 'Chuyển giai đoạn').length;
}

/* Dọn dòng trùng trong "Chuyển giai đoạn" (cùng ID + từ + đến + loại): chạy 1 lần từ Apps Script. */
function dedupeStageLog() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SH.STG);
  const lr = lastRowCol_(sh, 1);
  if (lr < 3) return;
  const v = sh.getRange(2, 1, lr - 1, 11).getValues();
  const seen = new Set(), keep = [];
  v.forEach(r => { const k = [r[2], r[4], r[5], r[10] || r[9]].join('|'); if (seen.has(k)) return; seen.add(k); keep.push(r); });
  sh.getRange(2, 1, lr - 1, 7).clearContent(); sh.getRange(2, 9, lr - 1, 3).clearContent();
  if (keep.length) {
    sh.getRange(2, 1, keep.length, 7).setValues(keep.map(r => r.slice(0, 7)));
    sh.getRange(2, 9, keep.length, 3).setValues(keep.map(r => r.slice(8, 11)));
  }
  SpreadsheetApp.getActive().toast('Đã xóa ' + (v.length - keep.length) + ' dòng trùng.');
}

/* Xóa toàn bộ nhật ký giai đoạn rồi đồng bộ lại: dùng khi đổi cách lấy tên giai đoạn (ví dụ từ Status sang stage_id),
   tránh sinh dòng "Chuyển giai đoạn" giả. Mọi account được ghi lại là "Thêm mới" theo ngày tạo. */
function resetStageLog() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SH.STG);
  const lr = lastRowCol_(sh, 1);
  if (lr > 1) { sh.getRange(2, 1, lr - 1, 7).clearContent(); sh.getRange(2, 9, lr - 1, 3).clearContent(); }
  syncAccounts();
}

function buildReportSheet_(ss) {
  const sh = getOrCreate_(ss, SH.RPT);
  sh.getCharts().forEach(c => sh.removeChart(c));
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart().clear().clearDataValidations();
  sh.clearConditionalFormatRules();
  sh.setHiddenGridlines(true);
  sh.getRange(1, 1, 130, 14).setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle').setFontColor(COLOR.text);
  [170, 200, 130, 110, 150, 130, 250, 250, 150, 16, 100, 170, 100, 100].forEach((x, i) => sh.setColumnWidth(i + 1, x));
  sh.setRowHeights(1, 130, 24);

  /* --- Tiêu đề & điều khiển --- */
  sh.getRange('A1:I1').merge().setValue('DAILY REPORT – SOURCING CHEM')
    .setFontSize(20).setFontWeight('bold').setFontColor('#ffffff').setBackground(COLOR.navy).setHorizontalAlignment('center');
  sh.setRowHeight(1, 44);
  sh.getRange('A2:I2').merge().setFormula(fx_('="Ngày "&TEXT($C$3,"dd/mm/yyyy")&"   |   Tháng "&TEXT($C$3,"mm/yyyy")&"   |   Phạm vi: "&$F$3&"   |   Dữ liệu CRM cập nhật: "&IF(' +
    D_ + '$W$1="","chưa đồng bộ",TEXT(' + D_ + '$W$1,"dd/mm/yyyy hh:mm"))'))
    .setHorizontalAlignment('center').setFontColor(COLOR.navy).setFontWeight('bold').setBackground(COLOR.band);
  sh.setRowHeight(2, 28);
  sh.getRange('B3').setValue('Ngày báo cáo:').setFontWeight('bold').setHorizontalAlignment('right');
  sh.getRange('C3').setValue(todayMid_()).setNumberFormat('dd/mm/yyyy').setBackground(COLOR.warn)
    .setHorizontalAlignment('center').setFontWeight('bold')
    .setDataValidation(SpreadsheetApp.newDataValidation().requireDate().build());
  sh.getRange('E3').setValue('Nhân sự:').setFontWeight('bold').setHorizontalAlignment('right');
  sh.getRange('F3:G3').merge().setNumberFormat('@').setValue('Tất cả').setBackground(COLOR.warn).setHorizontalAlignment('center').setFontWeight('bold')
    .setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInRange(ss.getSheetByName(SH.STAFF).getRange('O2:O60'), true).build());
  sh.getRange('H3').setValue('◄ Bấm đúp ô C3 để chọn ngày trên lịch (tự về hôm nay mỗi ngày), chọn nhân sự ở F3').setFontColor('#7f7f7f').setFontStyle('italic');

  /* --- Vùng tính toán (cột K:M) --- */
  sh.getRange('K3').setValue('VÙNG TÍNH TOÁN – KHÔNG SỬA').setFontWeight('bold').setFontColor(COLOR.helper);
  sh.getRange('K4').setFormula(fx_('=DATE(YEAR($C$3),MONTH($C$3),1)')).setNumberFormat('dd/mm/yyyy');
  sh.getRange('K5').setFormula(fx_('=$C$3+1')).setNumberFormat('dd/mm/yyyy');
  sh.getRange('K6').setFormula(fx_('=IF($F$3="Tất cả","?*",TO_TEXT($F$3))'));   // luôn là chữ để khớp cột tên nhân sự dạng chữ
  sh.getRange('K7').setFormula(fx_('=EOMONTH($C$3,0)')).setNumberFormat('dd/mm/yyyy');
  sh.getRange('K8').setFormula(fx_('=DAY($C$3)/DAY($K$7)')).setNumberFormat('0%');
  sh.getRange('L4:L8').setValues([['Đầu tháng'], ['Ngày kế tiếp (mốc loại trừ)'], ['Tiêu chí nhân sự'], ['Cuối tháng'], ['% tiến độ kỳ vọng']]);
  sh.getRange('K3:M60').setFontColor('#7f7f7f').setFontSize(9);

  /* --- KPI: Target / Đã hoàn thành / Cần hoàn thành --- */
  const stf = (col) => 'SUMIFS(' + S_ + '$' + col + ':$' + col + ',' + S_ + '$B:$B,$K$6,' + S_ + '$E:$E,"Có")';
  const WON = dCol_('person') + ',$K$6,' + dCol_('group') + ',"' + GRP.CONF + '",' + dCol_('confirm') + ',">="&$K$4,' +
    dCol_('confirm') + ',"<"&$K$5';

  sh.getRange('B4').setFormula(fx_('="SOURCING: "&UPPER($F$3)'));
  sh.getRange('C4:D4').merge().setValue('Quantity');
  sh.getRange('E4').setValue('Total Sourcing Value');
  sh.getRange('F4').setValue('New Supplier');
  styleHeader_(sh.getRange('B4:F4'), COLOR.blue, COLOR.navy);
  sh.getRange('B5:B8').setValues([['TARGET THÁNG'], ['ĐÃ HOÀN THÀNH'], ['CẦN HOÀN THÀNH'], ['% HOÀN THÀNH']]);
  [5, 6, 7, 8].forEach(r => sh.getRange('C' + r + ':D' + r).merge());
  sh.getRange('C5').setFormula(fx_('=' + stf('F')));
  sh.getRange('E5').setFormula(fx_('=' + stf('G')));
  sh.getRange('F5').setFormula(fx_('=' + stf('H')));
  sh.getRange('C6').setFormula(fx_('=SUMIFS(' + dCol_('qty') + ',' + WON + ')'));
  sh.getRange('E6').setFormula(fx_('=SUMIFS(' + dCol_('value') + ',' + WON + ')'));
  sh.getRange('F6').setFormula(fx_('=COUNTIFS(' + dCol_('isNew') + ',"Có",' + dCol_('person') + ',$K$6,' + dCol_('created') +
    ',">="&$K$4,' + dCol_('created') + ',"<"&$K$5)'));
  ['C', 'E', 'F'].forEach(c => {
    sh.getRange(c + '7').setFormula(fx_('=MAX(0,' + c + '5-' + c + '6)'));
    sh.getRange(c + '8').setFormula(fx_('=IF(' + c + '5=0,"",' + c + '6/' + c + '5)'));
  });
  sh.getRange('C5:E7').setNumberFormat('#,##0');
  sh.getRange('F5:F7').setNumberFormat('0');
  sh.getRange('C8:F8').setNumberFormat('0%');
  sh.getRange('B5:F8').setHorizontalAlignment('center').setFontSize(11);
  sh.getRange('B5:B8').setFontWeight('bold').setBackground(COLOR.blue).setFontColor(COLOR.navy);
  sh.getRange('C6:F6').setFontWeight('bold').setFontSize(13).setFontColor(COLOR.navy);
  sh.getRange('B8:F8').setBackground(COLOR.band).setFontWeight('bold');
  sh.getRange('B8').setBackground(COLOR.blue);
  border_(sh.getRange('B4:F8'));

  pipelineBlocks_(sh);
  sectionBand_(sh, 41, 'NCC MỚI & CHUYỂN GIAI ĐOẠN TRONG NGÀY');

  /* --- Bảng chi tiết (theo form Sourcing) --- */
  const person = '((' + dRng_('person') + '&""=$F$3&"")+($F$3="Tất cả")>0)*(' + dRng_('person') + '<>"")';   // so sánh dạng chữ: tên nhân sự có thể là ID số (10651)
  const grp = (g) => '(' + dRng_('group') + '="' + g + '")';
  const inMonth = '(' + dRng_('confirm') + '>=$K$4)*(' + dRng_('confirm') + '<$K$5)';
  const cntG = (g, withMonth) => 'COUNTIFS(' + dCol_('person') + ',$K$6,' + dCol_('group') + ',"' + g + '"' +
    (withMonth ? ',' + dCol_('confirm') + ',">="&$K$4,' + dCol_('confirm') + ',"<"&$K$5' : '') + ')';
  const sumG = (k, g, withMonth) => 'SUMIFS(' + dCol_(k) + ',' + dCol_('person') + ',$K$6,' + dCol_('group') + ',"' + g + '"' +
    (withMonth ? ',' + dCol_('confirm') + ',">="&$K$4,' + dCol_('confirm') + ',"<"&$K$5' : '') + ')';

  stageBlock_(sh, 42);
  supplierBlock_(sh, 64, 'Nhà cung cấp đàm phán (có Daily note đúng ngày báo cáo)', CAP.NEG, person + '*(' + dRng_('upd') + '<>"")',
    'COUNTIFS(' + dRng_('person') + ',$K$6,' + dRng_('upd') + ',"?*")');
  channelBlock_(sh, 82);

  sh.getRange('A89').setValue('Ghi chú: hai bảng đầu báo cáo đếm theo đúng các giai đoạn trên pipeline CRM Sourcing (Unstaged … Hold), lọc theo nhân sự ở ô F3. "NCC đàm phán" không phải giai đoạn CRM: là các NCC có Daily note đúng ngày báo cáo (bảng bên trên). "Kênh liên hệ" lấy từ sheet Activity theo ngày.')
    .setFontStyle('italic').setFontColor('#7f7f7f');

  /* --- Định dạng có điều kiện --- */
  const rules = [];
  const ruleF = (formula, bg, range) => SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(fx_(formula))
    .setBackground(bg).setRanges([range]).build();
  rules.push(ruleF('=AND(ISNUMBER(C$8),C$8>=$K$8)', COLOR.ok, sh.getRange('C8:F8')));
  rules.push(ruleF('=AND(ISNUMBER(C$8),C$8<$K$8)', COLOR.bad, sh.getRange('C8:F8')));
  sh.setConditionalFormatRules(rules);

  /* --- Biểu đồ: data vào từng giai đoạn pipeline trong tháng vs đang ở giai đoạn --- */
  sh.insertChart(sh.newChart().setChartType(Charts.ChartType.COLUMN).addRange(sh.getRange('B11:D' + (11 + PIPELINE.length))).setNumHeaders(1)
    .setPosition(11, 5, 12, 0).setOption('title', 'Data theo giai đoạn pipeline (lũy kế tháng)').setOption('width', 700).setOption('height', 280)
    .setOption('legend', { position: 'bottom' }).setOption('colors', ['#2f5597', '#b7b7b7']).build());

  sh.setFrozenRows(3);
  sh.setTabColor('#1f3864');
}

/* Hai bảng theo pipeline CRM Sourcing (nguồn: sheet "Chuyển giai đoạn" + "Thông tin dữ liệu"), đều lọc theo nhân sự ở F3 */
function pipelineBlocks_(sh) {
  const G_ = "'" + SH.STG + "'!";
  const g = (c) => G_ + '$' + c + '$2:$' + c;
  const n = PIPELINE.length;
  const noRen = ',' + g('K') + ',"<>Cập nhật tên"';

  /* --- Lũy kế tháng --- */
  sectionBand_(sh, 10, 'LŨY KẾ THÁNG THEO GIAI ĐOẠN PIPELINE (lọc theo nhân sự ở ô F3)');
  const h1 = 11;
  sh.getRange(h1, 2, 1, 3).setValues([['Giai đoạn pipeline', 'Data vào giai đoạn trong tháng', 'Data đang ở giai đoạn (hiện tại)']]);
  styleHeader_(sh.getRange(h1, 2, 1, 3), COLOR.blue, COLOR.navy);
  sideLabel_(sh, h1, n + 3, 'Lũy kế tháng');
  const mon = g('A') + ',">="&$K$4,' + g('A') + ',"<"&$K$5,' + g('H') + ',$K$6';
  PIPELINE.forEach((s, i) => {
    const r = h1 + 1 + i;
    sh.getRange(r, 2).setValue(s).setFontWeight('bold');
    sh.getRange(r, 3).setFormula(fx_('=COUNTIFS(' + mon + ',' + g('F') + ',$B' + r + noRen + ')'));
    sh.getRange(r, 4).setFormula(fx_('=COUNTIFS(' + dCol_('stage') + ',$B' + r + ',' + dCol_('person') + ',$K$6)'));
  });
  const t1 = h1 + n + 1;
  sh.getRange(t1, 2).setValue('TỔNG');
  sh.getRange(t1, 3).setFormula(fx_('=SUM(C' + (h1 + 1) + ':C' + (t1 - 1) + ')'));
  sh.getRange(t1, 4).setFormula(fx_('=SUM(D' + (h1 + 1) + ':D' + (t1 - 1) + ')'));
  sh.getRange(t1, 2, 1, 3).setBackground(COLOR.blue).setFontWeight('bold').setFontColor(COLOR.navy);
  sh.getRange(t1 + 1, 2).setValue('Data mới thêm trong tháng').setFontWeight('bold');
  sh.getRange(t1 + 1, 3).setFormula(fx_('=COUNTIFS(' + mon + ',' + g('K') + ',"Thêm mới")')).setFontWeight('bold').setFontColor(COLOR.navy);
  sh.getRange(h1 + 1, 3, n + 2, 2).setHorizontalAlignment('center').setNumberFormat('0');
  border_(sh.getRange(h1, 2, n + 3, 3));
  zebra_(sh, h1 + 1, n, 3);

  /* --- Data chuyển đổi theo ngày --- */
  const b2 = 24, h2 = 25;
  sectionBand_(sh, b2, 'DATA CHUYỂN GIAI ĐOẠN THEO NGÀY (ngày báo cáo ở ô C3, lọc theo nhân sự ở ô F3)');
  sh.getRange(h2, 2, 1, 3).setValues([['Giai đoạn pipeline', 'Chuyển vào trong ngày', 'Chuyển ra khỏi giai đoạn trong ngày']]);
  styleHeader_(sh.getRange(h2, 2, 1, 3), COLOR.blue, COLOR.navy);
  sideLabel_(sh, h2, n + 2, 'Trong ngày');
  const day = g('A') + ',">="&$C$3,' + g('A') + ',"<"&$C$3+1,' + g('H') + ',$K$6';
  PIPELINE.forEach((s, i) => {
    const r = h2 + 1 + i;
    sh.getRange(r, 2).setValue(s).setFontWeight('bold');
    sh.getRange(r, 3).setFormula(fx_('=COUNTIFS(' + day + ',' + g('F') + ',$B' + r + noRen + ')'));
    sh.getRange(r, 4).setFormula(fx_('=COUNTIFS(' + day + ',' + g('E') + ',$B' + r + ',' + g('K') + ',"Chuyển giai đoạn")'));
  });
  const t2 = h2 + n + 1;
  sh.getRange(t2, 2).setValue('TỔNG');
  sh.getRange(t2, 3).setFormula(fx_('=SUM(C' + (h2 + 1) + ':C' + (t2 - 1) + ')'));
  sh.getRange(t2, 4).setFormula(fx_('=SUM(D' + (h2 + 1) + ':D' + (t2 - 1) + ')'));
  sh.getRange(t2, 2, 1, 3).setBackground(COLOR.blue).setFontWeight('bold').setFontColor(COLOR.navy);
  sh.getRange(h2 + 1, 3, n + 1, 2).setHorizontalAlignment('center').setNumberFormat('0');
  border_(sh.getRange(h2, 2, n + 2, 3));
  zebra_(sh, h2 + 1, n, 3);
  sh.getRange(h2 + 1, 5, 4, 5).merge().setValue('Chuyển vào = data mới thêm hoặc vừa chuyển đến giai đoạn đó; Chuyển ra = data rời giai đoạn đó sang giai đoạn khác (không tính "Cập nhật tên"). Số liệu lấy từ nhật ký chuyển giai đoạn, ghi mỗi lần đồng bộ CRM.')
    .setFontStyle('italic').setFontColor('#7f7f7f').setWrap(true).setVerticalAlignment('top');
}

function sectionBand_(sh, row, text) {
  sh.getRange(row, 1, 1, 9).merge().setValue(text).setBackground(COLOR.navy).setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('left');
  sh.setRowHeight(row, 28);
}

/* Nhãn dọc bên trái (cột A) giống form gốc */
function sideLabel_(sh, row, rows, text) {
  sh.getRange(row, 1, rows, 1).merge().setValue(text).setBackground(COLOR.blue).setFontColor(COLOR.navy)
    .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  border_(sh.getRange(row, 1, rows, 1));
}

function zebra_(sh, row, rows, cols) {
  for (let i = 0; i < rows; i++) if (i % 2 === 1) sh.getRange(row + i, 2, 1, cols).setBackground(COLOR.band);
}

/* Đơn hàng chờ xác nhận / xác nhận: B Supplier | C Kind of product | D Quantity | E Total value | F Ref/SC no. | G New Supplier | H Notes */
function orderBlock_(sh, hr, label, cap, cond, countF, qtyF, valF) {
  sh.getRange(hr, 2, 1, 7).setValues([['Supplier', 'Kind of product', 'Quantity', 'Total Sourcing Value', 'Ref/SC no.', 'New Supplier', 'Notes']]);
  styleHeader_(sh.getRange(hr, 2, 1, 7), COLOR.blue, COLOR.navy);
  sideLabel_(sh, hr, cap + 1, label);
  // Cột Notes = công thức tra cứu Daily note MỚI NHẤT có Date <= ngày báo cáo (C3) trong sheet Activity theo ngày
  const cols = ['E', 'I', 'K', 'L', 'M', 'F', 'A'].map(c => dRng_(Object.keys(DC).filter(k => DC[k] === c)[0])).join(',');
  const stF = 'MAP(INDEX(t,0,7),LAMBDA(id,IFERROR(LET(r,INDEX(SORT(FILTER({' + "'" + SH.ACT + "'!" + '$B$2:$B,' + "'" + SH.ACT + "'!" + '$H$2:$H},' + 'ARRAYFORMULA(TO_TEXT(' + "'" + SH.ACT + "'!" + '$D$2:$D))=TO_TEXT(id),' + "'" + SH.ACT + "'!" + '$B$2:$B<$C$3+1),1,FALSE),1,0),TEXT(INDEX(r,1),"dd/mm/yyyy")&": "&INDEX(r,2)),"")))';
  sh.getRange(hr + 1, 2).setFormula(fx_('=IFERROR(LET(t,ARRAY_CONSTRAIN(SORT(FILTER({' + cols + '},' + cond + '),4,FALSE),' + cap + ',7),' +
    'HSTACK(CHOOSECOLS(t,1,2,3,4,5,6),' + stF + ')),"")'));
  const body = sh.getRange(hr + 1, 2, cap, 7);
  border_(body);
  body.setWrap(true);
  zebra_(sh, hr + 1, cap, 7);
  sh.getRange(hr + 1, 3, cap, 5).setHorizontalAlignment('center');
  sh.getRange(hr + 1, 4, cap, 1).setNumberFormat('#,##0.##');
  sh.getRange(hr + 1, 5, cap, 1).setNumberFormat('#,##0');
  const t = hr + cap + 1;
  sh.getRange(t, 2, 1, 2).merge().setValue('SUM (toàn bộ dữ liệu)');
  sh.getRange(t, 4).setFormula(fx_('=' + qtyF)).setNumberFormat('#,##0.##');
  sh.getRange(t, 5).setFormula(fx_('=' + valF)).setNumberFormat('#,##0');
  sh.getRange(t, 6).setFormula(fx_('=' + countF)).setNumberFormat('0" dòng"');
  sh.getRange(t, 7).setFormula(fx_('=IF(' + countF + '>' + cap + ',"⚠ Còn "&(' + countF + '-' + cap + ')&" dòng chưa hiển thị – xem sheet Thông tin dữ liệu","")'))
    .setFontColor('#c00000');
  sh.getRange(t, 2, 1, 7).setBackground(COLOR.blue).setFontWeight('bold').setFontColor(COLOR.navy);
  sh.getRange(t, 4, 1, 3).setHorizontalAlignment('center');
  border_(sh.getRange(t, 2, 1, 7));
}

/* Thống kê NCC mới / chuyển giai đoạn trong ngày báo cáo (nguồn: sheet "Chuyển giai đoạn") */
function stageBlock_(sh, hr) {
  const G_ = "'" + SH.STG + "'!";
  const g = (c) => G_ + '$' + c + '$2:$' + c;
  const day = g('A') + ',">="&$C$3,' + g('A') + ',"<"&$C$3+1,' + g('H') + ',$K$6';
  sh.getRange(hr, 2, 1, 3).merge().setValue('Chỉ số trong ngày báo cáo');
  sh.getRange(hr, 5).setValue('Số lượng');
  styleHeader_(sh.getRange(hr, 2, 1, 4), COLOR.blue, COLOR.navy);
  const lab = ['NCC Newly added (mới thêm trong ngày)', 'NCC chuyển sang Đúng hàng/ Tiềm năng', 'Tổng số data mới / chuyển giai đoạn'];
  lab.forEach((t, i) => { sh.getRange(hr + 1 + i, 2, 1, 3).merge().setValue(t).setFontWeight('bold'); });
  sh.getRange(hr + 1, 5).setFormula(fx_('=COUNTIFS(' + day + ',' + g('K') + ',"Thêm mới")'));
  sh.getRange(hr + 2, 5).setFormula(fx_('=COUNTIFS(' + day + ',' + g('F') + ',"Đúng hàng/ Tiềm năng",' + g('K') + ',"<>Cập nhật tên")'));
  sh.getRange(hr + 3, 5).setFormula(fx_('=COUNTIFS(' + day + ',' + g('K') + ',"<>Cập nhật tên")'));
  sh.getRange(hr + 1, 5, 3, 1).setHorizontalAlignment('center').setFontWeight('bold').setFontSize(13).setFontColor(COLOR.navy).setNumberFormat('0');
  border_(sh.getRange(hr, 2, 4, 4));
  sh.getRange(hr + 1, 6, 3, 3).merge().setValue('Ghi nhận mỗi lần đồng bộ CRM (mỗi giờ khi đã cài lịch): so giai đoạn hiện tại với lần trước. Danh sách bên dưới là các data mới thêm hoặc vừa đổi giai đoạn trong ngày báo cáo.')
    .setFontStyle('italic').setFontColor('#7f7f7f').setWrap(true).setVerticalAlignment('middle');
  sideLabel_(sh, hr, 4, 'Thống kê');

  const lh = hr + 5, cap = 14;
  sh.getRange(lh, 2, 1, 8).setValues([['Supplier', 'Từ giai đoạn', 'Đến giai đoạn', 'Owner', 'Country', 'Product', 'Loại', 'Owner ID']]);
  styleHeader_(sh.getRange(lh, 2, 1, 8), COLOR.blue, COLOR.navy);
  sideLabel_(sh, lh, cap + 2, 'Danh sách data được chuyển');
  const cond = '(' + g('A') + '>=$C$3)*(' + g('A') + '<$C$3+1)*((' + g('H') + '=$F$3)+($F$3="Tất cả")>0)*(' + g('K') + '<>"Cập nhật tên")*(' + g('C') + '<>"")';
  sh.getRange(lh + 1, 2).setFormula(fx_('=IFERROR(ARRAY_CONSTRAIN(SORT(FILTER({' + ['D', 'E', 'F', 'H', 'I', 'J', 'K', 'G'].map(g).join(',') + '},' + cond + '),7,TRUE,1,TRUE),' + cap + ',8),"")'));
  const body = sh.getRange(lh + 1, 2, cap, 8);
  border_(body);
  body.setWrap(true);
  zebra_(sh, lh + 1, cap, 8);
  sh.getRange(lh + 1, 3, cap, 7).setHorizontalAlignment('center');
  const t = lh + cap + 1;
  const cnt = 'COUNTIFS(' + day + ',' + g('K') + ',"<>Cập nhật tên")';
  sh.getRange(t, 2, 1, 3).merge().setValue('TỔNG SỐ DATA MỚI / CHUYỂN GIAI ĐOẠN');
  sh.getRange(t, 5).setFormula(fx_('=' + cnt)).setNumberFormat('0" dòng"').setHorizontalAlignment('center');
  sh.getRange(t, 6).setFormula(fx_('=IF(' + cnt + '>' + cap + ',"⚠ Còn "&(' + cnt + '-' + cap + ')&" dòng chưa hiển thị – xem sheet Chuyển giai đoạn","")')).setFontColor('#c00000');
  sh.getRange(t, 2, 1, 8).setBackground(COLOR.blue).setFontWeight('bold').setFontColor(COLOR.navy);
  border_(sh.getRange(t, 2, 1, 8));
}

/* Nhà cung cấp đàm phán: B Company | C Stage | D Country | E Company type | F Product | G Daily note | H Contact | I Owner */
function supplierBlock_(sh, hr, label, cap, cond, countF) {
  sh.getRange(hr, 2, 1, 8).setValues([['Company', 'Stage', 'Country', 'Company type', 'Product', 'Daily note', 'Contact', 'Owner']]);
  styleHeader_(sh.getRange(hr, 2, 1, 8), COLOR.blue, COLOR.navy);
  sideLabel_(sh, hr, cap + 1, label);
  // Stage = giai đoạn CRM theo stage_id (cột N sheet dữ liệu); Daily note = nội dung điền ĐÚNG ngày báo cáo (cột U); Owner = nhân viên phụ trách account (cột S)
  const cols = ['name', 'stage', 'country', 'ctype', 'product', 'contact', 'id', 'upd', 'person'].map(k => dRng_(k)).join(',');
  sh.getRange(hr + 1, 2).setFormula(fx_('=IFERROR(LET(t,ARRAY_CONSTRAIN(SORT(FILTER({' + cols + '},' + cond + '),1,TRUE),' + cap + ',9),' +
    'HSTACK(CHOOSECOLS(t,1,2,3,4,5),INDEX(t,0,8),CHOOSECOLS(t,6),INDEX(t,0,9))),"")'));
  const body = sh.getRange(hr + 1, 2, cap, 8);
  border_(body);
  body.setWrap(true);
  zebra_(sh, hr + 1, cap, 8);
  sh.getRange(hr + 1, 3, cap, 4).setHorizontalAlignment('center');
  sh.getRange(hr + 1, 9, cap, 1).setHorizontalAlignment('center');
  const t = hr + cap + 1;
  sh.getRange(t, 2, 1, 2).merge().setValue('TỔNG SỐ NCC ĐÀM PHÁN');
  sh.getRange(t, 4).setFormula(fx_('=' + countF)).setNumberFormat('0" NCC"');
  sh.getRange(t, 5).setFormula(fx_('=IF(' + countF + '>' + cap + ',"⚠ Còn "&(' + countF + '-' + cap + ')&" NCC chưa hiển thị","")')).setFontColor('#c00000');
  sh.getRange(t, 2, 1, 8).setBackground(COLOR.blue).setFontWeight('bold').setFontColor(COLOR.navy);
  sh.getRange(t, 4).setHorizontalAlignment('center');
  border_(sh.getRange(t, 2, 1, 8));
}

/* Kênh liên hệ: B Kênh | C Số lượng (ngày) | D Lũy kế tháng */
function channelBlock_(sh, hr) {
  sh.getRange(hr, 2, 1, 3).setValues([['Kênh', 'Số lượng (trong ngày)', 'Lũy kế tháng']]);
  styleHeader_(sh.getRange(hr, 2, 1, 3), COLOR.blue, COLOR.navy);
  sideLabel_(sh, hr, CH.length + 1, 'Kênh liên hệ');
  CH.forEach((c, i) => {
    const r = hr + 1 + i;
    sh.getRange(r, 2).setValue(c);
    sh.getRange(r, 3).setFormula(fx_('=COUNTIFS(' + aCol_('chan') + ',$B' + r + ',' + aCol_('date') + ',">="&$C$3,' + aCol_('date') +
      ',"<"&$C$3+1,' + aCol_('person') + ',$K$6)'));
    sh.getRange(r, 4).setFormula(fx_('=COUNTIFS(' + aCol_('chan') + ',$B' + r + ',' + aCol_('date') + ',">="&$K$4,' + aCol_('date') +
      ',"<"&$K$5,' + aCol_('person') + ',$K$6)'));
  });
  const t = hr + CH.length + 1;
  sh.getRange(t, 2).setValue('TỔNG');
  sh.getRange(t, 3).setFormula(fx_('=SUM(C' + (hr + 1) + ':C' + (t - 1) + ')'));
  sh.getRange(t, 4).setFormula(fx_('=SUM(D' + (hr + 1) + ':D' + (t - 1) + ')'));
  sh.getRange(t, 2, 1, 3).setBackground(COLOR.blue).setFontWeight('bold').setFontColor(COLOR.navy);
  sh.getRange(hr + 1, 3, CH.length + 1, 2).setHorizontalAlignment('center').setNumberFormat('0');
  border_(sh.getRange(hr, 2, CH.length + 2, 3));
}

/* ===================== KẾT NỐI BASE SALES API ===================== */
function saveToken() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Nhập access token (v1) của Base Sales – lưu trong Script Properties, không hiển thị trên sheet');
  if (r.getSelectedButton() === ui.Button.OK && r.getResponseText()) {
    PropertiesService.getScriptProperties().setProperty('BASE_TOKEN', r.getResponseText().trim());
    ui.alert('Đã lưu token.');
  }
}

function saveAccountToken() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Nhập access token của app Account (để lấy danh sách nhân sự) – lưu trong Script Properties');
  if (r.getSelectedButton() === ui.Button.OK && r.getResponseText()) {
    PropertiesService.getScriptProperties().setProperty('ACCOUNT_TOKEN', r.getResponseText().trim());
    ui.alert('Đã lưu token Account. Chạy tiếp "Đồng bộ danh sách nhân sự".');
  }
}

function saveAccountPassword() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Nhập password đi kèm token app Account (lưu trong Script Properties)');
  if (r.getSelectedButton() === ui.Button.OK && r.getResponseText()) {
    PropertiesService.getScriptProperties().setProperty('ACCOUNT_PASSWORD', r.getResponseText().trim());
    ui.alert('Đã lưu password Account. Chạy "Kiểm tra API Account (debug)" để thử lại.');
  }
}

function accountCall_(extra) {
  const pr = PropertiesService.getScriptProperties();
  const tk = pr.getProperty('ACCOUNT_TOKEN') || pr.getProperty('BASE_TOKEN');   // chưa lưu token Account thì dùng token CRM
  if (!tk) throw new Error('Chưa có token. Dùng menu "Lưu token Account" trước.');
  const payload = {}; payload[ACCOUNT_API.tokenParam] = tk;                      // API chỉ cần access_token, không cần password
  Object.keys(ACCOUNT_API.extra || {}).forEach(k => { payload[k] = ACCOUNT_API.extra[k]; });
  Object.keys(extra || {}).forEach(k => { payload[k] = extra[k]; });
  let lastErr = '';
  const tried = [];
  for (const url of accountUrls_()) {
    let res;
    try { res = UrlFetchApp.fetch(url, { method: 'post', payload: payload, muteHttpExceptions: true }); } catch (e) { lastErr = String(e.message).slice(0, 100); continue; }
    const text = res.getContentText();
    let j = null;
    try { j = JSON.parse(text); } catch (e) {}
    tried.push(url.replace('https://', '') + ' -> ' + (j ? ('code=' + j.code + ' ' + (j.message || '')) : 'HTTP ' + res.getResponseCode() + ' ' + text.slice(0, 40)));
    if (j && Array.isArray(firstArray_(j))) { PropertiesService.getScriptProperties().setProperty('ACCOUNT_URL', url); return j; }
  }
  return { raw: 'Không URL nào trả danh sách user. Đã thử: ' + tried.join(' | ') + (lastErr ? ' | lỗi: ' + lastErr : '') };
}

/* Lấy user từ Base Account, ghi vào sheet nhân sự.
   - Người đang là chủ sở hữu account trong sheet dữ liệu (CHEM) => "Có"; còn lại => "Không" (bật tay nếu cần).
   - Dòng đã có: chỉ cập nhật tên/chức danh, giữ nguyên nhóm, target, Có/Không. */
function syncStaff(silent) {
  silent = silent === true;
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SH.STAFF);
  const resp = accountCall_();
  const users = firstArray_(resp) || [];
  if (!users.length) { if (silent) return; SpreadsheetApp.getUi().alert('Không đọc được danh sách user. Phản hồi: ' + JSON.stringify(stripNull_(resp) || {}).slice(0, 600)); return; }
  const data = ss.getSheetByName(SH.DATA);
  const owners = new Set(data.getLastRow() > 1 ? data.getRange(2, 4, data.getLastRow() - 1, 1).getValues().map(r => String(r[0])) : []);
  const last = Math.max(sh.getLastRow(), 1);
  const cur = last > 1 ? sh.getRange(2, 1, last - 1, 10).getValues() : [];
  const idx = {}; cur.forEach((r, i) => { if (r[0] !== '') idx[String(r[0])] = i; });
  const add = [];
  let upd = 0;
  users.forEach(u => {
    const id = String(pick_(u, ['id', 'user_id']));
    if (!id) return;
    const name = String(pick_(u, ['name', 'fullname', 'username']));
    const title = String(pick_(u, ['title', 'position', 'job_title']));
    if (idx[id] !== undefined) {
      const r = cur[idx[id]]; if (name) r[1] = name; if (title) r[2] = title; upd++;
    } else {
      add.push([id, name, title, 'Sourcing', owners.has(id) ? 'Có' : 'Không', '', '', '', '', '']);
    }
  });
  if (cur.length) sh.getRange(2, 1, cur.length, 10).setValues(cur);
  if (add.length) sh.getRange(cur.length + 2, 1, add.length, 10).setValues(add);
  sh.getRange('A2:A200').setNumberFormat('@');
  if (!silent) ss.toast('Nhân sự: cập nhật ' + upd + ', thêm mới ' + add.length + ' (' + add.filter(a => a[4] === 'Có').length + ' người đang sở hữu account CHEM được bật "Có").');
}

/* Dò cách gọi API Account: thử nhiều URL / tên tham số token / có-không password và in phản hồi (không in token). */
function probeAccount() {
  const props = PropertiesService.getScriptProperties();
  const tk = props.getProperty('ACCOUNT_TOKEN') || props.getProperty('BASE_TOKEN');
  if (!tk) { SpreadsheetApp.getUi().alert('Chưa có token Account. Dùng menu "Lưu token Account" trước.'); return; }
  const apw = null;   // API Account chỉ cần access_token
  const urls = ['https://account.base.vn/extapi/v1/user/all', 'https://account.base.vn/account/extapi/v1/user/all', 'https://account.base.vn/extapi/v1/users', 'https://account.base.vn/extapi/v1/user/list',
    'https://account.base.vn/extapi/v1/group/get', 'https://apis.base.vn/account/v1/users', 'https://apis.base.vn/account/v1/user/list'];
  const params = ['access_token', 'access_token_v2'];
  let out = '';
  urls.forEach(u => params.forEach(p => [false, true].forEach(withPw => {
    if (withPw && !apw) return;
    const payload = {}; payload[p] = tk; if (withPw) payload.password = apw;
    let r;
    try { r = UrlFetchApp.fetch(u, { method: 'post', payload: payload, muteHttpExceptions: true }); } catch (e) { out += u.replace('https://', '') + ' | ' + p + (withPw ? '+pw' : '') + ' => LỖI ' + String(e.message).slice(0, 60) + '\n'; return; }
    const txt = r.getContentText();
    let note;
    try { const j = JSON.parse(txt); note = 'code=' + j.code + ' ' + (j.message || '') + (Array.isArray(firstArray_(j)) ? ' [CÓ MẢNG ' + firstArray_(j).length + ']' : ''); } catch (e) { note = 'HTTP ' + r.getResponseCode() + ' ' + txt.slice(0, 40).replace(/\s+/g, ' '); }
    out += u.replace('https://', '') + ' | ' + p + (withPw ? '+pw' : '') + ' => ' + note + '\n';
  })));
  SpreadsheetApp.getUi().alert(out);
}

function debugStaff() {
  let out = '';
  try {
    const resp = accountCall_();
    const users = firstArray_(resp) || [];
    out += 'Khóa cấp 1: ' + Object.keys(resp).join(', ') + '\nSố user: ' + users.length + '\n';
    if (users[0]) out += 'User mẫu (đã bỏ trường null): ' + JSON.stringify(stripNull_(users[0])).slice(0, 700);
    else out += 'Phản hồi: ' + JSON.stringify(stripNull_(resp) || {}).slice(0, 700);
  } catch (e) { out += 'LỖI: ' + e.message; }
  SpreadsheetApp.getUi().alert(out);
}

function savePassword() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Nhập password API Sales (lưu trong Script Properties)');
  if (r.getSelectedButton() === ui.Button.OK && r.getResponseText()) {
    PropertiesService.getScriptProperties().setProperty('BASE_PASSWORD', r.getResponseText().trim());
    ui.alert('Đã lưu password.');
  }
}

function salesCall_(path, extra, ver) {
  const props = PropertiesService.getScriptProperties();
  const payload = {};
  payload[SALES_API.tokenParam] = props.getProperty('BASE_TOKEN');
  const pw = props.getProperty('BASE_PASSWORD');
  if (pw) payload.password = pw;
  Object.keys(extra || {}).forEach(k => { payload[k] = extra[k]; });
  const res = UrlFetchApp.fetch('https://apis.' + SALES_API.domain + '/sales/' + (ver || SALES_API.version) + path,
    { method: 'post', payload: payload, muteHttpExceptions: true });
  const text = res.getContentText();
  if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode() + ' ' + path + ': ' + text.slice(0, 200));
  try { return JSON.parse(text); } catch (e) { return { raw: text.slice(0, 600) }; }
}

function listParams_(page, limit) {
  const p = { page: page, limit: limit };
  p[SALES_API.serviceParam] = SALES_API.serviceId;
  return p;
}

function firstArray_(o) {
  if (Array.isArray(o)) return (o.length === 0 || typeof o[0] === 'object') ? o : null;
  if (o && typeof o === 'object') {
    for (const k of Object.keys(o)) { const r = firstArray_(o[k]); if (r) return r; }
  }
  return null;
}

/* Tìm mảng activity/note trong phản hồi: ưu tiên khóa có tên activit/note/stream/log/item, bỏ qua mảng rỗng (labels, files...) */
function actsOf_(o) {
  const skip = /(^|\.)(form|access_keys|labels|files|collaborators|followers|segments|stage_list)(\.|$)/i;
  const looks = (x) => x && typeof x === 'object' && ['content', 'note', 'text', 'message', 'description', 'since', 'created_time', 'created_at'].some(k => x[k] !== undefined);
  const found = [];
  (function walk(v, path) {
    if (Array.isArray(v)) { if (v.length && typeof v[0] === 'object' && !skip.test(path) && looks(v[0])) found.push({ path: path, arr: v }); return; }
    if (v && typeof v === 'object') Object.keys(v).forEach(k => walk(v[k], path ? path + '.' + k : k));
  })(o, '');
  if (!found.length) return [];
  const pref = found.filter(f => /activit|note|stream|log|item|record|list/i.test(f.path));
  return (pref.length ? pref : found).sort((a, b) => b.arr.length - a.arr.length)[0].arr;
}

/* Bỏ các trường null / rỗng / mảng rỗng / object rỗng khỏi dữ liệu để in gọn */
function stripNull_(v) {
  if (Array.isArray(v)) { const a = v.map(stripNull_).filter(x => x !== undefined); return a.length ? a : undefined; }
  if (v && typeof v === 'object') {
    const o = {}; Object.keys(v).forEach(k => { const r = stripNull_(v[k]); if (r !== undefined) o[k] = r; });
    return Object.keys(o).length ? o : undefined;
  }
  return (v === null || v === undefined || v === '') ? undefined : v;
}

function arrSummary_(o) {
  const lines = [];
  (function walk(v, path) {
    if (Array.isArray(v)) { lines.push(path + ' [mảng ' + v.length + ']' + (v.length && typeof v[0] === 'object' ? ' khóa: ' + Object.keys(v[0]).join(',') : '')); return; }
    if (v && typeof v === 'object') Object.keys(v).forEach(k => walk(v[k], path ? path + '.' + k : k));
  })(o, '');
  return lines.join('\n');
}

/* Ánh xạ tự động trường tuỳ chỉnh theo TÊN trường trong form account (account/get > account.form).
   Sửa regex nếu tên trường trong CRM khác. Không khớp thì dùng đường dẫn dự phòng trong cấu hình.
   LƯU Ý: giai đoạn (Stage) KHÔNG lấy từ trường "Status" mà từ stage_id (xem STAGE_NAMES). */
const FIELD_NAMES = { stage: /^\s*status\s*$/i, country: /nước|quốc gia|country/i, ctype: /loại hình|company type|type of company/i, product: /loại (hàng|sản phẩm)|product/i, potential: /tiềm năng|potential/i, qty: /quantity|số lượng|sản lượng/i, value: /sourcing value|giá trị/i, ref: /ref|sc no|số sc|mã đơn/i, contact: /liên hệ|contact/i, confirmDate: /ngày (xác nhận|chốt)|confirm/i, note: /daily note|đàm phán|ghi chú|tình trạng/i };

function loadForm_(accs) {
  if (!accs.length) return [];
  try {
    const d = salesCall_(SALES_API.activities, { id: accs[0].id, user_id: SALES_API.viewerId });
    return (d.account && d.account.form) || [];
  } catch (e) { return []; }
}

/* Tên giai đoạn đã biết (stage_id -> tên cột trên bảng quy trình CRM). Account không có stage_id (hoặc 0) = Unstaged.
   Mã chưa biết sẽ hiện số ID: chạy menu "Xem các giai đoạn CRM (stage_id)" để biết ID nào đang dùng, rồi thêm vào đây,
   ví dụ: 2294: 'Newly added'. Tên phải khớp từng chữ với PIPELINE ở đầu file. */
const STAGE_NAMES = { 0: 'Unstaged', 2294: 'Newly added', 2295: 'Contacting', 2297: 'Sai hàng/ Không tiềm năng',
  2298: 'Đúng hàng/ Tiềm năng', 2299: 'Verified', 2300: 'Quality Approved', 2301: 'Ordered', 2303: 'Hold' };
function stageName_(id) { const n = Number(id) || 0; return STAGE_NAMES[n] !== undefined ? STAGE_NAMES[n] : String(id); }

/* Trường tuỳ chỉnh của account nằm trong mảng account.form (mỗi phần tử: id, code, name, value, display, type).
   Trường để trống thì không có value/display; trường bảng (input-table) có value = JSON mã hoá base64. */
function formEntries_(acc) { return (acc && Array.isArray(acc.form)) ? acc.form : []; }

function b64json_(s) {
  s = String(s || ''); if (!s) return null;
  const pad = s + '='.repeat((4 - s.length % 4) % 4);
  let txt = null;
  try { txt = Utilities.newBlob(Utilities.base64DecodeWebSafe(pad)).getDataAsString('UTF-8'); } catch (e) {
    try { txt = Utilities.newBlob(Utilities.base64Decode(pad)).getDataAsString('UTF-8'); } catch (e2) { return null; }
  }
  try { return JSON.parse(txt); } catch (e) { return null; }
}

/* display của trường bảng: các dòng cách nhau bằng xuống dòng, các cột cách nhau bằng "|" */
function parseDisplayTable_(display) {
  const rows = String(display || '').split(/\r?\n/).map(l => l.split('|')).filter(r => r.join('').trim());
  return rows.length ? parseTable_(rows) : [];
}

function fv_(a, form, key, fallback) {
  const re = FIELD_NAMES[key];
  const ent = re && formEntries_(a).find(x => re.test(String(x.name)) && ((x.display !== undefined && x.display !== '') || (x.value !== undefined && x.value !== '')));
  if (ent) return (ent.display !== undefined && ent.display !== '') ? ent.display : ent.value;
  const ent2 = re && (form || []).find(x => re.test(String(x.name)));
  if (ent2) {
    const d = a.data || {};
    const v = [d[ent2.code], d[ent2.gs_key], d[ent2.id], a[ent2.code], a[ent2.gs_key]].find(x => x !== undefined && x !== null && x !== '');
    if (v !== undefined) return (typeof v === 'object') ? JSON.stringify(v) : v;
  }
  return fallback ? pick_(a, [].concat(fallback)) : '';
}

/* Đọc trường dạng bảng 2 cột (Date, Update) ở nhiều dạng JSON */
/* Lấy các dòng (Date, Update) của bảng Daily note từ 1 account: ưu tiên đúng trường theo tên trong form,
   nếu không có thì quét mọi trường trong data (cả của account/get và account/list) tìm bảng có cột ngày. */
function dailyRows_(acc, a, ent) {
  // 1) Trường bảng Daily note trong account.form: value = base64(JSON [[ts, text], ...]) hoặc display "dd-mm-yyyy|nội dung".
  //    Thử mọi trường khả dĩ (ưu tiên đúng tên "Daily note"), lấy trường đầu tiên đọc ra được dòng ngày.
  const all = [].concat(formEntries_(acc), formEntries_(a)).filter(x => x && (x.value || x.display));
  const rank = (x) => /^\s*daily\s*note\s*$/i.test(String(x.name)) ? 0 : (FIELD_NAMES.note.test(String(x.name)) ? 1 : (/table/i.test(String(x.type || '')) ? 2 : 3));
  const cands = all.filter(x => rank(x) <= 2).sort((p, q) => rank(p) - rank(q));
  for (const note of cands) {
    let t = [];
    if (note.value) { const j = b64json_(note.value); if (j !== null) t = parseTable_(j); }
    if (!t.some(x => x.hasDate) && note.display) t = parseDisplayTable_(note.display);
    if (t.some(x => x.hasDate)) return t;
  }
  // 2) Dự phòng: quét các trường trong data tìm bảng có cột ngày
  const srcs = [(acc && acc.data) || {}, (a && a.data) || {}];
  for (const d of srcs) {
    for (const k of Object.keys(d)) {
      if (k === 'recorded_time') continue;
      const t = parseTable_(d[k]);
      if (t.some(x => x.hasDate)) return t;
    }
  }
  return [];
}

/* Xem cấu trúc trường Daily note của 1 account theo tên (nhập một phần tên, ví dụ MOON STAR). */
/* Liệt kê từng giai đoạn (stage_id) kèm số account và vài tên account mẫu, để đối chiếu với tên cột trên bảng quy trình CRM. */
function debugStages() {
  let out = '';
  try {
    const all = [];
    for (let page = 0; page < 50; page++) {
      const list = firstArray_(salesCall_(SALES_API.accountList, listParams_(page, SALES_API.pageSize))) || [];
      if (!list.length) break;
      Array.prototype.push.apply(all, list);
      if (list.length < SALES_API.pageSize) break;
    }
    const g = {};
    all.forEach(a => { const k = String(a.stage_id || '(trống)'); (g[k] = g[k] || []).push(a.name); });
    out += 'Tổng ' + all.length + ' account. Mỗi giai đoạn (stage_id | số account | tên mẫu):\n';
    Object.keys(g).forEach(k => { out += '- ' + k + ' | ' + g[k].length + ' | ' + g[k].slice(0, 3).join('; ') + '\n'; });
  } catch (e) { out += 'LỖI: ' + e.message; }
  SpreadsheetApp.getUi().alert(out);
}

/* Chẩn đoán tổng hợp: chạy một lần, ghi mọi kết quả kiểm tra vào sheet "Chẩn đoán" để gửi lại (không chứa token/password). */
function diagnoseAll() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('Chẩn đoán');
  if (!sh) sh = ss.insertSheet('Chẩn đoán');
  sh.clear();
  const rows = [];
  const add = (a, b) => rows.push([a, String(b).slice(0, 45000)]);
  const safe = (name, fn) => { try { fn(); } catch (e) { add(name, 'LỖI: ' + e.message); } };
  add('Thời điểm', new Date());
  add('Ngôn ngữ / múi giờ Sheet', ss.getSpreadsheetLocale() + ' / ' + ss.getSpreadsheetTimeZone());
  let accounts = [];
  safe('1. Danh sách account', () => {
    for (let p = 0; p < 50; p++) {
      const l = firstArray_(salesCall_(SALES_API.accountList, listParams_(p, SALES_API.pageSize))) || [];
      if (!l.length) break;
      Array.prototype.push.apply(accounts, l);
      if (l.length < SALES_API.pageSize) break;
    }
    add('1. Số account', accounts.length);
    const g = {};
    accounts.forEach(a => { const k = String(a.stage_id || '(trống)'); (g[k] = g[k] || []).push(a.name); });
    Object.keys(g).forEach(k => add('1. stage_id ' + k, g[k].length + ' account: ' + g[k].slice(0, 4).join('; ')));
    const withData = accounts.filter(a => a.data && Object.keys(stripNull_(a.data) || {}).length);
    add('1. Account có dữ liệu trường tuỳ chỉnh trong list', withData.length + ' (ví dụ: ' + withData.slice(0, 3).map(a => a.name).join('; ') + ')');
    if (accounts[0]) add('1. Khóa cấp 1 của account trong list', Object.keys(accounts[0]).join(', '));
  });
  // Chọn account để soi chi tiết: ưu tiên account có Daily note / có hoạt động
  const cands = [];
  ['moon star'].forEach(k => { const x = accounts.find(a => String(a.name).toLowerCase().indexOf(k) >= 0); if (x) cands.push(x); });
  accounts.filter(a => Number(a.last_activity_ts) > 0).slice(0, 2).forEach(a => cands.push(a));
  if (!cands.length && accounts[0]) cands.push(accounts[0]);
  cands.forEach((a, i) => safe('2. Account ' + a.name, () => {
    const det = detailCall_(a.id);
    const acc = det.account || det.data || {};
    add('2.' + i + ' Account', a.id + ' – ' + a.name + ' | stage_id=' + a.stage_id + ' | owner_id=' + a.owner_id);
    add('2.' + i + ' Khóa cấp 1 của account/get', Object.keys(det).join(', ') + ' | trong account: ' + Object.keys(acc).join(', '));
    add('2.' + i + ' account/get > data (bỏ null)', JSON.stringify(stripNull_(acc.data) || {}));
    add('2.' + i + ' account/list > data (bỏ null)', JSON.stringify(stripNull_(a.data) || {}));
    const form = acc.form || [];
    const ent = form.find(x => FIELD_NAMES.note.test(String(x.name)));
    add('2.' + i + ' Trường Daily note trong form', ent ? JSON.stringify(ent) : '(không thấy)');
    const rowsD = dailyRows_(acc, a, ent);
    add('2.' + i + ' Số dòng Date/Update đọc được', rowsD.length + (rowsD[0] ? ' | dòng đầu: ' + rowsD[0].d + ' | ' + rowsD[0].t.slice(0, 100) : ''));
    add('2.' + i + ' Toàn bộ phản hồi account/get (bỏ null, cắt 3000 ký tự)', JSON.stringify(stripNull_(det) || {}).slice(0, 3000));
  }));
  if (typeof SALES_API.dealList !== 'undefined') safe('3. Deal', () => {
    const resp = salesCall_(SALES_API.dealList, listParams_(0, 20));
    const l = firstArray_(resp) || [];
    add('3. deal/list khóa cấp 1', Object.keys(resp).join(', ') + ' | số deal trang 0: ' + l.length);
    add('3. deal/list phản hồi (bỏ null)', JSON.stringify(stripNull_(l[0] || resp) || {}).slice(0, 1500));
  });
  safe('4. API Account', () => {
    const resp = accountCall_();
    const u = firstArray_(resp) || [];
    add('4. API Account', 'khóa cấp 1: ' + Object.keys(resp).join(', ') + ' | số user: ' + u.length + ' | phản hồi: ' + JSON.stringify(stripNull_(u[0] || resp) || {}).slice(0, 600));
  });
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.setColumnWidth(1, 330); sh.setColumnWidth(2, 900);
  sh.getRange(1, 2, rows.length, 1).setWrap(true);
  sh.getRange(1, 1, rows.length, 1).setFontWeight('bold');
  ss.setActiveSheet(sh);
  ss.toast('Đã ghi ' + rows.length + ' dòng vào sheet "Chẩn đoán". Chụp hoặc sao chép gửi lại.', 'Chẩn đoán', 10);
}

function debugDailyNote() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Nhập một phần tên account có Daily note (ví dụ: MOON STAR)');
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const key = r.getResponseText().trim().toLowerCase();
  let out = '';
  try {
    let hit = null, form = [];
    for (let page = 0; page < 5 && !hit; page++) {
      const list = firstArray_(salesCall_(SALES_API.accountList, listParams_(page, 100))) || [];
      if (!list.length) break;
      hit = list.find(x => String(x.name).toLowerCase().indexOf(key) >= 0) || null;
    }
    if (!hit) { ui.alert('Không tìm thấy account có tên chứa "' + key + '" trong 5 trang đầu.'); return; }
    const det = detailCall_(hit.id);
    const acc = det.account || det.data || {};
    form = acc.form || [];
    const ent = form.find(x => FIELD_NAMES.note.test(String(x.name)));
    out += 'Account ' + hit.id + ' – ' + hit.name + '\n';
    out += ent ? 'Trường khớp: "' + ent.name + '" | code=' + ent.code + ' | type=' + ent.type + ' | gs_key=' + ent.gs_key + '\n' : '(KHÔNG có trường nào trong form tên giống Daily note) Các trường: ' + form.map(x => x.name).join(', ') + '\n';
    const d = acc.data || {};
    out += '\nCác khóa trong account/get > data:\n';
    Object.keys(d).forEach(k => { out += '- ' + k + ' = ' + JSON.stringify(stripNull_(d[k]) === undefined ? '' : stripNull_(d[k])).slice(0, 200) + '\n'; });
    out += '\nCác khóa trong account/list > data: ' + Object.keys(hit.data || {}).join(', ') + '\n';
    const rows = dailyRows_(acc, hit, ent);
    out += '\n=> Đọc được ' + rows.length + ' dòng Date/Update' + (rows[0] ? '. Dòng đầu: ' + rows[0].d + ' | ' + rows[0].t.slice(0, 80) : '');
  } catch (e) { out += 'LỖI: ' + e.message; }
  ui.alert(out);
}

function detailCall_(id) { return salesCall_(SALES_API.activities, { id: id, user_id: SALES_API.viewerId }, SALES_API.activitiesVersion); }

/* Đọc trường dạng bảng 2 cột (Date, Update) */
function parseTable_(raw) {
  if (raw === undefined || raw === null || raw === '') return [];
  let v = raw;
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return cleanText_(v) ? [{ d: new Date(), t: cleanText_(v), hasDate: false }] : []; } }
  const rows = Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).map(k => v[k]) : []);
  const isTs = (x) => (typeof x === 'number' && x > 1e8) || /^\d{9,13}$/.test(String(x).trim());
  const isDateLike = (x) => isTs(x) || /^\s*\d{1,4}[-\/.]\d{1,2}[-\/.]\d{1,4}\s*$/.test(String(x));   // chỉ nhận ô CHỈ chứa ngày (bản cũ nhận cả nội dung bắt đầu bằng ngày)
  const out = [];
  rows.forEach(r => {
    let d = '', t = '';
    if (Array.isArray(r)) {
      const di = isDateLike(r[0]) ? 0 : r.findIndex(isDateLike);       // cột Date luôn là cột đầu của bảng Daily note
      d = di >= 0 ? r[di] : ''; t = r.filter((x, i) => i !== di).map(x => cleanText_(x)).filter(Boolean).join(' ');
    } else if (r && typeof r === 'object') {
      const keys = Object.keys(r);
      const dk = keys.find(k => /date|ngày|time/i.test(k)) || keys.find(k => isDateLike(r[k]));
      const tk = keys.find(k => /update|nội dung|content|text|note|tình trạng/i.test(k) && k !== dk) || keys.find(k => k !== dk && typeof r[k] === 'string');
      d = dk ? r[dk] : ''; t = tk ? cleanText_(r[tk]) : '';
    } else if (typeof r === 'string') t = cleanText_(r);
    let dt = parseDate_(d);
    if (dt && isTs(d)) {            // mốc giờ unix -> ngày theo giờ Việt Nam (tránh lệch 1 ngày khi múi giờ script khác GMT+7), về 00:00 giờ của Sheet
      const p = Utilities.formatDate(dt, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd').split('-');
      dt = new Date(+p[0], +p[1] - 1, +p[2]);
    }
    if (t) out.push({ d: dt || new Date(), t: t, hasDate: !!dt });
  });
  return out;
}

/* Thêm giai đoạn CRM mới (theo stage_id) vào bảng ánh xạ L:M và owner_id mới vào danh sách nhân sự */
/* Điền nhóm mặc định cho các giai đoạn CRM đã biết nếu cột nhóm (M) còn trống – không ghi đè lựa chọn của bạn */
function fillStageMap_(st) {
  const def = { 'Newly added': GRP.NEG, 'Contacting': GRP.NEG, 'Đúng hàng/ Tiềm năng': GRP.NEG, 'Verified': GRP.NEG, 'Quality Approved': GRP.PEND, 'Ordered': GRP.CONF, 'Sai hàng/ Không tiềm năng': GRP.LOST, 'Hold': GRP.LOST,
    'Đang tiếp cận': GRP.NEG, 'Có hỏi hàng': GRP.NEG, 'KH Tiềm năng': GRP.NEG, 'Ra Đơn': GRP.CONF, 'KH Không Tiềm năng': GRP.LOST, 'Black list': GRP.LOST };
  const n = st.getLastRow() - 1; if (n < 1) return;
  const r = st.getRange(2, 12, n, 2), v = r.getValues(); let ch = false;
  v.forEach(x => { const k = String(x[0]).trim(); if (k && !x[1]) { const g = def[k] || ''; if (g) { x[1] = g; ch = true; } } });
  if (ch) r.setValues(v);
}
const OWNER_NAMES_ = {};
/* Thử lấy tên người phụ trách ngay trong dữ liệu account (nếu CRM có trả về) */
function ownerNameOf_(a) {
  const o = a.owner || a.owner_info || a.user || {};
  const v = a.owner_name || a.owner_username_name || (typeof o === 'object' ? (o.name || o.fullname || o.full_name || o.display_name) : '') || '';
  return String(v || '').trim();
}
function updateMaps_(rows) {
  const st = SpreadsheetApp.getActive().getSheetByName(SH.STAFF);
  const lastRow = Math.max(st.getLastRow(), 2);
  const known = new Set(st.getRange(2, 12, lastRow - 1, 1).getValues().map(r => String(r[0])).filter(Boolean));
  const stages = [...new Set(rows.map(r => String(r[13])).filter(x => x && !known.has(x)))];
  if (stages.length) {
    const start = st.getRange('L:L').getValues().filter(r => r[0] !== '').length + 1;
    st.getRange(start, 12, stages.length, 1).setNumberFormat('@').setValues(stages.map(x => [x]));
  }
  const ids = new Set(st.getRange(2, 1, lastRow - 1, 1).getValues().map(r => String(r[0])).filter(Boolean));
  const owners = [...new Set(rows.map(r => String(r[3])).filter(x => x && !ids.has(x)))];
  if (owners.length) {
    const s2 = st.getRange('A:A').getValues().filter(r => r[0] !== '').length + 1;
    st.getRange(s2, 1, owners.length, 5).setValues(owners.map(x => [x, x, '', 'Sourcing', 'Có']));
    st.getRange('A2:A200').setNumberFormat('@');
  }
  { // điền tên thật nếu CRM có trả về và ô tên đang trống hoặc đang là ID
    const lr2 = Math.max(st.getLastRow(), 2), r2 = st.getRange(2, 1, lr2 - 1, 2), v2 = r2.getValues();
    let ch2 = false;
    v2.forEach(x => { const id = String(x[0]), nm = OWNER_NAMES_[id]; if (id && nm && (String(x[1]).trim() === '' || String(x[1]).trim() === id)) { x[1] = nm; ch2 = true; } });
    if (ch2) { st.getRange(2, 2, v2.length, 1).setNumberFormat('@'); st.getRange(2, 2, v2.length, 1).setValues(v2.map(x => [x[1]])); }
  }
  { // tên nhân sự luôn là chữ (số thuần túy như 10362 làm COUNTIFS "?*" không đếm được)
    const nr = st.getRange(2, 2, Math.max(st.getLastRow() - 1, 1), 1);
    const nv = nr.getValues();
    nr.setNumberFormat('@');
    nr.setValues(nv.map(r => [r[0] === '' ? '' : String(r[0])]));
  }
  fillStageMap_(st);
}

function pick_(o, keys) {
  for (const k of keys) {
    const v = k.split('.').reduce((a, x) => (a == null ? a : a[x]), o);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function parseDate_(v) {
  if (v === '' || v == null) return '';
  if (typeof v === 'number' || /^\d{9,13}$/.test(String(v))) { const n = Number(v); return new Date(n > 1e12 ? n : n * 1000); }
  const m = String(v).trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);   // dd/mm/yyyy
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d;
}

function cleanText_(v) { return String(v).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }

function channelOf_(text, type) {
  const s = (String(text) + ' ' + String(type)).toLowerCase();
  if (/linkedin/.test(s)) return 'LinkedIn';
  if (/wechat|zalo/.test(s)) return 'Wechat/Zalo';
  if (/whatsapp/.test(s)) return 'Whatsapp';
  if (/e-?mail|mail/.test(s)) return 'Email';
  return '';
}

function writeData_(rows) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SH.DATA);
  const last = Math.max(sh.getLastRow(), 2);
  sh.getRange(2, 1, last - 1, 14).clearContent();            // A:N
  sh.getRange(2, 16, last - 1, 2).clearContent();            // P:Q  (cột O là công thức, không ghi đè)
  if (rows.length) {
    sh.getRange(2, 1, rows.length, 14).setValues(rows.map(r => r.slice(0, 14)));
    sh.getRange(2, 16, rows.length, 2).setValues(rows.map(r => r.slice(15, 17)));
  }
  sh.getRange('W1').setValue(new Date());
}

/* Đồng bộ danh sách account CHEM Sourcing -> sheet "Thông tin dữ liệu" */
function syncAccounts() {
  const t0 = Date.now();
  if (!PropertiesService.getScriptProperties().getProperty('BASE_TOKEN')) throw new Error('Chưa có token. Dùng menu "Lưu token CRM" trước.');
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const rows = [];
  let form = null;
  let page = 0, finished = false;
  const seen = new Set();
  while (Date.now() - t0 < SALES_API.maxMinutes * 60000) {
    const accs = firstArray_(salesCall_(SALES_API.accountList, listParams_(page, 100))) || [];
    if (form === null) form = loadForm_(accs);
    if (!accs.length) { finished = true; break; }
    const fresh = accs.filter(a0 => { const k = String(pick_(a0, ['id'])); if (seen.has(k)) return false; seen.add(k); return true; });
    if (!fresh.length) { finished = true; break; }                 // trang lặp lại (API trả trùng) => đã hết dữ liệu
    fresh.forEach(a0 => {
      let a = a0;
      if (Date.now() - t0 < (SALES_API.maxMinutes - 1) * 60000) {   // lấy chi tiết account để có đủ trường tuỳ chỉnh trong form
        try { const d = salesCall_(SALES_API.activities, { id: a0.id, user_id: SALES_API.viewerId }, SALES_API.activitiesVersion); if (d.account) a = Object.assign({}, a0, d.account); } catch (e) {}
      }
      { const nm = ownerNameOf_(a); if (nm) OWNER_NAMES_[String(pick_(a, ['owner_id']))] = nm; }
      const created = parseDate_(pick_(a, ['since']));
      const fm = (k) => fv_(a, form, k, FIELD_MAP[k]);
      rows.push([
        pick_(a, ['id']), created, parseDate_(pick_(a, ['last_update'])), String(pick_(a, ['owner_id'])),
        pick_(a, ['name', 'title']), (created && created >= monthStart) ? 'Có' : 'Không',
        fm('country'), fm('ctype'), fm('product'), fm('potential'), Number(fm('qty')) || 0, Number(fm('value')) || 0, fm('ref'),
        String(a.stage_name || (a.stage_export && a.stage_export.name) || stageName_(a.stage_id)), cleanText_(fv_(a, form, 'note', ['content', 'note'])),
        fm('contact'), parseDate_(fm('confirmDate'))
      ]);
    });
    if (accs.length < 100) { finished = true; break; }
    page++;
  }
  // Giữ lại note mới nhất đã lấy từ activity (nếu có) cho từng account
  rows.forEach(r => { r[14] = ''; });                      // cột O là công thức (Daily note mới nhất)
  let moved = 0;
  try { moved = logStageChanges_(rows); } catch (e) { Logger.log('Bỏ qua nhật ký chuyển giai đoạn: ' + e.message); }
  writeData_(rows);
  updateMaps_(rows);
  try { syncStaff(true); } catch (e) { Logger.log('Bỏ qua đồng bộ nhân sự: ' + e.message); }
  SpreadsheetApp.getActive().getSheetByName(SH.DATA).getRange('W4')
    .setValue(finished ? 'Đã đồng bộ đủ ' + rows.length + ' account (' + moved + ' NCC đổi giai đoạn)' : 'CHƯA ĐỦ: mới lấy ' + rows.length + ' account (hết thời gian)');
}

/* Bản đồ account_id -> note mới nhất (từ sheet Activity theo ngày) */
function latestNotes_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SH.ACT);
  const map = {};
  if (!sh || sh.getLastRow() < 2) return map;
  const vals = sh.getRange(2, 1, sh.getLastRow() - 1, 8).getValues();
  const best = {};
  vals.forEach(v => {
    const acc = String(v[3]), d = v[1] instanceof Date ? v[1].getTime() : 0;
    if (!v[7]) return;
    if (!(acc in best) || d >= best[acc]) { best[acc] = d; map[acc] = String(v[7]); }
  });
  return map;
}

/* Cập nhật cột Note của sheet dữ liệu bằng note mới nhất từ activity */
function applyLatestNotes_() { /* không còn dùng: cột O là công thức */ }

/* Lấy activity/note mới (lookbackDays) của các account có hoạt động gần đây -> sheet "Activity theo ngày" */
function syncActivities() {
  const t0 = Date.now();
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('BASE_TOKEN')) throw new Error('Chưa có token. Dùng menu "Lưu token CRM" trước.');
  const sh = SpreadsheetApp.getActive().getSheetByName(SH.ACT);
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  // Daily note là bảng do người dùng sửa được (đổi ngày, sửa/xóa dòng) => mỗi lần quét lại account nào thì GHI ĐÈ toàn bộ dòng của account đó,
  // không chỉ thêm dòng mới (bản cũ để lại dòng ngày cũ/nội dung cũ nên báo cáo sai ngày).
  const byAcc = {};
  const order = [];
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, ACT_HEADERS.length).getValues().forEach(r => {
    const k = String(r[3]); if (!(k in byAcc)) { byAcc[k] = []; order.push(k); } byAcc[k].push(r);
  });
  const cutoff = new Date(); cutoff.setHours(0, 0, 0, 0); cutoff.setDate(cutoff.getDate() - SALES_API.lookbackDays);
  let page = Number(props.getProperty('ACT_PAGE') || 0);
  let form = null;
  let finished = false, timedOut = false, scanned = 0, rowsOut = 0;
  const seenIds = new Set();
  while (Date.now() - t0 < SALES_API.maxMinutes * 60000) {
    const accounts = firstArray_(salesCall_(SALES_API.accountList, listParams_(page, SALES_API.pageSize))) || [];
    if (!accounts.length) { finished = true; break; }
    const fresh = accounts.filter(a => { const k = String(pick_(a, ['id'])); if (seenIds.has(k)) return false; seenIds.add(k); return true; });
    if (!fresh.length) { finished = true; break; }                 // API trả lặp trang => hết dữ liệu
    if (form === null) form = loadForm_(accounts);
    const ent = form.find(x => FIELD_NAMES.note.test(String(x.name)));
    for (const a of fresh) {
      if (Date.now() - t0 > SALES_API.maxMinutes * 60000) { timedOut = true; break; }
      const id = String(pick_(a, ['id']));
      const la = Math.max(Number(a.last_activity_ts) || 0, Number(a.last_update) || 0);
      if (la * 1000 < cutoff.getTime() && (id in byAcc)) continue;     // account cũ đã có nhật ký và không đổi gần đây thì bỏ qua
      const det = salesCall_(SALES_API.activities, { id: id, user_id: SALES_API.viewerId }, SALES_API.activitiesVersion);
      const acc = det.account || det.data || {};
      const keys = new Set(), rows = [];
      dailyRows_(acc, a, ent).forEach(x => {
        if (!x.hasDate) return;                                     // dòng không có ngày thì không đưa vào báo cáo (bản cũ gán nhầm ngày hôm nay / ngày cập nhật account)
        const aid = id + '|' + Utilities.formatDate(x.d, tz, 'yyyyMMdd') + '|' + x.t.slice(0, 40);
        if (keys.has(aid)) return;
        keys.add(aid);
        rows.push([aid, x.d, Utilities.formatDate(x.d, tz, 'HH:mm'), id, pick_(a, ['name', 'title']),
          String(pick_(a, ['owner_id'])), 'Daily note', x.t, channelOf_(x.t, '')]);
      });
      if (!(id in byAcc)) order.push(id);
      byAcc[id] = rows; scanned++; rowsOut += rows.length;
    }
    if (timedOut) break;
    if (accounts.length < SALES_API.pageSize) { finished = true; break; }
    page++;
  }
  const all = [];
  order.forEach(k => (byAcc[k] || []).forEach(r => all.push(r)));
  const lastR = Math.max(sh.getLastRow(), 2);
  sh.getRange(2, 1, lastR - 1, ACT_HEADERS.length).clearContent();
  if (all.length) sh.getRange(2, 1, all.length, ACT_HEADERS.length).setValues(all);
  props.setProperty('ACT_PAGE', finished ? '0' : String(page));
  sh.getRange('N1').setValue('Cập nhật: ' + Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm') +
    (finished ? ' (đã quét hết account)' : ' (còn tiếp, trang ' + page + ')'));
  SpreadsheetApp.getActive().toast('Activity theo ngày: quét lại ' + scanned + ' account, ' + rowsOut + ' dòng Daily note (tổng ' + all.length + ')' + (finished ? '.' : ' – chưa quét hết, chạy lại để tiếp tục.'), 'Đồng bộ', 8);
}

/* Đặt ô Ngày báo cáo (C3) = hôm nay. Chạy tự động mỗi ngày lúc 0h; vẫn bấm đúp ô để chọn ngày khác trên lịch. */
function todayMid_() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function setReportDateToday() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SH.RPT);
  if (sh) sh.getRange('C3').setValue(todayMid_());
}
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));   // xóa cả trigger cũ (vd. syncCrmData) trỏ tới hàm không còn tồn tại
  ScriptApp.newTrigger('syncAccounts').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('syncActivities').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('setReportDateToday').timeBased().everyDays(1).atHour(0).nearMinute(5).inTimezone(SpreadsheetApp.getActive().getSpreadsheetTimeZone()).create();
  SpreadsheetApp.getUi().alert('Đã cài lịch: đồng bộ account + activity mỗi giờ và đưa ngày báo cáo về hôm nay lúc 0h mỗi ngày.');
}

/* Xóa toàn bộ lịch tự động cũ (dùng khi báo "Không tìm thấy hàm tập lệnh") */
function removeAllTriggers() {
  const n = ScriptApp.getProjectTriggers().length;
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  SpreadsheetApp.getActive().toast('Đã xóa ' + n + ' trigger cũ. Chạy "Cài lịch tự động" để tạo lại.');
}

function clearData() {
  const ss = SpreadsheetApp.getActive();
  const d = ss.getSheetByName(SH.DATA);
  const n = Math.max(d.getLastRow() - 1, 1);
  d.getRange(2, 1, n, 14).clearContent();
  d.getRange(2, 16, n, 2).clearContent();
  const a = ss.getSheetByName(SH.ACT);
  a.getRange(2, 1, Math.max(a.getLastRow() - 1, 1), ACT_HEADERS.length).clearContent();
}

/* Kiểm tra kết nối: hiện phản hồi thật của API (không gồm token). */
function debugSales() {
  const ui = SpreadsheetApp.getUi();
  let out = '';
  try {
    const lr = salesCall_(SALES_API.accountList, listParams_(0, 100));
    const accs = firstArray_(lr) || [];
    if (!accs.length) out += 'PHẢN HỒI DANH SÁCH ACCOUNT (không có mảng): ' + JSON.stringify(lr).slice(0, 700) + '\n';
    const pk = accs.find(a => Number(a.last_activity_ts) > 0) || accs[0];
    out += 'Service ' + SALES_API.serviceId + ' | số account ở trang 0: ' + accs.length +
      ' | có last_activity_ts>0: ' + accs.filter(a => Number(a.last_activity_ts) > 0).length + '\n';
    if (pk) {
      out += 'Account mẫu: ' + JSON.stringify({ id: pk.id, name: pk.name, content: String(pk.content).slice(0, 80),
        last_activity_ts: pk.last_activity_ts, stats: pk.computed_stats }) + '\n\n';
      const ar = stripNull_(salesCall_(SALES_API.activities, { id: pk.id, user_id: SALES_API.viewerId }, SALES_API.activitiesVersion)) || {};
      out += 'ACTIVITIES khóa cấp 1: ' + Object.keys(ar).join(', ') + ' | code=' + ar.code + ' msg=' + ar.message + '\n';
      out += 'Các mảng trong phản hồi:\n' + (arrSummary_(ar) || '(không có mảng nào)') + '\n';
      const ac = actsOf_(ar);
      if (ac.length) out += 'Mẫu activity đầu: ' + JSON.stringify(stripNull_(ac[0])).slice(0, 500);
    }
  } catch (err) { out += 'LỖI: ' + err.message; }
  ui.alert(out);
}

/* Hiện các khóa tuỳ chỉnh của 1 account mẫu để điền FIELD_MAP */
function debugAccount() {
  let out = '';
  try {
    const accs = firstArray_(salesCall_(SALES_API.accountList, listParams_(0, 100))) || [];
    const pk = accs.find(a => a.data && Object.keys(a.data).length > 1) || accs[0];
    if (!pk) { SpreadsheetApp.getUi().alert('Không có account nào trong service ' + SALES_API.serviceId); return; }
    const form = loadForm_([pk]);
    const d = pk.data || {};
    out += 'Các trường tuỳ chỉnh của form (tên | code | giá trị ở account mẫu):\n';
    form.forEach(x => {
      const v = [d[x.code], d[x.gs_key], d[x.id]].find(y => y !== undefined && y !== null && y !== '');
      out += '- ' + x.name + ' | ' + x.code + ' | ' + (v === undefined ? '(trống)' : JSON.stringify(v).slice(0, 60)) + '\n';
    });
    const ent = form.find(x => FIELD_NAMES.note.test(String(x.name)));
    if (ent) {
      const cand = accs.filter(x => Number(x.last_activity_ts) > 0).slice(0, 3).concat([pk]);
      for (const c of cand) {
        const det = salesCall_(SALES_API.activities, { id: c.id, user_id: SALES_API.viewerId }, SALES_API.activitiesVersion);
        const dd = (det.account && det.account.data) || {};
        const raw = [dd[ent.code], dd[ent.gs_key], dd[ent.id]].find(y => y !== undefined && y !== null && y !== '');
        if (raw !== undefined) { out += '\nTRƯỜNG "' + ent.name + '" (account ' + c.id + ') dữ liệu thô: ' + JSON.stringify(raw).slice(0, 500) +
          '\n=> Đọc được ' + parseTable_(raw).length + ' dòng (Date/Update)\n'; break; }
      }
    } else out += '\n(Không thấy trường nào tên giống Daily note/đàm phán trong form — kiểm tra lại tên trường)\n';
    out += '\nKhóa trong data của account mẫu: ' + Object.keys(stripNull_(d) || {}).join(', ');
  } catch (err) { out += 'LỖI: ' + err.message; }
  SpreadsheetApp.getUi().alert(out);
}
