import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchNotifications, 
  fetchNotificationById, 
  createNotification, 
  updateNotificationStatus, 
  deleteNotification,
  fetchNotificationStats 
} from '../api/notifications';
import type { Notification, NotificationFilters, TableSort } from '../types';

/**
 * React Query hooks for notification operations
 * Provides caching, background updates, and optimistic updates
 */

// Query keys for consistent caching
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: NotificationFilters, sort: TableSort, page: number, limit: number) => 
    [...notificationKeys.lists(), { filters, sort, page, limit }] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch notifications with filtering, sorting, and pagination
 */
export const useNotifications = (
  filters: NotificationFilters = {},
  sort: TableSort = { column: 'createdAt', direction: 'desc' },
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: notificationKeys.list(filters, sort, page, limit),
    queryFn: () => fetchNotifications(filters, sort, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch a single notification by ID
 */
export const useNotification = (id: string) => {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => fetchNotificationById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch notification statistics
 */
export const useNotificationStats = () => {
  return useQuery({
    queryKey: notificationKeys.stats(),
    queryFn: fetchNotificationStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to create a new notification
 */
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      // Invalidate and refetch notifications list
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
    },
  });
};

/**
 * Hook to update notification status
 */
export const useUpdateNotificationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Notification['status'] }) =>
      updateNotificationStatus(id, status),
    onSuccess: (data, variables) => {
      // Update the specific notification in cache
      queryClient.setQueryData(
        notificationKeys.detail(variables.id),
        data.data
      );
      
      // Invalidate lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
    },
  });
};

/**
 * Hook to delete a notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: (_, notificationId) => {
      // Remove the notification from cache
      queryClient.removeQueries({ queryKey: notificationKeys.detail(notificationId) });
      
      // Invalidate lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() });
    },
  });
};

/**
 * Hook to prefetch notification details
 */
export const usePrefetchNotification = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: notificationKeys.detail(id),
      queryFn: () => fetchNotificationById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};
