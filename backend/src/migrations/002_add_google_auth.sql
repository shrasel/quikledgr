-- Migration: 002_add_google_auth.sql
-- Add Google OAuth sub ID and email verification status to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) NULL UNIQUE AFTER email,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE AFTER google_id;
