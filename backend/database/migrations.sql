-- GovService BD Safe Incremental Migration Script
-- Run this on an existing `govservice_db` database to add missing columns/tables
-- without dropping tables or deleting existing records.

USE govservice_db;

-- 1. Ensure `is_active` and `updated_at` exist on `users`
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'govservice_db' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role',
  'SELECT "users.is_active already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Create `user_profiles` table if missing
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  nid_number VARCHAR(50) NULL,
  date_of_birth DATE NULL,
  father_name VARCHAR(150) NULL,
  mother_name VARCHAR(150) NULL,
  gender VARCHAR(30) NULL,
  marital_status VARCHAR(30) NULL,
  occupation VARCHAR(100) NULL,
  present_address JSON NULL,
  permanent_address JSON NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Add `file_size` and `mime_type` to `personal_documents` if missing
SET @col_size := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'govservice_db' AND TABLE_NAME = 'personal_documents' AND COLUMN_NAME = 'file_size'
);
SET @sql := IF(@col_size = 0,
  'ALTER TABLE personal_documents ADD COLUMN file_size INT NULL AFTER file_path',
  'SELECT "personal_documents.file_size already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_mime := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'govservice_db' AND TABLE_NAME = 'personal_documents' AND COLUMN_NAME = 'mime_type'
);
SET @sql := IF(@col_mime = 0,
  'ALTER TABLE personal_documents ADD COLUMN mime_type VARCHAR(120) NULL AFTER file_size',
  'SELECT "personal_documents.mime_type already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Add `status`, `admin_response`, `updated_at` to `feedback_reports` if missing
SET @col_status := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'govservice_db' AND TABLE_NAME = 'feedback_reports' AND COLUMN_NAME = 'status'
);
SET @sql := IF(@col_status = 0,
  'ALTER TABLE feedback_reports ADD COLUMN status ENUM("pending", "reviewed", "resolved") NOT NULL DEFAULT "pending" AFTER message',
  'SELECT "feedback_reports.status already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_resp := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'govservice_db' AND TABLE_NAME = 'feedback_reports' AND COLUMN_NAME = 'admin_response'
);
SET @sql := IF(@col_resp = 0,
  'ALTER TABLE feedback_reports ADD COLUMN admin_response TEXT NULL AFTER status',
  'SELECT "feedback_reports.admin_response already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_upd := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'govservice_db' AND TABLE_NAME = 'feedback_reports' AND COLUMN_NAME = 'updated_at'
);
SET @sql := IF(@col_upd = 0,
  'ALTER TABLE feedback_reports ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
  'SELECT "feedback_reports.updated_at already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Create `managed_services` table if missing
CREATE TABLE IF NOT EXISTS managed_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_key VARCHAR(120) NOT NULL UNIQUE,
  category_id VARCHAR(100) NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  overview TEXT NULL,
  estimated_cost VARCHAR(255) NULL,
  processing_time VARCHAR(255) NULL,
  relevant_office VARCHAR(255) NULL,
  required_documents JSON NULL,
  application_steps JSON NULL,
  official_link VARCHAR(500) NULL,
  office_information TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_managed_services_category (category_id)
) ENGINE=InnoDB;
