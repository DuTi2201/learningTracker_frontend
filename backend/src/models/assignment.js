const db = require('../config/database');

class Assignment {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT a.*, GROUP_CONCAT(m.id) as material_ids
        FROM assignments a
        LEFT JOIN assignment_materials am ON a.id = am.assignment_id
        LEFT JOIN materials m ON am.material_id = m.id
        GROUP BY a.id
      `, [], async (err, rows) => {
        if (err) reject(err);
        
        // Fetch materials for each assignment
        const assignments = await Promise.all(rows.map(async (assignment) => {
          const materials = assignment.material_ids 
            ? await this.getAssignmentMaterials(assignment.id)
            : [];
          return {
            ...assignment,
            materials,
            material_ids: undefined
          };
        }));
        
        resolve(assignments);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT a.*, GROUP_CONCAT(m.id) as material_ids
        FROM assignments a
        LEFT JOIN assignment_materials am ON a.id = am.assignment_id
        LEFT JOIN materials m ON am.material_id = m.id
        WHERE a.id = ?
        GROUP BY a.id
      `, [id], async (err, assignment) => {
        if (err) reject(err);
        if (!assignment) resolve(null);
        
        const materials = assignment.material_ids 
          ? await this.getAssignmentMaterials(assignment.id)
          : [];
        
        resolve({
          ...assignment,
          materials,
          material_ids: undefined
        });
      });
    });
  }

  static getAssignmentMaterials(assignmentId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT m.*
        FROM materials m
        JOIN assignment_materials am ON m.id = am.material_id
        WHERE am.assignment_id = ?
      `, [assignmentId], (err, materials) => {
        if (err) reject(err);
        resolve(materials);
      });
    });
  }

  static create(assignment) {
    return new Promise((resolve, reject) => {
      const { title, description, deadline, status, notes, materials } = assignment;
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(
          'INSERT INTO assignments (title, description, deadline, status, notes) VALUES (?, ?, ?, ?, ?)',
          [title, description, deadline, status, notes],
          async function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            const assignmentId = this.lastID;
            
            if (materials && materials.length > 0) {
              const stmt = db.prepare('INSERT INTO assignment_materials (assignment_id, material_id) VALUES (?, ?)');
              for (const material of materials) {
                stmt.run([assignmentId, material.id], (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return reject(err);
                  }
                });
              }
              stmt.finalize();
            }
            
            db.run('COMMIT');
            resolve({ id: assignmentId, ...assignment });
          }
        );
      });
    });
  }

  static update(id, assignment) {
    return new Promise((resolve, reject) => {
      const { title, description, deadline, status, notes, materials } = assignment;
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(
          'UPDATE assignments SET title = ?, description = ?, deadline = ?, status = ?, notes = ? WHERE id = ?',
          [title, description, deadline, status, notes, id],
          async function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            // Delete existing material associations
            db.run('DELETE FROM assignment_materials WHERE assignment_id = ?', [id], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }
              
              // Add new material associations
              if (materials && materials.length > 0) {
                const stmt = db.prepare('INSERT INTO assignment_materials (assignment_id, material_id) VALUES (?, ?)');
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
              resolve({ id, ...assignment });
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
        db.run('DELETE FROM assignment_materials WHERE assignment_id = ?', [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          
          // Then delete the assignment
          db.run('DELETE FROM assignments WHERE id = ?', [id], (err) => {
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

module.exports = Assignment; 