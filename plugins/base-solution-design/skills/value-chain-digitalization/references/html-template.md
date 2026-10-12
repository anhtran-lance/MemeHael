# HTML Template — Value Chain Digitalization Map

Đây là template đầy đủ. Thay thế tất cả `{{PLACEHOLDER}}` bằng nội dung thực tế khi sinh file.

Khi viết Python script để ghi file, escape dấu nháy đơn trong string bằng `\'`.

---

## Cấu trúc placeholder

```
{{INDUSTRY_VI}}        — Tên ngành tiếng Việt (VD: Bảo Hiểm)
{{INDUSTRY_EN}}        — Tên ngành tiếng Anh (VD: Insurance)
{{INDUSTRY_LO}}        — Tên ngành tiếng Lào

{{TITLE1_VI/EN/LO}}    — Dòng tiêu đề 1 (màu cam)
{{TITLE2_VI/EN/LO}}    — Dòng tiêu đề 2 (màu navy)

{{BOX1_TITLE_VI/EN/LO}}  — Tiêu đề nhóm quy trình top-1
{{BOX2_TITLE_VI/EN/LO}}  — Tiêu đề nhóm quy trình top-2
{{BOX3_TITLE_VI/EN/LO}}  — Tiêu đề nhóm quy trình top-3

{{BOX1_ITEMS}} / {{BOX2_ITEMS}} / {{BOX3_ITEMS}}
  — Block <li> song ngữ cho mỗi nhóm quy trình trên

{{VC_STAGES}}          — Block HTML các giai đoạn VC strip

{{BOTTOM1_TITLE_VI/EN/LO}} — Tiêu đề nhóm phụ trợ 1 (Vận hành nội bộ)
{{BOTTOM2_TITLE_VI/EN/LO}} — Tiêu đề nhóm phụ trợ 2 (Kế toán & Đầu tư)
{{BOTTOM1_ITEMS}} / {{BOTTOM2_ITEMS}}
  — Block <li> song ngữ cho nhóm phụ trợ
```

---

## Template HTML đầy đủ

