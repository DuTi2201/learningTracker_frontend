const Assignment = require('../models/Assignment');
const Event = require('../models/Event');
const Goal = require('../models/Goal');
const Notification = require('../models/Notification');

class NotificationService {
  static async checkDeadlines() {
    try {
      const now = new Date();
      console.log('Checking deadlines at:', now.toISOString());

      // Kiểm tra bài tập
      const assignments = await Assignment.getAll();
      const nowTime = now.getTime();
      
      for (const assignment of assignments) {
        if (assignment.status === 'completed') continue;
        
        const deadline = new Date(assignment.deadline);
        const deadlineTime = deadline.getTime();
        const daysUntilDeadline = Math.ceil((deadlineTime - nowTime) / (1000 * 3600 * 24));
        
        // Chỉ tạo thông báo cho deadline trong tương lai
        if (daysUntilDeadline > 0) {
          // Thông báo trước 3 ngày
          if (daysUntilDeadline === 3) {
            await this.createNotificationIfNotExists({
              title: "Nhắc nhở Deadline",
              message: `Bài tập "${assignment.title}" sẽ đến hạn trong 3 ngày`,
              type: "warning",
              category: "assignment",
              related_id: assignment.id.toString(),
              action_url: `/assignments?id=${assignment.id}`,
              scheduled_for: new Date(deadline.getTime() - 3 * 24 * 60 * 60 * 1000)
            });
          }
          
          // Thông báo trước 1 ngày
          if (daysUntilDeadline === 1) {
            await this.createNotificationIfNotExists({
              title: "Deadline Gấp",
              message: `Bài tập "${assignment.title}" sẽ đến hạn trong 24 giờ`,
              type: "error",
              category: "assignment",
              related_id: assignment.id.toString(),
              action_url: `/assignments?id=${assignment.id}`,
              scheduled_for: new Date(deadline.getTime() - 24 * 60 * 60 * 1000)
            });
          }
        }
      }

      // Kiểm tra sự kiện
      const events = await Event.getAll();
      console.log('Found events:', events.length);
      
      for (const event of events) {
        const eventTime = new Date(event.start);
        const eventTimeTime = eventTime.getTime();
        const hoursUntilEvent = Math.ceil((eventTimeTime - nowTime) / (1000 * 3600));
        
        // Chỉ tạo thông báo cho sự kiện trong tương lai
        if (hoursUntilEvent > 0) {
          // Thông báo trước 24 giờ
          if (hoursUntilEvent === 24) {
            await this.createNotificationIfNotExists({
              title: "Sự kiện sắp diễn ra",
              message: `Sự kiện "${event.title}" sẽ diễn ra trong 24 giờ nữa`,
              type: "info",
              category: "event",
              related_id: event.id,
              action_url: `/events?id=${event.id}`,
              scheduled_for: new Date(eventTime.getTime() - 24 * 60 * 60 * 1000)
            });
          }
          
          // Thông báo trước 1 giờ
          if (hoursUntilEvent === 1) {
            await this.createNotificationIfNotExists({
              title: "Sự kiện sắp bắt đầu",
              message: `Sự kiện "${event.title}" sẽ bắt đầu trong 1 giờ tới`,
              type: "warning",
              category: "event",
              related_id: event.id,
              action_url: `/events?id=${event.id}`,
              scheduled_for: new Date(eventTime.getTime() - 60 * 60 * 1000)
            });
          }
        }
      }

      // Kiểm tra mục tiêu
      const goals = await Goal.getAll();
      for (const goal of goals) {
        if (goal.status === 'completed') continue;
        
        const deadline = new Date(goal.deadline);
        const deadlineTime = deadline.getTime();
        const daysUntilDeadline = Math.ceil((deadlineTime - nowTime) / (1000 * 3600 * 24));
        
        // Chỉ tạo thông báo cho mục tiêu trong tương lai
        if (daysUntilDeadline > 0) {
          // Thông báo trước 7 ngày
          if (daysUntilDeadline === 7) {
            await this.createNotificationIfNotExists({
              title: "Mục tiêu sắp đến hạn",
              message: `Mục tiêu "${goal.title}" sẽ đến hạn trong 1 tuần`,
              type: "info",
              category: "goal",
              related_id: goal.id.toString(),
              action_url: `/goals?id=${goal.id}`,
              scheduled_for: new Date(deadline.getTime() - 7 * 24 * 60 * 60 * 1000)
            });
          }
        }
      }

      console.log('Finished checking deadlines');
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  }

  static async createNotificationIfNotExists(notificationData) {
    try {
      const { category, related_id, scheduled_for } = notificationData;
      
      // Kiểm tra thông báo đã tồn tại chưa
      const existingNotifications = await Notification.getByCategory(category);
      const hasExisting = existingNotifications.some(n => 
        n.related_id === related_id && 
        n.scheduled_for === scheduled_for.toISOString() &&
        !n.is_sent
      );
      
      if (!hasExisting) {
        console.log('Creating notification:', notificationData.title);
        await Notification.create({
          ...notificationData,
          scheduled_for: notificationData.scheduled_for.toISOString()
        });
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  static async processScheduledNotifications() {
    try {
      const now = new Date();
      console.log('Processing notifications at:', now.toISOString());
      
      // Lấy các thông báo đến hạn gửi
      const pendingNotifications = await Notification.getPendingNotifications();
      console.log('Found pending notifications:', pendingNotifications.length);
      
      const processedNotifications = [];
      
      for (const notification of pendingNotifications) {
        const scheduledTime = new Date(notification.scheduled_for);
        
        // Chỉ xử lý các thông báo đến hạn
        if (scheduledTime <= now) {
          console.log('Processing notification:', notification.title);
          await Notification.markAsSent(notification.id);
          processedNotifications.push(notification);
        }
      }
      
      // Dọn dẹp thông báo cũ
      await Notification.cleanupOldNotifications();
      
      return processedNotifications;
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      return [];
    }
  }
}

module.exports = NotificationService; 
 