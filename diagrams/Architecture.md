# PulseControlERP - System Architecture Diagram

This diagram shows the high-level technical architecture for the multi-tenant ERP platform.

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        WEB[Web Browser]
        MOBILE[Mobile Browser/App]
    end
    
    subgraph CDN["CDN / Static Hosting"]
        STATIC[Static Assets - React/Angular/Vue]
    end
    
    subgraph Gateway["API Gateway / Load Balancer"]
        LB[NGINX / AWS ALB]
    end
    
    subgraph App["Application Layer"]
        direction TB
        API1[API Server Instance 1<br/>NestJS/Express + TypeScript]
        API2[API Server Instance 2<br/>NestJS/Express + TypeScript]
        API3[API Server Instance N<br/>NestJS/Express + TypeScript]
        
        subgraph Middleware["Middleware Stack"]
            AUTH[JWT Auth Guard]
            TENANT[Tenant Guard]
            RBAC[Role-Based Access Guard]
            AUDIT[Audit Log Interceptor]
        end
    end
    
    subgraph Data["Data Layer"]
        DB[(PostgreSQL<br/>Multi-Tenant DB)]
        CACHE[(Redis<br/>Session & Cache)]
        UPLOAD[File Storage<br/>S3 / MinIO]
    end
    
    subgraph Services["Background Services"]
        NOTIFY[Notification Service]
        REPORT[Report Generator]
        EMAIL[Email Service]
    end
    
    WEB --> CDN
    MOBILE --> CDN
    WEB --> LB
    MOBILE --> LB
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> Middleware
    API2 --> Middleware
    API3 --> Middleware
    
    Middleware --> DB
    Middleware --> CACHE
    Middleware --> UPLOAD
    
    API1 --> NOTIFY
    API2 --> NOTIFY
    API3 --> NOTIFY
    
    NOTIFY --> EMAIL
    REPORT --> DB
    
    style Client fill:#e1f5e1
    style Data fill:#e1e5f5
    style Services fill:#fff4e1
```

## Request Flow with Tenant Isolation

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant API
    participant AuthGuard
    participant TenantGuard
    participant Service
    participant Database
    
    User->>Browser: Click "View Orders"
    Browser->>API: GET /orders (with JWT token)
    API->>AuthGuard: Validate JWT
    AuthGuard->>AuthGuard: Decode Token → Extract user.id, user.companyId, user.role
    AuthGuard-->>API: User Authenticated
    API->>TenantGuard: Check Tenant Scope
    TenantGuard->>TenantGuard: Is System Admin?
    alt System Admin
        TenantGuard-->>API: No Filter Required
    else Company User
        TenantGuard->>TenantGuard: Attach WHERE companyId = user.companyId
        TenantGuard-->>API: Tenant Filter Applied
    end
    API->>Service: Execute findAll(user)
    Service->>Database: SELECT * FROM master_orders WHERE companyId = ?
    Database-->>Service: Results (scoped to company)
    Service-->>API: Orders List
    API-->>Browser: JSON Response
    Browser-->>User: Display Orders
```

## Authentication & Authorization Flow

```mermaid
flowchart LR
    A[User Login] --> B[Backend Validates Credentials]
    B --> C{Valid?}
    C -->|No| D[Return 401 Unauthorized]
    C -->|Yes| E[Generate JWT Token]
    E --> F[Token Contains: userId, companyId, roleCode]
    F --> G[Return Token to Client]
    G --> H[Client Stores Token]
    H --> I[Client Sends Token in Authorization Header]
    I --> J[Backend Validates & Decodes Token]
    J --> K[Extract User Context]
    K --> L[Apply Tenant & Permission Guards]
    L --> M[Execute Request]
    
    style D fill:#ffe1e1
    style M fill:#e1f5e1
```

## Multi-Tenancy Data Isolation Strategy

```mermaid
flowchart TD
    A[Incoming Request] --> B{Authenticated?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Extract User Role}
    D --> E{System Admin?}
    E -->|Yes| F[No Tenant Filter]
    E -->|No| G[Apply Tenant Filter: company_id = user.companyId]
    F --> H[Query Database]
    G --> H
    H --> I[Return Results]
    
    style C fill:#ffe1e1
    style I fill:#e1f5e1
```

## Database Schema Pattern (Multi-Tenant)

```mermaid
flowchart LR
    A[All Transactional Tables] --> B{Contains company_id Column?}
    B -->|Yes| C[Apply Row-Level Filter]
    B -->|No| D[Shared Reference Table - roles, permissions]
    C --> E[WHERE company_id = current_user.company_id]
    D --> F[Accessible to All]
    
    style C fill:#e1f5e1
    style D fill:#fff4e1
```

## Notification Architecture

```mermaid
flowchart TD
    A[Event Occurs - Transfer/Reallocation/Approval] --> B[Service Emits Event]
    B --> C[Notification Service Listener]
    C --> D[Create Notification Record in DB]
    D --> E{Notification Type}
    E -->|In-App| F[Store in notifications Table]
    E -->|Email| G[Queue Email Job]
    E -->|Push| H[Send Push Notification]
    F --> I[User Polls /notifications Endpoint]
    G --> J[Email Service Sends Email]
    H --> K[Push Service Delivers]
    
    style I fill:#e1f5e1
    style J fill:#e1f5e1
    style K fill:#e1f5e1
```

## Module Architecture (Backend)

