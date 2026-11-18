
const express = require('express');

const router = express.Router();

const servicesData = require('../../frontend/src/data/services');
const serviceDetailsData = require('../data/serviceDetailsData');

// GET: All categories and services
router.get('/', (req, res) => {
  try {
    const categories = Object.entries(servicesData).map(
      ([categoryId, category]) => ({
        categoryId,
        categoryName: category.title,
        services: category.services.map((serviceName, index) => ({
          id: `${categoryId}-${index}`,
          serviceName,
        })),
      })
    );

    res.status(200).json({
      success: true,
      totalCategories: categories.length,
      totalServices: categories.reduce(
        (total, category) => total + category.services.length,
        0
      ),
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve services.',
    });
  }
});

// GET: Services by category
router.get('/category/:categoryId', (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = servicesData[categoryId];

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Service category not found.',
      });
    }

    const services = category.services.map((serviceName, index) => ({
      id: `${categoryId}-${index}`,
      serviceName,
    }));

    res.status(200).json({
      success: true,
      categoryId,
      categoryName: category.title,
      totalServices: services.length,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category services.',
    });
  }
});

// GET: Single service details
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const serviceDetails = serviceDetailsData[id];

    if (!serviceDetails) {
      return res.status(404).json({
        success: false,
        message: 'Service details not found.',
      });
    }

    const categoryId = id.substring(0, id.lastIndexOf('-'));
    const serviceIndex = Number(id.substring(id.lastIndexOf('-') + 1));

    const category = servicesData[categoryId];

    if (!category || !category.services[serviceIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id,
        categoryId,
        categoryName: category.title,
        serviceName: category.services[serviceIndex],
        ...serviceDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve service details.',
    });
  }
});

module.exports = router;
