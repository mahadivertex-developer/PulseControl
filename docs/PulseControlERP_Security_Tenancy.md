# PulseControlERP - Security and Tenancy Implementation Notes

## 1. Authentication Rules
- All UI routes and API endpoints must require authentication except login endpoints.
- If token/session is missing or expired, return `401 Unauthorized`.
- Logged-out users must never receive protected data.

## 2. Authorization Rules
- System Admin: unrestricted access across all companies.
- Company Admin: unrestricted access inside own company.
- Employee: permission-based access inside own company.

## 3. Tenant Guard (Mandatory)
Apply on every read/write query:
- If role is not `SYSTEM_ADMIN`, force `WHERE company_id = current_user.company_id`.
- Reject create/update if payload `company_id` does not match current user company.

## 4. Backend Enforcement Pattern
Do not rely only on frontend checks.

Pseudo-flow:
1. `authenticate()` -> resolve current user.
2. `authorize(permission_code)` -> role/permission validation.
3. `tenant_scope(query, current_user)` -> auto-apply company filter.
4. Execute query.
5. Record audit log for sensitive actions.

## 5. Recommended DB-Level Defense (PostgreSQL)
Use Row Level Security (RLS) for tenant tables.

Example pattern:
```sql
ALTER TABLE master_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_master_orders
ON master_orders
USING (
    current_setting('app.is_system_admin', true) = 'true'
    OR company_id = current_setting('app.company_id', true)::BIGINT
);
```

In each request transaction, set:
```sql
SET LOCAL app.company_id = '123';
SET LOCAL app.is_system_admin = 'false';
```

## 6. Notification Triggers (Application Layer)
Generate notification records when:
- Material transfer between internal orders happens.
- Planning line/unit reallocation happens.
- Approval request submitted/approved/rejected.
- Shipment inspection fails and carton is returned to packing.

## 7. Audit Log Minimum Fields
- user_id, company_id
- action
- entity_type, entity_id
- old_data, new_data
- timestamp

## 8. Direct Link Access Rule
If user opens a direct link:
- Not logged in -> redirect to login, no data render.
- Logged in but wrong company data -> return `403 Forbidden` and no payload.
