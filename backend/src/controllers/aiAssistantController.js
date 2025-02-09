require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Lấy API key từ biến môi trường
const API_KEY = process.env.GEMINI_API_KEY;

// Kiểm tra API key
if (!API_KEY) {
  console.error('GEMINI_API_KEY không được cấu hình trong file .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Cấu hình mặc định cho model
const DEFAULT_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 800,
  topP: 0.95,
  topK: 40,
};

// Prompt mẫu cho trợ lý học tập
const SYSTEM_PROMPT = `Bạn là một trợ lý học tập thông minh với những đặc điểm sau:
- Trả lời bằng tiếng Việt rõ ràng, dễ hiểu
- Tập trung vào việc giải thích các khái niệm một cách đơn giản
- Đưa ra ví dụ thực tế khi cần thiết
- Khuyến khích tư duy phản biện và học tập chủ động
- Hỗ trợ người dùng tìm ra câu trả lời thay vì đưa ra đáp án trực tiếp`;

exports.chat = async (req, res) => {
  try {
    const { message, context = [] } = req.body;

    console.log('Sending request to Gemini API with message:', message);

    // Khởi tạo model với cấu hình
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      ...DEFAULT_CONFIG
    });

    // Tạo chat history từ context, bỏ qua system prompt
    const history = context.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: msg.content,
    }));

    // Tạo chat và thêm system prompt vào tin nhắn đầu tiên
    const chat = model.startChat({
      history: [],
      generationConfig: DEFAULT_CONFIG,
    });

    // Gửi system prompt như một phần của tin nhắn người dùng
    const userMessage = `${SYSTEM_PROMPT}\n\nUser: ${message}`;
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini API response:', response);

    const aiResponse = {
      reply: text,
      context: [
        ...context,
        { role: 'user', content: message },
        { role: 'assistant', content: text }
      ]
    };

    console.log('Sending response to client:', aiResponse);
    res.json(aiResponse);

  } catch (error) {
    console.error('AI Assistant Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Xử lý các lỗi cụ thể
    if (error.message.includes('API key')) {
      res.status(401).json({
        error: 'Invalid API key',
        details: { message: 'Please check your Gemini API key configuration' }
      });
    } else if (error.message.includes('quota')) {
      res.status(429).json({
        error: 'API quota exceeded',
        details: { message: 'Please try again later' }
      });
    } else {
      res.status(500).json({
        error: 'Failed to get response from AI Assistant',
        details: { message: error.message }
      });
    }
  }
};

