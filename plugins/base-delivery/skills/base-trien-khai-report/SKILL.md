---
name: "base-trien-khai-report"
description: "Dựng báo cáo quản trị triển khai Base (dashboard, lưu đồ, trạng thái QT theo ngày, CRM, bàn giao) cho một đơn vị mới bằng template + config, đúng chuẩn giao diện báo cáo TLD."
---

# Báo cáo quản trị triển khai Base (template + config)

Dùng khi Meme cần báo cáo theo dõi triển khai Base cho một đơn vị/khách hàng mới, cùng kiểu "TLD - BASE | BÁO CÁO QUẢN TRỊ TRIỂN KHAI". Toàn bộ nội dung tiếng Việt.

**Nguyên tắc cốt lõi: KHÔNG viết lại HTML, KHÔNG sửa tay mã nguồn.** Báo cáo được sinh từ một template đã kiểm thử + một file `config.json` mô tả đơn vị. Chất lượng thiết kế (Rework keynote, sáng/tối, nền động, khối NHẬN ĐỊNH/HÀNH ĐỘNG) nằm sẵn trong template; việc của bạn là thu thập dữ liệu đúng, điền config đúng, sinh, kiểm thử, publish.

## 0. Nguồn

| Thứ | Link | Ghi chú |
|---|---|---|
| Template (nguồn sinh) | `https://claude.ai/artifact/6k2ytVed2ek61csYxVfSwj` | "DEMO - Báo cáo quản trị", dữ liệu minh họa. KHÔNG publish đè trừ khi nâng cấp template. |
| Báo cáo TLD (chuẩn tham chiếu) | `https://claude.ai/artifact/MxCsnPXWpEMwZsE85KCx2i` | Bản live có dữ liệu khách hàng. Chỉ đọc để đối chiếu, KHÔNG publish đè khi làm đơn vị khác. |
| AMECC (tham chiếu ý tưởng) | `https://claude.ai/artifact/WfuBwodfNSt5K2mtnbUkLX` | Không sửa. |
| Slide Bảo vệ CSA Level 2 | `https://claude.ai/artifact/EfSAPXMmqKfix3qRbHKS1v` | Chuẩn style Rework keynote (bản sáng). |
| Skill style | `rework-keynote-style` | Đọc khi cần nâng cấp giao diện template. |

Bất kỳ báo cáo nào đã sinh từ template (có `<script id="config">`) đều dùng được làm nguồn — `gen.py` tự bóc config/state/skeleton.

## 1. Quy trình làm (theo đúng thứ tự)

1. **Phỏng vấn** (AskUserQuestion, tối đa 4 câu/lượt) theo checklist mục 3. Cái gì đọc được từ Base thì tự đọc, chỉ hỏi phần không có trên hệ thống.
2. **Thu thập từ Base** (mục 4) → lập bảng phòng × QT, gửi người dùng xác nhận trước khi sinh.
3. **Lấy template**: `Artifact` action `read`, `url` = template, `path: "index.html"` → file lưu trong scratchpad.
4. **Viết `config.json`** theo schema mục 2 (dùng Write). Lưu config cạnh báo cáo và vào Project nếu có.
5. **Sinh**: `python3 gen.py <index.html> config.json out.html` (script mục 6). Có "LỖI CONFIG" → sửa config, không sửa template.
6. **Kiểm thử**: `node test.js out.html shots/x` (mục 7) → phải ra `errors:[]`, `leftover:[]`, `saveRoundTrip:true`. Mở ảnh `shots/x-dark-dash.png`, `x-light-dash.png`, `x-dark-flow.png` và tự soát theo checklist mục 8.
7. **Publish artifact MỚI**: `file_path=out.html`, KHÔNG có `url`, `icon:"chart"`, `capabilities:{"artifact":{},"user":{}}`, `description` một câu. Tiêu đề lấy từ `<title>` = "<SHORT> - Báo cáo quản trị".
8. **Báo lại** (mục 12).

## 2. Schema config

