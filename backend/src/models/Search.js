const db = require('../config/database');

class Search {
  static async searchAll(query) {
    console.log('Starting search with query:', query);
    
    const results = {
      materials: [],
      events: [],
      assignments: [],
      goals: []
    };

    try {
      // Tìm kiếm trong materials với điểm ưu tiên
      console.log('Searching in materials...');
      const materials = await new Promise((resolve, reject) => {
        db.all(
          `SELECT *,
            CASE 
              WHEN title LIKE ? THEN 3
              WHEN title LIKE ? THEN 2
              WHEN description LIKE ? THEN 1
              ELSE 0
            END as relevance
           FROM materials 
           WHERE title LIKE ? OR title LIKE ? OR description LIKE ?
           ORDER BY relevance DESC
           LIMIT 5`,
          [`${query}%`, `%${query}%`, `%${query}%`, `${query}%`, `%${query}%`, `%${query}%`],
          (err, rows) => {
            if (err) {
              console.error('Error searching materials:', err);
              reject(err);
            }
            console.log('Found materials:', rows?.length || 0);
            resolve(rows || []);
          }
        );
      });
      results.materials = materials;

      // Tìm kiếm trong events với điểm ưu tiên
      console.log('Searching in events...');
      const events = await new Promise((resolve, reject) => {
        db.all(
          `SELECT *,
            CASE 
              WHEN title LIKE ? THEN 3
              WHEN title LIKE ? THEN 2
              WHEN description LIKE ? THEN 1
              ELSE 0
            END as relevance
           FROM events 
           WHERE title LIKE ? OR title LIKE ? OR description LIKE ?
           ORDER BY relevance DESC
           LIMIT 5`,
          [`${query}%`, `%${query}%`, `%${query}%`, `${query}%`, `%${query}%`, `%${query}%`],
          (err, rows) => {
            if (err) {
              console.error('Error searching events:', err);
              reject(err);
            }
            console.log('Found events:', rows?.length || 0);
            resolve(rows || []);
          }
        );
      });
      results.events = events;

      // Tìm kiếm trong assignments với điểm ưu tiên
      const assignments = await new Promise((resolve, reject) => {
        db.all(
          `SELECT *,
            CASE 
              WHEN title LIKE ? THEN 4
              WHEN title LIKE ? THEN 3
              WHEN description LIKE ? THEN 2
              WHEN notes LIKE ? THEN 1
              ELSE 0
            END as relevance
           FROM assignments 
           WHERE title LIKE ? OR title LIKE ? OR description LIKE ? OR notes LIKE ?
           ORDER BY relevance DESC
           LIMIT 5`,
          [`${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, 
           `${query}%`, `%${query}%`, `%${query}%`, `%${query}%`],
          (err, rows) => {
            if (err) reject(err);
            resolve(rows || []);
          }
        );
      });
      results.assignments = assignments;

      // Tìm kiếm trong goals với điểm ưu tiên
      const goals = await new Promise((resolve, reject) => {
        db.all(
          `SELECT *,
            CASE 
              WHEN title LIKE ? THEN 3
              WHEN title LIKE ? THEN 2
              WHEN description LIKE ? THEN 1
              ELSE 0
            END as relevance
           FROM goals 
           WHERE title LIKE ? OR title LIKE ? OR description LIKE ?
           ORDER BY relevance DESC
           LIMIT 5`,
          [`${query}%`, `%${query}%`, `%${query}%`, `${query}%`, `%${query}%`, `%${query}%`],
          (err, rows) => {
            if (err) reject(err);
            resolve(rows || []);
          }
        );
      });
      results.goals = goals;

      // Lọc bỏ các kết quả không có relevance
      Object.keys(results).forEach(key => {
        results[key] = results[key]
          .filter(item => item.relevance > 0)
          .map(({ relevance, ...item }) => ({
            ...item,
            matchScore: relevance
          }));
      });

      // Thử lưu lịch sử tìm kiếm
      try {
        const savePromises = [];
        
        if (materials.length > 0) {
          savePromises.push(this.saveSearchHistory(query, 'material', materials.length));
        }
        if (events.length > 0) {
          savePromises.push(this.saveSearchHistory(query, 'event', events.length));
        }
        if (assignments.length > 0) {
          savePromises.push(this.saveSearchHistory(query, 'assignment', assignments.length));
        }
        if (goals.length > 0) {
          savePromises.push(this.saveSearchHistory(query, 'goal', goals.length));
        }

        await Promise.allSettled(savePromises);
        console.log('Search history saved successfully');
      } catch (error) {
        console.error('Failed to save search history:', error);
      }

      return results;
    } catch (error) {
      console.error('Search error:', error);
      error.results = results;
      throw error;
    }
  }

  static saveSearchHistory(query, type, count) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO search_history (query, type, result_count) 
         VALUES (?, ?, ?)`,
        [query, type, count],
        (err) => {
          if (err) {
            console.error(`Error saving search history for type ${type}:`, err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  static getSearchHistory(limit = 5) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM search_history 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows || []);
        }
      );
    });
  }
}

module.exports = Search; 