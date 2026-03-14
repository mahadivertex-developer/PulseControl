# PulseControlERP - Department Workflow Diagram

This diagram illustrates the end-to-end order fulfillment workflow across departments.

## End-to-End Order Flow

```mermaid
flowchart TD
    Start([Order Received from Buyer]) --> A[Merchandising: Create Master Order]
    A --> B[Merchandising: Create Sub-PO for Materials]
    B --> C{Management Approval}
    C -->|Rejected| B
    C -->|Approved| D[GRN: Receive Materials]
    D --> E[Store: Update Inventory]
    E --> F[Store QA: Inspect Fabric & Accessories]
    F --> G{QA Pass?}
    G -->|Fail| H[Return/Reject Materials]
    G -->|Pass| I[Planning: Allocate Unit & Line]
    I --> J[Cutting: Raise Fabric Requisition]
    J --> K[Store: Issue Fabric to Cutting]
    K --> L[Cutting: Cut Fabric & Generate Bundles]
    L --> M[Cutting: Issue Bundles to Sewing]
    M --> N[Sewing: Raise Trims Requisition]
    N --> O[Store: Issue Trims to Sewing]
    O --> P[Sewing: Declare Output OK/Reject/Repair]
    P --> Q{Wash Required?}
    Q -->|Yes| R[Washing: Process & Output]
    Q -->|No| S[Finishing]
    R --> S
    S --> T[Finishing: Raise Finishing Requisition]
    T --> U[Store: Issue Finishing Items]
    U --> V[Finishing: Update Hourly Iron/QC/Metal Pass]
    V --> W[Packing: Create Cartons]
    W --> X[Shipment: Prepare Shipment]
    X --> Y[Shipment: Random Inspection]
    Y --> Z{Inspection Pass?}
    Z -->|Fail| AA[Return to Packing]
    AA --> W
    Z -->|Pass| AB[Shipment: Finalize & Generate Packing List]
    AB --> AC[Commercial: Update Costs]
    AC --> End([Order Complete])
    
    style Start fill:#e1f5e1
    style End fill:#ffe1e1
    style C fill:#fff4e1
    style G fill:#fff4e1
    style Q fill:#fff4e1
    style Z fill:#fff4e1
```

## Approval Workflow (Sub-PO & General Goods PO)

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> SUBMITTED : Submit for Approval
    SUBMITTED --> APPROVED : Management Approves
    SUBMITTED --> REJECTED : Management Rejects
    REJECTED --> DRAFT : Revise & Resubmit
    APPROVED --> [*]
    
    note right of SUBMITTED
        Notification sent to
        management users
    end note
    
    note right of APPROVED
        Can proceed to GRN
    end note
```

## Material Transfer Notification Flow

```mermaid
sequenceDiagram
    participant User
    participant System
    participant Inventory
    participant Notification
    
    User->>System: Request Material Transfer
    System->>Inventory: Check Source Availability
    Inventory-->>System: Qty Available
    System->>Inventory: Deduct from Source Order
    System->>Inventory: Add to Target Order
    System->>Notification: Generate Transfer Notification
    Notification-->>User: Transfer Completed Alert
```

## Planning Reallocation Notification Flow

```mermaid
sequenceDiagram
    participant Planner
    participant System
    participant LinePlan
    participant Notification
    
    Planner->>System: Request Line Reallocation
    System->>LinePlan: Update Line & Qty
    LinePlan-->>System: Updated
    System->>Notification: Generate Reallocation Notification
    Notification-->>Planner: Reallocation Completed Alert
    Notification-->>Production: Line Change Alert
```

## Requisition to Issue Flow

```mermaid
flowchart LR
    A[Department Raises Requisition] --> B{Store Reviews}
    B -->|Approved| C[Store Issues Items]
    B -->|Rejected| D[Return to Department]
    C --> E[Update Inventory Transaction]
    E --> F[Department Receives Items]
    F --> G[Department Returns Excess]
    G --> H[Store Receives Return]
    H --> I[Update Inventory Balance]
```

## QA Decision Flow

```mermaid
flowchart TD
    A[Material Received via GRN] --> B{Order-Related?}
    B -->|No General Goods| C[Skip QA]
    B -->|Yes| D{Material Type?}
    D -->|Fabric| E[Roll-wise Inspection]
    E --> F[Mark Shade, Shrinkage, Pattern]
    F --> G{Pass?}
    D -->|Accessories| H[Pass/Fail with Remarks]
    H --> I{Pass?}
    G -->|Yes| J[Release to Production]
    G -->|No| K[Reject/Return]
    I -->|Yes| J
    I -->|No| K
    C --> J
    
    style J fill:#e1f5e1
    style K fill:#ffe1e1
```

## Sewing to Finishing Routing

```mermaid
flowchart LR
    A[Sewing Declares Output] --> B{Wash Required?}
    B -->|Yes| C[Send to Washing]
    C --> D[Washing Input/Output]
    D --> E[Send to Finishing]
    B -->|No| E
    E --> F[Finishing Processes]
```

## Shipment Inspection & Rework Flow

```mermaid
flowchart TD
    A[Packing Creates Cartons] --> B[Shipment Receives Cartons]
    B --> C[Random Carton Inspection]
    C --> D{Inspection Result?}
    D -->|Pass| E[Add to Final Shipment]
    D -->|Fail| F[Generate Notification]
    F --> G[Return to Packing]
    G --> H[Packing Reworks]
    H --> B
    E --> I[Finalize Shipment]
    I --> J[Generate Packing List]
    
    style E fill:#e1f5e1
    style G fill:#ffe1e1
```

## Notification Trigger Events

```mermaid
mindmap
  root((Notifications))
    Material Transfer
      Between Internal Orders
      Qty Transferred
    Planning
      Line Reallocation
      Qty Change
    Approvals
      Sub-PO Submitted
      Sub-PO Approved
      Sub-PO Rejected
      General PO Submitted
      General PO Approved
      General PO Rejected
    Shipment
      Inspection Failed
      Return to Packing
```

## Multi-Department Handoff Summary

| From Department | To Department | Trigger Event | Data Passed |
|-----------------|---------------|---------------|-------------|
| Merchandising | Planning | Order Created | Master Order + PCD/BPCD |
| Planning | Cutting | Line Allocated | Unit, Line, Planned Qty |
| Cutting | Sewing | Bundles Issued | Bundle Cards with Barcode |
| Sewing | Washing | Wash Item Declared | Sewing Output Qty |
| Washing | Finishing | Washing Complete | Output Qty |
| Sewing | Finishing | Non-wash Item | Sewing Output Qty |
| Finishing | Packing | Metal Pass | Metal Pass Qty |
| Packing | Shipment | Cartons Ready | Carton List |
| Shipment | Commercial | Shipment Finalized | Delivery Details |

## Critical Decision Points (Approval Gates)

1. **Sub-PO Approval**: Management must approve before GRN
2. **General Goods PO Approval**: Management must approve before GRN
3. **QA Pass**: Materials must pass QA before production use
4. **Shipment Inspection**: Random cartons must pass before final shipment
