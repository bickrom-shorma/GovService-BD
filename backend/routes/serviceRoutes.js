const express = require('express');
const db = require('../config/db');

const router = express.Router();

const servicesMod = require('../../frontend/src/data/services');
const servicesData = servicesMod.default || servicesMod;

let serviceDetailsData = {};
try {
  const detailsMod = require('../../frontend/src/data/serviceDetailsData');
  serviceDetailsData = detailsMod.default || detailsMod;
} catch (error) {
  console.warn('[GovService-BD] Could not load serviceDetailsData:', error.message);
}

function parseJsonField(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

async function getMergedCatalog() {
  const categoriesMap = {};

  Object.entries(servicesData).forEach(([categoryId, category]) => {
    categoriesMap[categoryId] = {
      categoryId,
      categoryName: category.title,
      services: category.services.map((serviceName, index) => ({
        id: `${categoryId}-${index}`,
        serviceIndex: index,
        serviceName,
      })),
    };
  });

  try {
    const [managed] = await db.query(
      'SELECT * FROM managed_services WHERE is_active = 1'
    );

    managed.forEach((row) => {
      if (!categoriesMap[row.category_id]) {
        categoriesMap[row.category_id] = {
          categoryId: row.category_id,
          categoryName: row.category_name,
          services: [],
        };
      }

      const list = categoriesMap[row.category_id].services;
      const existingIdx = list.findIndex((s) => s.id === row.service_key);
      if (existingIdx !== -1) {
        list[existingIdx].serviceName = row.service_name;
      } else {
        list.push({
          id: row.service_key,
          serviceIndex: list.length,
          serviceName: row.service_name,
          isManaged: true,
        });
      }
    });
  } catch (err) {
    console.warn('[GovService-BD] Managed services lookup skipped:', err.message);
  }

  return categoriesMap;
}

// GET: All categories and services
router.get('/', async (req, res) => {
  try {
    const categoriesMap = await getMergedCatalog();
    const categories = Object.values(categoriesMap);

    return res.status(200).json({
      success: true,
      totalCategories: categories.length,
      totalServices: categories.reduce(
        (total, category) => total + category.services.length,
        0
      ),
      data: categories,
    });
  } catch (error) {
    console.error('Get services error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve services.',
    });
  }
});

// GET: Services by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const categoriesMap = await getMergedCatalog();
    const category = categoriesMap[categoryId];

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Service category not found.',
      });
    }

    return res.status(200).json({
      success: true,
      categoryId,
      categoryName: category.categoryName,
      totalServices: category.services.length,
      data: category.services,
    });
  } catch (error) {
    console.error('Get category services error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve category services.',
    });
  }
});

// GET: Single service details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check database-managed services first (override or custom service)
    try {
      const [managedRows] = await db.query(
        'SELECT * FROM managed_services WHERE service_key = ?',
        [id]
      );

      if (managedRows.length > 0 && managedRows[0].is_active === 1) {
        const row = managedRows[0];
        return res.status(200).json({
          success: true,
          data: {
            id: row.service_key,
            categoryId: row.category_id,
            categoryName: row.category_name,
            serviceName: row.service_name,
            overview: row.overview,
            estimatedCost: row.estimated_cost,
            processingTime: row.processing_time,
            relevantOffice: row.relevant_office,
            requiredDocuments: parseJsonField(row.required_documents, []),
            applicationSteps: parseJsonField(row.application_steps, { online: [], offline: [] }),
            officialLink: row.official_link,
            officeInformation: row.office_information,
          },
        });
      }
    } catch (err) {
      console.warn('[GovService-BD] Managed service detail lookup skipped:', err.message);
    }

    const lastDash = id.lastIndexOf('-');
    const categoryId = lastDash > 0 ? id.substring(0, lastDash) : '';
    const serviceIndex = lastDash > 0 ? Number(id.substring(lastDash + 1)) : -1;

    const category = servicesData[categoryId];
    const serviceName = category?.services?.[serviceIndex];

    if (!category || !serviceName) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    const serviceDetails = serviceDetailsData[id] || null;

    return res.status(200).json({
      success: true,
      data: {
        id,
        categoryId,
        categoryName: category.title,
        serviceName,
        ...(serviceDetails || {}),
      },
    });
  } catch (error) {
    console.error('Get service details error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve service details.',
    });
  }
});

module.exports = router;
