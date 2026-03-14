# PulseControlERP - Frontend Module Map

## Recommended Frontend Stack
- **Framework**: React 18+ with TypeScript / Angular 16+ / Vue 3
- **State Management**: Redux Toolkit / Zustand / Pinia
- **UI Library**: Material-UI / Ant Design / PrimeReact
- **Routing**: React Router / Angular Router
- **API Client**: Axios / React Query
- **Forms**: React Hook Form / Formik
- **Charts**: Recharts / Chart.js / ApexCharts
- **Barcode**: react-barcode-reader / ZXing

## Application Architecture
```
frontend/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── modules/
│   │   │   ├── system-admin/
│   │   │   ├── merchandising/
│   │   │   ├── planning/
│   │   │   ├── grn/
│   │   │   ├── store/
│   │   │   ├── qa/
│   │   │   ├── cutting/
│   │   │   ├── sewing/
│   │   │   ├── washing/
│   │   │   ├── finishing/
│   │   │   ├── packing/
│   │   │   ├── shipment/
│   │   │   └── commercial/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── services/
│   │   └── core/
│   ├── assets/
│   └── environments/
```

---

## Role-Based Navigation Menu

### System Admin Menu
```
- Dashboard
  └── Multi-Company Overview
- Company Management
  ├── Companies List
  ├── Create Company
  └── Company Settings
- User Management (All Companies)
  ├── Users List
  ├── Create User
  └── Roles & Permissions
- Reports
  └── Cross-Company Analytics
```

### Company Admin Menu
```
- Dashboard
  └── Company Dashboard
- Company Settings
- User Management
  ├── Users List
  ├── Create Employee
  └── Assign Permissions
- Master Data
  ├── Units
  ├── Production Lines
  ├── Items Master
  └── Buyers
- All Department Modules (see below)
```

### Employee Menu (Permission-Based)
Modules appear based on assigned permissions:
```
- Dashboard
- Merchandising (if permitted)
- Planning (if permitted)
- GRN (if permitted)
- Store (if permitted)
- QA (if permitted)
- Cutting (if permitted)
- Sewing (if permitted)
- Washing (if permitted)
- Finishing (if permitted)
- Packing (if permitted)
- Shipment (if permitted)
- Commercial (if permitted)
- Notifications
- Profile
```

---

## Module Screens and Features

### 1. Authentication Module
**Screens:**
- `LoginScreen`: Username/password, JWT storage
- `LogoutConfirmation`: Clear token, redirect to login
- `ForgotPassword`: (Optional future)
- `ChangePassword`: Secure password update

**Security:**
- On token expiry, auto-redirect to login
- On direct URL access without token, redirect to login
- Store user + role in local state after login

---

### 2. Dashboard Module
**System Admin Dashboard:**
- Total companies count
- Total users across all companies
- Recent activities (all companies)
- Quick links to company management

**Company Admin Dashboard:**
- Active orders summary
- Pending approvals (sub-PO, general goods PO)
- Inventory alerts
- Production status summary
- Shipment status

**Employee Dashboard:**
- Department-specific KPIs
- Today's tasks and requisitions
- Notifications

---

### 3. System Admin Module
**Companies Management Screen:**
- Table: Company Code, Name, Active Status, Created Date
- Actions: Create, Edit, Activate/Deactivate

**Users Management (All Companies):**
- Filter by company
- Table: Username, Full Name, Company, Role, Active Status
- Actions: Create, Edit, Deactivate

---

### 4. Merchandising Module
**Master Orders List:**
- Table: Internal Order No, Buyer Order No, Buyer, Style, Qty, PCD, BPCD, Status
- Filters: Date range, buyer, internal order no
- Actions: Create, View Details, Edit

**Create/Edit Master Order Form:**
- Internal Order No (auto-generated or manual)
- Buyer Order No
- Buyer Name
- Style No
- Order Qty
- PCD Date
- BPCD Date
- Submit button

**Sub-PO Management:**
- List sub-POs by master order
- Table: Sub-PO No, Master Order, Status, Created Date
- Actions: Create Sub-PO, Submit for Approval, View Items

**Create Sub-PO Form:**
- Select Master Order
- Sub-PO No (auto-generated)
- Add Items (Item dropdown, Ordered Qty, Unit Price)
- Save as Draft / Submit for Approval

**Material Transfer:**
- From Order (dropdown)
- To Order (dropdown)
- Item (dropdown)
- Quantity
- Remarks
- Submit → generates notification

---

### 5. Planning Module
**Line Plan List:**
- Table: Master Order, Unit, Line, Planned Qty, Plan Date
- Filter by order, unit, line, date range
- Actions: Create, Reallocate

**Create Line Plan Form:**
- Select Master Order
- Select Unit
- Select Production Line
- Planned Qty
- Plan Date
- Submit

