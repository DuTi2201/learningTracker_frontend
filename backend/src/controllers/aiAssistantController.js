require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatHistory = require('../models/ChatHistory');
const ChatMessage = require('../models/ChatMessage');
const Event = require('../models/Event');
const Assignment = require('../models/Assignment');
const Material = require('../models/Material');
const Goal = require('../models/Goal');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Lấy API key từ biến môi trường
const API_KEY = process.env.GEMINI_API_KEY;

// Kiểm tra và tạo bảng nếu chưa tồn tại
const ensureTablesExist = async () => {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      is_pinned INTEGER DEFAULT 0
    )`, (err) => {
      if (err) reject(err);
      else {
        db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER,
          role TEXT CHECK(role IN ('user', 'assistant')),
          content TEXT,
          timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (chat_id) REFERENCES chat_history(id) ON DELETE CASCADE
        )`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      }
    });
  });
};

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
const SYSTEM_PROMPT = `Bạn là một trợ lý học tập thông minh, có khả năng tương tác trực tiếp với hệ thống quản lý học tập. Bạn có thể:

1. Tạo và quản lý lịch học:
- Khi người dùng yêu cầu "lên lịch học", hãy hỏi tiêu đề lịch học
- Khi nhận được tiêu đề, tạo lịch học thông minh dựa trên tiêu đề đó
- KHÔNG lặp lại câu hỏi về tiêu đề nếu đã nhận được

2. Quản lý bài tập:
- Khi người dùng yêu cầu tạo bài tập mới, hỏi các thông tin cần thiết
- Lưu ý các thông tin quan trọng như deadline, môn học
- KHÔNG lặp lại câu hỏi nếu thông tin đã được cung cấp

3. Quản lý tài liệu:
- Khi người dùng yêu cầu thêm tài liệu mới, hỏi các thông tin cần thiết
- Lưu ý các thông tin như tiêu đề, mô tả, loại tài liệu
- KHÔNG lặp lại câu hỏi nếu thông tin đã được cung cấp

4. Phong cách tương tác:
- Trả lời ngắn gọn, rõ ràng khi xử lý các yêu cầu CRUD
- Chỉ đưa ra các gợi ý và chia sẻ kinh nghiệm khi được yêu cầu
- Tập trung vào việc hoàn thành yêu cầu của người dùng

5. Xử lý thông tin:
- Phân tích kỹ nội dung tin nhắn để tránh hỏi lại thông tin đã có
- Lưu trữ context để theo dõi tiến trình tương tác
- Xác nhận lại với người dùng trước khi thực hiện các thao tác quan trọng`;

