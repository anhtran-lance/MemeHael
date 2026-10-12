# gen.py và test.js (mục 6–7 của skill)

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