// Hàm phân tích dữ liệu học tập
async function analyzeUserProgress() {
  try {
    // Lấy dữ liệu từ các bảng
    const [events, assignments, goals, materials] = await Promise.all([
      Event.getAll(),
      Assignment.getAll(), 
      Goal.getAll(),
      Material.getAll()
    ]);

    // Phân tích sự kiện học tập
    const totalStudyHours = events.reduce((total, event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const hours = (end - start) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    // Phân tích bài tập
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const totalAssignments = assignments.length;
    const assignmentCompletionRate = totalAssignments > 0 
      ? (completedAssignments / totalAssignments) * 100 
      : 0;

    // Phân tích mục tiêu
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
    const totalGoals = goals.length;
    const goalCompletionRate = totalGoals > 0 
      ? (completedGoals / totalGoals) * 100 
      : 0;

    // Phân tích tài liệu học tập
    const totalMaterials = materials.length;
    
    // Tính toán xu hướng học tập
    const recentAssignments = assignments.filter(a => {
      const assignmentDate = new Date(a.deadline);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return assignmentDate >= oneMonthAgo;
    });

    const recentCompletionRate = recentAssignments.length > 0
      ? (recentAssignments.filter(a => a.status === 'completed').length / recentAssignments.length) * 100
      : 0;

    return {
      studyHours: totalStudyHours,
      assignmentStats: {
        completed: completedAssignments,
        total: totalAssignments,
        completionRate: assignmentCompletionRate,
        recentCompletionRate
      },
      goalStats: {
        completed: completedGoals,
        inProgress: inProgressGoals,
        total: totalGoals,
        completionRate: goalCompletionRate
      },
      materialStats: {
        total: totalMaterials
      }
    };
  } catch (error) {
    console.error('Error analyzing user progress:', error);
    throw error;
  }
}

// Hàm đưa ra đề xuất dựa trên phân tích
function generateRecommendations(analysis) {
  const recommendations = [];

  // Đề xuất về thời gian học
  if (analysis.studyHours < 10) {
    recommendations.push({
      area: 'Thời gian học tập',
      suggestion: 'Bạn nên tăng thời gian học tập lên. Mục tiêu tối thiểu nên là 10 giờ/tuần.',
      priority: 'high'
    });
  }

  // Đề xuất về bài tập
  if (analysis.assignmentStats.completionRate < 70) {
    recommendations.push({
      area: 'Hoàn thành bài tập',
      suggestion: 'Tỷ lệ hoàn thành bài tập của bạn còn thấp. Hãy lên kế hoạch để hoàn thành các bài tập đúng hạn.',
      priority: 'high'
    });
  }

  // Đề xuất về mục tiêu
  if (analysis.goalStats.completionRate < 50) {
    recommendations.push({
      area: 'Mục tiêu học tập',
      suggestion: 'Bạn nên tập trung hoàn thành các mục tiêu đã đề ra trước khi thêm mục tiêu mới.',
      priority: 'medium'
    });
  }

  // Đề xuất về tài liệu
  if (analysis.materialStats.total < 5) {
    recommendations.push({
      area: 'Tài liệu học tập',
      suggestion: 'Bạn nên tìm kiếm và sử dụng thêm tài liệu học tập để đa dạng hóa nguồn kiến thức.',
      priority: 'medium'
    });
  }

  return recommendations;
}

// Hàm phân tích xu hướng học tập theo thời gian
async function analyzeLearningTrends() {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    // Lấy dữ liệu từ các bảng
    const [events, assignments, goals] = await Promise.all([
      Event.getAll(),
      Assignment.getAll(),
      Goal.getAll()
    ]);

    // Phân tích dữ liệu theo tháng
    const currentMonthData = {
      studyHours: calculateStudyHours(events.filter(e => new Date(e.start) >= lastMonth)),
      completedAssignments: assignments.filter(a => 
        a.status === 'completed' && new Date(a.updated_at) >= lastMonth
      ).length,
      completedGoals: goals.filter(g => 
        g.status === 'completed' && new Date(g.updated_at) >= lastMonth
      ).length
    };

    const lastMonthData = {
      studyHours: calculateStudyHours(events.filter(e => 
        new Date(e.start) >= twoMonthsAgo && new Date(e.start) < lastMonth
      )),
      completedAssignments: assignments.filter(a => 
        a.status === 'completed' && 
        new Date(a.updated_at) >= twoMonthsAgo && 
        new Date(a.updated_at) < lastMonth
      ).length,
      completedGoals: goals.filter(g => 
        g.status === 'completed' && 
        new Date(g.updated_at) >= twoMonthsAgo && 
        new Date(g.updated_at) < lastMonth
      ).length
    };

    // Tính toán phần trăm thay đổi
    const trends = {
      studyHours: calculatePercentageChange(lastMonthData.studyHours, currentMonthData.studyHours),
      assignments: calculatePercentageChange(lastMonthData.completedAssignments, currentMonthData.completedAssignments),
      goals: calculatePercentageChange(lastMonthData.completedGoals, currentMonthData.completedGoals)
    };

    return {
      currentMonth: currentMonthData,
      lastMonth: lastMonthData,
      trends
    };
  } catch (error) {
    console.error('Error analyzing learning trends:', error);
    throw error;
  }
}

// Hàm phân tích thời gian biểu học tập tối ưu
async function analyzeOptimalSchedule() {
  try {
    const events = await Event.getAll();
    
    // Phân tích thời gian học tập theo giờ trong ngày
    const hourlyDistribution = new Array(24).fill(0);
    const productiveHours = new Map();

    events.forEach(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const duration = (end - start) / (1000 * 60 * 60); // Số giờ
      
      // Ghi nhận số giờ học vào các khung giờ
      const hour = start.getHours();
      hourlyDistribution[hour] += duration;
      
      // Ghi nhận vào map để tính toán thời gian học hiệu quả
      if (productiveHours.has(hour)) {
        productiveHours.set(hour, productiveHours.get(hour) + duration);
      } else {
        productiveHours.set(hour, duration);
      }
    });

    // Tìm các khung giờ học tập hiệu quả nhất
    const sortedHours = Array.from(productiveHours.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Phân tích ngày trong tuần
    const weekdayDistribution = new Array(7).fill(0);
    events.forEach(event => {
      const day = new Date(event.start).getDay();
      const duration = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);
      weekdayDistribution[day] += duration;
    });

    return {
      hourlyDistribution,
      mostProductiveHours: sortedHours,
      weekdayDistribution
    };
  } catch (error) {
    console.error('Error analyzing optimal schedule:', error);
    throw error;
  }
}

