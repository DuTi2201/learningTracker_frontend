const Event = require('../models/Event');
const { v4: uuidv4 } = require('uuid');

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.getAll();
    res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch events',
      message: error.message 
    });
  }
};

// Get a single event by ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.getById(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The requested event does not exist'
      });
    }
    res.json(event);
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(500).json({ 
      error: 'Failed to fetch event',
      message: error.message 
    });
  }
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    // Validate required fields
    const { title, start, end } = req.body;
    if (!title || !start || !end) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, start time, and end time are required'
      });
    }

    // Validate dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Start time and end time must be valid dates'
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'Invalid time range',
        message: 'End time must be after start time'
      });
    }

    const event = {
      id: uuidv4(),
      ...req.body
    };

    const createdEvent = await Event.create(event);
    res.status(201).json(createdEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      error: 'Failed to create event',
      message: error.message 
    });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  try {
    // Validate required fields
    const { title, start, end } = req.body;
    if (!title || !start || !end) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, start time, and end time are required'
      });
    }

    // Validate dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Start time and end time must be valid dates'
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'Invalid time range',
        message: 'End time must be after start time'
      });
    }

    const event = await Event.update(req.params.id, req.body);
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    if (error.message === 'Event not found') {
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The event you are trying to update does not exist'
      });
    }
    res.status(500).json({ 
      error: 'Failed to update event',
      message: error.message 
    });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    await Event.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    if (error.message === 'Event not found') {
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The event you are trying to delete does not exist'
      });
    }
    res.status(500).json({ 
      error: 'Failed to delete event',
      message: error.message 
    });
  }
}; 