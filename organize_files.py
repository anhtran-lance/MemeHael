#!/usr/bin/env python3
"""Sắp xếp file trong MỘT thư mục theo loại file.

Cách dùng:
    python organize_files.py "<thư_mục>"            # chạy thử, chỉ in ra
    python organize_files.py "<thư_mục>" --apply    # di chuyển thật
    python organize_files.py "<thư_mục>" --undo     # hoàn tác lần chạy gần nhất

An toàn:
- Mặc định chỉ chạy thử (dry-run).
- Chỉ xử lý file nằm trực tiếp trong thư mục, không đụng vào thư mục con.
- Không bao giờ ghi đè: nếu trùng tên sẽ thêm hậu tố _1, _2...
- Bỏ qua file ẩn (bắt đầu bằng dấu chấm) và file tạm đang tải dở.
- Từ chối chạy trên thư mục hệ thống / thư mục gốc / thư mục home.
- Ghi nhật ký vào .organize_log.json để hoàn tác được.
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

CATEGORIES = {
    "Hinh_anh": {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".heic", ".tiff", ".ico"},
    "Video": {".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v"},
    "Am_thanh": {".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"},
    "Tai_lieu": {".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".md", ".epub"},
    "Bang_tinh": {".xls", ".xlsx", ".csv", ".ods", ".tsv"},
    "Trinh_chieu": {".ppt", ".pptx", ".odp", ".key"},
    "Nen": {".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz"},
    "Cai_dat": {".exe", ".msi", ".dmg", ".pkg", ".deb", ".rpm", ".apk", ".iso"},
    "Ma_nguon": {".py", ".js", ".ts", ".html", ".css", ".json", ".java", ".c", ".cpp", ".go", ".rs", ".sh", ".sql"},
}
OTHER = "Khac"
SKIP_SUFFIXES = {".crdownload", ".part", ".tmp", ".download"}
LOG_NAME = ".organize_log.json"


def category_of(path: Path) -> str:
    ext = path.suffix.lower()
    for name, exts in CATEGORIES.items():
        if ext in exts:
            return name
    return OTHER


def unique_target(target: Path) -> Path:
    if not target.exists():
        return target
    i = 1
    while True:
        candidate = target.with_name(f"{target.stem}_{i}{target.suffix}")
        if not candidate.exists():
            return candidate
        i += 1


def is_protected(folder: Path) -> bool:
    home = Path.home().resolve()
    if folder == Path(folder.anchor) or folder == home:
        return True
    parts = {p.lower() for p in folder.parts}
    return bool(parts & {"windows", "system32", "program files", "program files (x86)",
                         "etc", "usr", "bin", "sbin", "system", "library", "boot"}) \
        and folder.parent == Path(folder.anchor)


def organize(folder: Path, apply: bool) -> None:
    moves = []
    for item in sorted(folder.iterdir()):
        if not item.is_file() or item.name.startswith(".") or item.suffix.lower() in SKIP_SUFFIXES:
            continue
        if item.name == Path(__file__).name:
            continue
        dest_dir = folder / category_of(item)
        moves.append((item, unique_target(dest_dir / item.name)))

    if not moves:
        print("Không có file nào cần sắp xếp.")
        return

    for src, dst in moves:
        print(f"{src.name}  ->  {dst.parent.name}/{dst.name}")
    print(f"\nTổng: {len(moves)} file.")

    if not apply:
        print("Đây mới là chạy thử. Thêm --apply để di chuyển thật.")
        return

    done = []
    for src, dst in moves:
        dst.parent.mkdir(exist_ok=True)
        shutil.move(str(src), str(dst))
        done.append({"from": str(src), "to": str(dst)})
    (folder / LOG_NAME).write_text(json.dumps(done, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Xong. Dùng --undo để hoàn tác.")


def undo(folder: Path) -> None:
    log = folder / LOG_NAME
    if not log.exists():
        print("Không tìm thấy nhật ký để hoàn tác.")
        return
    for entry in reversed(json.loads(log.read_text(encoding="utf-8"))):
        src, dst = Path(entry["to"]), Path(entry["from"])
        if src.exists() and not dst.exists():
            shutil.move(str(src), str(dst))
            print(f"Đã trả {dst.name}")
        else:
            print(f"Bỏ qua {src.name} (đã đổi hoặc bị trùng)")
    log.unlink()
    print("Đã hoàn tác. Các thư mục rỗng được giữ lại, bạn có thể xóa tay.")


def main() -> None:
    ap = argparse.ArgumentParser(description="Sắp xếp file theo loại")
    ap.add_argument("folder")
    ap.add_argument("--apply", action="store_true", help="di chuyển thật")
    ap.add_argument("--undo", action="store_true", help="hoàn tác lần chạy gần nhất")
    args = ap.parse_args()

    folder = Path(args.folder).expanduser().resolve()
    if not folder.is_dir():
        sys.exit(f"Không phải thư mục: {folder}")
    if is_protected(folder):
        sys.exit("Từ chối: đây là thư mục gốc/home/hệ thống. Hãy chọn thư mục cụ thể như Downloads.")

    if args.undo:
        undo(folder)
    else:
        organize(folder, args.apply)


if __name__ == "__main__":
    main()
