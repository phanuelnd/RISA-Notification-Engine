import { create } from 'zustand';
import type { Template, TemplateFilters, TableSort, TablePagination } from '../types';

interface TemplateStore {
  // State
  templates: Template[];
  selectedTemplate: Template | null;
  filters: TemplateFilters;
  sort: TableSort;
  pagination: TablePagination;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTemplates: (templates: Template[]) => void;
  setSelectedTemplate: (template: Template | null) => void;
  setFilters: (filters: Partial<TemplateFilters>) => void;
  setSort: (sort: TableSort) => void;
  setPagination: (pagination: Partial<TablePagination>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearFilters: () => void;
  resetPagination: () => void;
  addTemplate: (template: Template) => void;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
}

/**
 * Template store for managing template data and UI state
 * Handles CRUD operations, filtering, sorting, and pagination
 */
export const useTemplateStore = create<TemplateStore>((set, get) => ({
  // Initial state
  templates: [],
  selectedTemplate: null,
  filters: {},
  sort: { column: 'createdAt', direction: 'desc' },
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
  isLoading: false,
  error: null,

  // Actions
  setTemplates: (templates) => {
    set({ templates });
  },

  setSelectedTemplate: (template) => {
    set({ selectedTemplate: template });
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
  },

  addTemplate: (template) => {
    const currentTemplates = get().templates;
    set({ 
      templates: [template, ...currentTemplates],
      pagination: { ...get().pagination, total: currentTemplates.length + 1 }
    });
  },

  updateTemplate: (id, updates) => {
    const currentTemplates = get().templates;
    const updatedTemplates = currentTemplates.map(template =>
      template.id === id ? { ...template, ...updates, updatedAt: new Date().toISOString() } : template
    );
    set({ templates: updatedTemplates });
  },

  deleteTemplate: (id) => {
    const currentTemplates = get().templates;
    const filteredTemplates = currentTemplates.filter(template => template.id !== id);
    set({ 
      templates: filteredTemplates,
      pagination: { ...get().pagination, total: filteredTemplates.length }
    });
  }
}));
