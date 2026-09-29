import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { ServiceForm } from './ServiceForm';
import type { Service } from '../../types';

interface ServiceDetailsProps {
  service: Service;
  onClose: () => void;
  onEdit?: (service: Service) => void;
}

/**
 * Service details view component
 * Displays comprehensive service information with edit capabilities
 */
export const ServiceDetails: React.FC<ServiceDetailsProps> = ({ 
  service, 
  onClose, 
  onEdit 
}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleEditSuccess = (updatedService: Service) => {
    setShowEditForm(false);
    onEdit?.(updatedService);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="Service Details" size="lg">
        <div className="space-y-6">
          {/* Service Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{service.service_name}</h2>
              <p className="text-lg font-mono text-primary-600">{service.service_code}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                service.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {service.is_active ? 'Active' : 'Inactive'}
              </span>
              <Button variant="outline" onClick={handleEdit}>
                Edit Service
              </Button>
            </div>
          </div>

          {/* Service Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Service Code</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{service.service_code}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Service Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{service.service_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{service.contact_email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Timestamps */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(service.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(service.updated_at)}</dd>
                </div>
              </dl>
            </Card>
          </div>

          {/* Description */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed">{service.description}</p>
          </Card>

          {/* API Key Section */}
          {service.api_key && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Key</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-2">Service API Key</p>
                    <div className="font-mono text-sm text-gray-900 break-all">
                      {showApiKey ? service.api_key : '••••••••••••••••••••••••••••••••'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </Button>
                    {showApiKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(service.api_key!)}
                      >
                        Copy
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ Keep your API key secure and never share it publicly
                </p>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handleEdit}>
              Edit Service
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Form Modal */}
      <ServiceForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSuccess={handleEditSuccess}
        editService={service}
      />
    </>
  );
};
