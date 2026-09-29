import React, { useState } from 'react';
import { useTemplates } from '../../hooks/useTemplates';
import { useTemplateStore } from '../../store/useTemplateStore';
import { TemplateTable } from './TemplateTable';
import { TemplateFilters } from './TemplateFilters';
import TemplateForm from './TemplateForm.tsx';
import { DeleteTemplateModal } from './TemplateDeleteConfirm';
import { PreviewTemplateModal } from './PreviewTemplateModal';
import { Button } from '../../components/ui/Button';
import { Plus, Filter, Download } from 'lucide-react';
import type { TemplateFilters as FilterType } from '../../types';

/**
 * Main templates page with table, filters, and CRUD operations
 * Provides template management with full CRUD functionality
 */
export const TemplatesPage: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const { filters, sort, pagination, setFilters, setSort, setPagination } = useTemplateStore();

  const {
    data: templatesData,
    isLoading,
    error
  } = useTemplates(filters, sort, pagination.page, pagination.limit);

  const handleFilterChange = (newFilters: Partial<FilterType>) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: { column: string; direction: 'asc' | 'desc' }) => {
    setSort(newSort);
  };

  const handlePageChange = (page: number) => {
    setPagination({ page });
  };

  const handleLimitChange = (limit: number) => {
    setPagination({ page: 1, limit });
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleEditTemplate = (templateId: string) => {
    setEditingTemplate(templateId);
    setShowForm(true);
  };



  const handleDeleteTemplate = (templateId: string) => {
    setDeleteTemplateId(templateId);
    setShowConfirmDelete(true);
  };

  const handlePreviewTemplate = (templateId: string) => {
    setPreviewTemplateId(templateId);
    setShowPreview(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  if (error) {
    return (
      <>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Templates</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
          <div className="mt-6">
            <Button variant="primary" onClick={handleCreateTemplate} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Template</span>
            </Button>
          </div>
        </div>
        {/* Ensure modal can still open even when list load failed */}
        {showForm && (
          <TemplateForm
            templateId={editingTemplate}
            onClose={handleCloseForm}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage your notification templates
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateTemplate}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Template</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <TemplateFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Templates table */}
      <TemplateTable
        data={templatesData?.data || []}
        pagination={templatesData?.pagination}
        sort={sort}
        onSort={handleSortChange}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onView={handlePreviewTemplate}
        onEdit={handleEditTemplate}
        onDelete={handleDeleteTemplate}
        loading={isLoading}
      />

      {/* Template form modal */}
      {showForm && (
        <TemplateForm
          templateId={editingTemplate}
          onClose={handleCloseForm}
        />
      )}

      {/* Confirm delete modal */}
      {showConfirmDelete && deleteTemplateId && (
        <DeleteTemplateModal
          templateId={deleteTemplateId}
          onClose={() => setShowConfirmDelete(false)}
        />
      )}

      {/* Preview modal */}
      {showPreview && (
        <PreviewTemplateModal
          templateId={previewTemplateId}
          onClose={() => setShowPreview(false)}
        />
      )}

    </div>
  );
};