**Reallocate Line:**
- Current allocation details (read-only)
- New Production Line (dropdown)
- New Planned Qty
- Submit → generates notification

---

### 6. GRN Module
**GRN List:**
- Table: GRN No, Sub-PO/General PO, Received Date, Receiver
- Filter by date, PO number
- Actions: Create GRN, View Details

**Create GRN Form:**
- GRN No (auto-generated)
- Select Sub-PO or General Goods PO
- Received Date & Time
- Add Items (Item, Received Qty)
- Submit → updates inventory

---

### 7. Store Module
**Inventory Balance Screen:**
- Filter by Master Order, Item
- Table: Item, Master Order (if order-related), On-Hand Qty, Reserved Qty
- Actions: View Transactions, Stock Adjustment

**Requisitions List:**
- Table: Req No, Department, Master Order, Status, Requested Date
- Filter by department, status, date
- Actions: View, Issue Items

**Issue Items Form:**
- Display requisition items (read-only)
- For each item: Requested Qty, Already Issued, Available, Issue Now (input)
- Submit → updates inventory transactions

**General Goods Management:**
- Initial Stock Upload (CSV or form)
- General Goods PO creation
- GRN for general goods

---

### 8. QA Module
**Fabric Inspection Screen:**
- Select Master Order
- Select GRN Item (fabric roll)
- Roll No
- Color Shade
- Shrinkage %
- Pattern Group
- QA Status: Pass/Fail
- Submit

**Accessories Inspection Screen:**
- Select Master Order
- Select Item
- QA Status: Pass/Fail
- Fail Reason (required if fail)
- Submit

**QA Reports:**
- Fabric inspection summary (roll-wise, shade-wise)
- Accessories pass/fail summary

---

### 9. Cutting Module
**Cutting Batch List:**
- Table: Batch No, Master Order, Unit, Line, Cut Qty, Cut Date
- Filter by order, date, unit
- Actions: Create Batch, Generate Bundles, View Report

**Create Cutting Batch Form:**
- Batch No (auto-generated)
- Select Master Order
- Select Unit
- Select Production Line
- Cut Qty
- Panel Replacement Qty
- Cut Date
- Submit

**Generate Bundles:**
- Enter number of bundles
- System generates bundle barcodes
- Table: Bundle Barcode, Bundle Qty
- Print Bundle Cards (barcode labels)

**Cutting Reports:**
- Cutting summary by buyer, unit, date, fabric type
- Panel replacement report

---

### 10. Sewing Module
**Bundle Input Screen:**
- Scan/Enter Bundle Barcode
- Display bundle details (batch, qty)
- Mark as received

**Sewing Declaration Form:**
- Scan Bundle Barcode
- OK Qty
- Reject Qty
- Repair Qty
- DHU % (calculated or manual)
- Is Wash Required? (Yes/No)
- Submit → routes to Washing or Finishing

**Sewing Output Report:**
- By line, date, order
- Total OK, reject, repair, DHU trend

---

### 11. Washing Module
**Washing Input/Output:**
- Select Master Order
- Input Qty
- Output Qty
- Transaction Date
- Submit

**Washing Reports:**
- Daily washing summary
- Loss/shrinkage analysis

---

### 12. Finishing Module
**Finishing Hourly Log Entry:**
- Select Master Order
- Log Hour (timestamp)
- Iron Qty
- QC Pass Qty
- Repair Qty
- Reject Qty
- Metal Pass Qty
- Submit

**Finishing Dashboard:**
- Real-time hourly progress chart
- Cumulative metal-pass qty ready for packing

---

### 13. Packing Module
**Carton Creation:**
- Select Master Order
- Carton No (auto-generated or manual)
- Assortment Type (dropdown)
- Carton Qty
- Submit

**Packing List:**
- Table: Carton No, Master Order, Assortment, Qty, Packed Date
- Actions: View, Edit, Print Label

---

### 14. Shipment Module
**Shipments List:**
- Table: Shipment No, Master Order, Status, Shipped Date
- Filter by order, status, date
- Actions: Create Shipment, Inspect Cartons, Generate Packing List

**Create Shipment Form:**
- Shipment No
- Select Master Order
- Select Cartons (multi-select)
- Submit

**Carton Inspection:**
- Display shipment cartons
- For each carton: Inspection Status (Pending/Pass/Fail), Remarks
- If Fail → return to packing (generates notification)

**Packing List Report:**
- Detailed delivery-wise breakdown
- Print/export PDF

---

### 15. Commercial Module
**Add Commercial Cost:**
- Select Master Order
- Select Shipment (optional)
- Cost Head (dropdown/text)
- Amount
- Remarks
- Submit

