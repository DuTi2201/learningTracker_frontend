const Goal = require('../models/goal');

// Get all goals
exports.getAllGoals = async (req, res) => {
  try {
    const goals = await Goal.getAll();
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single goal by ID
exports.getGoalById = async (req, res) => {
  try {
    const goal = await Goal.getById(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new goal
exports.createGoal = async (req, res) => {
  try {
    const goal = await Goal.create(req.body);
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a goal
exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.update(req.params.id, req.body);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a goal
exports.deleteGoal = async (req, res) => {
  try {
    await Goal.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 