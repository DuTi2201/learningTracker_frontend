const Material = require('../models/material');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Get all materials
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.getAll();
    res.json(materials);
  } catch (error) {
    console.error('Error getting materials:', error);
    res.status(500).json({ 
      error: 'Failed to fetch materials',
      message: error.message 
    });
  }
};

// Get a single material by ID
exports.getMaterialById = async (req, res) => {
  try {
    const material = await Material.getById(req.params.id);
    if (!material) {
      return res.status(404).json({ 
        error: 'Material not found',
        message: 'The requested material does not exist'
      });
    }
    res.json(material);
  } catch (error) {
    console.error('Error getting material:', error);
    res.status(500).json({ 
      error: 'Failed to fetch material',
      message: error.message 
    });
  }
};

// Create a new material
exports.createMaterial = async (req, res) => {
  try {
    // Validate required fields
    const { title, type, link } = req.body;
    if (!title || !type || !link) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, type, and link are required'
      });
    }

    // Validate type
    if (!['file', 'link'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid type',
        message: 'Type must be either "file" or "link"'
      });
    }

    const material = {
      id: uuidv4(),
      ...req.body,
      date: new Date().toISOString().split('T')[0]
    };

    const createdMaterial = await Material.create(material);
    res.status(201).json(createdMaterial);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ 
      error: 'Failed to create material',
      message: error.message 
    });
  }
};

// Update a material
exports.updateMaterial = async (req, res) => {
  try {
    // Validate required fields
    const { title, type, link } = req.body;
    if (!title || !type || !link) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, type, and link are required'
      });
    }

    // Validate type
    if (!['file', 'link'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid type',
        message: 'Type must be either "file" or "link"'
      });
    }

    const material = await Material.update(req.params.id, req.body);
    res.json(material);
  } catch (error) {
    if (error.message === 'Material not found') {
      return res.status(404).json({ 
        error: 'Material not found',
        message: 'The material you are trying to update does not exist'
      });
    }
    console.error('Error updating material:', error);
    res.status(500).json({ 
      error: 'Failed to update material',
      message: error.message 
    });
  }
};

// Delete a material
exports.deleteMaterial = async (req, res) => {
  try {
    await Material.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error.message === 'Material not found') {
      return res.status(404).json({ 
        error: 'Material not found',
        message: 'The material you are trying to delete does not exist'
      });
    }
    console.error('Error deleting material:', error);
    res.status(500).json({ 
      error: 'Failed to delete material',
      message: error.message 
    });
  }
}; 