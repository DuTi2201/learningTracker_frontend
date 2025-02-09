const db = require('../config/database');

class ChatHistory {
  static async getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT ch.*, COUNT(cm.id) as message_count 
         FROM chat_history ch
         LEFT JOIN chat_messages cm ON ch.id = cm.chat_id
         GROUP BY ch.id
         ORDER BY ch.is_pinned DESC, ch.updated_at DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM chat_history WHERE id = ?', [id], (err, chat) => {
        if (err) reject(err);
        else resolve(chat);
      });
    });
  }

  static async create(title) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        'INSERT INTO chat_history (title, created_at, updated_at) VALUES (?, ?, ?)',
        [title, now, now],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, title, created_at: now, updated_at: now });
        }
      );
    });
  }

  static async update(id, title) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        'UPDATE chat_history SET title = ?, updated_at = ? WHERE id = ?',
        [title, now, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM chat_history WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static async togglePin(id) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE chat_history SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END WHERE id = ?',
        [id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async search(query) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT ch.*, COUNT(cm.id) as message_count 
         FROM chat_history ch
         LEFT JOIN chat_messages cm ON ch.id = cm.chat_id
         WHERE ch.title LIKE ?
         GROUP BY ch.id
         ORDER BY ch.is_pinned DESC, ch.updated_at DESC`,
        [`%${query}%`],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = ChatHistory; 