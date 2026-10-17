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
-- SEED INITIAL DATA: Demo Consultant User, Profiles, and Sample Invoices
-- -----------------------------------------------------------------------------

-- Demo User: Alexander Wright (Password: demoPassword123)
-- bcrypt hash for demoPassword123: $2a$10$7v1i7s0aE98jZfE5h1W/dO8h5eL2n9f3z1m4k6j8g9h0i1j2k3l4
INSERT IGNORE INTO users (id, name, email, password_hash, business_name, provider, role, avatar_url)
VALUES (
    'usr_blukers_alex',
    'Alexander Wright',
    'alex@wrightsolutions.io',
    '$2a$10$rQOQ28qI6eN7jTzO7dG99eFvFjKqS9eEwWbXgA3dF1kL6mOpQ2rSt',
    'Wright Advisory & Solutions LLC',
    'email',
    'consultant',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'
);

-- Demo Consultant Profile & Default Banking
INSERT IGNORE INTO user_profiles (id, user_id, phone, address, city_state_zip, country, tax_id, default_wire_details)
VALUES (
    'prof_alex',
    'usr_blukers_alex',
    '+1 (555) 234-5678',
    '100 Innovation Way, Suite 400',
    'San Francisco, CA 94105',
    'United States',
    'XX-XXX4920',
    '{
        "accountHolderName": "Wright Advisory & Solutions LLC",
        "bankName": "JPMorgan Chase Bank, N.A.",
        "bankAddress": "270 Park Avenue, New York, NY 10017, USA",
        "accountNumberOrIban": "984729104829",
        "swiftBicCode": "CHASUS33XXX",
        "routingAba": "021000021 (Wire / Fedwire)",
        "achRouting": "121000248 (ACH Direct Deposit)",
        "paymentInstructions": "Please route wire transfer to JPMorgan Chase Bank. Ensure Wire Reference is noted in the memo."
    }'
);

-- Demo Client: Blukers, Inc.
INSERT IGNORE INTO clients (id, user_id, company_name, contact_name, email, cc_email, address, city_state_zip, country)
VALUES (
    'client_blukers',
    'usr_blukers_alex',
    'Blukers, Inc.',
    'Accounting Department / Rosa',
    'accounting@blukers.com',
    'rosa@blukers.com',
    'Blukers Corporate Headquarters',
    'Miami, FL 33131',
    'United States'
);

-- Sample Invoice 1 (Sent)
INSERT IGNORE INTO invoices (id, invoice_number, user_id, client_id, client_name, client_email, client_cc_email, status, currency, invoice_date, due_date, service_period, subtotal, additional_charges_total, total, notes, agreement_compliance_note)
VALUES (
    'BLK-2026-10-001',
    'BLK-2026-10-001',
    'usr_blukers_alex',
    'client_blukers',
    'Blukers, Inc.',
    'accounting@blukers.com',
    'rosa@blukers.com',
    'sent',
    'USD',
    '2026-10-01',
    '2026-10-15',
    'September 1 – September 30, 2026',
    15200.00,
    320.00,
    15520.00,
    'Consulting services for September 2026.',
    'Submitted in accordance with Consulting Agreement. Invoices sent to accounting@blukers.com (cc: rosa@blukers.com).'
);

-- Sample Invoice 1 Items
INSERT IGNORE INTO invoice_items (id, invoice_id, description, category, quantity, rate, amount)
VALUES (
    'item_1_1',
    'BLK-2026-10-001',
    'Strategic Technical Consulting & Architecture Execution - 160 hrs',
    'consulting',
    160.00,
    95.00,
    15200.00
);

INSERT IGNORE INTO invoice_additional_charges (id, invoice_id, description, amount)
VALUES (
    'chg_1_1',
    'BLK-2026-10-001',
    'Pre-Approved Cloud Infrastructure & Tooling Reimbursables',
    320.00
);

-- Sample Invoice 1 Security (PIN: 482910)
INSERT IGNORE INTO invoice_security (id, invoice_id, access_pin_hash, access_pin_salt, passcode_hint)
VALUES (
    'sec_1',
    'BLK-2026-10-001',
    '$2a$10$eE0mC1yS5x.yE6kH8r0F2eG.zP8k9jL3m2n1o0p9q8r7s6t5u4v3w',
    'blukers_salt_2026',
    'Enter your 6-digit access PIN provided in email.'
);

-- Sample Invoice 1 Wire Details
INSERT IGNORE INTO invoice_wire_details (id, invoice_id, account_holder_name, bank_name, bank_address, account_number_or_iban, swift_bic_code, routing_aba, ach_routing, wire_reference, payment_instructions)
VALUES (
    'wire_1',
    'BLK-2026-10-001',
    'Wright Advisory & Solutions LLC',
    'JPMorgan Chase Bank, N.A.',
    '270 Park Avenue, New York, NY 10017, USA',
    '984729104829',
    'CHASUS33XXX',
    '021000021 (Wire / Fedwire)',
    '121000248 (ACH Direct Deposit)',
    'INV-BLK-2026-10 - Alexander Wright',
    'Please route wire transfer to JPMorgan Chase Bank. Note invoice number in description.'
);

-- Sample Invoice 2 (Paid)
INSERT IGNORE INTO invoices (id, invoice_number, user_id, client_id, client_name, client_email, client_cc_email, status, currency, invoice_date, due_date, service_period, subtotal, additional_charges_total, total)
VALUES (
    'BLK-2026-09-002',
    'BLK-2026-09-002',
    'usr_blukers_alex',
    'client_blukers',
    'Blukers, Inc.',
    'accounting@blukers.com',
    'rosa@blukers.com',
    'paid',
    'USD',
    '2026-09-01',
    '2026-09-15',
    'August 1 – August 31, 2026',
    15200.00,
    0.00,
    15200.00
);

-- Sample Invoice 3 (Draft / Not Sent)
INSERT IGNORE INTO invoices (id, invoice_number, user_id, client_id, client_name, client_email, client_cc_email, status, currency, invoice_date, due_date, service_period, subtotal, additional_charges_total, total)
VALUES (
    'BLK-2026-11-004',
    'BLK-2026-11-004',
    'usr_blukers_alex',
    'client_blukers',
    'Blukers, Inc.',
    'accounting@blukers.com',
    'rosa@blukers.com',
    'draft',
    'USD',
    '2026-10-16',
    '2026-11-15',
    'October 1 – October 31, 2026',
    15200.00,
    320.00,
    15520.00
);
