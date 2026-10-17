-- Migration: 001_create_schema.sql
-- QuikLedgr — Relational MariaDB Schema for Consulting Invoicing System

-- 1. Users table (Consultants)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    business_name VARCHAR(200) NULL,
    provider ENUM('email', 'google') DEFAULT 'email',
    role VARCHAR(50) DEFAULT 'consultant',
    avatar_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User Profiles & Saved Consultant Wire Settings
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,
    address VARCHAR(255) NULL,
    city_state_zip VARCHAR(100) NULL,
    country VARCHAR(100) DEFAULT 'United States',
    tax_id VARCHAR(100) NULL,
    default_wire_details JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Clients Directory (e.g. Blukers, Inc.)
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(150) NULL,
    email VARCHAR(191) NOT NULL,
    cc_email VARCHAR(191) NULL,
    address VARCHAR(255) NULL,
    city_state_zip VARCHAR(100) NULL,
    country VARCHAR(100) DEFAULT 'United States',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_client_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) NULL,
    client_name VARCHAR(150) NOT NULL,
    client_email VARCHAR(191) NOT NULL,
    client_cc_email VARCHAR(191) NULL,
    client_address TEXT NULL,
    status ENUM('draft', 'sent', 'paid', 'overdue') DEFAULT 'draft',
    currency VARCHAR(10) DEFAULT 'USD',
    currency_symbol VARCHAR(5) DEFAULT '$',
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    service_period VARCHAR(150) NOT NULL,
    service_start_date DATE NULL,
    service_end_date DATE NULL,
    payment_terms VARCHAR(255) DEFAULT 'Payment due on or before the 15th of the month',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    additional_charges_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    agreement_compliance_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_invoice_user (user_id),
    INDEX idx_invoice_status (status),
    INDEX idx_invoice_due (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('consulting', 'additional_charge', 'deliverable') DEFAULT 'consulting',
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_items_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Pre-Approved Additional Charges
CREATE TABLE IF NOT EXISTS invoice_additional_charges (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_charges_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Invoice Security & Access Passcode
CREATE TABLE IF NOT EXISTS invoice_security (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL UNIQUE,
    access_pin_hash VARCHAR(255) NOT NULL,
    access_pin_salt VARCHAR(64) NOT NULL,
    passcode_hint VARCHAR(255) NULL,
    failed_attempts INT DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Sensitive Wire Transfer Banking Details
CREATE TABLE IF NOT EXISTS invoice_wire_details (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL UNIQUE,
    account_holder_name VARCHAR(150) NOT NULL,
    bank_name VARCHAR(150) NOT NULL,
    bank_address VARCHAR(255) NULL,
    account_number_or_iban VARCHAR(100) NOT NULL,
    swift_bic_code VARCHAR(50) NOT NULL,
    routing_aba VARCHAR(50) NULL,
    ach_routing VARCHAR(50) NULL,
    wire_reference VARCHAR(150) NULL,
    payment_instructions TEXT NULL,
    encrypted_payload TEXT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- Production Ready Schema: Clean installation (0 demo data or test invoices)
-- -----------------------------------------------------------------------------

