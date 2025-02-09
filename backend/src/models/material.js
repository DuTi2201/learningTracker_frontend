const db = require('../config/database');

class Material {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM materials ORDER BY date DESC', [], (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        }
        resolve(rows);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM materials WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        }
        resolve(row);
      });
    });
  }

  static create(material) {
    return new Promise((resolve, reject) => {
      const { id, title, description, type, link, date } = material;
      db.run(
        'INSERT INTO materials (id, title, description, type, link, date) VALUES (?, ?, ?, ?, ?, ?)',
        [id, title, description, type, link, date],
        function(err) {
          if (err) {
            console.error('Database error:', err);
            reject(err);
          }
          resolve({ id, ...material });
        }
      );
    });
  }

  static update(id, material) {
    return new Promise((resolve, reject) => {
      const { title, description, type, link, date } = material;
      db.run(
        'UPDATE materials SET title = ?, description = ?, type = ?, link = ?, date = ? WHERE id = ?',
        [title, description, type, link, date, id],
        function(err) {
          if (err) {
            console.error('Database error:', err);
            reject(err);
          }
          resolve({ id, ...material });
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM materials WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        }
        resolve();
      });
    });
  }
}

module.exports = Material; 