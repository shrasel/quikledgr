-- Migration: 007_onboarding_setup.sql
-- Onboarding & Initial Setup settings for Organizations (QuickBooks style setup)

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS user_role VARCHAR(100) NULL AFTER legal_name,
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100) NULL AFTER user_role,
ADD COLUMN IF NOT EXISTS industry VARCHAR(150) NULL AFTER business_type,
ADD COLUMN IF NOT EXISTS annual_revenue VARCHAR(100) NULL AFTER industry,
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150) NULL AFTER annual_revenue,
ADD COLUMN IF NOT EXISTS bank_account_last4 VARCHAR(10) NULL AFTER bank_name,
ADD COLUMN IF NOT EXISTS is_bank_connected BOOLEAN DEFAULT FALSE AFTER bank_account_last4,
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE AFTER is_bank_connected;
