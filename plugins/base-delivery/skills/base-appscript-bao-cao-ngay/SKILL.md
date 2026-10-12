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

## 3. Bộ mã mẫu — cấu hình & tiện ích
```js
const SH = { RPT:'Báo cáo ngày', DATA:'Thông tin dữ liệu', STAFF:'Danh sách nhân sự', ACT:'Activity theo ngày', STG:'Chuyển giai đoạn' };
const GRP = { PEND:'Đơn chờ xác nhận', CONF:'Đơn đã xác nhận', NEG:'NCC đàm phán', LOST:'Không tiềm năng/ Hold' };
const SALES_API = { domain:'base.vn', tokenParam:'access_token', version:'v1', activitiesVersion:'v1',
  accountList:'/account/list', activities:'/account/get', viewerId:10062, serviceId:11139,
  serviceParam:'service_id', pageSize:50, lookbackDays:2, maxMinutes:4 };
const ACCOUNT_API = { tenant:'ctcptldvn', domain:'base.vn', path:'/account/extapi/v1/user/all', tokenParam:'access_token', extra:{} };
function accountUrls_() {            // thử theo thứ tự, nhớ URL chạy được
  const d = ACCOUNT_API.domain, u = [], c = PropertiesService.getScriptProperties().getProperty('ACCOUNT_URL');
  if (c) u.push(c);
  if (ACCOUNT_API.tenant) u.push('https://' + ACCOUNT_API.tenant + '.' + d + ACCOUNT_API.path);
  ['account','apis'].forEach(t => u.push('https://' + t + '.' + d + ACCOUNT_API.path));
  u.push('https://account.' + d + '/extapi/v1/user/all');
  return u.filter((x,i) => u.indexOf(x) === i);
}
const FIELD_MAP = { country:['data.country','country'], ctype:['data.company_type'], product:['data.product','data.kind_of_product'],
  potential:['data.potential'], qty:['data.quantity'], value:['data.total_sourcing_value'], ref:['data.ref_sc_no'],
  contact:['data.contact'], confirmDate:['data.confirm_date'] };
const FIELD_NAMES = { stage:/^\s*status\s*$/i, country:/nước|quốc gia|country/i, ctype:/loại hình|company type/i,
  product:/loại (hàng|sản phẩm)|product/i, potential:/tiềm năng|potential/i, qty:/quantity|số lượng/i,
  value:/sourcing value|giá trị/i, ref:/ref|sc no/i, contact:/liên hệ|contact/i, confirmDate:/ngày xác nhận|confirm/i,
  note:/daily ?note|ghi chú|note/i };    // chỉnh regex theo tên trường thật trong form (xem debugAccount)
const STAGE_NAMES = { 0:'Unstaged', 2295:'Contacting', 2301:'Đúng hàng/ Tiềm năng' };   // thêm mã khi biết
function stageName_(id){ const n = Number(id)||0; return STAGE_NAMES[n] !== undefined ? STAGE_NAMES[n] : String(id); }

function pick_(o, keys){ for (const k of keys){ const v = k.split('.').reduce((a,x)=>a==null?a:a[x], o); if (v!==undefined && v!==null && v!=='') return v; } return ''; }
function cleanText_(v){ return String(v).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); }
function parseDate_(v){
  if (v===''||v==null) return '';
  if (typeof v==='number'||/^\d{9,13}$/.test(String(v))){ const n=Number(v); return new Date(n>1e12?n:n*1000); }
  const m = String(v).trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return new Date(+m[3], +m[2]-1, +m[1], +(m[4]||0), +(m[5]||0));
  const d = new Date(v); return isNaN(d.getTime()) ? '' : d;
}
function todayMid_(){ const d = new Date(); d.setHours(0,0,0,0); return d; }

function salesCall_(path, extra, ver){
  const props = PropertiesService.getScriptProperties(), payload = {};
  payload[SALES_API.tokenParam] = props.getProperty('BASE_TOKEN');
  const pw = props.getProperty('BASE_PASSWORD'); if (pw) payload.password = pw;
  Object.keys(extra||{}).forEach(k => payload[k] = extra[k]);
  const res = UrlFetchApp.fetch('https://apis.' + SALES_API.domain + '/sales/' + (ver||SALES_API.version) + path,
    { method:'post', payload:payload, muteHttpExceptions:true });
  const text = res.getContentText();
  if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode() + ' ' + path + ': ' + text.slice(0,200));
  try { return JSON.parse(text); } catch(e){ return { raw:text.slice(0,600) }; }
}
function listParams_(page, limit){ const p = { page:page, limit:limit }; p[SALES_API.serviceParam] = SALES_API.serviceId; return p; }
function firstArray_(o){
  if (Array.isArray(o)) return (o.length===0 || typeof o[0]==='object') ? o : null;
  if (o && typeof o==='object') for (const k of Object.keys(o)){ const r = firstArray_(o[k]); if (r) return r; }
  return null;
}
```