```html
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{INDUSTRY_EN}} — Value Chain Digitalization Map</title>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=Noto+Sans+Lao:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #FFFFFF;
    --blue-dark: #1B3F72;
    --blue-mid: #2563A8;
    --blue-light: #3B82C4;
    --orange: #F26522;
    --text-dark: #1A2E4A;
    --text-mid: #3C5A7A;
    --text-light: #6B88A8;
    --stage-bg: #F0F6FF;
    --stage-border: #C5D9F0;
    --support-bg: #F7FAFE;
    --support-border-dashed: #A8C4E0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    font-family: "Be Vietnam Pro", "Noto Sans Lao", sans-serif;
    color: var(--text-dark);
    padding: 32px 48px 56px;
    min-width: 1280px;
  }
  .lang-bar { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .lang-btn {
    padding: 7px 22px; font-size: 12px; font-weight: 600;
    font-family: "Be Vietnam Pro", "Noto Sans Lao", sans-serif;
    border: 1.5px solid var(--blue-mid); background: transparent;
    color: var(--blue-mid); cursor: pointer; transition: all 0.18s; letter-spacing: 0.4px;
  }
  .lang-btn:first-child { border-radius: 6px 0 0 6px; border-right: none; }
  .lang-btn:nth-child(2) { border-right: none; }
  .lang-btn:last-child { border-radius: 0 6px 6px 0; }
  .lang-btn.active { background: var(--blue-mid); color: #fff; }
  .lang-btn:hover:not(.active) { background: #E8F1FB; }
  .page-title { margin-bottom: 32px; }
  .page-title h1 { font-size: 28px; font-weight: 800; color: var(--orange); line-height: 1.25; letter-spacing: -0.3px; }
  .page-title h2 { font-size: 28px; font-weight: 800; color: var(--blue-dark); line-height: 1.25; letter-spacing: -0.3px; }
  .value-chain-wrapper { display: flex; flex-direction: column; }
  .top-processes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .process-box { border: 1.5px dashed var(--support-border-dashed); border-radius: 6px; padding: 14px 16px 16px; background: var(--support-bg); }
  .process-box-title {
    font-size: 10px; font-weight: 700; color: var(--blue-mid);
    letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px; line-height: 1.5;
  }
  .process-box-title::after { content: ""; flex: 1; border-top: 1.5px dashed var(--support-border-dashed); }
  .process-list { list-style: none; display: flex; flex-direction: column; gap: 5px; }
  .process-list li { font-size: 11.5px; color: var(--text-mid); font-weight: 400; line-height: 1.5; }
  .vc-strip {
    background: var(--stage-bg); border: 1px solid var(--stage-border);
    border-radius: 12px; padding: 28px 24px 32px;
    display: flex; align-items: flex-start; margin-bottom: 20px;
  }
  .vc-stage { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; padding: 0 10px; }
  .vc-stage:not(:last-child)::after {
    content: "›"; position: absolute; right: -8px; top: 26px;
    font-size: 28px; color: var(--blue-light); font-weight: 300; line-height: 1;
  }
  .stage-circle {
    width: 60px; height: 60px; border-radius: 50%;
    background: linear-gradient(145deg, var(--blue-mid) 0%, var(--blue-dark) 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; margin-bottom: 12px;
    box-shadow: 0 4px 14px rgba(37,99,168,0.28); flex-shrink: 0;
  }
  .stage-name-primary { font-size: 11.5px; font-weight: 700; color: var(--blue-dark); text-align: center; line-height: 1.4; }
  .stage-name-secondary { font-size: 10px; font-weight: 400; color: var(--text-light); text-align: center; margin-top: 3px; font-style: italic; line-height: 1.4; }
  .bottom-processes { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  /* lang visibility */
  .t-vi, li.t-vi { display: revert; }
  .t-en, li.t-en { display: none; }
  .t-lo, li.t-lo { display: none; }
  body.lang-en .t-vi, body.lang-en li.t-vi { display: none; }
  body.lang-en .t-en { display: revert; }
  body.lang-en li.t-en { display: list-item; }
  body.lang-en .t-lo, body.lang-en li.t-lo { display: none; }
  body.lang-lo .t-vi, body.lang-lo li.t-vi { display: none; }
  body.lang-lo .t-en, body.lang-lo li.t-en { display: none; }
  body.lang-lo .t-lo { display: revert; }
  body.lang-lo li.t-lo { display: list-item; }
</style>
</head>
<body>

<div class="lang-bar">
  <button class="lang-btn active" id="btn-vi" onclick="setLang('vi')">Tiếng Việt</button>
  <button class="lang-btn" id="btn-en" onclick="setLang('en')">English</button>
  <button class="lang-btn" id="btn-lo" onclick="setLang('lo')">ພາສາລາວ</button>
</div>

<div class="page-title">
  <h1>
    <span class="t-vi">{{TITLE1_VI}}</span>
    <span class="t-en">{{TITLE1_EN}}</span>
    <span class="t-lo">{{TITLE1_LO}}</span>
  </h1>
  <h2>
    <span class="t-vi">{{TITLE2_VI}}</span>
    <span class="t-en">{{TITLE2_EN}}</span>
    <span class="t-lo">{{TITLE2_LO}}</span>
  </h2>
</div>

<div class="value-chain-wrapper">

  <div class="top-processes">

    <div class="process-box">
      <div class="process-box-title">
        <span class="t-vi">{{BOX1_TITLE_VI}}</span>
        <span class="t-en">{{BOX1_TITLE_EN}}</span>
        <span class="t-lo">{{BOX1_TITLE_LO}}</span>
      </div>
      <ul class="process-list">
        {{BOX1_ITEMS}}
      </ul>
    </div>

    <div class="process-box">
      <div class="process-box-title">
        <span class="t-vi">{{BOX2_TITLE_VI}}</span>
        <span class="t-en">{{BOX2_TITLE_EN}}</span>
        <span class="t-lo">{{BOX2_TITLE_LO}}</span>
      </div>
      <ul class="process-list">
        {{BOX2_ITEMS}}
      </ul>
    </div>

    <div class="process-box">
      <div class="process-box-title">
        <span class="t-vi">{{BOX3_TITLE_VI}}</span>
        <span class="t-en">{{BOX3_TITLE_EN}}</span>
        <span class="t-lo">{{BOX3_TITLE_LO}}</span>
      </div>
      <ul class="process-list">
        {{BOX3_ITEMS}}
      </ul>
    </div>

  </div>

  <div class="vc-strip">
    {{VC_STAGES}}
  </div>

  <div class="bottom-processes">

    <div class="process-box">
      <div class="process-box-title">
        <span class="t-vi">{{BOTTOM1_TITLE_VI}}</span>
        <span class="t-en">{{BOTTOM1_TITLE_EN}}</span>
        <span class="t-lo">{{BOTTOM1_TITLE_LO}}</span>
      </div>
      <ul class="process-list">
        {{BOTTOM1_ITEMS}}
      </ul>
    </div>

    <div class="process-box">
      <div class="process-box-title">
        <span class="t-vi">{{BOTTOM2_TITLE_VI}}</span>
        <span class="t-en">{{BOTTOM2_TITLE_EN}}</span>
        <span class="t-lo">{{BOTTOM2_TITLE_LO}}</span>
      </div>
      <ul class="process-list">
        {{BOTTOM2_ITEMS}}
      </ul>
    </div>

  </div>
</div>

<script>
  function setLang(lang) {
    document.body.className = lang === "vi" ? "" : "lang-" + lang;
    ["vi","en","lo"].forEach(function(l) {
      document.getElementById("btn-" + l).classList.toggle("active", l === lang);
    });
  }
</script>

</body>
</html>
```

---

## Pattern cho mỗi item trong process-list

```html
<!-- Mỗi quy trình cần 3 li: vi / en / lo -->
<li class="t-vi">1. QT Tên quy trình tiếng Việt</li>
<li class="t-en">1. Process Name in English</li>
<li class="t-lo">1. ຂະບວນການ ຊື່ຂະບວນການ</li>
```

---

## Pattern cho mỗi VC Stage

```html
<div class="vc-stage">
  <div class="stage-circle">EMOJI</div>
  <div class="stage-name-primary">
    <span class="t-vi">Tên tiếng Việt</span>
    <span class="t-en">English Name</span>
    <span class="t-lo">ຊື່ພາສາລາວ</span>
  </div>
  <div class="stage-name-secondary">
    <span class="t-vi">English subtitle</span>
    <span class="t-en">Tên phụ VI</span>
    <span class="t-lo">English subtitle</span>
  </div>
</div>
```

Note: `stage-name-secondary` hiện ngôn ngữ thứ 2 (khi đang xem VI thì phụ là EN, khi xem EN thì phụ là VI, khi xem LO thì phụ là EN).
