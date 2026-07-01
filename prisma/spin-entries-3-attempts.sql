-- Migration: spin_entries — add 3-attempt logic columns
-- Run against Turso production DB

ALTER TABLE spin_entries ADD COLUMN attemptCount INTEGER NOT NULL DEFAULT 1;
ALTER TABLE spin_entries ADD COLUMN lastAttemptAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
