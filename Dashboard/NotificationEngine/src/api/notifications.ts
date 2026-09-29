import type { Notification, NotificationFilters, PaginatedResponse, ApiResponse } from '../types';
// import notificationsData from '../data/notifications.json';

/**
 * Notifications API client
 * Makes HTTP requests to the backend
 */

// API configuration
// In Docker/production, nginx proxies /api to backend, so always use relative path
// Only use absolute URL if explicitly set via env variable
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch notifications with filtering, sorting, and pagination
 * @param filters - Filter criteria
 * @param sort - Sort configuration
 * @param page - Page number
 * @param limit - Items per page
 * @returns Promise<PaginatedResponse<Notification>>
 */
export const fetchNotifications = async (
  filters: NotificationFilters = {},
  sort: { column: string; direction: 'asc' | 'desc' } = { column: 'createdAt', direction: 'desc' },
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Notification>> => {
  // await delay(500); // Simulate network delay

  // Fetch all notifications from backend
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE}/notifications/list/`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  const backendData: Notification[] = await response.json();

  let filteredData = [...backendData];

  // let filteredData = [...notificationsData] as Notification[];

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    filteredData = filteredData.filter(notification =>
      filters.status!.includes(notification.status)
    );
  }

  if (filters.type && filters.type.length > 0) {
    filteredData = filteredData.filter(notification =>
      filters.type!.includes(notification.type)
    );
  }

  if (filters.priority && filters.priority.length > 0) {
    filteredData = filteredData.filter(notification =>
      filters.priority!.includes(notification.priority)
    );
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredData = filteredData.filter(notification =>
      notification.title.toLowerCase().includes(searchTerm) ||
      notification.message.toLowerCase().includes(searchTerm) ||
      notification.recipient.toLowerCase().includes(searchTerm) ||
      (notification.recipientName && notification.recipientName.toLowerCase().includes(searchTerm))
    );
  }

  if (filters.dateRange) {
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    filteredData = filteredData.filter(notification => {
      const notificationDate = new Date(notification.createdAt);
      return notificationDate >= startDate && notificationDate <= endDate;
    });
  }

  // Apply sorting
  filteredData.sort((a, b) => {
    const aValue = a[sort.column as keyof Notification];
    const bValue = b[sort.column as keyof Notification];

    if (aValue && bValue && aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
    if (aValue && bValue && aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Apply pagination
  const total = filteredData.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

/**
 * Fetch a single notification by ID
 * @param id - Notification ID
 * @returns Promise<Notification | null>
 */
export const fetchNotificationById = async (id: string): Promise<Notification | null> => {
  // await delay(100); // Reduced delay for better UX
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE}/notifications/${id}`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  if (!response.ok) return null;
  return await response.json();
};
// const notification = notificationsData.find(notif => notif.id === id);
// return notification as Notification | null;
// };

/**
 * Create a new notification
 * @param notificationData - Notification data
 * @returns Promise<ApiResponse<Notification>>
 */
export const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Notification>> => {
  await delay(800);

  const newNotification: Notification = {
    ...notificationData,
    id: `notif-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // In production, this would make an API call
  // For now, we'll just return the created notification
  return {
    data: newNotification,
    success: true,
    message: 'Notification created successfully'
  };
};

/**
 * Update notification status
 * @param id - Notification ID
 * @param status - New status
 * @returns Promise<ApiResponse<Notification>>
 */
export const updateNotificationStatus = async (id: string, status: Notification['status']): Promise<ApiResponse<Notification>> => {
  const response = await fetch(`${API_BASE}/notifications/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    return {
      data: null as any,
      success: false,
      message: 'Notification not found'
    };
  }
  const data = await response.json();
  return {
    data,
    success: true,
    message: 'Notification status updated successfully'
  };
};

/**
 * Delete a notification
 * @param id - Notification ID
 * @returns Promise<ApiResponse<boolean>>
 */
export const deleteNotification = async (id: string): Promise<ApiResponse<boolean>> => {
  // await delay(500);
 const response = await fetch(`${API_BASE}/notifications/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    return {
      data: false,
      success: false,
      message: 'Notification not found'
    };
  }
  return {
    data: true,
    success: true,
    message: 'Notification deleted successfully'
  };
};

/**
 * Get notification statistics for dashboard
 * @returns Promise<{
 *   total: number;
 *   sent: number;
 *   delivered: number;
 *   failed: number;
 *   pending: number;
 * }>
 */
export const fetchNotificationStats = async () => {
  // await delay(300);
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE}/notifications/stats`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  if (!response.ok) {
    return {
      total: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      pending: 0
    };
  }
  return await response.json();

  // const stats = notificationsData.reduce((acc, notification) => {
  //   acc.total++;
  //   switch (notification.status) {
  //     case 'sent':
  //       acc.sent++;
  //       break;
  //     case 'delivered':
  //       acc.delivered++;
  //       break;
  //     case 'failed':
  //       acc.failed++;
  //       break;
  //     case 'pending':
  //       acc.pending++;
  //       break;
  //   }
  //   return acc;
  // }, {
  //   total: 0,
  //   sent: 0,
  //   delivered: 0,
  //   failed: 0,
  //   pending: 0
  // });

  // return stats;
};

/**
 * Send bulk notifications (email or SMS)
 * POST: /notifications/send/
 */
export async function sendBulkNotifications(
  body: {
    recipients: Array<Record<string, any>>;
    subject: string;
    message: string;
    webhook_url?: string;
    metadata?: Record<string, any>;
  },
  apiKey: string
) {
  const res = await fetch(`${API_BASE}/notifications/send/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    // Extract detailed validation errors if available
    let errorMessage = data?.message || 'Failed to queue notification request';
    
    if (data?.errors && typeof data.errors === 'object') {
      const errorDetails = Object.entries(data.errors)
        .map(([field, errors]: [string, any]) => {
          const errorList = Array.isArray(errors) ? errors.join(', ') : String(errors);
          return `${field}: ${errorList}`;
        })
        .join('; ');
      
      if (errorDetails) {
        errorMessage = `${errorMessage}. ${errorDetails}`;
      }
    }
    
    const error = new Error(errorMessage);
    (error as any).response = { status: res.status, data };
    throw error;
  }
  return data;
}

/**
 * Get notification request status by id
 * GET: /notifications/requests/{id}/
 */
export async function getNotificationRequestStatus(requestId: string, apiKey: string) {
  const res = await fetch(`${API_BASE}/notifications/requests/${requestId}/`, {
    headers: {
      'X-API-Key': apiKey,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to fetch request status');
  }
  return data;
}
