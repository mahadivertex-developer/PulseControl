# PulseControlERP - Multi-Company Garment Manufacturing ERP

A complete, implementation-ready specification for a multi-tenant ERP system designed for garment manufacturing and supply chain management.

## 🎯 Project Overview

PulseControlERP is a secure, multi-company ERP platform where:
- **System Admin** manages multiple companies and has unrestricted access
- **Company Admins** manage their company's operations and users
- **Employees** perform department-specific tasks based on assigned permissions
- **Complete tenant isolation** ensures companies cannot access each other's data

## 📁 Project Structure

```
PulseControl/
├── api/
│   └── openapi.yaml              # Complete REST API specification
├── db/
│   └── schema.sql                # PostgreSQL database schema (ready to execute)
├── docs/
	├── PulseControlERP_Requirements.md       # Complete functional requirements
	├── PulseControlERP_Workflow.md           # Department workflows and control matrix
	├── PulseControlERP_Security_Tenancy.md   # Security and multi-tenancy rules
│   ├── Backend_Implementation_Guide.md      # NestJS/Express implementation patterns
│   └── Frontend_Module_Map.md               # React/Angular/Vue module structure
├── diagrams/
│   ├── README.md                 # How to view diagrams
│   ├── ERD.md                    # Database entity-relationship diagram
│   ├── Workflow.md               # Department workflow diagrams
│   └── Architecture.md           # System architecture diagrams
└── README.md                     # This file
```

## 🏢 Department Coverage

The ERP system covers the complete garment manufacturing lifecycle:

1. **Merchandising**: Order creation, sub-PO management, material transfer
2. **Planning**: Unit and line allocation, reallocation management
3. **GRN (Gate Receiving)**: Material receiving with timestamps
4. **Store**: Inventory management, requisition handling, issue/return tracking
5. **Store QA**: Fabric inspection (roll-wise), accessories QA (pass/fail)
6. **Cutting**: Fabric cutting, bundle generation with barcodes
7. **Sewing**: Bundle processing, output declaration (OK/reject/repair/DHU)
8. **Washing**: Input/output tracking for wash-required items
9. **Finishing**: Hourly logs (iron/QC/repair/metal pass)
10. **Packing**: Carton creation with assortment types
11. **Shipment**: Random inspection, packing list generation
12. **Commercial**: Cost tracking and profit analysis

## 🔐 Security & Tenancy Features

### Multi-Tenant Isolation
- Every transactional record includes `company_id`
- Automatic tenant filtering for non-admin users
- System admin bypasses all tenant restrictions

### Access Control
- **Logged-out users**: No data access (401 Unauthorized)
- **Company users**: Cannot view other company data (403 Forbidden)
- **System admin**: Full access to all companies

### Approval Workflows
- Sub-PO and General Goods PO require management approval
- Approval state machine: `DRAFT → SUBMITTED → APPROVED/REJECTED`
- Notifications generated for all approval events

### Notifications
Automatic notifications for:
- Material transfer between orders
- Planning line/unit reallocation
- Approval submissions and decisions
- Shipment inspection failures

## 🚀 Quick Start

### 1. Review Requirements
Start with the comprehensive requirements document:
```bash
docs/PulseControlERP_Requirements.md
```

### 2. Understand Workflows
Review department workflows and control gates:
```bash
docs/PulseControlERP_Workflow.md
```

### 3. View Visual Diagrams
See system architecture, workflows, and database schema:
```bash
diagrams/README.md  # Instructions for viewing Mermaid diagrams
```

### 4. Set Up Database
Execute the baseline schema:
```bash
psql -U your_user -d pulse_erp_db -f db/schema.sql
```

### 5. Implement Backend
Follow the implementation guide:
```bash
docs/Backend_Implementation_Guide.md
```
Key patterns included:
- JWT authentication guard
- Tenant guard with automatic company filtering
- Audit log interceptor
- Notification service
- Material transfer with notifications
- Approval workflow implementation

### 6. Build Frontend
Follow the module map:
```bash
docs/Frontend_Module_Map.md
```
Includes:
- Role-based navigation menus
- Screen specifications for all departments
- Shared components (barcode scanner, data table, etc.)
- Security guards and interceptors

### 7. API Integration
Use the OpenAPI specification:
```bash
api/openapi.yaml
```
Generate client SDKs or import into Postman/Insomnia for testing.

## ☁️ Cloud Access (Work From Any Laptop)

This repository is preconfigured for GitHub Codespaces via:

- `.devcontainer/devcontainer.json`
- `.devcontainer/docker-compose.yml`
- `.devcontainer/post-create.sh`

### One-Time Setup

1. Push this project to a GitHub repository.
2. In GitHub, open the repo and go to **Code → Codespaces**.
3. Click **Create codespace on main**.

### Start the App in Codespaces

Open two terminals in Codespaces:

```bash
cd backend
npm run start:dev
```

```bash
cd frontend
npm start
```

### Use From a Different Laptop

1. On any laptop, sign in to GitHub.
2. Open your repository.
3. Go to **Code → Codespaces**.
4. Open your existing codespace (or create a new one).
5. Open forwarded ports:
   - Frontend: `3001`
   - Backend API: `3002`

### Database in Cloud Dev

- PostgreSQL runs as a service inside the dev container.
- Schema is auto-loaded from `db/schema.sql`.
- Default dev DB values are already wired for Codespaces.

### Important

