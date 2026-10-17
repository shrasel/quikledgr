-- ==============================================================================
-- Migration 004: Phase 2 — Quotes, Recurring Invoicing & Accounts Receivable (AR)
-- ==============================================================================

-- 1. Quotes & Proposals Table
CREATE TABLE IF NOT EXISTS quotes (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    quote_number VARCHAR(50) NOT NULL,
    client_id VARCHAR(36) NULL,
    client_name VARCHAR(150) NOT NULL,
    client_email VARCHAR(150) NULL,
    client_address TEXT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    subtotal DECIMAL(15, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    total DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('draft', 'sent', 'approved', 'declined', 'converted', 'expired') DEFAULT 'draft',
    converted_invoice_id VARCHAR(36) NULL,
    signature_data_url LONGTEXT NULL,
    signed_at DATETIME NULL,
    signed_by_name VARCHAR(150) NULL,
    notes TEXT NULL,
    terms TEXT NULL,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY uk_org_quote_num (organization_id, quote_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Quote Line Items Table
CREATE TABLE IF NOT EXISTS quote_items (
    id VARCHAR(36) PRIMARY KEY,
    quote_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1.00,
    rate DECIMAL(15, 2) DEFAULT 0.00,
    amount DECIMAL(15, 2) DEFAULT 0.00,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Recurring Invoicing Profiles (Retainers & Subscriptions)
CREATE TABLE IF NOT EXISTS recurring_profiles (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    profile_name VARCHAR(150) NOT NULL,
    client_id VARCHAR(36) NULL,
    client_name VARCHAR(150) NOT NULL,
    client_email VARCHAR(150) NULL,
    frequency ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NULL,
    next_issue_date DATE NOT NULL,
    auto_send BOOLEAN DEFAULT FALSE,
    currency VARCHAR(10) DEFAULT 'USD',
    total DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('active', 'paused', 'completed') DEFAULT 'active',
    template_payload JSON NOT NULL,
    last_generated_at DATETIME NULL,
    generation_count INT DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Dunning Rules & Late Fee Configuration
CREATE TABLE IF NOT EXISTS dunning_rules (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    days_past_due INT NOT NULL,
    action_type ENUM('email_reminder', 'late_fee', 'suspend_notice') DEFAULT 'email_reminder',
    late_fee_type ENUM('percentage', 'flat') DEFAULT 'flat',
    late_fee_amount DECIMAL(10, 2) DEFAULT 0.00,
    email_subject VARCHAR(200) NULL,
    email_template TEXT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Widen action and category for Phase 2 workflows
ALTER TABLE audit_logs MODIFY COLUMN action VARCHAR(50) NOT NULL;
ALTER TABLE invoice_items MODIFY COLUMN category VARCHAR(50) DEFAULT 'consulting';

