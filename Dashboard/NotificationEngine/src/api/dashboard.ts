import type { DashboardStats, NotificationActivity } from '../types';
import notificationsData from '../data/notifications.json';
import templatesData from '../data/templates.json';

/**
 * Mock API client for dashboard data
 * In production, this would make actual HTTP requests to the backend
 */

// API configuration
// const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch dashboard statistics
 * @returns Promise<DashboardStats>
 */
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  // const response = await fetch(`${API_BASE}/dashboard/analytics`);
  // if (!response.ok) {
  //   throw new Error('Failed to fetch dashboard analytics');
  // }
  // const data = await response.json();

  // Calculate notification statistics
  const notificationStats = notificationsData.reduce((acc: any, notification: any) => {
    acc.totalNotifications++;
    switch (notification.status) {
      case 'sent':
        acc.sentNotifications++;
        break;
      case 'delivered':
        acc.deliveredNotifications++;
        break;
      case 'failed':
        acc.failedNotifications++;
        break;
      case 'pending':
        acc.pendingNotifications++;
        break;
    }
    return acc;
  }, {
    totalNotifications: 0,
    sentNotifications: 0,
    deliveredNotifications: 0,
    failedNotifications: 0,
    pendingNotifications: 0
  });

  // Calculate template statistics
  const templateStats = templatesData.reduce((acc, template) => {
    acc.totalTemplates++;
    if (template.isActive) {
      acc.activeTemplates++;
    }
    return acc;
  }, {
    totalTemplates: 0,
    activeTemplates: 0
  });

  // Generate recent activity
  const recentActivity: NotificationActivity[] = [
    {
      id: 'activity-001',
      type: 'notification_sent',
      message: 'Welcome email sent to john.doe@example.com',
      timestamp: '2024-01-15T10:00:12Z',
      metadata: { notificationId: 'notif-001' }
    },
    {
      id: 'activity-002',
      type: 'template_created',
      message: 'New template "Welcome Email" created',
      timestamp: '2024-01-15T09:30:00Z',
      metadata: { templateId: 'template-001' }
    },
    {
      id: 'activity-003',
      type: 'notification_delivered',
      message: 'Order confirmation delivered to +1234567890',
      timestamp: '2024-01-15T16:45:08Z',
      metadata: { notificationId: 'notif-003' }
    },
    {
      id: 'activity-004',
      type: 'notification_failed',
      message: 'Payment failed notification could not be sent',
      timestamp: '2024-01-15T20:15:10Z',
      metadata: { notificationId: 'notif-005', reason: 'SMTP server timeout' }
    },
    {
      id: 'activity-005',
      type: 'template_updated',
      message: 'Template "Password Reset" updated',
      timestamp: '2024-01-15T14:25:00Z',
      metadata: { templateId: 'template-002' }
    }
  ];

  return {
    ...notificationStats,
    ...templateStats,
    recentActivity
  };
};

/**
 * Fetch notification statistics for charts
 * @returns Promise<{
 *   dailyStats: Array<{ date: string; sent: number; delivered: number; failed: number }>;
 *   typeStats: Array<{ type: string; count: number }>;
 *   statusStats: Array<{ status: string; count: number }>;
 * }>
 */
export const fetchChartData = async () => {
  await delay(300);

  // Generate daily stats for the last 7 days
  const dailyStats = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Mock data - in production this would come from the backend
    const sent = Math.floor(Math.random() * 50) + 10;
    const delivered = Math.floor(sent * (0.85 + Math.random() * 0.1));
    const failed = sent - delivered;
    
    dailyStats.push({
      date: dateStr,
      sent,
      delivered,
      failed
    });
  }

  // Generate type statistics
  const typeStats = notificationsData.reduce((acc, notification) => {
    if (!acc[notification.type]) {
      acc[notification.type] = 0;
    }
    acc[notification.type]++;
    return acc;
  }, {} as Record<string, number>);

  const typeStatsArray = Object.entries(typeStats).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count
  }));

  // Generate status statistics
  const statusStats = notificationsData.reduce((acc, notification) => {
    if (!acc[notification.status]) {
      acc[notification.status] = 0;
    }
    acc[notification.status]++;
    return acc;
  }, {} as Record<string, number>);

  const statusStatsArray = Object.entries(statusStats).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count
  }));

  return {
    dailyStats,
    typeStats: typeStatsArray,
    statusStats: statusStatsArray
  };
};
