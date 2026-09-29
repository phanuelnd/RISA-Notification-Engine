import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchChartData } from '../api/dashboard';

/**
 * React Query hooks for dashboard data
 * Provides caching and background updates for dashboard statistics
 */

// Query keys for consistent caching
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  charts: () => [...dashboardKeys.all, 'charts'] as const,
};

/**
 * Hook to fetch dashboard statistics
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch chart data for dashboard
 */
export const useChartData = () => {
  return useQuery({
    queryKey: dashboardKeys.charts(),
    queryFn: fetchChartData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
