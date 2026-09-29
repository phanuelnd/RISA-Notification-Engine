import { create } from 'zustand';
import type { Notification, NotificationFilters, TableSort, TablePagination } from '../types';

interface NotificationStore {
  // State
  notifications: Notification[];
  selectedNotification: Notification | null;
  filters: NotificationFilters;
  sort: TableSort;
  pagination: TablePagination;
  isLoading: boolean;
  error: string | null;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  setSelectedNotification: (notification: Notification | null) => void;
  setFilters: (filters: Partial<NotificationFilters>) => void;
  setSort: (sort: TableSort) => void;
  setPagination: (pagination: Partial<TablePagination>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearFilters: () => void;
  resetPagination: () => void;
}

/**
 * Notification store for managing notification data and UI state
 * Handles filtering, sorting, pagination, and selection
 */
export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],
  selectedNotification: null,
  filters: {},
  sort: { column: 'createdAt', direction: 'desc' },
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
  isLoading: false,
  error: null,

  // Actions
  setNotifications: (notifications) => {
    set({ notifications });
  },

  setSelectedNotification: (notification) => {
    set({ selectedNotification: notification });
  },

  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ 
      filters: updatedFilters,
      pagination: { ...get().pagination, page: 1 } // Reset to first page when filters change
    });
  },

  setSort: (sort) => {
    set({ sort });
  },

  setPagination: (newPagination) => {
    const currentPagination = get().pagination;
    set({ 
      pagination: { ...currentPagination, ...newPagination }
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  clearFilters: () => {
    set({ 
      filters: {},
      pagination: { ...get().pagination, page: 1 }
    });
  },

  resetPagination: () => {
    set({ 
      pagination: { ...get().pagination, page: 1 }
    });
  }
}));