### 3.1 Locale Sheet vi_VN (BẮT BUỘC)
Sheet đặt ngôn ngữ Việt dùng `;` giữa đối số và `\` giữa cột trong `{..}`. `setFormula` không tự đổi → mọi công thức phải qua `fx_()`, nếu không đều `#ERROR!`. Công thức viết theo dạng en-US (dấu `,`):
```js
let SEMI_ = null;
function semi_(){
  if (SEMI_ !== null) return SEMI_;
  const ss = SpreadsheetApp.getActive(), tmp = ss.insertSheet('_tmp_locale');
  try { tmp.getRange('A1').setFormula('=SUM(1,2)'); SpreadsheetApp.flush(); SEMI_ = tmp.getRange('A1').getValue() !== 3; }
  finally { ss.deleteSheet(tmp); }
  return SEMI_;
}
function fx_(f){
  if (typeof f !== 'string' || !semi_()) return f;
  let out = '', i = 0; const stack = [];
  while (i < f.length){
    const c = f[i];
    if (c === '"' || c === "'"){
      let j = i + 1;
      while (j < f.length){ if (f[j] === c){ if (f[j+1] === c){ j += 2; continue; } break; } j++; }
      let body = f.slice(i+1, j);
      if (c === '"' && /^[#0,.]+$/.test(body)) body = body.replace(/[,.]/g, m => m === ',' ? '.' : ',');
      out += c + body + c; i = j + 1; continue;
    }
    if (c === '{' || c === '(') stack.push(c);
    if (c === '}' || c === ')') stack.pop();
    if (c === ',') out += stack[stack.length-1] === '{' ? '\\' : ';';
    else if (c === '.' && /\d/.test(f[i-1]||'') && /\d/.test(f[i+1]||'')) out += ',';
    else out += c;
    i++;
  }
  return out;
}
```