- Keep secrets out of Git; use GitHub Codespaces Secrets for production-like credentials.
- If a port is busy, stop old processes and restart the server in that terminal.

## 🛠️ Technology Recommendations

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: NestJS (recommended) or Express
- **Database**: PostgreSQL 14+
- **Cache**: Redis
- **Authentication**: JWT (passport-jwt)
- **ORM**: TypeORM or Prisma

### Frontend
- **Framework**: React 18+ / Angular 16+ / Vue 3
- **UI Library**: Material-UI / Ant Design / PrimeReact
- **State**: Redux Toolkit / Zustand
- **Forms**: React Hook Form / Formik
- **Charts**: Recharts / ApexCharts

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Orchestration**: Kubernetes / AWS ECS
- **Load Balancer**: NGINX / AWS ALB
- **File Storage**: S3 / MinIO
- **CDN**: CloudFront

## 📊 Key Features

### Traceability
- Every record links to master order (internal unique number + buyer order number)
- Complete audit trail from order to shipment
- Time-stamped events for performance analysis

### Requisition-Based Material Flow
- Cutting, Sewing, and Finishing raise requisitions
- Store issues materials against approved requisitions
- Return tracking for unused materials

### Barcode Support
- Bundle cards with unique barcodes
- Sewing output declaration via barcode scan
- Carton tracking

### Reporting
- Master order tracking
- Sub-PO and GRN aging
- Inventory balance and variance
- QA summary reports
- Cutting, sewing, finishing productivity
- Packing list
- Commercial profit analysis

## 🔄 Development Workflow

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up development environment (Node.js, PostgreSQL, Redis)
- [ ] Initialize backend project (NestJS)
- [ ] Execute database schema
- [ ] Implement authentication module (JWT)
- [ ] Create tenant guard and interceptors
- [ ] Build user and company management modules

### Phase 2: Core Modules (Weeks 3-6)
- [ ] Merchandising (orders, sub-PO, material transfer)
- [ ] Planning (line allocation, reallocation)
- [ ] GRN (receiving)
- [ ] Store (inventory, requisitions, issue/return)
- [ ] Notification service

### Phase 3: Production Modules (Weeks 7-10)
- [ ] QA (fabric, accessories)
- [ ] Cutting (batches, bundles)
- [ ] Sewing (declarations)
- [ ] Washing (transactions)
- [ ] Finishing (hourly logs)

### Phase 4: Fulfillment (Weeks 11-12)
- [ ] Packing (cartons)
- [ ] Shipment (inspection, packing list)
- [ ] Commercial (costing, profit analysis)

### Phase 5: Frontend (Weeks 13-16)
- [ ] Authentication screens
- [ ] Dashboard (role-based)
- [ ] Department modules (parallel development)
- [ ] Reports and analytics

### Phase 6: Testing & Deployment (Weeks 17-18)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests (tenant isolation verification)
- [ ] Performance testing
- [ ] Security audit
- [ ] Production deployment

## 🧪 Testing Tenant Isolation

Critical test scenarios:

1. **Company A user tries to view Company B order**
   - Expected: 403 Forbidden

2. **Logged-out user accesses protected endpoint**
   - Expected: 401 Unauthorized

3. **Company A user creates order with Company B's company_id**
   - Expected: 403 Forbidden (blocked by tenant interceptor)

4. **System admin views all companies' data**
   - Expected: 200 OK with all data

## 📈 Scalability Considerations

- Horizontal scaling: Stateless API design allows multiple instances behind load balancer
- Database: Read replicas for reporting, connection pooling, indexed `company_id` columns
- Caching: Redis for session and frequently accessed data
- CDN: Serve static frontend assets from CDN
- Background jobs: Use queue (Bull/BullMQ) for report generation and email notifications

## 🔒 Security Best Practices

1. **Never trust client-side checks**: Enforce authorization in backend
2. **Audit sensitive actions**: Log create/update/delete with user context
3. **Use prepared statements**: Prevent SQL injection
4. **Validate all inputs**: Use DTO validation (class-validator)
5. **HTTPS only**: Enforce TLS in production
6. **Rate limiting**: Prevent abuse (express-rate-limit)
7. **Regular security audits**: Review tenant isolation logic

## 📝 Documentation Quality

All documentation is:
- ✅ **Implementation-ready**: Code examples, SQL schema, API specs
- ✅ **Complete**: Every department, workflow, and security rule documented
- ✅ **Visual**: Mermaid diagrams for architecture, workflows, and ERD
- ✅ **Actionable**: Step-by-step implementation guides

## 🤝 Contributing

When extending this ERP:

1. Maintain tenant isolation in all new modules
2. Add `company_id` to all transactional tables
3. Apply `JwtAuthGuard` and `TenantGuard` to all protected endpoints
4. Generate notifications for critical events
5. Log sensitive actions in audit table
6. Update OpenAPI specification
7. Add integration tests for new endpoints

## 📞 Support

For questions or clarifications on:
- **Requirements**: See `docs/PulseControlERP_Requirements.md`
- **Security**: See `docs/PulseControlERP_Security_Tenancy.md`
- **Backend**: See `docs/Backend_Implementation_Guide.md`
- **Frontend**: See `docs/Frontend_Module_Map.md`
- **Diagrams**: See `diagrams/README.md`

## 📜 License

This specification is provided as-is for implementation of the PulseControlERP system.

---

**Ready to build!** This complete specification package includes everything needed to implement a production-grade multi-tenant garment ERP system.
