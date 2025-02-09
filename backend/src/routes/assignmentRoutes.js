const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');

// GET /api/assignments
router.get('/', assignmentController.getAllAssignments);

// GET /api/assignments/:id
router.get('/:id', assignmentController.getAssignmentById);

// POST /api/assignments
router.post('/', assignmentController.createAssignment);

// PUT /api/assignments/:id
router.put('/:id', assignmentController.updateAssignment);

// DELETE /api/assignments/:id
router.delete('/:id', assignmentController.deleteAssignment);

module.exports = router; 