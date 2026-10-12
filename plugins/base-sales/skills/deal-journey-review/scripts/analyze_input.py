# -*- coding: utf-8 -*-
"""
Đọc file Excel input deal journey và trả JSON các chỉ số đã tính sẵn.

    python3 analyze_input.py <file.xlsx>

Đầu ra gồm: chỉ số nhịp deal, vị trí % từng touchpoint trên trục thời gian
(dùng thẳng cho biểu đồ HTML), cờ đỏ tự phát hiện, phân bố Power Map,
điểm Champion, và danh sách trường còn trống.

Script KHÔNG diễn giải — chỉ tính. Việc diễn giải là của người/model đọc JSON.
"""
import sys
import json
from datetime import datetime, date

try:
    from openpyxl import load_workbook
except ImportError:
    sys.exit("Cần openpyxl: pip install openpyxl --break-system-packages")


def as_date(v):
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        s = v.strip()
        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y"):
            try:
                return datetime.strptime(s, fmt).date()
            except ValueError:
                pass
    return None


def txt(v):
    if v is None:
        return ""
    return str(v).strip()


def is_example(row_vals):
    """Dòng ví dụ mẫu trong template — nhận diện để bỏ qua."""
    joined = " ".join(txt(v) for v in row_vals).lower()
    markers = ("nguyễn văn a", "ví dụ", "vd:", "tên đối thủ / phương án")
    return any(m in joined for m in markers)


def read_rows(ws, first_row, ncols, key_col=1):
    out = []
    for r in range(first_row, ws.max_row + 1):
        vals = [ws.cell(r, c).value for c in range(1, ncols + 1)]
        if not txt(vals[key_col - 1]):
            continue
        if is_example(vals):
            continue
        out.append((r, vals))
    return out


