const db = require('./db');

let managedServicesReady = false;
let managedServicesPromise = null;

async function ensureManagedServicesTable() {
  if (managedServicesReady || db.isMockMode()) {
    managedServicesReady = true;
    return true;
  }

  if (managedServicesPromise) {
    return managedServicesPromise;
  }

  managedServicesPromise = (async () => {
    try {
      await db.query(`
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
        ) ENGINE=InnoDB
      `);
      managedServicesReady = true;
      return true;
    } catch (err) {
      console.warn('[GovService-BD] Could not ensure managed_services table:', err.message);
      return false;
    } finally {
      managedServicesPromise = null;
    }
  })();

  return managedServicesPromise;
}

module.exports = {
  ensureManagedServicesTable,
};
