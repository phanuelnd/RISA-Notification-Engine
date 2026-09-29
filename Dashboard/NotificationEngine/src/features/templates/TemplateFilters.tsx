import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { X } from 'lucide-react';
import type { TemplateFilters as FilterType, NotificationType } from '../../types';

interface TemplateFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: Partial<FilterType>) => void;
  onClose: () => void;
}

/**
 * Template filters component with filtering options
 * Supports type, status, and search filters
 */
export const TemplateFilters: React.FC<TemplateFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState<FilterType>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const typeOptions = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Push' },
    { value: 'webhook', label: 'Webhook' }
  ];

  const statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
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

  const handleTypeChange = (value: string) => {
    const typeArray = value ? [value as NotificationType] : [];
    handleFilterChange('type', typeArray);
  };

  const handleStatusChange = (value: string) => {
    if (value === '') {
      handleFilterChange('isActive', undefined);
    } else {
      handleFilterChange('isActive', value === 'true');
    }
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Search */}
        <div>
          <Input
            label="Search"
            placeholder="Search templates..."
            value={localFilters.search || ''}
            onChange={(value) => handleFilterChange('search', value)}
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

        {/* Status filter */}
        <div>
          <Select
            label="Status"
            placeholder="All statuses"
            value={localFilters.isActive !== undefined ? localFilters.isActive.toString() : ''}
            onChange={handleStatusChange}
            options={statusOptions}
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