```json
{
 "unit": {"short":"TLD","full":"Công ty Cổ phần TLD","partner":"Base Service"},
 "golive": "2026-11-02",
 "start": "2026-10-01",
 "catalogDate": "2026-10-09",
 "bizLabel": "phòng kinh doanh",
 "depts": [
  {"id":"chem","name":"Chem","pkd":1,"conn":1,
   "hof":"QT Xử lý đơn có bước webhook chuyển phiếu sang QT khác trong bộ.",
   "groups":[{"g":"Kinh doanh","items":[["CH01","TN 0","QT Xử lý đơn"],["CH04","4","QT xử lý ĐH - Chuyển khẩu","C"]]},
             {"g":"Sourcing","items":[["CH06","TN 2","QT Sourcing","",1]]}]},
  {"id":"kt","name":"Kế toán","groups":[{"g":"Bộ quy trình","items":[["KT01","HT","QT thanh toán"]]}]}
 ],
 "logName": "LOG",
 "logFns": [{"k":"X","n":"Xuất khẩu"},{"k":"C","n":"Chuyển khẩu"}],
 "hand": [{"k":"qt","t":"Quy trình","due":"2026-10-25"},{"k":"crm","t":"CRM","due":"2026-10-25"},{"k":"rep","t":"Báo cáo ngày","due":"2026-11-01"}],
 "conn": {"name":"Discord","desc":"Đầu vào của Chem và Resin"},
 "ww": [["booking","Booking","Đặt xe và phòng họp"]],
 "crm": {"rows":[{"id":"chem_s","name":"Chem · Sales","dept":"chem"},{"id":"chem_src","name":"Chem · Sourcing","dept":"chem","sub":1}],
         "note":"Chem tách Sales và Sourcing theo dịch vụ công ty trên CRM."},
 "dailyNote": "Báo cáo ngày do Base cùng IT TLD xây bằng Apps Script, tổng hợp đầu ra từ các quy trình.",
 "flowNote": "",
 "notes": ["Điểm cần xác nhận 1", "Điểm cần xác nhận 2"]
}
```

| Trường | Ý nghĩa / quy tắc |
|---|---|
| `unit.short` | Bắt buộc. Viết hoa, ngắn (hiện ở tiêu đề "<SHORT> - BASE \| BÁO CÁO QUẢN TRỊ TRIỂN KHAI"). |
| `golive`, `start` | YYYY-MM-DD. Tuần 1 = từ `start` tới Chủ nhật đầu tiên, sau đó thứ Hai–Chủ nhật, tuần cuối dừng trước go-live, thêm mốc Go-live. Bảng ngày bỏ Chủ nhật. |
| `catalogDate` | Ngày đọc danh mục QT từ Base (chân trang). Bỏ trống thì không hiện. |
| `depts[]` | Tối đa 10 (màu `--d0..--d9` tự gán theo thứ tự; đặt PKD trước). `id` chỉ a-z0-9_. `pkd:1` = khối Business (★). Không `pkd` = khối Back & Hỗ trợ. `conn:1` = phòng có kết nối ngoài. `hof` = ghi chú bàn giao nội bộ trên lưu đồ. |
| `items[]` | `[mã duy nhất, số hiệu QT trên Base, tên QT, mã chức năng hỗ trợ?, cờ sourcing?]`. Mã chức năng phải có trong `logFns`. |
| `logName`, `logFns` | Phòng hỗ trợ thao tác trên QT nằm trong bộ PKD (kiểu LOG). Không có → bỏ cả hai: khối LOG, chú thích, dòng LOG ở khối Back tự ẩn. Tối đa 4 chức năng (4 màu). |
| `hand[]` | Hạng mục bàn giao theo PKD + hạn. Bao nhiêu mục cũng được; cột tự co. |
| `conn` | Kết nối hệ thống ngoài (Discord, Zalo OA…). Bỏ → khung kết nối, cột, câu nhắc tự ẩn. |
| `ww[]` | App Base Wework dùng chung `[key, tên, mô tả]`. Rỗng → ẩn. |
| `crm.rows[]` | Dòng CRM theo dịch vụ công ty trên Base Sales; `dept` phải là id phòng; `sub:1` = dòng phụ (Sourcing). Bỏ `crm` → ẩn tab 03 và khối CRM trên dashboard. |
| `dailyNote`, `flowNote`, `notes[]` | Câu mô tả; `flowNote` trống thì dùng câu mặc định; `notes` = "Điểm cần xác nhận" ở tab Hướng dẫn. |

