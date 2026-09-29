import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { X } from 'lucide-react';
import type { NotificationFilters as FilterType, NotificationStatus, NotificationType, NotificationPriority } from '../../types';

interface NotificationFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: Partial<FilterType>) => void;
  onClose: () => void;
}

/**
 * Notification filters component with advanced filtering options
 * Supports status, type, priority, date range, and search filters
 */
export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState<FilterType>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'sent', label: 'Sent' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const typeOptions = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Push' },
    { value: 'webhook', label: 'Webhook' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const handleFilterChange = (key: keyof FilterType, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterType = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const handleStatusChange = (value: string) => {
    const statusArray = value ? [value as NotificationStatus] : [];
    handleFilterChange('status', statusArray);
  };

  const handleTypeChange = (value: string) => {
    const typeArray = value ? [value as NotificationType] : [];
    handleFilterChange('type', typeArray);
  };

  const handlePriorityChange = (value: string) => {
    const priorityArray = value ? [value as NotificationPriority] : [];
    handleFilterChange('priority', priorityArray);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ''
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div>
          <Input
            label="Search"
            placeholder="Search notifications..."
            value={localFilters.search || ''}
            onChange={(value) => handleFilterChange('search', value)}
          />
        </div>

        {/* Status filter */}
        <div>
          <Select
            label="Status"
            placeholder="All statuses"
            value={localFilters.status?.[0] || ''}
            onChange={handleStatusChange}
            options={statusOptions}
          />
        </div>

        {/* Type filter */}
        <div>
          <Select
            label="Type"
            placeholder="All types"
            value={localFilters.type?.[0] || ''}
            onChange={handleTypeChange}
            options={typeOptions}
          />
        </div>

        {/* Priority filter */}
        <div>
          <Select
            label="Priority"
            placeholder="All priorities"
            value={localFilters.priority?.[0] || ''}
            onChange={handlePriorityChange}
            options={priorityOptions}
          />
        </div>
      </div>

      {/* Date range filters */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Input
            label="From Date"
            type="date"
            value={localFilters.dateRange?.start || ''}
            onChange={(value) => handleFilterChange('dateRange', {
              ...localFilters.dateRange,
              start: value
            })}
          />
        </div>
        <div>
          <Input
            label="To Date"
            type="date"
            value={localFilters.dateRange?.end || ''}
            onChange={(value) => handleFilterChange('dateRange', {
              ...localFilters.dateRange,
              end: value
            })}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex items-center justify-end space-x-3">
        <Button
          variant="outline"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          Clear All
        </Button>
        <Button
          variant="primary"
          onClick={handleApplyFilters}
        >
          Apply Filters
        </Button>
      </div>
    </Card>
  );
};