def main(path):
    wb = load_workbook(path, data_only=True)
    res = {"file": path, "sheets": wb.sheetnames}
    missing = []

    # ---------- 01 Deal Info ----------
    info = {}
    if "01_Deal_Info" in wb.sheetnames:
        ws = wb["01_Deal_Info"]
        for r in range(5, 20):
            k = txt(ws.cell(r, 1).value)
            if k:
                info[k] = ws.cell(r, 2).value
    res["deal_info"] = {k: (v.isoformat() if isinstance(v, (datetime, date)) else v)
                        for k, v in info.items() if v not in (None, "")}
    for k in ("Compelling event", "Ngân sách khách đã nhắc đến", "Ai là người ký cuối cùng"):
        if not txt(info.get(k)):
            missing.append(f"01_Deal_Info · {k}")

    d_start = as_date(info.get("Ngày bắt đầu deal"))
    d_review = as_date(info.get("Ngày review (hôm nay)")) or date.today()

    # ---------- 02 Hành trình ----------
    tps = []
    if "02_Hanh_trinh" in wb.sheetnames:
        ws = wb["02_Hanh_trinh"]
        for r in range(5, ws.max_row + 1):
            d = as_date(ws.cell(r, 2).value)
            if not d:
                continue
            vals = [ws.cell(r, c).value for c in range(1, 15)]
            if is_example(vals):
                continue
            tps.append({
                "row": r, "date": d,
                "loai": txt(ws.cell(r, 3).value),
                "giai_doan": txt(ws.cell(r, 4).value),
                "bphase": txt(ws.cell(r, 5).value),
                "muc_tieu": txt(ws.cell(r, 6).value),
                "eb": txt(ws.cell(r, 9).value),
                "noi_dung": txt(ws.cell(r, 10).value),
                "ket_qua": txt(ws.cell(r, 11).value),
                "cam_ket_base": txt(ws.cell(r, 12).value),
                "cam_ket_kh": txt(ws.cell(r, 13).value),
                "ghi_chu": txt(ws.cell(r, 14).value),
            })
    tps.sort(key=lambda x: x["date"])
    if not tps:
        res["error"] = "Không đọc được touchpoint nào ở sheet 02_Hanh_trinh."
        print(json.dumps(res, ensure_ascii=False, indent=2, default=str))
        return

    if not d_start:
        d_start = tps[0]["date"]
        missing.append("01_Deal_Info · Ngày bắt đầu deal (đã lấy tạm ngày touchpoint đầu tiên)")

    span = max((d_review - d_start).days, 1)
    gaps = [(tps[i]["date"] - tps[i - 1]["date"]).days for i in range(1, len(tps))]
    silence = (d_review - tps[-1]["date"]).days
    avg_gap = round(sum(gaps) / len(gaps), 1) if gaps else None

    eb_dates = [t["date"] for t in tps if t["eb"] == "Có"]
    days_no_eb = (d_review - max(eb_dates)).days if eb_dates else None

    timeline = []
    for i, t in enumerate(tps, start=1):
        timeline.append({
            "stt": i,
            "date": t["date"].isoformat(),
            "date_vn": t["date"].strftime("%d.%m"),
            "left_pct": round((t["date"] - d_start).days / span * 100, 2),
            "ket_qua": t["ket_qua"],
            "mau": {"Tích cực": "var(--patina)", "Tiêu cực": "var(--oxide)"}.get(t["ket_qua"], "var(--ink-3)"),
            "eb": t["eb"],
            "nhan": t["giai_doan"] or t["loai"],
        })
    gap_bands = []
    for i in range(1, len(tps)):
        l = timeline[i - 1]["left_pct"]
        gap_bands.append({"left_pct": l, "width_pct": round(timeline[i]["left_pct"] - l, 2),
                          "days": gaps[i - 1], "wide": False})
    gap_bands.append({"left_pct": timeline[-1]["left_pct"],
                      "width_pct": round(100 - timeline[-1]["left_pct"], 2),
                      "days": silence, "wide": True})

    res["nhip_deal"] = {
        "ngay_bat_dau": d_start.isoformat(),
        "ngay_review": d_review.isoformat(),
        "do_dai_ngay": span,
        "so_touchpoint": len(tps),
        "khoang_cach": gaps,
        "khoang_cach_tb": avg_gap,
        "im_lang_hien_tai": silence,
        "im_lang_gap_may_lan_tb": round(silence / avg_gap, 2) if avg_gap else None,
        "so_buoi_co_eb": sum(1 for t in tps if t["eb"] == "Có"),
        "ngay_khong_tiep_can_eb": days_no_eb,
        "phan_bo_ket_qua": {k: sum(1 for t in tps if t["ket_qua"] == k)
                            for k in ("Tích cực", "Trung lập", "Tiêu cực")},
        "phan_bo_giai_doan": {g: sum(1 for t in tps if t["giai_doan"] == g)
                              for g in sorted({t["giai_doan"] for t in tps if t["giai_doan"]})},
        "phan_bo_loai_hd": {g: sum(1 for t in tps if t["loai"] == g)
                            for g in sorted({t["loai"] for t in tps if t["loai"]})},
        "bphase_khai_bao": sorted({t["bphase"] for t in tps if t["bphase"]}),
        "chuoi_ket_qua": [t["ket_qua"] for t in tps],
    }
    res["timeline_positions"] = timeline
    res["gap_bands"] = gap_bands

    # ---------- 03 Stakeholders ----------
    stake = []
    if "03_Stakeholders" in wb.sheetnames:
        ws = wb["03_Stakeholders"]
        for r, v in read_rows(ws, 5, 17):
            infl, auth = txt(v[4]), txt(v[5])
            pm = "" if not (infl and auth) else (
                "IA" if infl == "Cao" and auth == "Cao" else
                "INA" if infl == "Cao" else
                "ANI" if auth == "Cao" else "NINA")
            tests = [txt(v[i]) == "Có" for i in (10, 11, 12, 13)]
            stake.append({
                "ten": txt(v[0]), "chuc_danh": txt(v[1]), "phong_ban": txt(v[2]),
                "vai_tro": txt(v[3]), "influence": infl, "authority": auth,
                "power_map": pm, "thai_do": txt(v[7]), "kpi_lien_quan": txt(v[8]),
                "quyen_phu_quyet": txt(v[9]),
                "champion_score": sum(tests), "champion_tests": tests,
                "lan_tuong_tac": (as_date(v[15]).isoformat() if as_date(v[15]) else ""),
                "ghi_chu": txt(v[16]),
            })
    res["stakeholders"] = stake
    res["power_map_phan_bo"] = {k: sum(1 for s in stake if s["power_map"] == k)
                                for k in ("IA", "INA", "ANI", "NINA")}
    best = max(stake, key=lambda s: s["champion_score"]) if stake else None
    res["champion"] = {
        "so_nguoi_dat_4_4": sum(1 for s in stake if s["champion_score"] == 4),
        "ung_vien_cao_nhat": best["ten"] if best and best["champion_score"] > 0 else None,
        "diem_cao_nhat": max((s["champion_score"] for s in stake), default=0),
        "co_nguoi_co_kpi_lien_quan": sum(1 for s in stake if s["kpi_lien_quan"] == "Có"),
        "so_nguoi_co_quyen_phu_quyet": sum(1 for s in stake if s["quyen_phu_quyet"] == "Có"),
    }
    if not stake:
        missing.append("03_Stakeholders · chưa có dòng nào")

    # ---------- 04 MEDDPICC ----------
    medd = []
    if "04_MEDDPICC" in wb.sheetnames:
        ws = wb["04_MEDDPICC"]
        for r in range(5, 13):
            name = txt(ws.cell(r, 1).value)
            if name:
                medd.append({"yeu_to": name, "trang_thai": txt(ws.cell(r, 3).value),
                             "bang_chung": txt(ws.cell(r, 4).value),
                             "khoang_trong": txt(ws.cell(r, 5).value)})
    res["meddpicc"] = medd
    res["meddpicc_tong"] = {
        "dat": sum(1 for m in medd if m["trang_thai"] == "Đạt"),
        "mot_phan": sum(1 for m in medd if m["trang_thai"] == "Một phần"),
        "trong": sum(1 for m in medd if m["trang_thai"] == "Trống"),
        "chua_cham": sum(1 for m in medd if not m["trang_thai"]),
    }

    # ---------- 05 Red flags ----------
    flags = []
    if "05_Red_Flags" in wb.sheetnames:
        ws = wb["05_Red_Flags"]
        for r, v in read_rows(ws, 5, 10, key_col=4):
            d = as_date(v[0])
            flags.append({"ngay": d.isoformat() if d else "", "tp": txt(v[1]),
                          "loai": txt(v[2]), "mo_ta": txt(v[3]), "muc_do": txt(v[4]),
                          "trang_thai": txt(v[5]), "khac_phuc": txt(v[6])})
    res["red_flags_khai_bao"] = flags

    # ---------- 08 Cam kết ----------
    ck = []
    if "08_Cam_ket" in wb.sheetnames:
        ws = wb["08_Cam_ket"]
        for r, v in read_rows(ws, 5, 7, key_col=2):
            ck.append({"ben": txt(v[0]), "noi_dung": txt(v[1]), "tp": txt(v[2]),
                       "trang_thai": txt(v[5]), "doi_lai": txt(v[6])})
    res["cam_ket"] = ck
    base_ck = [c for c in ck if c["ben"] == "Base"]
    res["cam_ket_tong"] = {
        "base_tong": len(base_ck),
        "khach_tong": sum(1 for c in ck if c["ben"] == "Khách hàng"),
        "base_dang_no": sum(1 for c in base_ck if c["trang_thai"] in ("Đang làm", "Quá hạn")),
        "nhuong_bo_khong_doi_lai": sum(1 for c in base_ck
                                       if c["doi_lai"].lower() in ("không có", "khong co", "không", "")),
    }

    # ---------- 06 / 07 ----------
    for sheet, key, kcol, ncol in (("06_Doi_thu", "doi_thu", 1, 7),
                                   ("07_Value_Case", "value_case", 1, 9)):
        rows = []
        if sheet in wb.sheetnames:
            ws = wb[sheet]
            for r, v in read_rows(ws, 5, ncol, key_col=kcol):
                rows.append([txt(x) for x in v])
        res[key] = rows
        if not rows:
            missing.append(f"{sheet} · chưa có dòng nào")

    # ---------- Cờ đỏ tự phát hiện ----------
    auto = []

    def flag(code, muc, msg):
        auto.append({"ma": code, "muc_do": muc, "mo_ta": msg})

    if days_no_eb is None:
        flag("EB_NEVER", "Cao", "Chưa có buổi nào Economic Buyer có mặt trọn vẹn.")
    elif days_no_eb > 14:
        # Mức độ theo biên độ vượt ngưỡng: 15-45 ngày trong pha đàm phán là bình thường,
        # trên 45 ngày là mất dấu EB.
        flag("EB_14D", "Cao" if days_no_eb > 45 else "Trung bình",
             f"Không tiếp cận EB {days_no_eb} ngày — vượt ngưỡng 14 ngày của playbook.")
    if avg_gap and silence > 2 * avg_gap:
        flag("SILENCE", "Cao" if (silence > 3 * avg_gap or silence > 30) else "Trung bình",
             f"Im lặng {silence} ngày, gấp {round(silence/avg_gap,1)}× khoảng cách trung bình ({avg_gap} ngày).")
    if len(gaps) >= 3 and gaps[-1] >= gaps[0] * 2:
        flag("RHYTHM", "Trung bình",
             f"Nhịp giãn dần: {gaps[0]} ngày → {gaps[-1]} ngày giữa các buổi.")
    demo = res["nhip_deal"]["phan_bo_giai_doan"].get("Demo/Showcase", 0)
    if demo / len(tps) > 0.5:
        flag("PROOF_LOOP", "Cao",
             f"{demo}/{len(tps)} touchpoint là Demo/Showcase — đang mắc vòng lặp chứng minh.")
    if span > 90 and not res["nhip_deal"]["phan_bo_giai_doan"].get("Báo giá"):
        flag("NO_PRICE", "Cao",
             f"{span} ngày mà chưa có buổi Báo giá — chưa có gì để khách phê duyệt.")
    if len({t["loai"] for t in tps}) == 1:
        flag("ONE_CHANNEL", "Trung bình",
             f"Toàn bộ touchpoint đều là '{tps[0]['loai']}' — không có hoạt động nào giữa các buổi.")
    if res["champion"]["so_nguoi_dat_4_4"] == 0 and stake:
        flag("NO_CHAMPION", "Cao",
             "Không ai đạt đủ 4/4 hành vi chủ động — chưa có Champion thật.")
    if stake and res["champion"]["co_nguoi_co_kpi_lien_quan"] == 0:
        flag("NO_KPI_OWNER", "Cao",
             "Không ai phía khách có KPI cá nhân đẹp lên nếu deal chạy.")
    if not stake:
        flag("NO_MAP", "Cao", "Chưa lập bản đồ người nào — buying group đang là hộp đen.")
    if res["power_map_phan_bo"]["ANI"] and not res["power_map_phan_bo"]["IA"]:
        flag("ANI_TRAP", "Trung bình",
             "Có người ANI (chức danh cao, ảnh hưởng thấp) nhưng chưa có IA nào — rủi ro nhầm tiến độ.")
    if not txt(info.get("Compelling event")) or txt(info.get("Compelling event")).lower().startswith("không"):
        flag("NO_EVENT", "Cao", "Không có compelling event — không có lý do để khách quyết bây giờ.")
    if not txt(info.get("Ngân sách khách đã nhắc đến")) or txt(info.get("Ngân sách khách đã nhắc đến")).lower().startswith(("chưa", "khong", "không")):
        flag("NO_BUDGET", "Cao", "Khách chưa từng nhắc đến bất kỳ con số ngân sách nào.")
    if res["cam_ket_tong"]["base_tong"] and res["cam_ket_tong"]["khach_tong"] == 0:
        flag("ONE_WAY", "Cao",
             f"Base nợ {res['cam_ket_tong']['base_tong']} cam kết, khách nợ 0 — quan hệ một chiều.")
    if res["cam_ket_tong"]["nhuong_bo_khong_doi_lai"] >= 2:
        flag("FREE_CONCESSION", "Trung bình",
             f"{res['cam_ket_tong']['nhuong_bo_khong_doi_lai']} nhượng bộ không đổi lấy ràng buộc nào.")
    if medd and res["meddpicc_tong"]["dat"] < 5:
        flag("MEDD_WEAK", "Cao",
             f"MEDDPICC chỉ {res['meddpicc_tong']['dat']}/8 Đạt — dưới ngưỡng nằm trong forecast chốt.")
    if not res["doi_thu"]:
        flag("NO_INCUMBENT", "Trung bình",
             "Chưa khai đối thủ nào — kể cả status quo. Status quo luôn là Incumbent (-20% đến -35% P(Win)).")
    if res["nhip_deal"]["chuoi_ket_qua"] and res["nhip_deal"]["chuoi_ket_qua"][-1] == "Tiêu cực":
        flag("LAST_NEGATIVE", "Cao", "Touchpoint gần nhất có kết quả Tiêu cực.")

    # --- Nhóm cờ giai đoạn muộn: deal đã báo giá nhưng không đóng được ---
    quote_tps = [t for t in tps if t["giai_doan"] == "Báo giá"]
    signed = any(t["giai_doan"] == "Chốt hợp đồng" for t in tps)
    if quote_tps and not signed:
        since_quote = (d_review - max(t["date"] for t in quote_tps)).days
        if since_quote > 30:
            flag("STALLED_AFTER_QUOTE", "Cao" if since_quote > 60 else "Trung bình",
                 f"Đã báo giá {since_quote} ngày trước mà chưa chốt hợp đồng — deal tắc ở giai đoạn muộn.")
        paper = next((m for m in medd if m["yeu_to"].startswith("P")), None)
        if paper and paper["trang_thai"] in ("Trống", ""):
            flag("PAPER_UNKNOWN", "Cao",
                 "Đã báo giá nhưng Paper Process còn trống — không biết hồ sơ mất bao lâu và kẹt ở đâu.")
        passive = [c for c in res["doi_thu"] if "passive" in " ".join(c).lower()]
        if passive:
            flag("LATE_COMPETITOR", "Cao",
                 "Đã báo giá và có đối thủ Passive — rủi ro đối thủ đến muộn qua quy chế 2–3 báo giá, "
                 "hưởng trọn business case do mình dựng.")

    # --- Chuỗi kết quả tiêu cực liên tiếp: deal có thể đã nhận câu trả lời ---
    kq = res["nhip_deal"]["chuoi_ket_qua"]
    streak = 0
    for k in kq:
        streak = streak + 1 if k == "Tiêu cực" else 0
        if streak >= 3:
            break
    if streak >= 3:
        flag("LOSS_SIGNAL", "Cao",
             f"{streak} buổi Tiêu cực liên tiếp — nhiều khả năng deal đã nhận câu trả lời, "
             "không còn là deal đang chậm. Xem lại trạng thái forecast trước khi lập kế hoạch cứu.")
    if len(kq) >= 3 and kq[-3:].count("Tiêu cực") >= 2:
        flag("RECENT_NEGATIVE", "Cao",
             "2 trong 3 touchpoint gần nhất có kết quả Tiêu cực — đà deal đang đi xuống, không đi ngang.")

    # --- Đi lùi giai đoạn: đã tới Báo giá rồi quay về Khảo sát/Demo ---
    order = {"Tiếp cận": 0, "Khảo sát": 1, "Demo/Showcase": 2, "POC": 3,
             "Báo giá": 4, "Đàm phán": 5, "Chốt hợp đồng": 6}
    peak, regress = -1, []
    for t in tps:
        o = order.get(t["giai_doan"], -1)
        if o < 0:
            continue
        if o >= 4:
            peak = max(peak, o)
        elif peak >= 4:
            regress.append(t)
    if regress:
        flag("STAGE_REGRESSION", "Cao",
             f"Sau khi đã tới giai đoạn Báo giá, deal quay lại {len(regress)} buổi "
             f"Khảo sát/Demo ({regress[0]['date']} → {regress[-1]['date']}) — đi lùi giai đoạn, "
             "dấu hiệu báo giá được đưa ra trước khi bài toán được chốt.")

    # --- Người ký cuối cùng chưa từng gặp ---
    signer = txt(info.get("Ai là người ký cuối cùng"))
    if signer and not signer.lower().startswith(("chưa", "chua", "khong", "không")):
        met_signer = None
        for st in stake:
            blob = " ".join([st["ten"], st["chuc_danh"], st["vai_tro"]]).lower()
            if any(w and w in blob for w in signer.lower().replace(",", " ").split()):
                met_signer = st
                break
        if met_signer is not None and not met_signer["lan_tuong_tac"]:
            flag("SIGNER_NEVER_MET", "Cao",
                 f"Người ký cuối cùng ({met_signer['ten']} — {met_signer['chuc_danh']}) "
                 f"đã có trong bản đồ người nhưng chưa từng có lần tương tác nào.")
        elif met_signer is None:
            flag("SIGNER_UNMAPPED", "Cao",
                 f"Người ký cuối cùng được khai là '{signer}' nhưng không có ai tương ứng trong bản đồ người.")

    # --- Khách hàng trễ cam kết ---
    kh_overdue = [c for c in ck if c["ben"] == "Khách hàng" and c["trang_thai"] == "Quá hạn"]
    if kh_overdue:
        flag("CUSTOMER_OVERDUE", "Cao",
             f"{len(kh_overdue)} cam kết phía khách hàng đang quá hạn — mức cam kết thật thấp hơn lời nói.")

    res["red_flags_tu_dong"] = auto
    res["truong_con_trong"] = missing
    print(json.dumps(res, ensure_ascii=False, indent=2, default=str))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