Trạng thái (cố định trong template, không đổi mã để tương thích dữ liệu): QT `dig` Đã số hóa → `pre` Chưa vận hành → `test` Đang UAT → `fix` Đang tối ưu → `live` Hoàn thiện. CRM Account/Contact/Pipeline: Đã số hóa / Đang UAT / Đang vận hành & tối ưu; Báo cáo quản trị CRM: Đã phân tích / Đã xây dựng demo. Bàn giao: Chưa bàn giao / Đang hoàn thiện / Đã bàn giao (quá hạn tự đánh dấu). Ô trống giữ trạng thái ngày trước.

## 3. Checklist phỏng vấn

1. Tên đầy đủ + tên viết tắt đơn vị; đối tác hiển thị (thường "Base Service").
2. Ngày bắt đầu theo dõi và ngày go-live.
3. Danh sách phòng kinh doanh (khối Business) và phòng chức năng (khối Back & Hỗ trợ). Phòng nào tách Sales/Sourcing?
4. Có phòng hỗ trợ thao tác trên QT của PKD không (kiểu LOG)? Chức năng của nó? QT nào thuộc chức năng nào?
5. Hạng mục bàn giao và hạn (mặc định gợi ý: Quy trình, CRM, Báo cáo ngày).
6. Kết nối ngoài (Discord/Zalo/website…) và phòng nào dùng; app Wework dùng chung.
7. Có theo dõi CRM không; các dòng CRM theo dịch vụ công ty.
8. Điểm cần xác nhận muốn ghi ở tab Hướng dẫn.

Không hỏi trạng thái hiện tại: báo cáo bắt đầu rỗng, người dùng tự cập nhật trên trang.

## 4. Thu thập dữ liệu từ Base

- Quy trình: Base Service `<tenant>.base.vn/service` → chỉ QT đang hoạt động; QT không hiển thị = đã đóng; Base Process chỉ là automation, không đưa vào; nhóm "mặc định"/bản "Copy" là test → loại. Ghi số hiệu QT (TN 0, HT 1…) vào cột 2 của item.
- CRM: Base Sales `<tenant>.base.vn/sales` → Cài đặt: Dịch vụ công ty (→ `crm.rows`), Dịch vụ liên hệ, Quy trình thương vụ, Báo cáo. Chỉ dùng để dựng cấu trúc, KHÔNG điền sẵn trạng thái hay ghi chú hiện trạng (sẽ thay đổi nhiều).
- Trình duyệt: dùng trình duyệt đã đăng nhập (Claude in Chrome hoặc trình duyệt trong app). Nếu cần đăng nhập thì người dùng tự đăng nhập, không bao giờ nhập mật khẩu. Xin quyền truy cập từng site.
- Lập bảng xác nhận (phòng → nhóm → mã, số hiệu, tên QT, chức năng hỗ trợ) gửi người dùng trước khi sinh.

## 5. Chuẩn giao diện (đã có trong template — dùng để soát, không tự chế lại)

