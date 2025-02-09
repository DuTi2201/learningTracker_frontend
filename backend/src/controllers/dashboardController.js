const Event = require('../models/Event');
const Assignment = require('../models/Assignment');
const Goal = require('../models/Goal');
const Material = require('../models/material');

exports.getDashboardStats = async (req, res) => {
  try {
    // Lấy thời điểm 1 tuần trước
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString();

    // Lấy tất cả dữ liệu
    const [events, assignments, goals, materials] = await Promise.all([
      Event.getAll(),
      Assignment.getAll(),
      Goal.getAll(),
      Material.getAll()
    ]);

    // Tính toán số liệu thống kê
    const stats = {
      totalLessons: events.length,
      totalLessonsLastWeek: events.filter(e => new Date(e.created_at) >= oneWeekAgo).length,
      
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
              (goals.filter(g => g.status === 'completed').length / goals.length) * 100 || 0,
              (assignments.filter(a => a.status === 'completed').length / assignments.length) * 100 || 0,
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
      }
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