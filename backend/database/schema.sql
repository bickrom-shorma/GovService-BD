-- GovService BD MySQL Database Schema
-- Database: govservice_db
-- Safe, non-destructive schema definition

CREATE DATABASE IF NOT EXISTS govservice_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE govservice_db;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- 2. User extended profile table (non-destructive extension of users)
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

-- 3. Personal documents table
CREATE TABLE IF NOT EXISTS personal_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NULL,
  mime_type VARCHAR(120) NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_personal_documents_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_personal_documents_user (user_id)
) ENGINE=InnoDB;

-- 4. Saved services table
CREATE TABLE IF NOT EXISTS saved_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  service_key VARCHAR(120) NOT NULL,
  category_id VARCHAR(100) NULL,
  service_index INT NULL,
  service_name VARCHAR(255) NOT NULL,
  category_name VARCHAR(255) NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_saved_services_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_user_service (user_id, service_key),
  INDEX idx_saved_services_user (user_id)
) ENGINE=InnoDB;

-- 5. Document checklists table
CREATE TABLE IF NOT EXISTS document_checklists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  service_key VARCHAR(120) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  is_completed TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_document_checklists_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_user_service_doc (user_id, service_key, document_name(180)),
  INDEX idx_document_checklists_user_service (user_id, service_key)
) ENGINE=InnoDB;

-- 6. Feedback & reports table
CREATE TABLE IF NOT EXISTS feedback_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  feedback_type VARCHAR(80) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending', 'reviewed', 'resolved') NOT NULL DEFAULT 'pending',
  admin_response TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_reports_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_feedback_reports_user (user_id),
  INDEX idx_feedback_reports_status (status)
) ENGINE=InnoDB;

-- 7. Managed / custom government services table (for Admin Service Management)
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
