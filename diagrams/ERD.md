# PulseControlERP - Entity Relationship Diagram (ERD)

This diagram shows the core database relationships for the multi-tenant ERP system.

## Core ERD (Mermaid Format)

```mermaid
erDiagram
    companies ||--o{ users : "has many"
    companies ||--o{ units : "has many"
    companies ||--o{ master_orders : "has many"
    companies ||--o{ sub_pos : "has many"
    companies ||--o{ items : "has many"
    
    roles ||--o{ users : "assigned to"
    roles ||--o{ role_permissions : "has"
    permissions ||--o{ role_permissions : "granted in"
    
    units ||--o{ production_lines : "contains"
    
    master_orders ||--o{ sub_pos : "generates"
    master_orders ||--o{ line_plans : "planned in"
    master_orders ||--o{ inventory_balances : "tracks"
    master_orders ||--o{ cutting_batches : "cut for"
    master_orders ||--o{ washing_transactions : "processes"
    master_orders ||--o{ finishing_hourly_logs : "finishes"
    master_orders ||--o{ cartons : "packed into"
    master_orders ||--o{ shipments : "ships in"
    master_orders ||--o{ commercial_costs : "costs for"
    
    sub_pos ||--o{ sub_po_items : "contains"
    sub_pos ||--o{ grns : "received via"
    
    items ||--o{ sub_po_items : "ordered in"
    items ||--o{ grn_items : "received as"
    items ||--o{ inventory_balances : "stored as"
    items ||--o{ requisition_items : "requested as"
    
    grns ||--o{ grn_items : "contains"
    
    requisitions ||--o{ requisition_items : "contains"
    
    cutting_batches ||--o{ bundle_cards : "generates"
    bundle_cards ||--o{ sewing_declarations : "declared in"
    
    cartons ||--o{ shipment_cartons : "assigned to"
    shipments ||--o{ shipment_cartons : "contains"
    
    companies {
        bigint id PK
        varchar code UK
        varchar name
        boolean is_active
        timestamp created_at
    }
    
    users {
        bigint id PK
        bigint company_id FK
        bigint role_id FK
        varchar username UK
        varchar email
        varchar password_hash
        varchar full_name
        boolean is_active
        timestamp last_login_at
        timestamp created_at
    }
    
    roles {
        bigint id PK
        varchar code UK
        varchar name
        boolean is_system
    }
    
    permissions {
        bigint id PK
        varchar code UK
        varchar name
    }
    
    master_orders {
        bigint id PK
        bigint company_id FK
        varchar internal_order_no UK
        varchar buyer_order_no UK
        varchar buyer_name
        varchar style_no
        numeric order_qty
        date pcd_date
        date bpcd_date
        bigint created_by FK
        timestamp created_at
    }
    
    sub_pos {
        bigint id PK
        bigint company_id FK
        bigint master_order_id FK
        varchar sub_po_no UK
        varchar status
        bigint created_by FK
        timestamp created_at
        bigint approved_by FK
        timestamp approved_at
    }
    
    items {
        bigint id PK
        bigint company_id FK
        varchar sku UK
        varchar name
        varchar item_category
        varchar uom
        boolean is_order_related
    }
    
    grns {
        bigint id PK
        bigint company_id FK
        varchar grn_no UK
        bigint sub_po_id FK
        bigint general_goods_po_id FK
        timestamp received_at
        bigint received_by FK
        timestamp created_at
    }
    
    inventory_balances {
        bigint id PK
        bigint company_id FK
        bigint item_id FK
        bigint master_order_id FK
        numeric on_hand_qty
        numeric reserved_qty
    }
    
    requisitions {
        bigint id PK
        bigint company_id FK
        varchar req_no UK
        varchar department
        bigint master_order_id FK
        bigint requested_by FK
        varchar status
        timestamp created_at
    }
    
    cutting_batches {
        bigint id PK
        bigint company_id FK
        varchar batch_no UK
        bigint master_order_id FK
        bigint unit_id FK
        bigint production_line_id FK
        numeric cut_qty
        numeric panel_replacement_qty
        date cut_date
        bigint created_by FK
    }
    
    bundle_cards {
        bigint id PK
        bigint company_id FK
        bigint cutting_batch_id FK
        varchar bundle_barcode UK
        numeric bundle_qty
        numeric issued_to_sewing_qty
    }
    
    sewing_declarations {
        bigint id PK
        bigint company_id FK
        bigint bundle_card_id FK
        numeric ok_qty
        numeric reject_qty
        numeric repair_qty
        numeric dhu_percent
        boolean is_wash_required
        timestamp declared_at
        bigint declared_by FK
    }
    
    cartons {
        bigint id PK
        bigint company_id FK
        varchar carton_no UK
        bigint master_order_id FK
        varchar assortment_type
        numeric carton_qty
        timestamp packed_at
        bigint created_by FK
    }
    
    shipments {
        bigint id PK
        bigint company_id FK
        varchar shipment_no UK
        bigint master_order_id FK
        varchar status
        timestamp shipped_at
        bigint created_by FK
        timestamp created_at
    }
```

## Tenant Isolation Pattern

Every transactional table includes `company_id` to enforce tenant boundaries:

```mermaid
graph LR
    A[User Request] --> B{Is System Admin?}
    B -->|Yes| C[Access All Data]
    B -->|No| D[Filter WHERE company_id = user.company_id]
    D --> E[Return Scoped Data]
```

## Key Relationships Summary

1. **Multi-Tenancy**: All tables reference `companies.id` via `company_id`
2. **Order Flow**: `master_orders` → `sub_pos` → `grns` → `inventory_balances`
3. **Production**: `line_plans` → `cutting_batches` → `bundle_cards` → `sewing_declarations`
4. **Fulfillment**: `finishing_hourly_logs` → `cartons` → `shipments`
5. **Traceability**: All records link back to `master_orders` via `master_order_id`