## 4. Bộ mã mẫu — đọc form, Daily note, đồng bộ
```js
function formEntries_(acc){ return (acc && Array.isArray(acc.form)) ? acc.form : []; }
function b64json_(s){
  s = String(s||''); if (!s) return null;
  const pad = s + '='.repeat((4 - s.length % 4) % 4); let txt = null;
  try { txt = Utilities.newBlob(Utilities.base64DecodeWebSafe(pad)).getDataAsString('UTF-8'); }
  catch(e){ try { txt = Utilities.newBlob(Utilities.base64Decode(pad)).getDataAsString('UTF-8'); } catch(e2){ return null; } }
  try { return JSON.parse(txt); } catch(e){ return null; }
}
function parseTable_(raw){     // [[ts,text],...] hoặc [{date,update}] -> [{d,t,hasDate}]
  if (raw===undefined||raw===null||raw==='') return [];
  let v = raw;
  if (typeof v==='string'){ try { v = JSON.parse(v); } catch(e){ return cleanText_(v) ? [{ d:new Date(), t:cleanText_(v) }] : []; } }
  const rows = Array.isArray(v) ? v : (v && typeof v==='object' ? Object.keys(v).map(k=>v[k]) : []);
  const isDateLike = x => (typeof x==='number' && x>1e8) || /^\d{9,13}$/.test(String(x)) || /^\d{1,4}[-\/.]\d{1,2}[-\/.]\d{1,4}/.test(String(x));
  const out = [];
  rows.forEach(r => {
    let d = '', t = '';
    if (Array.isArray(r)){ const di = r.findIndex(isDateLike); d = di>=0 ? r[di] : ''; t = r.filter((x,i)=>i!==di).map(cleanText_).filter(Boolean).join(' '); }
    else if (r && typeof r==='object'){
      const keys = Object.keys(r), dk = keys.find(k=>/date|ngày|time/i.test(k)) || keys.find(k=>isDateLike(r[k]));
      const tk = keys.find(k=>/update|nội dung|content|text|note|tình trạng/i.test(k) && k!==dk) || keys.find(k=>k!==dk && typeof r[k]==='string');
      d = dk ? r[dk] : ''; t = tk ? cleanText_(r[tk]) : '';
    } else if (typeof r==='string') t = cleanText_(r);
    const dt = parseDate_(d); if (t) out.push({ d: dt||new Date(), t:t, hasDate:!!dt });
  });
  return out;
}
function parseDisplayTable_(display){   // "dd-mm-yyyy|nội dung" nhiều dòng
  const rows = String(display||'').split(/\r?\n/).map(l=>l.split('|')).filter(r=>r.join('').trim());
  return rows.length ? parseTable_(rows) : [];
}
function fv_(a, form, key, fallback){    // giá trị trường tuỳ chỉnh theo TÊN trường; display ưu tiên hơn value
  const re = FIELD_NAMES[key];
  const ent = re && formEntries_(a).find(x => re.test(String(x.name)) && ((x.display!==undefined && x.display!=='') || (x.value!==undefined && x.value!=='')));
  if (ent) return (ent.display!==undefined && ent.display!=='') ? ent.display : ent.value;
  return fallback ? pick_(a, [].concat(fallback)) : '';
}
function dailyRows_(acc, a){            // các dòng Daily note của 1 account
  const all = [].concat(formEntries_(acc), formEntries_(a)).filter(x => x && (x.value || x.display));
  const rank = x => /^\s*daily\s*note\s*$/i.test(String(x.name)) ? 0 : (FIELD_NAMES.note.test(String(x.name)) ? 1 : (/table/i.test(String(x.type||'')) ? 2 : 3));
  for (const note of all.filter(x => rank(x) <= 2).sort((p,q) => rank(p)-rank(q))){
    let t = [];
    if (note.value){ const j = b64json_(note.value); if (j !== null) t = parseTable_(j); }
    if (!t.some(x=>x.hasDate) && note.display) t = parseDisplayTable_(note.display);
    if (t.some(x=>x.hasDate)) return t;
  }
  return [];
}
```

