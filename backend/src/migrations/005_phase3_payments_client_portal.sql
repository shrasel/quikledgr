-- ==============================================================================
-- Migration 005: Phase 3 — Client Portal, Embedded Payments & Installment Engine
-- ==============================================================================

-- 1. Extend Invoices for Partial Payments & Balance Tracking
ALTER TABLE invoices 
    ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15, 2) DEFAULT 0.00 AFTER total,
    ADD COLUMN IF NOT EXISTS balance_due DECIMAL(15, 2) DEFAULT 0.00 AFTER amount_paid;

-- Ensure existing invoices have balance_due set to total (or 0 if already marked paid)
UPDATE invoices SET balance_due = total - amount_paid WHERE balance_due = 0 AND status != 'paid';
UPDATE invoices SET balance_due = 0.00, amount_paid = total WHERE status = 'paid';

-- Widen Invoice Status to support partially_paid and cancelled
ALTER TABLE invoices 
    MODIFY COLUMN status ENUM('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled') DEFAULT 'draft';

-- 2. Extend Organizations for Payment Processing & Portal Settings
ALTER TABLE organizations 
    ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(100) NULL AFTER books_locked_until,
    ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT FALSE AFTER stripe_account_id,
    ADD COLUMN IF NOT EXISTS pass_processing_fee BOOLEAN DEFAULT FALSE AFTER stripe_enabled,
    ADD COLUMN IF NOT EXISTS allow_partial_payments BOOLEAN DEFAULT TRUE AFTER pass_processing_fee,
    ADD COLUMN IF NOT EXISTS portal_banner_text TEXT NULL AFTER allow_partial_payments;

-- 3. Payments Ledger Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    invoice_id VARCHAR(36) NOT NULL,
    payment_number VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    surcharge_fee DECIMAL(10, 2) DEFAULT 0.00,
    net_amount DECIMAL(15, 2) NOT NULL,
    payment_method ENUM('stripe_card', 'ach_debit', 'wire_transfer', 'check', 'cash', 'other') DEFAULT 'stripe_card',
    reference_number VARCHAR(100) NULL,
    status ENUM('pending', 'succeeded', 'failed', 'refunded') DEFAULT 'succeeded',
    notes TEXT NULL,
    receipt_url VARCHAR(255) NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_pay_org (organization_id),
    INDEX idx_pay_inv (invoice_id),
    INDEX idx_pay_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Zero-Login Client Portal Magic Tokens
CREATE TABLE IF NOT EXISTS client_portal_tokens (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    client_email VARCHAR(191) NOT NULL,
    client_name VARCHAR(150) NOT NULL,
    magic_token VARCHAR(128) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    last_accessed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_portal_lookup (magic_token),
    INDEX idx_portal_client (organization_id, client_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Invoice Installments / Milestone Schedule
CREATE TABLE IF NOT EXISTS invoice_installments (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    percentage DECIMAL(5, 2) NULL,
    status ENUM('unpaid', 'partially_paid', 'paid') DEFAULT 'unpaid',
    notes VARCHAR(200) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_installment_inv (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Allow null user_id for public client portal and system audit logs
ALTER TABLE audit_logs MODIFY user_id VARCHAR(50) NULL;
