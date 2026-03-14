# PulseControlERP - Workflow and Control Matrix

## 1. End-to-End Order Flow
1. Merchandising creates Master Order (buyer PO + internal number + PCD/BPCD).
2. Merchandising creates Sub-PO(s) for raw materials.
3. Management approves Sub-PO.
4. GRN records material receiving by Sub-PO and timestamp.
5. Store updates order inventory.
6. Store QA performs fabric/accessories QA (order-related only).
7. Planning allocates unit/line and quantity.
8. Cutting raises requisition and receives allocated fabric rolls.
9. Cutting outputs bundles with barcode and issues to sewing.
10. Sewing receives bundles, requisitions trims, and declares output (OK/reject/repair/DHU).
11. Wash items move to Washing; non-wash moves to Finishing.
12. Finishing updates hourly process and metal pass quantities.
13. Packing creates cartons per assortment and buyer sheet.
14. Shipment inspects random cartons; failed lots return to packing.
15. Shipment finalizes delivery and packing list.
16. Commercial posts misc costs and produces profitability.

## 2. Approval Gates
- Sub-PO: `DRAFT -> SUBMITTED -> APPROVED/REJECTED`.
- General Goods PO: `DRAFT -> SUBMITTED -> APPROVED/REJECTED`.
- Only approved documents can be received/processed.

## 3. Requisition and Issue Rules
- Cutting, Sewing, and Finishing must request through requisitions.
- Store issues only against approved and valid requisitions.
- Returns from Cutting/Sewing are posted as return transactions.

## 4. Transfer and Reallocation Rules
- Material transfer between internal numbers requires:
  - source availability check
  - target order reference
  - notification and audit entry
- Planning reallocation between lines/units requires:
  - no negative pending quantity
  - notification and audit entry

## 5. Inspection and Quality Rules
- Fabric QA: roll-wise inspection, shade, shrinkage, pattern grouping.
- Accessories QA: pass/fail with mandatory fail remark.
- Shipment random inspection failure requires reverse movement to packing.

## 6. Traceability Keys
All departments must reference:
- `company_id`
- `master_order_id` (internal unique number)
- `buyer_order_number`
- `sub_po_id` where applicable
- `unit_id` and `line_id` where applicable

## 7. Security Control Matrix
- Logged-out: no access.
- Employee: role and permission based, own company only.
- Company Admin: all own-company modules.
- System Admin: all companies, all modules.

## 8. Audit-Required Actions
- User login/logout
- Data create/update/delete
- Approval submit/approve/reject
- Stock issue/receive/return/adjustment
- Material transfer
- Planning reallocation
- Inspection pass/fail
