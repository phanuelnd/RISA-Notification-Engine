import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchTemplates, 
  fetchTemplateById, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  duplicateTemplate,
  fetchTemplateStats 
} from '../api/templates';
import type { Template, TemplateFilters, TableSort } from '../types';

/**
 * React Query hooks for template operations
 * Provides caching, background updates, and optimistic updates
 */

// Query keys for consistent caching
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (filters: TemplateFilters, sort: TableSort, page: number, limit: number) => 
    [...templateKeys.lists(), { filters, sort, page, limit }] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  stats: () => [...templateKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch templates with filtering, sorting, and pagination
 */
export const useTemplates = (
  filters: TemplateFilters = {},
  sort: TableSort = { column: 'createdAt', direction: 'desc' },
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: templateKeys.list(filters, sort, page, limit),
    queryFn: () => fetchTemplates(filters, sort, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch a single template by ID
 */
export const useTemplate = (id: string, accessToken: string ) => {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => fetchTemplateById(id, accessToken),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch template statistics
 */
export const useTemplateStats = () => {
  return useQuery({
    queryKey: templateKeys.stats(),
    queryFn: fetchTemplateStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to create a new template
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      // Invalidate and refetch templates list
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templateKeys.stats() });
    },
  });
};

/**
 * Hook to update a template
 */
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<any, any, { id: string; updates: Partial<Template>; accessToken: string }>({
    mutationFn: ({ id, updates, accessToken }: { id: string; updates: Partial<Template>; accessToken: string }) =>
      updateTemplate(id, updates, accessToken),
    onSuccess: (data: any, variables: { id: string; updates: Partial<Template>; accessToken: string }) => {
      // Update the specific template in cache
      queryClient.setQueryData(
        templateKeys.detail(variables.id),
        data.data
      );
      
      // Invalidate lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templateKeys.stats() });
    },
  });
};

/**
 * Hook to delete a template
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, { id: string; accessToken: string }>({
    mutationFn: ({ id, accessToken }: { id: string; accessToken: string }) => 
      deleteTemplate(id, accessToken),
    onSuccess: (_: any, variables: { id: string; accessToken: string }) => {
      // Remove the template from cache
      queryClient.removeQueries({ queryKey: templateKeys.detail(variables.id) });
      
      // Invalidate lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templateKeys.stats() });
    },
  });
};

/**
 * Hook to duplicate a template
 */
export const useDuplicateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      duplicateTemplate(id, newName),
    onSuccess: () => {
      // Invalidate lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templateKeys.stats() });
    },
  });
};

/**
 * Hook to prefetch template details
 */
export const usePrefetchTemplate = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: templateKeys.detail(id),
      queryFn: () => fetchTemplateById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};
