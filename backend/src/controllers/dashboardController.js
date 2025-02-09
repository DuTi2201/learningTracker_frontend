const Event = require('../models/Event');
const Assignment = require('../models/Assignment');
const Goal = require('../models/Goal');
const Material = require('../models/material');

exports.getDashboardStats = async (req, res) => {
  try {
    // Lấy thời điểm 1 tuần trước và 1 tháng trước
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Lấy tất cả dữ liệu
    const [events, assignments, goals, materials] = await Promise.all([
      Event.getAll(),
      Assignment.getAll(),
      Goal.getAll(),
      Material.getAll()
    ]);

    // Tính toán số giờ học tập cho tháng này và tháng trước
    const currentMonthHours = events
      .filter(e => new Date(e.start) >= oneMonthAgo)
      .reduce((total, event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        return total + (end - start) / (1000 * 60 * 60);
      }, 0);

    const lastMonthStart = new Date(oneMonthAgo);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    
    const lastMonthHours = events
      .filter(e => {
        const date = new Date(e.start);
        return date >= lastMonthStart && date < oneMonthAgo;
      })
      .reduce((total, event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        return total + (end - start) / (1000 * 60 * 60);
      }, 0);

    // Tính toán tỷ lệ hoàn thành
    const assignmentCompletionRate = assignments.length > 0 
      ? (assignments.filter(a => a.status === 'completed').length / assignments.length) * 100 
      : 0;
    
    const goalCompletionRate = goals.length > 0
      ? (goals.filter(g => g.status === 'completed').length / goals.length) * 100
      : 0;

    // Tính phần trăm thay đổi
    const calculatePercentageChange = (oldValue, newValue) => {
      if (oldValue === 0) return newValue > 0 ? 100 : 0;
      return Math.round(((newValue - oldValue) / oldValue) * 100);
    };

    // Tính toán số liệu thống kê
    const stats = {
      totalLessons: events.length,
      totalLessonsLastWeek: events.filter(e => new Date(e.start) >= oneWeekAgo).length,
      
      completedAssignments: assignments.filter(a => a.status === 'completed').length,
      completedAssignmentsLastWeek: assignments.filter(
        a => a.status === 'completed' && new Date(a.updated_at) >= oneWeekAgo
      ).length,
      
      studyHours: events.reduce((total, event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const hours = (end - start) / (1000 * 60 * 60);
        return total + hours;
      }, 0),
      
      completedGoals: goals.filter(g => g.status === 'completed').length,
      completedGoalsLastWeek: goals.filter(
        g => g.status === 'completed' && new Date(g.updated_at) >= oneWeekAgo
      ).length,

      // Thêm dữ liệu cho biểu đồ
      learningProgress: {
        labels: ['Goals', 'Assignments', 'Materials'],
        datasets: [
          {
            label: 'Completed',
            data: [
              goalCompletionRate,
              assignmentCompletionRate,
              materials.length > 0 ? 100 : 0 // Materials không có trạng thái
            ]
          },
          {
            label: 'In Progress',
            data: [
              (goals.filter(g => g.status === 'in_progress').length / goals.length) * 100 || 0,
              (assignments.filter(a => a.status === 'in_progress').length / assignments.length) * 100 || 0,
              0 // Materials không có trạng thái in progress
            ]
          }
        ]
      },

      // Thêm phần analysis và trends
      analysis: {
        trends: {
          studyHours: calculatePercentageChange(lastMonthHours, currentMonthHours),
          assignments: calculatePercentageChange(
            assignments.filter(a => new Date(a.updated_at) >= lastMonthStart && new Date(a.updated_at) < oneMonthAgo).length,
            assignments.filter(a => new Date(a.updated_at) >= oneMonthAgo).length
          ),
          goals: calculatePercentageChange(
            goals.filter(g => new Date(g.updated_at) >= lastMonthStart && new Date(g.updated_at) < oneMonthAgo).length,
            goals.filter(g => new Date(g.updated_at) >= oneMonthAgo).length
          )
        },
        optimalSchedule: analyzeOptimalSchedule(events)
      },

      // Thêm phần summary
      summary: {
        overallProgress: Math.round((assignmentCompletionRate + goalCompletionRate) / 2),
        strengths: determineStrengths(assignments, goals, events),
        areasForImprovement: determineAreasForImprovement(assignments, goals, events)
      },

      // Thêm phần recommendations
      recommendations: generateRecommendations({
        assignmentCompletionRate,
        goalCompletionRate,
        studyHours: currentMonthHours,
        studyHoursChange: calculatePercentageChange(lastMonthHours, currentMonthHours),
        assignments,
        goals,
        events,
        materials
      })
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to get dashboard statistics',
      message: error.message 
    });
  }
};

