const db = require('../config/database');

class ChatMessage {
  static async getMessagesByChatId(chatId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY timestamp ASC',
        [chatId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async create(chatId, role, content) {
    return new Promise((resolve, reject) => {
      const timestamp = new Date().toISOString();
      db.run(
        'INSERT INTO chat_messages (chat_id, role, content, timestamp) VALUES (?, ?, ?, ?)',
        [chatId, role, content, timestamp],
        function(err) {
          if (err) reject(err);
          else resolve({ 
            id: this.lastID, 
            chat_id: chatId, 
            role, 
            content, 
            timestamp 
          });
        }
      );
    });
  }

  static async deleteAllByChatId(chatId) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM chat_messages WHERE chat_id = ?', [chatId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static async searchInChat(chatId, query) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM chat_messages WHERE chat_id = ? AND content LIKE ? ORDER BY timestamp ASC',
        [chatId, `%${query}%`],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async getLatestMessages(limit = 10) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT cm.*, ch.title as chat_title 
         FROM chat_messages cm
         JOIN chat_history ch ON cm.chat_id = ch.id
         ORDER BY cm.timestamp DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = ChatMessage; 