**Profit Analysis Screen:**
- Select Master Order
- Display breakdown:
  - Total Revenue
  - Material Costs (from sub-PO)
  - Commercial Costs
  - Total Costs
  - Profit
  - Profit Margin %
- Export to Excel

---

### 16. Notifications Module
**Notifications List Screen:**
- Table: Event Type, Message, Timestamp
- Filter by event type, date
- Mark as read (optional)

**Notification Events:**
- Material Transfer
- Line Reallocation
- Approval Submitted
- Approval Approved/Rejected
- Inspection Failed

---

### 17. Reports Module (Cross-Functional)
**Available Reports:**
- Master Order Tracking
- Sub-PO Status
- GRN Aging
- Inventory Balance & Variance
- QA Summary (Fabric/Accessories)
- Cutting Summary
- Sewing Productivity
- Washing Loss Analysis
- Finishing Hourly Progress
- Packing Summary
- Shipment Inspection Report
- Commercial Profit Analysis

**Report Filters:**
- Date range
- Buyer Order No / Internal Order No
- Unit, Line
- Department
- Export: Excel, PDF

---

## Shared Components

### TenantGuard (Frontend Route Guard)
```typescript
// Angular example
canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
  const token = this.authService.getToken();
  if (!token) {
    this.router.navigate(['/login']);
    return false;
  }

  const user = this.authService.getCurrentUser();
  const requiredPermission = route.data['permission'];

  if (requiredPermission && !this.authService.hasPermission(requiredPermission)) {
    this.router.navigate(['/unauthorized']);
    return false;
  }

  return true;
}
```

### API Interceptor (Auto-attach JWT)
```typescript
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const token = this.authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next.handle(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Token expired or invalid
        this.authService.logout();
        this.router.navigate(['/login']);
      } else if (error.status === 403) {
        // Forbidden - trying to access another company's data
        this.notificationService.error('Access denied to this resource');
      }
      return throwError(error);
    })
  );
}
```

### Barcode Scanner Component
```typescript
<BarcodeScanner onScan={(barcode) => handleBundleScan(barcode)} />
```

### DateRangePicker Component
```typescript
<DateRangePicker
  startDate={filters.startDate}
  endDate={filters.endDate}
  onChange={(start, end) => setFilters({ ...filters, startDate: start, endDate: end })}
/>
```

### DataTable Component
- Sortable columns
- Pagination
- Row selection
- Export to Excel/CSV

---

## UI/UX Best Practices
1. **Breadcrumbs**: Always show current navigation path
2. **Loading States**: Spinner/skeleton during API calls
3. **Error Handling**: Toast notifications for errors
4. **Confirmation Dialogs**: For delete, approval, rejection actions
5. **AutoComplete Dropdowns**: For orders, items, buyers with large datasets
6. **Responsive Design**: Mobile-friendly tables (collapse/expand rows)
7. **Dark Mode**: Optional theme toggle

---

## Key Frontend Security Rules
- Never store sensitive data in localStorage unencrypted
- Clear token on logout
- Auto-logout on 401 response
- Show 403 error page if user tries to access another company's data
- Validate all forms client-side and server-side
- Mask sensitive fields (cost, profit) unless user has permission

---

## Development Workflow
1. Install dependencies
2. Configure API base URL in environment files
3. Generate API client from OpenAPI spec (optional: openapi-generator)
4. Implement authentication service
5. Create route guards for tenant and permission checks
6. Build shared components (table, forms, modals)
7. Develop modules screen by screen (start with authentication → dashboard → one department)
8. Test cross-company access restrictions
9. Add notification polling or WebSocket for real-time alerts
10. Performance optimization: lazy loading, code splitting

---

## Sample Screen Mockup (Markdown Table)

**Master Orders List Screen:**
| Internal Order No | Buyer Order No | Buyer  | Style   | Qty   | PCD        | BPCD       | Actions       |
|-------------------|----------------|--------|---------|-------|------------|------------|---------------|
| INT-2026-001      | BYR-12345      | Nike   | T-Shirt | 5000  | 2026-04-01 | 2026-03-20 | View / Edit   |
| INT-2026-002      | BYR-67890      | Adidas | Hoodie  | 3000  | 2026-05-15 | 2026-05-01 | View / Edit   |

**Filters:** Date Range, Buyer, Internal Order No  
**Actions:** + Create Order, Export

---

## Approval Workflow UI Flow
1. User creates Sub-PO → status = DRAFT
2. User clicks "Submit for Approval" → status = SUBMITTED
3. Notification sent to management users
4. Management user views pending approvals dashboard
5. Management clicks Approve/Reject → status updates, notification sent to requester
6. If approved, sub-PO can be received via GRN

---

## Mobile Considerations (Optional)
- Responsive web app for tablets
- Barcode scanning for bundle tracking (use device camera)
- Offline mode for cutting/sewing data entry with sync