// Hàm đề xuất tài liệu học tập
async function recommendMaterials() {
  try {
    // Lấy tất cả dữ liệu cần thiết
    const [materials, assignments, goals] = await Promise.all([
      Material.getAll(),
      Assignment.getAll(),
      Goal.getAll()
    ]);

    // Phân tích mục tiêu và bài tập hiện tại
    const currentGoals = goals.filter(g => g.status !== 'completed');
    const currentAssignments = assignments.filter(a => a.status !== 'completed');

    // Tạo danh sách từ khóa từ mục tiêu và bài tập
    const keywords = new Set();
    currentGoals.forEach(goal => {
      goal.title.toLowerCase().split(' ').forEach(word => keywords.add(word));
      if (goal.description) {
        goal.description.toLowerCase().split(' ').forEach(word => keywords.add(word));
      }
    });
    currentAssignments.forEach(assignment => {
      assignment.title.toLowerCase().split(' ').forEach(word => keywords.add(word));
      if (assignment.description) {
        assignment.description.toLowerCase().split(' ').forEach(word => keywords.add(word));
      }
    });

    // Tìm tài liệu phù hợp dựa trên từ khóa
    const recommendedMaterials = materials.filter(material => {
      const materialWords = new Set([
        ...material.title.toLowerCase().split(' '),
        ...(material.description ? material.description.toLowerCase().split(' ') : [])
      ]);
      
      // Tính điểm phù hợp dựa trên số từ khóa trùng khớp
      let matchScore = 0;
      keywords.forEach(keyword => {
        if (materialWords.has(keyword)) matchScore++;
      });
      
      material.relevanceScore = matchScore;
      return matchScore > 0;
    });

    // Sắp xếp theo độ phù hợp
    recommendedMaterials.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return recommendedMaterials.slice(0, 5); // Trả về 5 tài liệu phù hợp nhất
  } catch (error) {
    console.error('Error recommending materials:', error);
    throw error;
  }
}

// Hàm hỗ trợ tính phần trăm thay đổi
function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) return newValue === 0 ? 0 : 100;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Hàm hỗ trợ tính tổng số giờ học
function calculateStudyHours(events) {
  return events.reduce((total, event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return total + (end - start) / (1000 * 60 * 60);
  }, 0);
}

// Cập nhật hàm analyzeAndRecommend để bao gồm các phân tích mới
exports.analyzeAndRecommend = async (req, res) => {
  try {
    const [basicAnalysis, trends, schedule, recommendations] = await Promise.all([
      analyzeUserProgress(),
      analyzeLearningTrends(),
      analyzeOptimalSchedule(),
      recommendMaterials()
    ]);

    res.json({
      analysis: {
        ...basicAnalysis,
        trends,
        optimalSchedule: schedule
      },
      recommendations: [
        ...generateRecommendations(basicAnalysis),
        {
          area: 'Tài liệu học tập',
          suggestion: 'Dựa trên mục tiêu và bài tập hiện tại của bạn, đây là những tài liệu được đề xuất:',
          materials: recommendations
        }
      ],
      summary: {
        overallProgress: Math.round(
          (basicAnalysis.assignmentStats.completionRate + basicAnalysis.goalStats.completionRate) / 2
        ),
        strengths: determineStrengths(basicAnalysis, trends),
        areasForImprovement: determineAreasForImprovement(basicAnalysis, trends)
      }
    });
  } catch (error) {
    console.error('Error in analyzeAndRecommend:', error);
    res.status(500).json({
      error: 'Failed to analyze learning progress',
      details: { message: error.message }
    });
  }
};

// Hàm xác định điểm mạnh
function determineStrengths(analysis, trends) {
  const strengths = [];
  
  if (analysis.assignmentStats.completionRate > 80) {
    strengths.push('Tỷ lệ hoàn thành bài tập cao');
  }
  
  if (analysis.goalStats.completionRate > 70) {
    strengths.push('Đạt được nhiều mục tiêu đề ra');
  }
  
  if (trends.studyHours > 10) {
    strengths.push('Thời gian học tập tăng đáng kể');
  }
  
  return strengths;
}

// Hàm xác định điểm cần cải thiện
function determineAreasForImprovement(analysis, trends) {
  const areas = [];
  
  if (analysis.assignmentStats.completionRate < 60) {
    areas.push('Tỷ lệ hoàn thành bài tập');
  }
  
  if (analysis.goalStats.completionRate < 50) {
    areas.push('Tỷ lệ đạt mục tiêu');
  }
  
  if (trends.studyHours < 0) {
    areas.push('Thời gian học tập');
  }
  
  return areas;
} 