```mermaid
graph TB
    subgraph Core["Core Modules"]
        AuthModule[Auth Module - JWT, Login, Logout]
        UsersModule[Users Module - User CRUD, Roles]
        CompaniesModule[Companies Module - System Admin Only]
        NotificationsModule[Notifications Module]
        AuditLogModule[Audit Log Module]
    end
    
    subgraph Business["Business Modules"]
        OrdersModule[Orders Module - Master Orders]
        SubPOModule[Sub-PO Module - Material PO]
        PlanningModule[Planning Module - Line Plans]
        GRNModule[GRN Module - Goods Receiving]
        StoreModule[Store Module - Inventory, Requisition]
        QAModule[QA Module - Fabric & Accessories QA]
        CuttingModule[Cutting Module - Batches, Bundles]
        SewingModule[Sewing Module - Declarations]
        WashingModule[Washing Module - Transactions]
        FinishingModule[Finishing Module - Hourly Logs]
        PackingModule[Packing Module - Cartons]
        ShipmentModule[Shipment Module - Inspection]
        CommercialModule[Commercial Module - Costing]
    end
    
    Core -.->|Uses| Business
    Business -->|Emits Events| NotificationsModule
    Business -->|Logs Actions| AuditLogModule
```

## Security Layers

```mermaid
flowchart TB
    A[Request Received] --> B[Layer 1: HTTPS/TLS]
    B --> C[Layer 2: CORS Validation]
    C --> D[Layer 3: JWT Authentication]
    D --> E[Layer 4: Tenant Guard - company_id Check]
    E --> F[Layer 5: Role & Permission Guard]
    F --> G[Layer 6: Input Validation - DTO]
    G --> H[Layer 7: Business Logic Validation]
    H --> I[Layer 8: Database RLS - Optional]
    I --> J[Layer 9: Audit Log]
    J --> K[Execute Business Logic]
    K --> L[Response]
    
    style L fill:#e1f5e1
```

## Deployment Architecture (AWS Example)

```mermaid
flowchart TB
    subgraph Internet
        USER[End Users]
    end
    
    subgraph AWS["AWS Cloud"]
        ROUTE53[Route 53 - DNS]
        CF[CloudFront - CDN]
        S3[S3 - Static Frontend]
        ALB[Application Load Balancer]
        
        subgraph VPC["VPC - Private Network"]
            subgraph AppTier["Application Tier"]
                ECS1[ECS Task - API 1]
                ECS2[ECS Task - API 2]
                ECS3[ECS Task - API 3]
            end
            
            subgraph DataTier["Data Tier"]
                RDS[(RDS PostgreSQL<br/>Multi-AZ)]
                REDIS[(ElastiCache Redis)]
            end
            
            subgraph Storage["Storage"]
                S3_FILES[S3 - File Uploads]
            end
        end
    end
    
    USER --> ROUTE53
    ROUTE53 --> CF
    CF --> S3
    USER --> ALB
    ALB --> ECS1
    ALB --> ECS2
    ALB --> ECS3
    
    ECS1 --> RDS
    ECS2 --> RDS
    ECS3 --> RDS
    
    ECS1 --> REDIS
    ECS2 --> REDIS
    ECS3 --> REDIS
    
    ECS1 --> S3_FILES
    ECS2 --> S3_FILES
    ECS3 --> S3_FILES
    
    style USER fill:#e1f5e1
    style VPC fill:#e1e5f5
```

## Technology Stack Summary

```mermaid
mindmap
  root((PulseControlERP<br/>Tech Stack))
    Frontend
      React 18 / Angular 16 / Vue 3
      TypeScript
      Material-UI / Ant Design
      React Query / Apollo
      Recharts
    Backend
      Node.js 18+
      NestJS / Express
      TypeScript
      TypeORM / Prisma
      Passport JWT
      class-validator
    Database
      PostgreSQL 14+
      Redis
      Row-Level Security RLS
    Infrastructure
      Docker
      Kubernetes / ECS
      NGINX / AWS ALB
      S3 / MinIO
      CloudFront / CDN
    DevOps
      Git / GitHub
      CI/CD Pipeline
      Jest / Supertest
      Swagger / OpenAPI
```

## Data Flow: Order to Shipment

```mermaid
flowchart LR
    A[Master Order Created] -->|Merchandising| B[Sub-PO Created]
    B -->|Approval| C[GRN Received]
    C -->|Store| D[Inventory Updated]
    D -->|QA| E[Material Inspected]
    E -->|Planning| F[Line Allocated]
    F -->|Cutting| G[Bundles Generated]
    G -->|Sewing| H[Output Declared]
    H -->|Washing/Finishing| I[Finishing Complete]
    I -->|Packing| J[Cartons Created]
    J -->|Shipment| K[Inspection & Packing List]
    K -->|Commercial| L[Cost Analysis & Profit]
    
    style A fill:#e1f5e1
    style L fill:#ffe1e1
```

## Scalability Considerations

```mermaid
flowchart TB
    A[Horizontal Scaling] --> B[Multiple API Instances behind Load Balancer]
    A --> C[Stateless API Design - JWT in Header]
    A --> D[Redis for Session Cache]
    
    E[Database Scaling] --> F[Read Replicas for Reports]
    E --> G[Connection Pooling]
    E --> H[Indexed company_id Columns]
    
    I[Performance] --> J[API Response Caching]
    I --> K[Lazy Loading / Pagination]
    I --> L[CDN for Static Assets]
    
    style A fill:#e1f5e1
    style E fill:#e1e5f5
    style I fill:#fff4e1
```
