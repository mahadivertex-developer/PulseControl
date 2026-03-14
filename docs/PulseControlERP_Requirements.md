# PulseControlERP - Multi-Company ERP Requirements (v1)

## 1. Product Scope
PulseControlERP is a multi-company ERP platform where:
- System Admin (platform owner) can access all companies and all data.
- Company data is tenant-isolated.
- Company Admin manages users and operations inside their own company.
- Employees perform department operations based on assigned permissions.

## 2. Core Multi-Tenant Rules
1. Every transactional record must include `company_id`.
2. Non-system users can only read/write records where `company_id` matches their active company.
3. Logged-out users cannot access any protected endpoint, page, or file.
4. System Admin bypasses tenant restrictions and role restrictions.
5. Users from Company A must never view Company B data.

## 3. User Types and Access
- `SYSTEM_ADMIN`: full platform access; no restrictions.
- `COMPANY_ADMIN`: full access within own company; can create/manage company employees.
- `EMPLOYEE`: permission-based access to department functions.

## 4. Organizational Model
- One platform has many companies.
- One company has many units and production lines.
- One company has many users.
- One user belongs to one company (except system admin).

## 5. Order and Merchandising
### 5.1 Master Order
- Created by Merchandising.
- Fields:
  - Buyer Order Number
  - Internal Unique Number (master internal number)
  - Buyer, style, item, quantity, shipment target dates
  - PCD and BPCD

### 5.2 Sub-PO
- Multiple sub-POs can exist under one master order.
- Each sub-PO has unique sub-PO number.
- Linked to required raw materials: fabric, zipper, thread, label, accessories.
- Supports transfer of raw material quantity between internal numbers.
- Transfer must generate notification and audit log.

## 6. Planning Department
- Assign unit and production line for each order.
- Multiple units/lines allowed for on-time delivery.
- Line plan must store assigned quantity by line.
- Reallocation/change of line must generate notification.

## 7. GRN (Gate + Receiving)
- Gate user updates received item by sub-PO with receive timestamp.
- Required outputs:
  - GRN number
  - item-wise received qty
  - receive time and receiver
- Used for inventory lead-time and store team performance tracking.

## 8. Store Department
### 8.1 Order-Related Store
- Maintain inventory against master order and sub-PO.
- Issue materials to Cutting/Sewing/Finishing against requisitions.
- Receive return balance from Cutting/Sewing.
- Run stock verification (physical vs system quantity).

### 8.2 General Goods Store
- Handles non-order goods: paper, pen, computer, office items, chair, etc.
- Initial stock upload at ERP launch (without PO).
- General Goods PO creation and receiving.

### 8.3 Approval Rule
- All sub-PO and General Goods PO require management approval before execution.

## 9. Store QA
### 9.1 Order-Related QA (required)
- Fabric inspection roll-wise.
- Color shading marking.
- Shrinkage report.
- Pattern group definition.
- Shade report.
- Accessories QA pass/fail with fail remarks.

### 9.2 General Goods QA
- Not required.

## 10. Cutting Department
- Follow PCD/BPCD for cutting plan.
- Raise fabric requisition with consumption marking.
- Cut only against allocated roll numbers.
- Outputs:
  - Cutting report
  - Panel replacement quantity
  - Bundle card (barcode)
  - Cutting summary (buyer-wise, unit-wise, date-wise, fabric-type-wise)
- Issue cut panels to Sewing based on planning line/unit.

## 11. Sewing Department
- Receive cut panels from Cutting.
- Raise requisition to Store for labels/buttons/thread based on style.
- Bundle declaration using bundle barcode:
  - OK qty
  - Reject qty
  - Defect repair qty
  - DHU
- If non-wash item: send directly to Finishing.
- If wash item: send to Washing.

## 12. Washing Department
- Track washing input and output quantities.
- Must reference internal unique number + buyer PO.

## 13. Finishing Department
- Raise requisition for finishing items (hang tag, price tag, string, drawcord, etc.).
- Hourly updates:
  - Iron qty
  - QC pass qty
  - Repair qty
  - Reject qty
  - Metal pass qty
- Metal-pass garments sent to Packing.

## 14. Packing Department
- Pack garments into cartons per buyer order sheet.
- Capture carton assortment type:
  - Solid size solid color
  - Solid size assorted color
  - Assorted size assorted color
- Carton output moves to Shipment.

## 15. Shipment Department
- Receive cartons from Packing.
- Issue random cartons for inspection.
- If fail, send back to Packing for recheck/rework.
- Generate delivery-wise detailed packing list.

## 16. Commercial Department
- Update miscellaneous costs per delivery/order.
- Final cost and profit analysis report required.

## 17. Notifications and Alerts
Mandatory notifications:
- Raw material transfer between internal numbers.
- Planning line/unit reallocation.
- Approval request created (sub-PO / general goods PO).
- Approval approved/rejected.
- Shipment inspection failure and return to packing.

## 18. Security and Session Rules
1. All pages and APIs require authenticated session.
2. On logout/session expiry, user must be denied all protected data.
3. Backend must enforce authorization; UI checks are not enough.
4. Every data query must include tenant filter, except for system admin.
5. Audit logs required for create/update/delete/approve/reject/transfer/reallocation.

## 19. Reporting Requirements
- Master order tracking by buyer PO and internal unique number.
- Sub-PO status and material receipt status.
- GRN aging and receive-time analytics.
- Inventory balance, issue, return, variance report.
- QA reports (fabric and accessories).
- Cutting, sewing, washing, finishing productivity reports.
- Packing list and shipment inspection report.
- Costing and profit analysis (commercial).

## 20. Non-Functional Requirements
- Strong tenant isolation.
- Full traceability from order to shipment.
- Role-based permissions with easy admin assignment.
- Scalable for multiple companies, units, and lines.
- Time-stamped events for performance analysis.

## 21. Recommended Implementation Approach
- Backend with strict authorization middleware + tenant guard.
- Database constraints including `company_id` on all transactional tables.
- State-machine workflow per department to avoid invalid transitions.
- Event/notification table for in-app alerts and optional email.
- Barcode support for bundle and carton traceability.