exports.getChats = async (req, res) => {
  try {
    const chats = await ChatHistory.getAll();
    res.json(chats);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
};

exports.getChatById = async (req, res) => {
  try {
    const chat = await ChatHistory.getById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    const messages = await ChatMessage.getMessagesByChatId(req.params.id);
    res.json({ ...chat, messages });
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
};

exports.createChat = async (req, res) => {
  try {
    const { title } = req.body;
    const chat = await ChatHistory.create(title || 'New Chat');
    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    await ChatHistory.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};

exports.togglePinChat = async (req, res) => {
  try {
    await ChatHistory.togglePin(req.params.id);
    res.status(200).json({ message: 'Chat pin status updated' });
  } catch (error) {
    console.error('Error toggling chat pin:', error);
    res.status(500).json({ error: 'Failed to toggle chat pin' });
  }
};

exports.searchChats = async (req, res) => {
  try {
    const { query } = req.query;
    const chats = await ChatHistory.search(query);
    res.json(chats);
  } catch (error) {
    console.error('Error searching chats:', error);
    res.status(500).json({ error: 'Failed to search chats' });
  }
};

// Cập nhật phương thức chat hiện có
exports.chat = async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Xử lý tin nhắn với context
    const response = await processWithAI(message, context);
    
    res.json({
      message: response.message,
      context: response.context
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ 
      error: 'Failed to process chat',
      details: error.message 
    });
  }
};

// Hàm kiểm tra và phân loại nội dung nhạy cảm
function analyzeContentSensitivity(message) {
  const categories = {
    sexual: ['nứng', 'dâm', 'sex', 'địt', 'lồn', 'cặc', 'buồi', 'đụ'],
    profanity: ['fuck', 'dick', 'pussy', 'porn', 'xxx'],
    harassment: ['đồ ngu', 'ngu như chó', 'óc lợn', 'mẹ mày'],
    hate_speech: ['đồ điên', 'thần kinh', 'tâm thần', 'khùng']
  };

  const normalizedMessage = message.toLowerCase();
  
  for (const [category, words] of Object.entries(categories)) {
    if (words.some(word => normalizedMessage.includes(word))) {
      return {
        isSensitive: true,
        category: category,
        suggestion: getEducationalResponse(category)
      };
    }
  }
  
  return { isSensitive: false };
}

// Hàm tạo phản hồi mang tính giáo dục
function getEducationalResponse(category) {
  const responses = {
    sexual: `Tôi hiểu bạn có thể đang gặp những thắc mắc về vấn đề sinh lý. Đây là chủ đề nhạy cảm cần được thảo luận một cách nghiêm túc và tôn trọng. Tôi gợi ý bạn:
- Tham khảo ý kiến chuyên gia y tế hoặc tâm lý
- Tìm hiểu qua các nguồn thông tin giáo dục giới tính uy tín
- Thảo luận với người lớn đáng tin cậy

Bạn có muốn tôi giới thiệu một số website giáo dục giới tính phù hợp không?`,

    profanity: `Tôi nhận thấy bạn đang sử dụng ngôn ngữ thiếu tích cực. Giao tiếp văn minh và tôn trọng sẽ giúp:
- Xây dựng các mối quan hệ tốt đẹp
- Thể hiện sự trưởng thành và chuyên nghiệp
- Tạo môi trường học tập lành mạnh

Hãy chia sẻ với tôi điều bạn thực sự muốn bày tỏ nhé?`,

    harassment: `Tôi cảm nhận được bạn đang có cảm xúc tiêu cực với ai đó. Thay vì sử dụng lời lẽ gây tổn thương, chúng ta có thể:
- Thảo luận vấn đề một cách bình tĩnh
- Tìm hiểu nguyên nhân sâu xa
- Đề xuất giải pháp xây dựng

Bạn muốn chia sẻ điều gì đang khiến bạn khó chịu không?`,

    hate_speech: `Tôi thấy bạn đang có định kiến hoặc thành kiến với một số người. Để xây dựng một cộng đồng tốt đẹp, chúng ta nên:
- Tôn trọng sự đa dạng của mọi người
- Thấu hiểu hoàn cảnh của người khác
- Sử dụng ngôn từ tích cực và xây dựng

Bạn có muốn tìm hiểu thêm về cách giao tiếp tích cực không?`
  };

  return responses[category] || 'Hãy cùng trao đổi với thái độ tôn trọng và xây dựng nhé.';
}

// Hàm phân tích yêu cầu CRUD
async function analyzeCRUDRequest(message) {
  // Phân tích yêu cầu liên quan đến lịch học
  if (message.toLowerCase().includes('lịch học') || message.toLowerCase().includes('lên lịch')) {
    return {
      type: 'schedule',
      action: 'create',
      requiredFields: ['title', 'description', 'start_time', 'end_time', 'instructor'],
      missingFields: []
    };
  }
  
  // Phân tích yêu cầu liên quan đến mục tiêu
  if (message.toLowerCase().includes('mục tiêu') || message.toLowerCase().includes('target')) {
    return {
      type: 'goal',
      action: 'create',
      requiredFields: ['title', 'description', 'deadline', 'priority', 'status'],
      missingFields: []
    };
  }
  
  // Phân tích yêu cầu liên quan đến bài tập
  if (message.toLowerCase().includes('bài tập') || message.toLowerCase().includes('assignment')) {
    return {
      type: 'assignment',
      action: 'create', 
      requiredFields: ['title', 'description', 'deadline', 'status'],
      missingFields: []
    };
  }
  
  return null;
}

// Hàm tạo câu hỏi để lấy thông tin còn thiếu
function generateQuestions(crudRequest) {
  const questions = {
    schedule: {
      title: 'Bạn muốn đặt tiêu đề gì cho lịch học này?',
      description: 'Bạn có muốn thêm mô tả chi tiết không?',
      start_time: 'Thời gian bắt đầu là khi nào?',
      end_time: 'Thời gian kết thúc là khi nào?',
      instructor: 'Giảng viên/người hướng dẫn là ai?'
    },
    goal: {
      title: 'Bạn muốn đặt tiêu đề gì cho mục tiêu này?',
      description: 'Bạn có thể mô tả chi tiết mục tiêu không?',
      deadline: 'Bạn muốn hoàn thành mục tiêu này vào khi nào?',
      priority: 'Mức độ ưu tiên của mục tiêu này là gì (cao/trung bình/thấp)?',
      status: 'Trạng thái hiện tại của mục tiêu là gì (chưa bắt đầu/đang thực hiện/hoàn thành)?'
    },
    assignment: {
      title: 'Bạn muốn đặt tiêu đề gì cho bài tập này?',
      description: 'Bạn có thể mô tả chi tiết bài tập không?',
      deadline: 'Thời hạn nộp bài tập là khi nào?',
      status: 'Trạng thái hiện tại của bài tập là gì (chưa bắt đầu/đang làm/hoàn thành)?'
    }
  };
  
  return questions[crudRequest.type];
}

// Hàm tạo xác nhận từ người dùng
function generateConfirmation(data, type) {
  let confirmation = 'Tôi sẽ tạo ';
  
  switch (type) {
    case 'schedule':
      confirmation += `lịch học "${data.title}" từ ${data.start_time} đến ${data.end_time}`;
      if (data.instructor) confirmation += ` với giảng viên ${data.instructor}`;
      break;
      
    case 'goal':
      confirmation += `mục tiêu "${data.title}" với deadline ${data.deadline}`;
      confirmation += `\nĐộ ưu tiên: ${data.priority}`;
      confirmation += `\nTrạng thái: ${data.status}`;
      break;
      
    case 'assignment':
      confirmation += `bài tập "${data.title}" với deadline ${data.deadline}`;
      confirmation += `\nTrạng thái: ${data.status}`;
      break;
  }
  
  confirmation += '\n\nBạn có đồng ý không? (Có/Không)';
  return confirmation;
}

// Hàm phân tích thời gian từ văn bản
function parseTimeFromText(text) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Xử lý "ngày mai"
  if (text.toLowerCase().includes('ngày mai')) {
    return tomorrow;
  }
  
  // Xử lý giờ cụ thể
  const timeMatch = text.match(/(\d{1,2})[h:]\s*(\d{1,2})?/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const date = new Date(tomorrow);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  
  return null;
}

// Hàm tạo lịch học thông minh
async function createIntelligentSchedule(title, description = '') {
  try {
    // Phân tích tiêu đề để tạo lịch học phù hợp
    const schedule = {
      title,
      description,
      events: []
    };

    // Nếu là ôn tập chung, tạo lịch học theo phương pháp Pomodoro
    if (title.toLowerCase().includes('ôn tập chung')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Buổi sáng
      schedule.events.push({
        id: uuidv4(),
        title: 'Ôn tập - Phiên 1',
        description: 'Ôn tập tập trung (25 phút) + Nghỉ giải lao (5 phút) x 2',
        start: new Date(tomorrow.setHours(8, 0, 0, 0)),
        end: new Date(tomorrow.setHours(9, 0, 0, 0))
      });
      
      schedule.events.push({
        id: uuidv4(),
        title: 'Ôn tập - Phiên 2',
        description: 'Ôn tập tập trung (25 phút) + Nghỉ giải lao (5 phút) x 2',
        start: new Date(tomorrow.setHours(9, 30, 0, 0)),
        end: new Date(tomorrow.setHours(10, 30, 0, 0))
      });
      
      // Buổi chiều
      schedule.events.push({
        id: uuidv4(),
        title: 'Ôn tập - Phiên 3',
        description: 'Ôn tập tập trung (25 phút) + Nghỉ giải lao (5 phút) x 2',
        start: new Date(tomorrow.setHours(14, 0, 0, 0)),
        end: new Date(tomorrow.setHours(15, 0, 0, 0))
      });
      
      schedule.events.push({
        id: uuidv4(),
        title: 'Ôn tập - Phiên 4',
        description: 'Ôn tập tập trung (25 phút) + Nghỉ giải lao (5 phút) x 2',
        start: new Date(tomorrow.setHours(15, 30, 0, 0)),
        end: new Date(tomorrow.setHours(16, 30, 0, 0))
      });
    }
    
    // Tạo các sự kiện trong CSDL
    const createdEvents = [];
    for (const event of schedule.events) {
      const result = await Event.create(event);
      createdEvents.push(result);
    }
    
    return {
      success: true,
      schedule,
      events: createdEvents
    };
  } catch (error) {
    console.error('Error creating intelligent schedule:', error);
    throw error;
  }
}

// Cập nhật hàm processWithAI
async function processWithAI(message, context = {}) {
  try {
    // Phân tích yêu cầu CRUD
    const crudRequest = await analyzeCRUDRequest(message);
    
    if (crudRequest) {
      // Nếu là yêu cầu tạo lịch học cụ thể
      if (crudRequest.type === 'schedule' && message.toLowerCase().includes('giờ')) {
        // Phân tích thời gian từ tin nhắn
        const timeInfo = parseTimeFromText(message);
        if (timeInfo) {
          // Tạo sự kiện trong CSDL
          const eventData = {
            id: uuidv4(),
            title: message.toLowerCase().includes('đi học') ? 'Đi học' : 'Lịch học',
            start: timeInfo,
            end: new Date(timeInfo.getTime() + 2 * 60 * 60 * 1000), // Mặc định 2 tiếng
            description: 'Được tạo tự động từ trợ lý học tập'
          };

          try {
            const createdEvent = await Event.create(eventData);
            return {
              message: `Đã tạo lịch học "${eventData.title}" vào ${timeInfo.toLocaleTimeString()} ngày ${timeInfo.toLocaleDateString()}. Bạn có muốn tôi thêm thông tin nào khác không?`,
              context: {
                type: 'schedule',
                event: createdEvent,
                confirming: false
              }
            };
          } catch (error) {
            console.error('Error creating event:', error);
            return {
              message: 'Xin lỗi, đã có lỗi khi tạo lịch học. Vui lòng thử lại sau.',
              context: null
            };
          }
        }
      }
      
      // Nếu là yêu cầu tạo lịch ôn tập
      if (crudRequest.type === 'schedule' && message.toLowerCase().includes('ôn tập')) {
        const result = await createIntelligentSchedule(message);
        if (result.success) {
          return {
            message: `Tôi đã tạo lịch học thông minh cho bạn:
            
${result.schedule.events.map(event => `
- ${event.title}
  Thời gian: ${new Date(event.start).toLocaleTimeString()} - ${new Date(event.end).toLocaleTimeString()}
  ${event.description}
`).join('\n')}

Lịch học này đã được thêm vào hệ thống. Bạn có muốn điều chỉnh gì không?`,
            context: {
              type: 'schedule',
              schedule: result.schedule,
              confirming: false
            }
          };
        }
      }
      
      // Nếu là yêu cầu tạo bài tập và đã có thông tin đầy đủ
      if (crudRequest.type === 'assignment' && message.toLowerCase().includes('bài tập') && message.toLowerCase().includes('deadline')) {
        const assignmentInfo = {
          title: message.split(',')[0].replace('bài tập', '').trim(),
          deadline: message.split('deadline')[1].trim(),
          status: 'not_started',
          description: 'Được tạo tự động từ trợ lý học tập'
        };
        
        try {
          const createdAssignment = await Assignment.create(assignmentInfo);
          return {
            message: `Đã tạo bài tập "${assignmentInfo.title}" với deadline ${assignmentInfo.deadline}. Bạn có muốn thêm mô tả chi tiết không?`,
            context: {
              type: 'assignment',
              assignment: createdAssignment,
              confirming: false
            }
          };
        } catch (error) {
          console.error('Error creating assignment:', error);
          return {
            message: 'Xin lỗi, đã có lỗi khi tạo bài tập. Vui lòng thử lại sau.',
            context: null
          };
        }
      }
      
      // Xử lý các trường hợp khác như cũ
      if (context.collecting) {
        context.data[context.currentField] = message;
        const missingFields = crudRequest.requiredFields.filter(
          field => !context.data[field]
        );
        
        if (missingFields.length > 0) {
          const questions = generateQuestions(crudRequest);
          context.currentField = missingFields[0];
          return {
            message: questions[missingFields[0]],
            context: {
              ...context,
              collecting: true
            }
          };
        } else {
          return {
            message: generateConfirmation(context.data, crudRequest.type),
            context: {
              ...context,
              collecting: false,
              confirming: true
            }
          };
        }
      }
      
      // Bắt đầu thu thập thông tin nếu chưa đủ
      const questions = generateQuestions(crudRequest);
      const firstField = crudRequest.requiredFields[0];
      
      return {
        message: questions[firstField],
        context: {
          type: crudRequest.type,
          collecting: true,
          currentField: firstField,
          data: {}
        }
      };
    }
    
    // Xử lý các yêu cầu không phải CRUD
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: DEFAULT_CONFIG
    });
    
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{text: SYSTEM_PROMPT}]
        },
        {
          role: 'model',
          parts: [{text: 'Tôi đã hiểu. Tôi sẽ trả lời bằng tiếng Việt và tuân theo các yêu cầu của bạn.'}]
        }
      ]
    });
    
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return {
      message: response.text(),
      context: null
    };
  } catch (error) {
    console.error('Error in processWithAI:', error);
    return {
      message: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
      context: null
    };
  }
}

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