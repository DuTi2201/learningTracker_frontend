const db = require('../config/database');

class Goal {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM goals', [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM goals WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  static create(goal) {
    return new Promise((resolve, reject) => {
      const { title, description, deadline, priority, status } = goal;
      db.run(
        'INSERT INTO goals (title, description, deadline, priority, status) VALUES (?, ?, ?, ?, ?)',
        [title, description, deadline, priority, status],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...goal });
        }
      );
    });
  }

  static update(id, goal) {
    return new Promise((resolve, reject) => {
      const { title, description, deadline, priority, status } = goal;
      db.run(
        'UPDATE goals SET title = ?, description = ?, deadline = ?, priority = ?, status = ? WHERE id = ?',
        [title, description, deadline, priority, status, id],
        function(err) {
          if (err) reject(err);
          resolve({ id, ...goal });
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM goals WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        resolve();
      });
    });
  }
}

module.exports = Goal; 