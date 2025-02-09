const db = require('../config/database');

class Notification {
  static async getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM notifications ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM notifications WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async getByCategory(category) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM notifications WHERE category = ? ORDER BY created_at DESC', [category], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async getUnreadNotifications() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM notifications WHERE read_at IS NULL ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async getPendingNotifications() {
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM notifications 
         WHERE sent_at IS NULL 
         AND scheduled_for <= ? 
         AND (retry_count < 3 OR retry_count IS NULL)
         ORDER BY scheduled_for ASC`,
        [now],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async create(notification) {
    const {
      title,
      message,
      type,
      category,
      related_id,
      action_url,
      scheduled_for
    } = notification;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO notifications (
          title, message, type, category, related_id, 
          action_url, scheduled_for, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          message,
          type,
          category,
          related_id,
          action_url,
          scheduled_for,
          new Date().toISOString()
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...notification });
        }
      );
    });
  }

  static async markAsRead(id) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE notifications SET read_at = ? WHERE id = ?',
        [new Date().toISOString(), id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async markAllAsRead() {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE notifications SET read_at = ? WHERE read_at IS NULL',
        [new Date().toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async markAsSent(id) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE notifications SET sent_at = ? WHERE id = ?',
        [new Date().toISOString(), id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async updateRetryCount(id) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE notifications 
         SET retry_count = COALESCE(retry_count, 0) + 1,
             last_retry_at = ?
         WHERE id = ?`,
        [new Date().toISOString(), id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async cleanupOldNotifications() {
    // Xóa các thông báo đã đọc và cũ hơn 30 ngày
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM notifications 
         WHERE read_at IS NOT NULL 
         AND read_at < ?`,
        [thirtyDaysAgo.toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM notifications WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Notification; 