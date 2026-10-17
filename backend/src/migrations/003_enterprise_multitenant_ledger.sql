-- Migration: 003_enterprise_multitenant_ledger.sql
-- QuikLedgr Enterprise: Multi-Tenant Organizations, RBAC, Double-Entry General Ledger, and Audit Logs

-- 1. Organizations (Multi-Tenant Workspaces)
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200) NULL,
    tax_id VARCHAR(100) NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    fiscal_year_start_month TINYINT DEFAULT 1,
    accounting_method ENUM('accrual', 'cash') DEFAULT 'accrual',
    books_locked_until DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Organization Members (RBAC: Owner, Admin, Accountant, Billing Only, Read Only)
CREATE TABLE IF NOT EXISTS organization_members (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('owner', 'admin', 'accountant', 'billing_only', 'read_only') NOT NULL DEFAULT 'owner',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_org (user_id, organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Scope Invoices and Clients with organization_id
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36) NULL AFTER user_id,
ADD INDEX IF NOT EXISTS idx_invoice_org (organization_id);

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36) NULL AFTER user_id,
ADD INDEX IF NOT EXISTS idx_client_org (organization_id);

-- 4. Chart of Accounts (CoA)
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
    subtype VARCHAR(50) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY uk_org_account (organization_id, account_number),
    INDEX idx_org_type (organization_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Journal Entries (Append-Only General Ledger Headers)
CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,
    source_type ENUM('invoice', 'payment', 'bill', 'bill_payment', 'manual', 'bank_feed') NOT NULL,
    source_id VARCHAR(36) NULL,
    description TEXT NOT NULL,
    is_posted BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_org_entry_date (organization_id, entry_date),
    INDEX idx_source (source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Journal Entry Lines (Debits and Credits)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id VARCHAR(36) PRIMARY KEY,
    journal_entry_id VARCHAR(36) NOT NULL,
    account_id VARCHAR(36) NOT NULL,
    debit_amount DECIMAL(15, 2) DEFAULT 0.00,
    credit_amount DECIMAL(15, 2) DEFAULT 0.00,
    memo VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    INDEX idx_account_lines (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Immutable Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    action ENUM('create', 'update', 'delete', 'void', 'reconcile', 'lock_books') NOT NULL,
    before_state JSON NULL,
    after_state JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_audit_lookup (organization_id, entity_type, entity_id),
    INDEX idx_audit_created (organization_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
