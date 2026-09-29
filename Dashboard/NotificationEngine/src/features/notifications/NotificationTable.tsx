import React from 'react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { 
  Eye, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import type { Notification, TableSort, TablePagination } from '../../types';

interface NotificationTableProps {
  data: Notification[];
  pagination?: TablePagination;
  sort: TableSort;
  onSort: (sort: TableSort) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRowClick: (notificationId: string) => void;
  loading?: boolean;
}

/**
 * Notification table component with sorting, pagination, and actions
 * Displays notifications in a sortable, filterable table format
 */
export const NotificationTable: React.FC<NotificationTableProps> = ({
  data,
  pagination,
  sort,
  onSort,
  onPageChange,
  onLimitChange,
  onRowClick,
  loading = false
}) => {
  const getStatusBadge = (status: Notification['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: Notification['type']) => {
    const icons = {
      email: '📧',
      sms: '📱',
      push: '🔔',
      webhook: '🔗'
    };
    return icons[type] || '📄';
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    const colors = {
      low: 'text-gray-500',
      normal: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500'
    };
    return colors[priority] || 'text-gray-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      key: 'title' as keyof Notification,
      label: 'Title',
      sortable: true,
      render: (value: string, item: Notification) => (
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getTypeIcon(item.type)}</span>
          <div>
            <div className="font-medium text-gray-900 truncate max-w-xs">
              {value}
            </div>
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {item.recipient}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'type' as keyof Notification,
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-900 capitalize">{value}</span>
      )
    },
    {
      key: 'status' as keyof Notification,
      label: 'Status',
      sortable: true,
      render: (value: Notification['status']) => getStatusBadge(value)
    },
    {
      key: 'priority' as keyof Notification,
      label: 'Priority',
      sortable: true,
      render: (value: Notification['priority']) => (
        <span className={`text-sm font-medium capitalize ${getPriorityColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'createdAt' as keyof Notification,
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-900">{formatDate(value)}</span>
      )
    },
    {
      key: 'actions' as keyof Notification,
      label: 'Actions',
      sortable: false,
      render: (_: any, item: Notification) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRowClick(item.id)}
            className="p-1"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const limitOptions = [
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
        emptyMessage="No notifications found"
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
