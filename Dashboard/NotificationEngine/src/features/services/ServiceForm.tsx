import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useServicesStore } from '../../store/useServicesStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { ServiceFormData } from '../../types';

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (service: any) => void;
  editService?: any;
}

// Stable portal-based modal with persistent backdrop
const StableServiceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = React.memo(({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Persistent backdrop - rendered once, never re-renders */}
      <div className="fixed inset-0 z-[1300] bg-black/40 backdrop-blur-sm" />
      
      {/* Modal content */}
      <div className="fixed inset-0 z-[1350] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
});

// Stable API key modal
const StableApiKeyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = React.memo(({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Persistent backdrop */}
      <div className="fixed inset-0 z-[1300] bg-black/40 backdrop-blur-sm" />
      
      {/* Modal content */}
      <div className="fixed inset-0 z-[1350] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl border">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
});

/**
 * Service creation/editing form component
 * Handles form validation and submission for service CRUD operations
 */
export const ServiceForm: React.FC<ServiceFormProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  editService 
}) => {
  const [formData, setFormData] = useState<ServiceFormData>({
    service_code: '',
    service_name: '',
    description: '',
    contact_email: '',
    is_active: true
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormData, string>>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');

  const { createService, updateService, isCreating, isUpdating, error, clearError } = useServicesStore();
  const { accessToken } = useAuthStore();

  const isLoading = isCreating || isUpdating;

  // Populate form when editing
  useEffect(() => {
    if (editService) {
      setFormData({
        service_code: editService.service_code || '',
        service_name: editService.service_name || '',
        description: editService.description || '',
        contact_email: editService.contact_email || '',
        is_active: editService.is_active ?? true
      });
    } else {
      setFormData({
        service_code: '',
        service_name: '',
        description: '',
        contact_email: '',
        is_active: true
      });
    }
  }, [editService, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ServiceFormData, string>> = {};

    // Service code validation
    if (!formData.service_code.trim()) {
      newErrors.service_code = 'Service code is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData.service_code)) {
      newErrors.service_code = 'Service code must contain only uppercase letters, numbers, and underscores';
    } else if (formData.service_code.length < 3) {
      newErrors.service_code = 'Service code must be at least 3 characters';
    }

    // Service name validation
    if (!formData.service_name.trim()) {
      newErrors.service_name = 'Service name is required';
    } else if (formData.service_name.length < 3) {
      newErrors.service_name = 'Service name must be at least 3 characters';
    }

    // Description validation - only require if provided
    if (formData.description.trim() && formData.description.length < 3) {
      newErrors.description = 'Description must be at least 3 characters if provided';
    }

    // Email validation
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !accessToken) return;

    clearError();

    try {
      let result;
      if (editService) {
        result = await updateService(editService.id, formData, accessToken);
      } else {
        result = await createService(formData, accessToken);
      }

      if (result) {
        // If creating a new service and it has an API key, show it
        if (!editService && result.api_key) {
          setNewApiKey(result.api_key);
          setShowApiKey(true);
        }
        
        onSuccess?.(result);
        handleClose();
      }
    } catch (err) {
      console.error('Service operation failed:', err);
    }
  }, [formData, accessToken, editService, validateForm, clearError, updateService, createService, onSuccess]);

  const handleClose = useCallback(() => {
    setFormData({
      service_code: '',
      service_name: '',
      description: '',
      contact_email: '',
      is_active: true
    });
    setErrors({});
    clearError();
    setShowApiKey(false);
    setNewApiKey('');
    onClose();
  }, [clearError, onClose]);

  const handleInputChange = useCallback((field: keyof ServiceFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const copyApiKey = useCallback(() => {
    navigator.clipboard.writeText(newApiKey);
    // You could add a toast notification here
  }, [newApiKey]);

  return (
    <>
      <StableServiceModal
        isOpen={isOpen}
        onClose={handleClose}
        title={editService ? 'Edit Service' : 'Create New Service'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General error */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Code */}
            <div className="md:col-span-1">
              <Input
                label="Service Code"
                type="text"
                placeholder="e.g., MINICT"
                value={formData.service_code}
                onChange={(value) => handleInputChange('service_code', value.toUpperCase())}
                error={errors.service_code}
                required
                disabled={isLoading}
                className="uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for the service (uppercase letters, numbers, underscores only)
              </p>
            </div>

            {/* Service Name */}
            <div className="md:col-span-1">
              <Input
                label="Service Name"
                type="text"
                placeholder="e.g., Ministry of Infrastructure"
                value={formData.service_name}
                onChange={(value) => handleInputChange('service_name', value)}
                error={errors.service_name}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this service does..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              rows={3}
              required
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <Input
              label="Contact Email"
              type="email"
              placeholder="contact@service.gov.rw"
              value={formData.contact_email}
              onChange={(value) => handleInputChange('contact_email', value)}
              error={errors.contact_email}
              required
              disabled={isLoading}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
              disabled={isLoading}
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Service is active
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
            >
              {editService ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </StableServiceModal>

      {/* API Key Display Modal */}
      <StableApiKeyModal
        isOpen={showApiKey}
        onClose={() => setShowApiKey(false)}
        title="Service Created Successfully"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Service created successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your service has been created and is ready to use. Please save the API key below securely.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="flex">
              <input
                type="text"
                value={newApiKey}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={copyApiKey}
                className="rounded-l-none border-l-0"
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-red-600 mt-2">
              ⚠️ This API key will only be shown once. Please copy and store it securely.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowApiKey(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      </StableApiKeyModal>
    </>
  );
};
