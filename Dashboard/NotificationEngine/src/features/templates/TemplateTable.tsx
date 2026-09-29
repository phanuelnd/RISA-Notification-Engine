import React from 'react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import {
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Eye
} from 'lucide-react';
import type { Template, TableSort, TablePagination } from '../../types';

interface TemplateTableProps {
  data: Template[];
  pagination?: TablePagination;
  sort: TableSort;
  onSort: (sort: TableSort) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onEdit: (templateId: string) => void;
  onView: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  loading?: boolean;
}

/**
 * Template table component with sorting, pagination, and actions
 * Displays templates in a sortable, filterable table format
 */
export const TemplateTable: React.FC<TemplateTableProps> = ({
  data,
  pagination,
  sort,
  onSort,
  onPageChange,
  onLimitChange,
  onEdit,
  onView,
  onDelete,
  loading = false
}) => {
  const getTypeIcon = (type: Template['type']) => {
    const icons = {
      email: '📧',
      sms: '📱',
      push: '🔔',
      webhook: '🔗'
    };
    return icons[type] || '📄';
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Inactive
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const columns = [
    {
      key: 'name' as keyof Template,
      label: 'Template',
      sortable: true,
      render: (value: string, item: Template) => (
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getTypeIcon(item.type)}</span>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            {item.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {item.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'type' as keyof Template,
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-900 capitalize">{value}</span>
      )
    },
    {
      key: 'isActive' as keyof Template,
      label: 'Status',
      sortable: true,
      render: (value: boolean) => getStatusBadge(value)
    },
    {
      key: 'usageCount' as keyof Template,
      label: 'Usage',
      sortable: true,
      render: (value: number) => (
        <span className="text-sm text-gray-900">{value.toLocaleString()}</span>
      )
    },
    {
      key: 'createdAt' as keyof Template,
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-900">{formatDate(value)}</span>
      )
    },
    {
      key: 'lastUsed' as keyof Template,
      label: 'Last Used',
      sortable: true,
      render: (value: string | undefined) => (
        <span className="text-sm text-gray-900">
          {value ? formatDate(value) : 'Never'}
        </span>
      )
    },
    {
      key: 'actions' as keyof Template,
      label: 'Actions',
      sortable: false,
      render: (_: any, item: Template) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item.id)}
            className="p-1"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {/* <Button
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <Copy className="h-4 w-4" />
          </Button> */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(item.id)}
            className="p-1"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const limitOptions = [
    { value: '5', label: '5 per page' },
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
    { value: '100', label: '100 per page' }
  ];

  return (
    <div className="space-y-4">
      {/* Table */}
      <Table
        data={data}
        columns={columns}
        sort={sort}
        onSort={onSort}
        loading={loading}
        emptyMessage="No templates found"
      />

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between bg-white px-6 py-3 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Show</span>
              <Select
                value={pagination.limit.toString()}
                onChange={(value) => onLimitChange(parseInt(value))}
                options={limitOptions}
                className="w-32"
              />
              <span className="text-sm text-gray-700">of {pagination.total} results</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={!pagination.hasPrev}
                className="p-1"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="p-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="p-1"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(pagination.totalPages)}
                disabled={!pagination.hasNext}
                className="p-1"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
