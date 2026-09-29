import type { Template, TemplateFilters, PaginatedResponse, ApiResponse } from '../types';

// Resolve base URL robustly; avoid "undefined/notifications"
// In Docker/production, nginx proxies /api to backend, so always use relative path
const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE_URL = `${BASE}/notifications`;

const apiCall = async (endpoint: string, options?: RequestInit) => {

  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    ...options,
  });
  const result = await response.json();
  return result;
};

/**
 * Fetch templates with filtering, sorting, and pagination
 * @param filters - Filter criteria
 * @param sort - Sort configuration
 * @param page - Page number
 * @param limit - Items per page
 * @returns Promise<PaginatedResponse<Template>>
 */

export const fetchTemplates = async (
  filters: TemplateFilters = {},
  sort: { column: string; direction: 'asc' | 'desc' } = { column: 'createdAt', direction: 'desc' },
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Template>> => {
  const response = await apiCall('/templates/list');

  let filteredData = [...response.data] as Template[];

  if (filters.type && filters.type.length > 0) {
    filteredData = filteredData.filter(template =>
      filters.type!.includes(template.type)
    );
  }

  if (filters.isActive !== undefined) {
    filteredData = filteredData.filter(template =>
      template.isActive === filters.isActive
    );
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredData = filteredData.filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description?.toLowerCase().includes(searchTerm) ||
      template.content.toLowerCase().includes(searchTerm)
    );
  }

  filteredData.sort((a, b) => {
    const aValue = a[sort.column as keyof Template];
    const bValue = b[sort.column as keyof Template];

    if (aValue == null || bValue == null) return 0;
    if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });

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
 * Fetch a single template by ID
 * @param id - Template ID
 * @param accessToken - Optional access token for authentication
 * @returns Promise<Template | null>
 */
export const fetchTemplateById = async (id: string, accessToken?: string): Promise<Template | null> => {
  try {
    const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined;
    const data = await apiCall(`/templates/${id}/`, { headers });
    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Create a new template
 * @param templateData - Template data
 * @returns Promise<ApiResponse<Template>>
 */
export const createTemplate = async (templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> & { accessToken?: string }): Promise<ApiResponse<Template>> => {

  const backendData: any = {
    template_code: `template-${Date.now()}`,
    template_name: templateData.name,
    channel_type: templateData.type.toUpperCase(),
    variables: templateData.variables || [],
    body_template: templateData.content,
    subject_template: templateData.subject || null,
    category: templateData.description || null,
    is_active: templateData.isActive,
    service: templateData.service || 1
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${templateData.accessToken}`
  }
  const response = await apiCall('/templates/', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(backendData),
  });

  return {
    data: response.data,
    success: response.success,
    message: response.message || 'Template created successfully'
  };
};

/**
 * Update a template
 * @param id - Template ID
 * @param updates - Template updates
 * @returns Promise<ApiResponse<Template>>
 */
export const updateTemplate = async (id: string, updates: Partial<Template>, accessToken: string): Promise<ApiResponse<Template>> => {

  // let template: Template | null = null;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  }
  // Map form/update fields to backend API model
  const updatedTemplate: any = {
    // Always update timestamp
    updated_at: new Date().toISOString()
  };

  // Only include fields that were provided in `updates`
  if (updates.name !== undefined) {
    updatedTemplate.template_name = updates.name;
  }
  if (updates.type !== undefined) {
    // backend expects channel type in upper case
    updatedTemplate.channel_type = (updates.type as string).toUpperCase();
  }
  if (updates.variables !== undefined) {
    updatedTemplate.variables = updates.variables;
  }
  if (updates.content !== undefined) {
    updatedTemplate.body_template = updates.content;
  }
  if (updates.subject !== undefined) {
    updatedTemplate.subject_template = updates.subject;
  }
  if (updates.description !== undefined) {
    updatedTemplate.category = updates.description;
  }
  if (updates.isActive !== undefined) {
    updatedTemplate.is_active = updates.isActive;
  }
  if (updates.service !== undefined) {
    updatedTemplate.service = updates.service;
  }
  // allow optional template_code updates if provided by the form
  if ((updates as any).template_code !== undefined) {
    updatedTemplate.template_code = (updates as any).template_code;
  }

  const response = await apiCall(`/templates/${id}/update`, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(updatedTemplate),
  });

  return {
    data: response.data,
    success: response.success,
    message: response.message || 'Template updated successfully'
  };
};

/**
 * Delete a template
 * @param id - Template ID
 * @returns Promise<ApiResponse<boolean>>
 */
export const deleteTemplate = async (id: string, accessToken: string): Promise<ApiResponse<boolean>> => {
  // let template: Template | null = null;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  }
  const response = await apiCall(`/templates/${id}/`, {
    method: 'DELETE',
    headers: headers,
  });

  return {
    data: response.success,
    success: response.success,
    message: response.message || 'Template deleted successfully'
  };
};

/**
 * Duplicate a template
 * @param id - Template ID
 * @param newName - New template name
 * @returns Promise<ApiResponse<Template>>
 */
export const duplicateTemplate = async (id: string, newName: string): Promise<ApiResponse<Template>> => {
  const originalTemplate = await fetchTemplateById(id);
  if (!originalTemplate) {
    return {
      data: null as any,
      success: false,
      message: 'Template not found'
    };
  }

  const duplicatedTemplate: Template = {
    ...originalTemplate,
    id: `template-${Date.now()}`,
    name: newName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  } as Template;

  return {
    data: duplicatedTemplate,
    success: true,
    message: 'Template duplicated successfully'
  };
};

/**
 * Get template statistics for dashboard
 * @returns Promise<{
 *   total: number;
 *   active: number;
 *   inactive: number;
 *   byType: Record<string, number>;
 * }>
 */
export const fetchTemplateStats = async () => {
  const response = await apiCall('/templates/list');
  const data = response.data as Template[];

  const stats = data.reduce((acc: any, template: Template) => {
    acc.total++;
    if (template.isActive) {
      acc.active++;
    } else {
      acc.inactive++;
    }

    if (!acc.byType[template.type]) {
      acc.byType[template.type] = 0;
    }
    acc.byType[template.type]++;

    return acc;
  }, {
    total: 0,
    active: 0,
    inactive: 0,
    byType: {} as Record<string, number>
  });

  return stats;
};