### 4.1 syncAccounts (dedupe + thời gian + log giai đoạn)
Cột sheet dữ liệu: A id, B ngày tạo, C ngày cập nhật, D owner_id, E tên, F NCC mới (tháng), G quốc gia, H loại hình, I sản phẩm, J tiềm năng, K qty, L value, M ref, N giai đoạn, O (công thức note mới nhất), P liên hệ, Q ngày xác nhận, R ngày đàm phán gần nhất, S tên nhân sự (công thức), T nhóm (công thức), U Daily note đúng ngày (công thức), W1 giờ đồng bộ, W4 trạng thái. Script CHỈ ghi A:N và P:Q (O,R,S,T,U là ArrayFormula, không ghi đè).
```js
function syncAccounts(){
  const t0 = Date.now();
  if (!PropertiesService.getScriptProperties().getProperty('BASE_TOKEN')) throw new Error('Chưa có token. Dùng menu "Lưu token CRM" trước.');
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const rows = [], seen = new Set(); let form = null, page = 0, finished = false;
  while (Date.now() - t0 < SALES_API.maxMinutes*60000){
    const accs = firstArray_(salesCall_(SALES_API.accountList, listParams_(page, 100))) || [];
    if (form === null) form = loadForm_(accs);
    if (!accs.length){ finished = true; break; }
    const fresh = accs.filter(a0 => { const k = String(pick_(a0,['id'])); if (seen.has(k)) return false; seen.add(k); return true; });
    if (!fresh.length){ finished = true; break; }          // trang lặp lại => hết dữ liệu
    fresh.forEach(a0 => {
      let a = a0;
      if (Date.now() - t0 < (SALES_API.maxMinutes-1)*60000){
        try { const d = salesCall_(SALES_API.activities, { id:a0.id, user_id:SALES_API.viewerId }, SALES_API.activitiesVersion); if (d.account) a = Object.assign({}, a0, d.account); } catch(e){}
      }
      { const nm = ownerNameOf_(a); if (nm) OWNER_NAMES_[String(pick_(a,['owner_id']))] = nm; }
      const created = parseDate_(pick_(a,['since'])), fm = k => fv_(a, form, k, FIELD_MAP[k]);
      rows.push([ pick_(a,['id']), created, parseDate_(pick_(a,['last_update'])), String(pick_(a,['owner_id'])), pick_(a,['name','title']),
        (created && created >= monthStart) ? 'Có' : 'Không', fm('country'), fm('ctype'), fm('product'), fm('potential'),
        Number(fm('qty'))||0, Number(fm('value'))||0, fm('ref'),
        String(fv_(a, form, 'stage') || a.stage_name || stageName_(a.stage_id)), '', fm('contact'), parseDate_(fm('confirmDate')) ]);
    });
    if (accs.length < 100){ finished = true; break; }
    page++;
  }
  let moved = 0;
  try { moved = logStageChanges_(rows); } catch(e){ Logger.log('Bỏ qua log giai đoạn: ' + e.message); }
  writeData_(rows); updateMaps_(rows);
  try { syncStaff(true); } catch(e){ Logger.log('Bỏ qua nhân sự: ' + e.message); }
  SpreadsheetApp.getActive().getSheetByName(SH.DATA).getRange('W4').setValue(finished ? 'Đã đồng bộ đủ ' + rows.length + ' account (' + moved + ' NCC đổi giai đoạn)' : 'CHƯA ĐỦ: mới lấy ' + rows.length + ' account (hết thời gian)');
}
function writeData_(rows){
  const sh = SpreadsheetApp.getActive().getSheetByName(SH.DATA), last = Math.max(sh.getLastRow(), 2);
  sh.getRange(2,1,last-1,14).clearContent(); sh.getRange(2,16,last-1,2).clearContent();
  if (rows.length){ sh.getRange(2,1,rows.length,14).setValues(rows.map(r=>r.slice(0,14))); sh.getRange(2,16,rows.length,2).setValues(rows.map(r=>r.slice(15,17))); }
  sh.getRange('W1').setValue(new Date());
}
```