// Hàm xác định điểm mạnh
function determineStrengths(assignments, goals, events) {
  const strengths = [];
  
  const assignmentCompletionRate = assignments.length > 0
    ? (assignments.filter(a => a.status === 'completed').length / assignments.length) * 100
    : 0;
    
  const goalCompletionRate = goals.length > 0
    ? (goals.filter(g => g.status === 'completed').length / goals.length) * 100
    : 0;

  if (assignmentCompletionRate > 80) {
    strengths.push('Tỷ lệ hoàn thành bài tập cao');
  }
  
  if (goalCompletionRate > 70) {
    strengths.push('Đạt được nhiều mục tiêu đề ra');
  }
  
  if (events.length > 10) {
    strengths.push('Tham gia nhiều hoạt động học tập');
  }
  
  return strengths;
}

// Hàm xác định điểm cần cải thiện
function determineAreasForImprovement(assignments, goals, events) {
  const areas = [];
  
  const assignmentCompletionRate = assignments.length > 0
    ? (assignments.filter(a => a.status === 'completed').length / assignments.length) * 100
    : 0;
    
  const goalCompletionRate = goals.length > 0
    ? (goals.filter(g => g.status === 'completed').length / goals.length) * 100
    : 0;

  if (assignmentCompletionRate < 60) {
    areas.push('Tỷ lệ hoàn thành bài tập');
  }
  
  if (goalCompletionRate < 50) {
    areas.push('Tỷ lệ đạt mục tiêu');
  }
  
  if (events.length < 5) {
    areas.push('Số lượng hoạt động học tập');
  }
  
  return areas;
}

// Hàm tạo đề xuất
function generateRecommendations(data) {
  const recommendations = [];

  // Đề xuất về bài tập
  if (data.assignmentCompletionRate < 70) {
    recommendations.push({
      area: 'Hoàn thành bài tập',
      suggestion: 'Tăng tỷ lệ hoàn thành bài tập bằng cách lên kế hoạch học tập cụ thể và chia nhỏ bài tập thành các phần dễ quản lý hơn.',
      priority: 'high'
    });
  }

  // Đề xuất về mục tiêu
  if (data.goalCompletionRate < 60) {
    recommendations.push({
      area: 'Đạt mục tiêu',
      suggestion: 'Xem xét lại các mục tiêu học tập và điều chỉnh để chúng trở nên thực tế và có thể đạt được hơn.',
      priority: 'medium'
    });
  }

  // Đề xuất về thời gian học
  if (data.studyHours < 20) {
    recommendations.push({
      area: 'Thời gian học tập',
      suggestion: 'Tăng thời gian học tập bằng cách tạo thời khóa biểu học tập cố định và tìm thời điểm học tập hiệu quả nhất trong ngày.',
      priority: 'high'
    });
  } else if (data.studyHoursChange < 0) {
    recommendations.push({
      area: 'Duy trì thời gian học',
      suggestion: 'Thời gian học tập đang giảm so với tháng trước. Cố gắng duy trì tính kỷ luật và thói quen học tập đều đặn.',
      priority: 'medium'
    });
  }

  // Đề xuất về tài liệu học tập
  if (data.materials.length < 5) {
    recommendations.push({
      area: 'Tài liệu học tập',
      suggestion: 'Bổ sung thêm tài liệu học tập đa dạng để hỗ trợ việc học hiệu quả hơn.',
      priority: 'low'
    });
  }

  // Đề xuất về sự đều đặn
  const recentEvents = data.events.filter(e => new Date(e.start) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  if (recentEvents.length < 3) {
    recommendations.push({
      area: 'Tính đều đặn',
      suggestion: 'Tăng cường tính đều đặn trong học tập bằng cách tạo các sự kiện học tập thường xuyên hơn.',
      priority: 'medium'
    });
  }

  return recommendations;
}

// Thêm hàm analyzeOptimalSchedule
function analyzeOptimalSchedule(events) {
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
}