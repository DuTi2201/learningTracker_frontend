const db = require('../config/database');

class Event {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT e.*, GROUP_CONCAT(m.id) as material_ids
        FROM events e
        LEFT JOIN event_materials em ON e.id = em.event_id
        LEFT JOIN materials m ON em.material_id = m.id
        GROUP BY e.id
      `, [], async (err, rows) => {
        if (err) reject(err);
        
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
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT e.*, GROUP_CONCAT(m.id) as material_ids
        FROM events e
        LEFT JOIN event_materials em ON e.id = em.event_id
        LEFT JOIN materials m ON em.material_id = m.id
        WHERE e.id = ?
        GROUP BY e.id
      `, [id], async (err, event) => {
        if (err) reject(err);
        if (!event) resolve(null);
        
        const materials = event.material_ids 
          ? await this.getEventMaterials(event.id)
          : [];
        
        resolve({
          ...event,
          materials,
          material_ids: undefined
        });
      });
    });
  }

  static getEventMaterials(eventId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT m.*
        FROM materials m
        JOIN event_materials em ON m.id = em.material_id
        WHERE em.event_id = ?
      `, [eventId], (err, materials) => {
        if (err) reject(err);
        resolve(materials);
      });
    });
  }

  static create(event) {
    return new Promise((resolve, reject) => {
      const { id, title, description, start, end, instructor, materials } = event;
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(
          'INSERT INTO events (id, title, description, start, end, instructor) VALUES (?, ?, ?, ?, ?, ?)',
          [id, title, description, start, end, instructor],
          async function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            if (materials && materials.length > 0) {
              const stmt = db.prepare('INSERT INTO event_materials (event_id, material_id) VALUES (?, ?)');
              for (const material of materials) {
                stmt.run([id, material.id], (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return reject(err);
                  }
                });
              }
              stmt.finalize();
            }
            
            db.run('COMMIT');
            resolve({ id, ...event });
          }
        );
      });
    });
  }

  static update(id, event) {
    return new Promise((resolve, reject) => {
      const { title, description, start, end, instructor, materials } = event;
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(
          'UPDATE events SET title = ?, description = ?, start = ?, end = ?, instructor = ? WHERE id = ?',
          [title, description, start, end, instructor, id],
          async function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            // Delete existing material associations
            db.run('DELETE FROM event_materials WHERE event_id = ?', [id], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }
              
              // Add new material associations
              if (materials && materials.length > 0) {
                const stmt = db.prepare('INSERT INTO event_materials (event_id, material_id) VALUES (?, ?)');
                for (const material of materials) {
                  stmt.run([id, material.id], (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return reject(err);
                    }
                  });
                }
                stmt.finalize();
              }
              
              db.run('COMMIT');
              resolve({ id, ...event });
            });
          }
        );
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete material associations first
        db.run('DELETE FROM event_materials WHERE event_id = ?', [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          
          // Then delete the event
          db.run('DELETE FROM events WHERE id = ?', [id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
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