### 4.2 Nhật ký chuyển giai đoạn (sheet `Chuyển giai đoạn`)
Cột: A Ngày, B Thời điểm ghi, C ID account (text), D Tên, E Từ, F Đến, G Owner ID (text), H Owner (công thức ARRAYFORMULA VLOOKUP sheet nhân sự, fallback ID), I Country, J Product, K Loại. Script ghi A:G và I:K (không đụng H).
```js
function lastRowCol_(sh, col){ const v = sh.getRange(1,col,sh.getMaxRows(),1).getValues(); for (let i=v.length-1;i>=0;i--) if (v[i][0]!=='') return i+1; return 1; }
function logStageChanges_(rows){
  const sh = SpreadsheetApp.getActive().getSheetByName(SH.STG); if (!sh) return 0;
  const last = {}, lr = lastRowCol_(sh,1);
  if (lr > 1) sh.getRange(2,1,lr-1,11).getValues().forEach(r => { if (r[2]!=='') last[String(r[2])] = String(r[5]); });
  const today = todayMid_(), now = new Date(), out = [];
  rows.forEach(r => {
    const id = String(r[0]), st = String(r[13]||'').trim(); if (!id || !st) return;
    const prev = last[id];
    if (prev === undefined){
      const c = (r[1] instanceof Date) ? new Date(r[1].getFullYear(), r[1].getMonth(), r[1].getDate()) : today;
      out.push([c, now, id, r[4], '(mới)', st, String(r[3]), r[6], r[8], 'Thêm mới']); last[id] = st;
    } else if (prev !== st){
      const rename = /^\d+$/.test(prev) && !/^\d+$/.test(st);       // đổi mã số -> tên: không tính thống kê
      out.push([today, now, id, r[4], prev, st, String(r[3]), r[6], r[8], rename ? 'Cập nhật tên' : 'Chuyển giai đoạn']); last[id] = st;
    }
  });
  if (!out.length) return 0;
  const start = lr + 1;
  sh.getRange(start,1,out.length,7).setValues(out.map(o=>o.slice(0,7)));
  sh.getRange(start,9,out.length,3).setValues(out.map(o=>o.slice(7)));
  return out.filter(o => o[9]==='Chuyển giai đoạn').length;
}
function dedupeStageLog(){            // dọn dòng trùng (cùng ID+từ+đến+loại), chạy 1 lần
  const sh = SpreadsheetApp.getActive().getSheetByName(SH.STG), lr = lastRowCol_(sh,1); if (lr < 3) return;
  const v = sh.getRange(2,1,lr-1,11).getValues(), seen = new Set(), keep = [];
  v.forEach(r => { const k = [r[2],r[4],r[5],r[10]||r[9]].join('|'); if (!seen.has(k)){ seen.add(k); keep.push(r); } });
  sh.getRange(2,1,lr-1,7).clearContent(); sh.getRange(2,9,lr-1,3).clearContent();
  if (keep.length){ sh.getRange(2,1,keep.length,7).setValues(keep.map(r=>r.slice(0,7))); sh.getRange(2,9,keep.length,3).setValues(keep.map(r=>r.slice(8,11))); }
}
```
Lần đầu log trống: mọi account được ghi "Thêm mới" với ngày = ngày tạo account (baseline). Giữa hai lần đồng bộ có thể bỏ sót chuyển giai đoạn nếu đổi 2 lần liên tiếp, vì vậy cài trigger mỗi giờ.

