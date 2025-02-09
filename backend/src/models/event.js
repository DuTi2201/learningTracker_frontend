const db = require('../config/database');

class Event {
  static validateEvent(event) {
    const errors = [];
    
    // Validate required fields
    if (!event.title) errors.push('Title is required');
    if (!event.start) errors.push('Start time is required');
    if (!event.end) errors.push('End time is required');
    
    // Validate dates
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    if (isNaN(startDate.getTime())) errors.push('Invalid start time format');
    if (isNaN(endDate.getTime())) errors.push('Invalid end time format');
    
    if (startDate >= endDate) {
      errors.push('End time must be after start time');
    }

    return errors;
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT e.*, GROUP_CONCAT(m.id) as material_ids
        FROM events e
        LEFT JOIN event_materials em ON e.id = em.event_id
        LEFT JOIN materials m ON em.material_id = m.id
        GROUP BY e.id
      `, [], async (err, rows) => {
        if (err) {
          console.error('Database error in getAll:', err);
          reject(new Error('Failed to fetch events'));
          return;
        }
        
        try {
          // Fetch materials for each event
          const events = await Promise.all(rows.map(async (event) => {
            const materials = event.material_ids 
              ? await this.getEventMaterials(event.id)
              : [];
            return {
              ...event,
              materials,
              material_ids: undefined
            };
          }));
          
          resolve(events);
        } catch (error) {
          console.error('Error processing events:', error);
          reject(new Error('Failed to process events data'));
        }
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject(new Error('Event ID is required'));
        return;
      }

      db.get(`
        SELECT e.*, GROUP_CONCAT(m.id) as material_ids
        FROM events e
        LEFT JOIN event_materials em ON e.id = em.event_id
        LEFT JOIN materials m ON em.material_id = m.id
        WHERE e.id = ?
        GROUP BY e.id
      `, [id], async (err, event) => {
        if (err) {
          console.error('Database error in getById:', err);
          reject(new Error('Failed to fetch event'));
          return;
        }
        if (!event) {
          resolve(null);
          return;
        }
        
        try {
          const materials = event.material_ids 
            ? await this.getEventMaterials(event.id)
            : [];
          
          resolve({
            ...event,
            materials,
            material_ids: undefined
          });
        } catch (error) {
          console.error('Error processing event:', error);
          reject(new Error('Failed to process event data'));
        }
      });
    });
  }

  static getEventMaterials(eventId) {
    return new Promise((resolve, reject) => {
      if (!eventId) {
        reject(new Error('Event ID is required'));
        return;
      }

      db.all(`
        SELECT m.*
        FROM materials m
        JOIN event_materials em ON m.id = em.material_id
        WHERE em.event_id = ?
      `, [eventId], (err, materials) => {
        if (err) {
          console.error('Database error in getEventMaterials:', err);
          reject(new Error('Failed to fetch event materials'));
          return;
        }
        resolve(materials || []);
      });
    });
  }

  static create(event) {
    return new Promise((resolve, reject) => {
      // Validate event
      const errors = this.validateEvent(event);
      if (errors.length > 0) {
        reject(new Error(errors.join(', ')));
        return;
      }

      const { id, title, description, start, end, instructor, materials } = event;
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(
          'INSERT INTO events (id, title, description, start, end, instructor) VALUES (?, ?, ?, ?, ?, ?)',
          [id, title, description, start, end, instructor],
          async function(err) {
            if (err) {
              console.error('Database error in create:', err);
              db.run('ROLLBACK');
              reject(new Error('Failed to create event'));
              return;
            }
            
            try {
              if (materials && materials.length > 0) {
                const stmt = db.prepare('INSERT INTO event_materials (event_id, material_id) VALUES (?, ?)');
                for (const material of materials) {
                  stmt.run([id, material.id], (err) => {
                    if (err) {
                      console.error('Database error in create materials:', err);
                      db.run('ROLLBACK');
                      reject(new Error('Failed to associate materials with event'));
                      return;
                    }
                  });
                }
                stmt.finalize();
              }
              
              db.run('COMMIT');
              resolve({ id, ...event });
            } catch (error) {
              console.error('Error in create:', error);
              db.run('ROLLBACK');
              reject(new Error('Failed to create event'));
            }
          }
        );
      });
    });
  }

  static update(id, event) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject(new Error('Event ID is required for update'));
        return;
      }

      // Validate event
      const errors = this.validateEvent(event);
      if (errors.length > 0) {
        reject(new Error(errors.join(', ')));
        return;
      }

      const { title, description, start, end, instructor, materials } = event;
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(
          'UPDATE events SET title = ?, description = ?, start = ?, end = ?, instructor = ? WHERE id = ?',
          [title, description, start, end, instructor, id],
          async function(err) {
            if (err) {
              console.error('Database error in update:', err);
              db.run('ROLLBACK');
              reject(new Error('Failed to update event'));
              return;
            }
            
            if (this.changes === 0) {
              db.run('ROLLBACK');
              reject(new Error('Event not found'));
              return;
            }

            try {
              // Delete existing material associations
              await new Promise((resolve, reject) => {
                db.run('DELETE FROM event_materials WHERE event_id = ?', [id], (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
              
              // Add new material associations
              if (materials && materials.length > 0) {
                const stmt = db.prepare('INSERT INTO event_materials (event_id, material_id) VALUES (?, ?)');
                for (const material of materials) {
                  await new Promise((resolve, reject) => {
                    stmt.run([id, material.id], (err) => {
                      if (err) reject(err);
                      else resolve();
                    });
                  });
                }
                stmt.finalize();
              }
              
              db.run('COMMIT');
              resolve({ id, ...event });
            } catch (error) {
              console.error('Error in update:', error);
              db.run('ROLLBACK');
              reject(new Error('Failed to update event materials'));
            }
          }
        );
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject(new Error('Event ID is required for deletion'));
        return;
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete material associations first
        db.run('DELETE FROM event_materials WHERE event_id = ?', [id], (err) => {
          if (err) {
            console.error('Database error in delete materials:', err);
            db.run('ROLLBACK');
            reject(new Error('Failed to delete event materials'));
            return;
          }
          
          // Then delete the event
          db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
            if (err) {
              console.error('Database error in delete:', err);
              db.run('ROLLBACK');
              reject(new Error('Failed to delete event'));
              return;
            }
            
            if (this.changes === 0) {
              db.run('ROLLBACK');
              reject(new Error('Event not found'));
              return;
            }
            
            db.run('COMMIT');
            resolve();
          });
        });
      });
    });
  }
}

module.exports = Event; 