# MemeHael – bộ skill Base.vn

Cài: `/plugin marketplace add trananhhoai0-lang/MemeHael`, rồi `/plugin install <tên>@memehael`.

| Plugin | Skill | Dùng khi |
|---|---|---|
| base-solution-design | techmap-casan, value-chain-digitalization, value-chain-to-casan, so-hoa-thuy-dien, crm-operating-service-map, explore-service-structure | Tư vấn, proposal, demo giải pháp số hóa |
| base-delivery | base-trien-khai-report, base-appscript-bao-cao-ngay, base-flow-visualizer, amecc-process-flow-map | Triển khai và báo cáo cho khách |
| base-inventory | base-thiet-lap-ton-kho-1-1, base-thiet-lap-ton-kho-1-n | Cấu hình tồn kho theo lô |
| base-sales | deal-journey-review | Review hành trình deal |
| meme-brand | rework-keynote-style | Giao diện chung (base-trien-khai-report gọi skill này) |

Ghi chú:
- `base-flow-visualizer` là bản gộp của `qt-flow-doc-designer` và `base-service-flow-visualizer`.
- `amecc-process-flow-map` gắn với một khách hàng; cân nhắc chuyển sang `clients/` nếu có thêm khách.
- Phụ thuộc giữa skill: `value-chain-to-casan` → `techmap-casan`, `so-hoa-thuy-dien`; `deal-journey-review` → `techmap-casan`, `value-chain-to-casan`. Cài `base-solution-design` đầy đủ để các liên kết này hoạt động.
- Skill của Anthropic (docx, xlsx, pptx, pdf, skill-creator) không đóng gói ở đây.
