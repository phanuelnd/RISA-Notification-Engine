import React from 'react';

/**
 * Core data types for the Notification Engine system
 * These interfaces define the structure of all data entities used throughout the application
 */

// User authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
}

// Service types
export interface Service {
  id: string;
  service_code: string;
  service_name: string;
  description: string;
  contact_email: string;
  is_active: boolean;
  api_key?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceFormData {
  service_code: string;
  service_name: string;
  description: string;
  contact_email: string;
  is_active: boolean;
}

// API Response types
export interface LoginResponse {
  success: boolean;
  message: string;
  status_code: number;
  data: {
    user: User;
    tokens: {
      refresh: string;
      access: string;
    };
  };
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  status_code: number;
  data: Service;
}

export interface ServicesResponse {
  success: boolean;
  message: string;
  status_code: number;
  data: Service[];
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  status_code: number;
}

// Notification types
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
export type NotificationType = 'email' | 'sms' | 'push' | 'webhook';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  priority: NotificationPriority;
  recipient: string;
  recipientName?: string;
  templateId?: string;
  templateName?: string;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Template types
export interface Template {
  id: string;
  name: string;
  description?: string;
  type: NotificationType;
  subject?: string; // For email templates
  content: string;
  variables: string[]; // List of variable names used in the template
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastUsed?: string;
  usageCount: number;
  service?: string;
}

// Dashboard statistics types
export interface DashboardStats {
  totalNotifications: number;
  sentNotifications: number;
  deliveredNotifications: number;
  failedNotifications: number;
  pendingNotifications: number;
  totalTemplates: number;
  activeTemplates: number;
  recentActivity: NotificationActivity[];
}

export interface NotificationActivity {
  id: string;
  type: 'notification_sent' | 'notification_delivered' | 'notification_failed' | 'template_created' | 'template_updated';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter and search types
export interface NotificationFilters {
  status?: NotificationStatus[];
  type?: NotificationType[];
  priority?: NotificationPriority[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface TemplateFilters {
  type?: NotificationType[];
  isActive?: boolean;
  search?: string;
}

// Table and UI types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface TablePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form types
export interface NotificationFormData {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipient: string;
  recipientName?: string;
  templateId?: string;
  scheduledAt?: string;
  metadata?: Record<string, any>;
}

export interface TemplateFormData {
  name: string;
  description?: string;
  type: NotificationType;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  service?: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Navigation types
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hover?: boolean;
}
