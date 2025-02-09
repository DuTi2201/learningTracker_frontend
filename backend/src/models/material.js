const db = require('../config/database');

class Material {
  static validateMaterial(material) {
    const errors = [];
    
    // Validate required fields
    if (!material.title) errors.push('Title is required');
    if (!material.type) errors.push('Type is required');
    if (!material.link) errors.push('Link is required');
    
    // Validate type
    if (material.type && !['file', 'link'].includes(material.type)) {
      errors.push('Type must be either "file" or "link"');
    }

    return errors;
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM materials ORDER BY date DESC', [], (err, rows) => {
        if (err) {
          console.error('Database error in getAll:', err);
          reject(new Error('Failed to fetch materials'));
          return;
        }
        resolve(rows || []);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject(new Error('ID is required'));
        return;
      }

      db.get('SELECT * FROM materials WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Database error in getById:', err);
          reject(new Error('Failed to fetch material'));
          return;
        }
        resolve(row);
      });
    });
  }

  static create(material) {
    return new Promise((resolve, reject) => {
      // Validate material
      const errors = this.validateMaterial(material);
      if (errors.length > 0) {
        reject(new Error(errors.join(', ')));
        return;
      }

      const { id, title, description, type, link, date } = material;
      
      db.run(
        'INSERT INTO materials (id, title, description, type, link, date) VALUES (?, ?, ?, ?, ?, ?)',
        [id, title, description, type, link, date],
        function(err) {
          if (err) {
            console.error('Database error in create:', err);
            reject(new Error('Failed to create material'));
            return;
          }
          resolve({ id, ...material });
        }
      );
    });
  }

  static update(id, material) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject(new Error('ID is required for update'));
        return;
      }

      // Validate material
      const errors = this.validateMaterial(material);
      if (errors.length > 0) {
        reject(new Error(errors.join(', ')));
        return;
      }

      const { title, description, type, link, date } = material;
      
      db.run(
        'UPDATE materials SET title = ?, description = ?, type = ?, link = ?, date = ? WHERE id = ?',
        [title, description, type, link, date, id],
        function(err) {
          if (err) {
            console.error('Database error in update:', err);
            reject(new Error('Failed to update material'));
            return;
          }
          if (this.changes === 0) {
            reject(new Error('Material not found'));
            return;
          }
          resolve({ id, ...material });
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject(new Error('ID is required for deletion'));
        return;
      }

      db.run('DELETE FROM materials WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Database error in delete:', err);
          reject(new Error('Failed to delete material'));
          return;
        }
        if (this.changes === 0) {
          reject(new Error('Material not found'));
          return;
        }
        resolve();
      });
    });
  }
}

module.exports = Material; 