const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

// GET /api/materials
router.get('/', materialController.getAllMaterials);

// GET /api/materials/:id
router.get('/:id', materialController.getMaterialById);

// POST /api/materials
router.post('/', materialController.createMaterial);

// PUT /api/materials/:id
router.put('/:id', materialController.updateMaterial);

// DELETE /api/materials/:id
router.delete('/:id', materialController.deleteMaterial);

module.exports = router; 