### 4.3 Nhân sự (sheet `Danh sách nhân sự`: A owner_id (@), B tên (@), C chức danh, D nhóm, E Có/Không, F:J target, L giai đoạn, M nhóm báo cáo, O danh sách chọn)
```js
function accountCall_(extra){
  const pr = PropertiesService.getScriptProperties();
  const tk = pr.getProperty('ACCOUNT_TOKEN') || pr.getProperty('BASE_TOKEN');
  if (!tk) throw new Error('Chưa có token.');
  const payload = {}; payload[ACCOUNT_API.tokenParam] = tk;       // API Account chỉ cần access_token
  Object.keys(extra||{}).forEach(k => payload[k] = extra[k]);
  const tried = [];
  for (const url of accountUrls_()){
    let res; try { res = UrlFetchApp.fetch(url, { method:'post', payload:payload, muteHttpExceptions:true }); } catch(e){ continue; }
    const text = res.getContentText(); let j = null; try { j = JSON.parse(text); } catch(e){}
    tried.push(url.replace('https://','') + ' -> ' + (j ? 'code=' + j.code + ' ' + (j.message||'') : 'HTTP ' + res.getResponseCode() + ' ' + text.slice(0,40)));
    if (j && Array.isArray(firstArray_(j))){ PropertiesService.getScriptProperties().setProperty('ACCOUNT_URL', url); return j; }
  }
  return { raw: 'Không URL nào trả danh sách user. Đã thử: ' + tried.join(' | ') };
}
function syncStaff(silent){            // cập nhật tên/chức danh dòng có sẵn, thêm user mới (Có nếu đang sở hữu account); giữ target/nhóm
  const ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(SH.STAFF);
  const users = firstArray_(accountCall_()) || [];
  if (!users.length){ if (silent) return; SpreadsheetApp.getUi().alert('Không đọc được danh sách user.'); return; }
  const data = ss.getSheetByName(SH.DATA);
  const owners = new Set(data.getLastRow()>1 ? data.getRange(2,4,data.getLastRow()-1,1).getValues().map(r=>String(r[0])) : []);
  const last = Math.max(sh.getLastRow(),1), cur = last>1 ? sh.getRange(2,1,last-1,10).getValues() : [];
  const idx = {}; cur.forEach((r,i) => { if (r[0]!=='') idx[String(r[0])] = i; });
  const add = [];
  users.forEach(u => {
    const id = String(pick_(u,['id','user_id'])); if (!id) return;
    const name = String(pick_(u,['name','fullname','username'])), title = String(pick_(u,['title','position','job_title']));
    if (idx[id] !== undefined){ const r = cur[idx[id]]; if (name) r[1] = name; if (title) r[2] = title; }
    else add.push([id, name, title, 'Sourcing', owners.has(id) ? 'Có' : 'Không','','','','','']);
  });
  if (cur.length) sh.getRange(2,1,cur.length,10).setValues(cur);
  if (add.length) sh.getRange(cur.length+2,1,add.length,10).setValues(add);
  sh.getRange('A2:A200').setNumberFormat('@'); sh.getRange('B2:B200').setNumberFormat('@');
}
```
`updateMaps_(rows)` phải: (a) thêm giai đoạn mới vào cột L, (b) thêm owner_id lạ vào A (tên = ID, E=Có), (c) ép cột tên B về text (tên toàn số làm COUNTIFS "?*" không đếm), (d) `fillStageMap_` điền nhóm mặc định cho ô M trống: Newly added/Contacting/Đúng hàng/Verified→NEG, Quality Approved→PEND, Ordered→CONF, Sai hàng/Hold→LOST. Dọn nhân sự mẫu bằng `removeDemoStaff_` trong `setupAll`.

### 4.4 syncActivities
Quét account (có `maxMinutes`, lưu `ACT_PAGE` trong Properties để chạy tiếp), với mỗi account gọi `account/get`, `dailyRows_` → ghi từng dòng vào sheet `Activity theo ngày` (A key = `id|yyyyMMdd|40 ký tự đầu nội dung` để không ghi trùng, B ngày, C giờ, D account id, E tên, F owner, G "Daily note", H nội dung, I kênh, J mẫu Gửi/Nhận). Bỏ qua account cũ đã có nhật ký và `last_activity` trước `lookbackDays`. Cũng phải dedupe trang lặp.

### 4.5 Trigger & menu
```js
function setReportDateToday(){ const s = SpreadsheetApp.getActive().getSheetByName(SH.RPT); if (s) s.getRange('C3').setValue(todayMid_()); }
function installTrigger(){
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncAccounts').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('syncActivities').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('setReportDateToday').timeBased().everyDays(1).atHour(0).nearMinute(5).inTimezone(SpreadsheetApp.getActive().getSpreadsheetTimeZone()).create();
}
function removeAllTriggers(){ ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t)); }
```
`onOpen` tạo menu: 1 Dựng giao diện (`setupAll`), Lưu token CRM, Lưu token Account, Đồng bộ nhân sự, Dò API Account (`probeAccount`), Kiểm tra API, Xem trường account mẫu, ★ Chẩn đoán tổng hợp, Đồng bộ account, Đồng bộ activity, Cài lịch tự động, Xóa lịch cũ, Xóa dữ liệu. `setupAll` tạo đủ sheet trước (tránh #REF!) rồi gọi build từng sheet.

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