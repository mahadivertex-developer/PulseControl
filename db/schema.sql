-- PulseControlERP baseline relational schema (vendor-neutral SQL with PostgreSQL-friendly types)

-- ==============================
-- Identity and tenant structure
-- ==============================

CREATE TABLE companies (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code VARCHAR(50) NOT NULL UNIQUE,
	name VARCHAR(200) NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	validity_date DATE,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code VARCHAR(50) NOT NULL UNIQUE,
	name VARCHAR(100) NOT NULL,
	is_system BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE permissions (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code VARCHAR(100) NOT NULL UNIQUE,
	name VARCHAR(150) NOT NULL
);

CREATE TABLE role_permissions (
	role_id BIGINT NOT NULL REFERENCES roles(id),
	permission_id BIGINT NOT NULL REFERENCES permissions(id),
	PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT REFERENCES companies(id),
	role_id BIGINT NOT NULL REFERENCES roles(id),
	username VARCHAR(80) NOT NULL UNIQUE,
	email VARCHAR(160),
	password_hash VARCHAR(255) NOT NULL,
	full_name VARCHAR(160) NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	last_login_at TIMESTAMP,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- Organization setup
-- ==============================

CREATE TABLE units (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	code VARCHAR(50) NOT NULL,
	name VARCHAR(100) NOT NULL,
	UNIQUE (company_id, code)
);

CREATE TABLE production_lines (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	unit_id BIGINT NOT NULL REFERENCES units(id),
	code VARCHAR(50) NOT NULL,
	name VARCHAR(100) NOT NULL,
	UNIQUE (company_id, code)
);

CREATE TABLE buyers (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	code VARCHAR(50) NOT NULL,
	name VARCHAR(150) NOT NULL,
	UNIQUE (company_id, code)
);

-- ==============================
-- Orders and planning
-- ==============================

CREATE TABLE master_orders (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	internal_order_no VARCHAR(80) NOT NULL,
	buyer_order_no VARCHAR(120) NOT NULL,
	buyer_name VARCHAR(150) NOT NULL,
	style_no VARCHAR(100),
	order_qty NUMERIC(18,3) NOT NULL,
	pcd_date DATE,
	bpcd_date DATE,
	created_by BIGINT NOT NULL REFERENCES users(id),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (company_id, internal_order_no),
	UNIQUE (company_id, buyer_order_no, style_no)
);

CREATE TABLE sub_pos (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	master_order_id BIGINT NOT NULL REFERENCES master_orders(id),
	sub_po_no VARCHAR(100) NOT NULL,
	status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
	created_by BIGINT NOT NULL REFERENCES users(id),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	approved_by BIGINT REFERENCES users(id),
	approved_at TIMESTAMP,
	UNIQUE (company_id, sub_po_no),
	CONSTRAINT ck_sub_po_status CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED'))
);

CREATE TABLE line_plans (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	master_order_id BIGINT NOT NULL REFERENCES master_orders(id),
	unit_id BIGINT NOT NULL REFERENCES units(id),
	production_line_id BIGINT NOT NULL REFERENCES production_lines(id),
	planned_qty NUMERIC(18,3) NOT NULL,
	plan_date DATE NOT NULL,
	created_by BIGINT NOT NULL REFERENCES users(id),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- Item master and procurement
-- ==============================

CREATE TABLE items (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	sku VARCHAR(100) NOT NULL,
	name VARCHAR(200) NOT NULL,
	item_category VARCHAR(40) NOT NULL,
	uom VARCHAR(30) NOT NULL,
	is_order_related BOOLEAN NOT NULL DEFAULT TRUE,
	UNIQUE (company_id, sku)
);

CREATE TABLE sub_po_items (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	sub_po_id BIGINT NOT NULL REFERENCES sub_pos(id),
	item_id BIGINT NOT NULL REFERENCES items(id),
	ordered_qty NUMERIC(18,3) NOT NULL,
	unit_price NUMERIC(18,4),
	UNIQUE (sub_po_id, item_id)
);

CREATE TABLE general_goods_pos (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	po_no VARCHAR(100) NOT NULL,
	status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
	created_by BIGINT NOT NULL REFERENCES users(id),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	approved_by BIGINT REFERENCES users(id),
	approved_at TIMESTAMP,
	UNIQUE (company_id, po_no),
	CONSTRAINT ck_general_po_status CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED'))
);

CREATE TABLE general_goods_po_items (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	general_goods_po_id BIGINT NOT NULL REFERENCES general_goods_pos(id),
	item_id BIGINT NOT NULL REFERENCES items(id),
	ordered_qty NUMERIC(18,3) NOT NULL,
	unit_price NUMERIC(18,4),
	UNIQUE (general_goods_po_id, item_id)
);

-- ==============================
-- GRN and inventory
-- ==============================

CREATE TABLE grns (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	grn_no VARCHAR(100) NOT NULL,
	sub_po_id BIGINT REFERENCES sub_pos(id),
	general_goods_po_id BIGINT REFERENCES general_goods_pos(id),
	received_at TIMESTAMP NOT NULL,
	received_by BIGINT NOT NULL REFERENCES users(id),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (company_id, grn_no)
);

CREATE TABLE grn_items (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	grn_id BIGINT NOT NULL REFERENCES grns(id),
	item_id BIGINT NOT NULL REFERENCES items(id),
	received_qty NUMERIC(18,3) NOT NULL
);

CREATE TABLE inventory_balances (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	item_id BIGINT NOT NULL REFERENCES items(id),
	master_order_id BIGINT REFERENCES master_orders(id),
	on_hand_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
	reserved_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
	UNIQUE (company_id, item_id, master_order_id)
);

CREATE TABLE inventory_transactions (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	txn_type VARCHAR(40) NOT NULL,
	item_id BIGINT NOT NULL REFERENCES items(id),
	qty NUMERIC(18,3) NOT NULL,
	master_order_id BIGINT REFERENCES master_orders(id),
	source_doc_type VARCHAR(50),
	source_doc_id BIGINT,
	remarks VARCHAR(500),
	txn_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	created_by BIGINT NOT NULL REFERENCES users(id)
);

-- ==============================
-- Requisition and issue/return
-- ==============================

CREATE TABLE requisitions (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	req_no VARCHAR(100) NOT NULL,
	department VARCHAR(30) NOT NULL,
	master_order_id BIGINT REFERENCES master_orders(id),
	requested_by BIGINT NOT NULL REFERENCES users(id),
	status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (company_id, req_no),
	CONSTRAINT ck_req_dept CHECK (department IN ('CUTTING','SEWING','FINISHING')),
	CONSTRAINT ck_req_status CHECK (status IN ('SUBMITTED','APPROVED','ISSUED','PARTIAL_ISSUED','CLOSED','REJECTED'))
);

CREATE TABLE requisition_items (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	requisition_id BIGINT NOT NULL REFERENCES requisitions(id),
	item_id BIGINT NOT NULL REFERENCES items(id),
	requested_qty NUMERIC(18,3) NOT NULL,
	issued_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
	returned_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
	UNIQUE (requisition_id, item_id)
);

-- ==============================
-- QA, cutting, sewing, washing
-- ==============================

CREATE TABLE fabric_qa_reports (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	master_order_id BIGINT NOT NULL REFERENCES master_orders(id),
	grn_item_id BIGINT REFERENCES grn_items(id),
	roll_no VARCHAR(80) NOT NULL,
	color_shade VARCHAR(80),
	shrinkage_percent NUMERIC(8,4),
	pattern_group VARCHAR(80),
	qa_status VARCHAR(20) NOT NULL,
	created_by BIGINT NOT NULL REFERENCES users(id),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT ck_fabric_qa_status CHECK (qa_status IN ('PASS','FAIL'))
);

CREATE TABLE accessories_qa_reports (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	master_order_id BIGINT NOT NULL REFERENCES master_orders(id),
	item_id BIGINT NOT NULL REFERENCES items(id),
	qa_status VARCHAR(20) NOT NULL,
	fail_reason VARCHAR(500),
	created_by BIGINT NOT NULL REFERENCES users(id),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT ck_accessories_qa_status CHECK (qa_status IN ('PASS','FAIL'))
);

CREATE TABLE cutting_batches (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	batch_no VARCHAR(100) NOT NULL,
	master_order_id BIGINT NOT NULL REFERENCES master_orders(id),
	unit_id BIGINT NOT NULL REFERENCES units(id),
	production_line_id BIGINT NOT NULL REFERENCES production_lines(id),
	cut_qty NUMERIC(18,3) NOT NULL,
	panel_replacement_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
	cut_date DATE NOT NULL,
	created_by BIGINT NOT NULL REFERENCES users(id),
	UNIQUE (company_id, batch_no)
);

CREATE TABLE bundle_cards (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	cutting_batch_id BIGINT NOT NULL REFERENCES cutting_batches(id),
	bundle_barcode VARCHAR(120) NOT NULL,
	bundle_qty NUMERIC(18,3) NOT NULL,
	issued_to_sewing_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
	UNIQUE (company_id, bundle_barcode)
);

CREATE TABLE sewing_declarations (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	bundle_card_id BIGINT NOT NULL REFERENCES bundle_cards(id),
	ok_qty NUMERIC(18,3) NOT NULL,
	reject_qty NUMERIC(18,3) NOT NULL,
	repair_qty NUMERIC(18,3) NOT NULL,
	dhu_percent NUMERIC(8,4),
	is_wash_required BOOLEAN NOT NULL,
	declared_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	declared_by BIGINT NOT NULL REFERENCES users(id)
);

CREATE TABLE washing_transactions (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	master_order_id BIGINT NOT NULL REFERENCES master_orders(id),
	input_qty NUMERIC(18,3) NOT NULL,
	output_qty NUMERIC(18,3) NOT NULL,
	txn_date DATE NOT NULL,
	created_by BIGINT NOT NULL REFERENCES users(id)
);

-- ==============================
-- Finishing, packing, shipment
-- ==============================

CREATE TABLE finishing_hourly_logs (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	master_order_id BIGINT NOT NULL REFERENCES master_orders(id),
	log_hour TIMESTAMP NOT NULL,
	iron_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
	qc_pass_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
	repair_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
	reject_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
	metal_pass_qty NUMERIC(18,3) NOT NULL DEFAULT 0,
	created_by BIGINT NOT NULL REFERENCES users(id)
);

CREATE TABLE cartons (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	carton_no VARCHAR(120) NOT NULL,
	master_order_id BIGINT NOT NULL REFERENCES master_orders(id),
	assortment_type VARCHAR(50) NOT NULL,
	carton_qty NUMERIC(18,3) NOT NULL,
	packed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	created_by BIGINT NOT NULL REFERENCES users(id),
	UNIQUE (company_id, carton_no)
);

CREATE TABLE shipments (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	shipment_no VARCHAR(120) NOT NULL,
	master_order_id BIGINT NOT NULL REFERENCES master_orders(id),
	status VARCHAR(30) NOT NULL DEFAULT 'READY',
	shipped_at TIMESTAMP,
	created_by BIGINT NOT NULL REFERENCES users(id),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (company_id, shipment_no)
);

CREATE TABLE shipment_cartons (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	shipment_id BIGINT NOT NULL REFERENCES shipments(id),
	carton_id BIGINT NOT NULL REFERENCES cartons(id),
	inspection_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
	inspection_remarks VARCHAR(500),
	CONSTRAINT ck_shipment_carton_inspection
		CHECK (inspection_status IN ('PENDING','PASS','FAIL')),
	UNIQUE (shipment_id, carton_id)
);

-- ==============================
-- Commercial and costing
-- ==============================

CREATE TABLE commercial_costs (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT NOT NULL REFERENCES companies(id),
	master_order_id BIGINT NOT NULL REFERENCES master_orders(id),
	shipment_id BIGINT REFERENCES shipments(id),
	cost_head VARCHAR(120) NOT NULL,
	amount NUMERIC(18,4) NOT NULL,
	remarks VARCHAR(500),
	created_by BIGINT NOT NULL REFERENCES users(id),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- Notifications and audit
-- ==============================

CREATE TABLE notifications (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT REFERENCES companies(id),
	event_type VARCHAR(80) NOT NULL,
	entity_type VARCHAR(80) NOT NULL,
	entity_id BIGINT NOT NULL,
	message VARCHAR(500) NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	company_id BIGINT REFERENCES companies(id),
	user_id BIGINT REFERENCES users(id),
	action VARCHAR(100) NOT NULL,
	entity_type VARCHAR(80) NOT NULL,
	entity_id BIGINT,
	old_data TEXT,
	new_data TEXT,
	logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Suggested baseline indexes for tenant-safe query performance
CREATE INDEX idx_master_orders_company ON master_orders(company_id);
CREATE INDEX idx_sub_pos_company ON sub_pos(company_id);
CREATE INDEX idx_inventory_txn_company ON inventory_transactions(company_id);
CREATE INDEX idx_requisitions_company ON requisitions(company_id);
CREATE INDEX idx_shipments_company ON shipments(company_id);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
