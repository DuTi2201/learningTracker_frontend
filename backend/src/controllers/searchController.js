const Search = require('../models/Search');

exports.search = async (req, res) => {
  try {
    const { query } = req.query;
    console.log('Received search request with query:', query);

    if (!query) {
      console.log('Search query is empty');
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log('Searching in database...');
    const results = await Search.searchAll(query);
    console.log('Search completed successfully');
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    
    // Nếu có kết quả tìm kiếm trong error object, vẫn trả về kết quả
    if (error.results) {
      console.log('Returning search results despite error');
      return res.json(error.results);
    }
    
    // Nếu không có kết quả, trả về lỗi
    res.status(500).json({ 
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
};

exports.getSearchHistory = async (req, res) => {
  try {
    const { limit } = req.query;
    const history = await Search.getSearchHistory(limit ? parseInt(limit) : 5);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 