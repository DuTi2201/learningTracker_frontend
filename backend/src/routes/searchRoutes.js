const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// GET /api/search
router.get('/', searchController.search);

// GET /api/search/history
router.get('/history', searchController.getSearchHistory);

module.exports = router; 