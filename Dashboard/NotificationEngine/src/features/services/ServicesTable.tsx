import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { useServicesStore } from '../../store/useServicesStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Service } from '../../types';

interface ServicesTableProps {
  onEditService?: (service: Service) => void;
  onViewService?: (service: Service) => void;
}

// Stable, portal-based delete confirmation modal with persistent overlay
const DeleteConfirmModal: React.FC<{
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}> = React.memo(({ onCancel, onConfirm, loading }) => {
  return createPortal(
    <>
      {/* Persistent overlay rendered once to the body, independent of modal content re-renders */}
      <div className="fixed inset-0 z-[1300] bg-black/40 backdrop-blur-sm" />

      {/* Modal content */}
      <div className="fixed inset-0 z-[1350] flex items-center justify-center">
        <div className="w-full max-w-md mx-4 rounded-md bg-white shadow-xl border">
          <div className="mt-3 text-center p-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Service</h3>
            <div className="mt-2 px-2">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this service? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 rounded-md border border-red-600 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
});

/**
 * Services table component with search, filtering, and CRUD operations
 * Displays all services in a professional table format
 */
export const ServicesTable: React.FC<ServicesTableProps> = ({ 
  onEditService, 
  onViewService 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const { 
    services, 
    isLoading, 
    error, 
    deleteService, 
    isDeleting,
    clearError 
  } = useServicesStore();
  
  const { accessToken } = useAuthStore();

  // Filter services based on search term and status
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.service_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.contact_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && service.is_active) ||
      (statusFilter === 'inactive' && !service.is_active);

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (serviceId: string) => {
    if (!accessToken) return;

    try {
      const success = await deleteService(serviceId, accessToken);
      if (success) {
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const onCancelDelete = useCallback(() => setShowDeleteConfirm(null), []);
  const onConfirmDelete = useCallback(() => {
    if (showDeleteConfirm) {
      void handleDelete(showDeleteConfirm);
    }
  }, [showDeleteConfirm, accessToken]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tableColumns = [
    {
      key: 'service_code' as keyof Service,
      label: 'Service Code',
      sortable: true,
      render: (value: string) => (
        <div className="font-mono font-semibold text-primary-600">
          {value}
        </div>
      )
    },
    {
      key: 'service_name' as keyof Service,
      label: 'Service Name',
      sortable: true,
      render: (value: string, service: Service) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {service.description}
          </div>
        </div>
      )
    },
    {
      key: 'contact_email' as keyof Service,
      label: 'Contact Email',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-gray-600">{value}</div>
      )
    },
    {
      key: 'is_active' as keyof Service,
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'created_at' as keyof Service,
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-gray-500">
          {formatDate(value)}
        </div>
      )
    },
    {
      key: 'actions' as keyof Service,
      label: 'Actions',
      render: (_: any, service: Service) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewService?.(service)}
            className="text-xs"
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditService?.(service)}
            className="text-xs"
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(service.id)}
            className="text-xs"
            disabled={isDeleting}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  // Show a full-screen error only if we have no data at all (initial load failure)
  if (error && services.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Services</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" onClick={clearError}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inline action error (keep table visible) */}
      {error && services.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Action Failed</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-3">
                <Button variant="outline" onClick={clearError} className="text-red-700 border-red-300 hover:bg-red-50">
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filter Controls */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="w-full"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Services Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Services ({filteredServices.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <Table
            data={filteredServices}
            columns={tableColumns}
            loading={isLoading}
            emptyMessage="No services found. Create your first service to get started."
          />
        </div>
      </Card>

      {/* Delete Confirmation Modal (portal-based with persistent overlay) */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
          loading={isDeleting}
        />
      )}
    </div>
  );
};