- Rework keynote: tối mặc định (navy, nhấn cyan/vàng) + nút chuyển sáng. Ở giao diện tối chữ phụ, tiêu đề cột, chú thích đều trắng; màu trạng thái sáng (live #3BE68F, fix #B99EFF, test #FFC94D, pre #AEB6CF, dig #5CB8FF).
- Font Be Vietnam Pro + Inter (không dùng Sora — thiếu dấu tiếng Việt). Chữ tô gradient có padding trên để không cắt dấu ("TRIỂN").
- Nền động: tối = sao + bụi sáng + cực quang + sao băng; sáng = mảng màu loang + bokeh. Tôn trọng `prefers-reduced-motion`.
- Dashboard: hero đếm ngược (số ngày to nhất, vàng cam) + mốc tuần; câu kết luận lớn; 3 thẻ Tổng kết điều hành (Đánh giá tiến độ / Điểm nghẽn / Ưu tiên tuần này); 7 KPI; khối Business và Back & Hỗ trợ (số theo màu, không khung, 0 là "–", cột Đã số hóa là nút "✓ Done"); khối CRM; cơ cấu, xu hướng, LOG, bàn giao. **Mỗi biểu đồ có NHẬN ĐỊNH + HÀNH ĐỘNG tự tính.**
- Không dùng màu làm kênh duy nhất (luôn có nhãn chữ). Vừa laptop 1440px ở zoom 100%.
- Tab: 00 Dashboard · 01 Lưu đồ (PKD hàng trên, phòng chức năng hàng dưới; dải màu nối phòng LOG nếu có) · 02 Trạng thái theo ngày (QT × ngày, cột "Hiện tại" cố định, ô trống giữ trạng thái ngày trước — chữ nghiêng, viền đứt, có "Xóa cập nhật ngày này") · 03 CRM (bảng hôm nay + cập nhật theo ngày) · 04 Bàn giao & kết nối · 05 Hướng dẫn.
- Cấu trúc file: `<title>` → Google Fonts → `<style id="css">` → `<template id="tpl">` → `<script id="config">` → `<script id="state">` → `<script id="main">`. Trang tự lưu bằng `claude.use('artifact').publish(build())` (build ghép lại cả config); quyền sửa qua `claude.use('user').canEdit()` → "Chế độ chỉnh sửa / chỉ xem / Bản xem trước". Hash tab `#t-<tab>`.

## 6. gen.py (sinh báo cáo + kiểm tra config)

```python
#!/usr/bin/env python3
"""Sinh báo cáo triển khai Base từ template + config.
Dùng: python3 gen.py report-template.html config.json out.html
"""
import json, sys, re, datetime as dt

tpl_path, cfg_path, out_path = sys.argv[1:4]
tpl = open(tpl_path, encoding='utf8').read()
# Nguồn có thể là template (__CONFIG__) hoặc bất kỳ báo cáo đã publish nào dựng từ template.
if '__CONFIG__' not in tpl:
    if '<script id="config"' not in tpl: sys.exit('Nguồn không phải template báo cáo (thiếu <script id="config">)')
    if '<!doctype' in tpl[:200].lower():  # bản đọc từ artifact: bỏ skeleton nền tảng
        tpl = tpl[tpl.index('<title>'):tpl.rindex('</body>')].rstrip()
    tpl = re.sub(r'<title>.*?</title>', '<title>__TITLE__</title>', tpl, count=1, flags=re.S)
    tpl = re.sub(r'(<script id="config" type="application/json">).*?(</script>)', lambda m: m.group(1) + '__CONFIG__' + m.group(2), tpl, count=1, flags=re.S)
    tpl = re.sub(r'(<script id="state" type="application/json">).*?(</script>)', lambda m: m.group(1) + '{"st":{},"hand":{},"dc":{},"ww":{},"digd":{},"crmd":{},"updated":""}' + m.group(2), tpl, count=1, flags=re.S)
cfg = json.load(open(cfg_path, encoding='utf8'))
err, warn = [], []

def d(s, k):
    try: return dt.date.fromisoformat(s)
    except Exception: err.append(f'{k}: ngày "{s}" không đúng định dạng YYYY-MM-DD'); return None

u = cfg.get('unit') or {}
if not u.get('short'): err.append('unit.short bắt buộc (tên viết tắt đơn vị)')
st, gl = d(cfg.get('start', ''), 'start'), d(cfg.get('golive', ''), 'golive')
if st and gl and st >= gl: err.append('start phải trước golive')
deps = cfg.get('depts') or []
if not deps: err.append('depts trống')
if len(deps) > 10: warn.append('quá 10 phòng: màu phòng sẽ lặp lại')
if not any(x.get('pkd') for x in deps): err.append('cần ít nhất 1 phòng pkd:1 (khối Business)')
ids, codes = set(), set()
lf = {f['k'] for f in cfg.get('logFns') or []}
for x in deps:
    if not re.fullmatch(r'[a-z][a-z0-9_]*', x.get('id', '')): err.append(f'id phòng "{x.get("id")}" chỉ dùng a-z, 0-9, _')
    if x['id'] in ids: err.append(f'id phòng trùng: {x["id"]}')
    ids.add(x['id'])
    n = 0
    for g in x.get('groups') or []:
        for it in g.get('items') or []:
            n += 1
            if len(it) < 3: err.append(f'{x["id"]}: QT thiếu trường {it}'); continue
            if it[0] in codes: err.append(f'mã QT trùng: {it[0]}')
            codes.add(it[0])
            if len(it) > 3 and it[3] and it[3] not in lf: err.append(f'{it[0]}: chức năng "{it[3]}" không có trong logFns')
    if n == 0: warn.append(f'phòng {x["id"]} chưa có QT nào')
    if x.get('conn') and not (cfg.get('conn') or {}).get('name'): err.append(f'{x["id"]} có conn:1 nhưng thiếu conn.name')
for h in cfg.get('hand') or []:
    hd = d(h.get('due', ''), 'hand.' + h.get('k', '?'))
    if hd and gl and hd > gl: warn.append(f'hạn bàn giao {h["k"]} sau go-live')
for r in (cfg.get('crm') or {}).get('rows') or []:
    if r.get('dept') not in ids: err.append(f'crm row {r.get("id")}: dept "{r.get("dept")}" không tồn tại')
if err:
    print('LỖI CONFIG:\n- ' + '\n- '.join(err)); sys.exit(1)

j = json.dumps(cfg, ensure_ascii=False).replace('<', '\\u003c')
title = f'{u["short"]} - Báo cáo quản trị'
assert tpl.count('__CONFIG__') == 1 and tpl.count('__TITLE__') == 1
out = tpl.replace('__CONFIG__', j).replace('__TITLE__', title.replace('<', '&lt;'))
open(out_path, 'w', encoding='utf8').write(out)
for w in warn: print('Cảnh báo:', w)
print(f'OK {out_path}: {len(deps)} phòng, {len(codes)} QT, {len(out)//1024} KB')
```

## 7. test.js (Playwright, Chromium có sẵn)

```js
// node test.js out.html shotPrefix  -> kiểm tra lỗi, tab, sáng/tối, lưu khứ hồi
const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const [file,pre]=process.argv.slice(2);
const wrap=f=>{const w=path.resolve(f+'.wrap.html'); fs.writeFileSync(w,'<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync(f,'utf8')+'</body></html>'); return w;};
const stub=()=>{window.claude={use:n=>Promise.resolve(n==='artifact'?{publish:h=>{window.__pub=h;return Promise.resolve({})}}:n==='user'?{canEdit:()=>Promise.resolve(true)}:null)}};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const pg=await b.newPage({viewport:{width:1440,height:900}}); const errs=[];
  pg.on('pageerror',e=>errs.push('pageerror: '+e.message)); pg.on('console',m=>{ if(m.type()==='error'&&!/fonts\.g/.test(m.text())) errs.push('console: '+m.text()); });
  await pg.addInitScript(stub);
  await pg.goto('file://'+wrap(file)); await pg.waitForTimeout(1200);
  const tabs=await pg.$$eval('nav.tabs button[data-tab]',bs=>bs.filter(b=>b.offsetParent).map(b=>b.dataset.tab));
  const leftover=await pg.evaluate(()=>(document.body.innerText.match(/\{\{\w+\}\}|undefined|NaN/g)||[]));
  for(const theme of ['dark','light']){
    await pg.evaluate(t=>{ document.documentElement.setAttribute('data-theme',t); window.__skyDraw&&window.__skyDraw(); },theme);
    for(const t of tabs){ await pg.click(`nav.tabs button[data-tab="${t}"]`); await pg.waitForTimeout(350);
      const lo=await pg.evaluate(()=>(document.body.innerText.match(/\{\{\w+\}\}|undefined|NaN/g)||[])); if(lo.length) leftover.push(t+':'+lo.join(','));
      if(pre) await pg.screenshot({path:`${pre}-${theme}-${t}.png`,fullPage:t==='dash'}); }
  }
  // lưu khứ hồi: đổi 1 ô ngày, bấm lưu, nạp lại bản publish
  await pg.click('nav.tabs button[data-tab="daily"]'); await pg.waitForTimeout(200);
  const sel=await pg.$('select[data-p]:not([disabled])')||await pg.$('#p-daily select:not([disabled])');
  let pubOk='skip';
  if(sel){ const opts=await sel.$$eval('option',o=>o.map(x=>x.value).filter(v=>v&&v!=='clear')); await sel.selectOption(opts[opts.length-1]); await pg.waitForTimeout(200);
    await pg.click('#savebtn'); await pg.waitForTimeout(300);
    const pub=await pg.evaluate(()=>window.__pub||'');
    pubOk=/<script id="config" type="application\/json">\{/.test(pub)&&/"st":\{"/.test(pub);
    if(pub){ fs.writeFileSync(path.resolve(file+'.pub.html'),pub); const p2=await b.newPage(); p2.on('pageerror',e=>errs.push('reload: '+e.message)); await p2.addInitScript(stub);
      await p2.goto('file://'+path.resolve(file+'.pub.html')); await p2.waitForTimeout(800);
      const kept=await p2.evaluate(()=>{ try{ return Object.keys(JSON.parse(document.getElementById('state').textContent).st).length; }catch(e){ return -1; } });
      pubOk=pubOk&&kept>0; }
  }
  console.log(JSON.stringify({file,tabs,errors:errs,leftover,saveRoundTrip:pubOk}));
  await b.close();
})();
```

Lỗi `ERR_TUNNEL_CONNECTION_FAILED` của Google Fonts trong sandbox là bình thường, bỏ qua. Muốn so số liệu với ảnh, dùng `page.emulateMedia({reducedMotion:'reduce'})` vì số trên dashboard có hiệu ứng đếm.

## 8. Checklist soát ảnh trước khi publish

- Tiêu đề, eyebrow, mốc tuần, go-live đúng đơn vị và ngày; không còn chữ "TLD", "Discord", "Chem"… nếu đơn vị không có.
- Khối Business đúng số PKD; khối Back đúng phòng chức năng; tổng QT khớp bảng xác nhận.
- Phần không dùng (LOG/kết nối/Wework/CRM) đã ẩn, bố cục không bị lỗ trống.
- Cả sáng và tối: chữ đọc rõ, dấu tiếng Việt không bị cắt, không tràn ngang.
- Lưu khứ hồi OK (bản publish lại vẫn giữ config + state).

## 9. Câu chữ

- Không ngụ ý team triển khai Base chịu trách nhiệm việc phía khách hàng: việc của đơn vị (kết nối ngoài, IT, nhập liệu) viết "Đề nghị <ĐƠN VỊ>…", "phía <ĐƠN VỊ>". Template đã viết theo quy tắc này; câu trong `dailyNote`, `conn.desc`, `notes` cũng phải theo.
- Ngắn, không thuật ngữ kỹ thuật với người dùng cuối.

## 10. Cập nhật báo cáo đã có người dùng lưu

- Đổi danh mục (thêm phòng/QT, đổi hạn): sửa `config.json` → nhắc người dùng bấm "Lưu cập nhật" → `Artifact read` (có `path`) bản live → `python3 gen.py live.html config.json out.html` → ghép lại khối `<script id="state">` của bản live vào `out.html` (gen.py đặt state rỗng) → test → publish với `url` của báo cáo đó.
- Ngay trước publish đọc lại version; nếu đã đổi thì ghép state mới nhất. Bị từ chối vì có version mới → kiểm tra diff chỉ khác state/định dạng rồi publish lại. Không truyền `capabilities`/`icon` khi publish đè.
- Đổi mã QT sẽ mất lịch sử trạng thái của QT đó → chỉ thêm mã mới, không đổi mã cũ.
- Báo cáo TLD (v28) là bản dựng tay trước template: sửa trực tiếp theo cách cũ hoặc hỏi người dùng trước khi chuyển sang bản sinh từ `config-tld.json` (lưu trong Project "TLD", `claude/config-tld.json`; nội dung tương đương, đã đối chiếu từng tab).

## 11. Nâng cấp template

Chỉ khi người dùng muốn đổi giao diện/tính năng chung: sửa bản template, chạy test với ít nhất 2 config (một có đủ LOG/kết nối/CRM, một tối giản), soát ảnh, publish đè template (`url` template), rồi báo các báo cáo đơn vị nào cần sinh lại.

## 12. Báo lại người dùng

2–4 câu: báo cáo của đơn vị nào, bao nhiêu phòng/QT, phần nào ẩn vì đơn vị không dùng, kết quả kiểm thử sáng/tối; nêu giả định và điểm cần xác nhận. Không dán URL (thẻ artifact đã có link). Nhắc artifact đang riêng tư cho đến khi người dùng chia sẻ.