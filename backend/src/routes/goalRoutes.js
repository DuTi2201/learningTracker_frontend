const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');

// GET /api/goals
router.get('/', goalController.getAllGoals);

// GET /api/goals/:id
router.get('/:id', goalController.getGoalById);

// POST /api/goals
router.post('/', goalController.createGoal);

// PUT /api/goals/:id
router.put('/:id', goalController.updateGoal);

// DELETE /api/goals/:id
router.delete('/:id', goalController.deleteGoal);

module.exports = router; 