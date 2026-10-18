-- Migration: 006_phase4_expenses_ap_ocr.sql
-- QuikLedgr Enterprise Phase 4: Expense Tracking, Receipt OCR, Accounts Payable (AP), and 1099 Contractor Compliance

-- 1. Vendors (Suppliers, Contractors & Payees)
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(50) NULL,
    address TEXT NULL,
    tax_id VARCHAR(50) NULL, -- EIN or SSN for 1099 tracking
    is_1099_contractor BOOLEAN DEFAULT FALSE,
    default_expense_account_id VARCHAR(36) NULL,
    payment_terms ENUM('due_on_receipt', 'net_15', 'net_30', 'net_60') DEFAULT 'net_30',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_vendor_org (organization_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bills (Accounts Payable - Supplier & Vendor Invoices)
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    bill_number VARCHAR(100) NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status ENUM('draft', 'open', 'partially_paid', 'paid', 'overdue', 'void') DEFAULT 'open',
    notes TEXT NULL,
    attachment_url TEXT NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
    INDEX idx_bill_org_status (organization_id, status),
    INDEX idx_bill_due_date (organization_id, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bill Line Items
CREATE TABLE IF NOT EXISTS bill_items (
    id VARCHAR(36) PRIMARY KEY,
    bill_id VARCHAR(36) NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    is_billable BOOLEAN DEFAULT FALSE,
    client_id VARCHAR(36) NULL,
    markup_percent DECIMAL(5,2) DEFAULT 0.00,
    invoiced_item_id VARCHAR(36) NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    INDEX idx_bill_items (bill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bill Payments (Settling AP against Bank / Cash accounts)
CREATE TABLE IF NOT EXISTS bill_payments (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    bill_id VARCHAR(36) NOT NULL,
    payment_account_id VARCHAR(36) NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('ach', 'check', 'credit_card', 'wire', 'other') DEFAULT 'ach',
    reference_number VARCHAR(100) NULL,
    notes TEXT NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    INDEX idx_bill_payments_org (organization_id, payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Direct Expenses & Receipt OCR Log
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    payment_account_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NULL,
    expense_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    merchant_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NULL,
    description TEXT NULL,
    reference_number VARCHAR(100) NULL,
    receipt_url TEXT NULL,
    ocr_data JSON NULL,
    is_billable BOOLEAN DEFAULT FALSE,
    client_id VARCHAR(36) NULL,
    markup_percent DECIMAL(5,2) DEFAULT 0.00,
    is_invoiced BOOLEAN DEFAULT FALSE,
    invoiced_item_id VARCHAR(36) NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
    INDEX idx_expense_org_date (organization_id, expense_date),
    INDEX idx_expense_billable (organization_id, is_billable, is_invoiced)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
