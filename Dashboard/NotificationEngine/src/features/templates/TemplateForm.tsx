import React, { useState, useEffect } from 'react';
import { useTemplate, useCreateTemplate, useUpdateTemplate } from '../../hooks/useTemplates';
import { ServicesAPI } from '../../api/services';
import { useAuthStore } from '../../store/useAuthStore';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import type { TemplateFormData, NotificationType, Service } from '../../types';

interface TemplateFormProps {
  templateId?: string | null;
  onClose: () => void;
}

/**
 * Template form component for creating and editing templates
 * Supports all template types with validation and preview
 */
export const TemplateForm: React.FC<TemplateFormProps> = ({
  templateId,
  onClose
}) => {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    type: 'email',
    subject: '',
    content: '',
    variables: [],
    isActive: true,
    service: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newVariable, setNewVariable] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const { accessToken, refreshToken } = useAuthStore();
  const { user } = useAuthStore();
  const { data: template, isLoading: templateLoading } = useTemplate(templateId || '', accessToken || '');
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const isEditing = !!templateId;
  const isLoading = templateLoading || createTemplate.isPending || updateTemplate.isPending;

  useEffect(() => {
    if (accessToken) {
      ServicesAPI.getServices(accessToken)
        .then(response => setServices(response.data))
        .catch(async (error) => {
          if (error.message?.includes('expired')) {
            try {
              const refreshed = await refreshToken();
              if (refreshed && accessToken) {
                const response = await ServicesAPI.getServices(accessToken);
                setServices(response.data);
              } else {
                setServices([]);
              }
            } catch (refreshError) {
              setServices([]);
            }
          } else {
            setServices([]);
          }
        });
    }
  }, [accessToken, refreshToken]);

  useEffect(() => {
    if (template) {
      const templateData = template as any;
      setFormData({
        name: templateData.template_name,
        description: templateData.category || '',
        type: templateData.channel_type.toLowerCase() as NotificationType,
        subject: templateData.subject_template || '',
        content: templateData.body_template,
        variables: templateData.variables || [],
        isActive: templateData.is_active,
        service: templateData.service || ''
      });
    }
  }, [template]);

  const typeOptions = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Push Notification' },
    { value: 'webhook', label: 'Webhook' }
  ];

  const serviceOptions = services.map(service => ({
    value: service.id,
    label: `${service.service_name} (${service.service_code})`
  }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Template content is required';
    }

    if (formData.type === 'email' && !formData.subject?.trim()) {
      newErrors.subject = 'Email subject is required';
    }

    if (!formData.service) {
      newErrors.service = 'Service is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditing && templateId) {
        await updateTemplate.mutateAsync({
          id: templateId,
          updates: formData,
          accessToken: accessToken || '',
        });
      } else {
        await createTemplate.mutateAsync({
          ...formData,
          accessToken: accessToken || '',
          createdBy: user?.email || 'unknown'
        } as any);
      }
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleAddVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, newVariable.trim()]
      }));
      setNewVariable('');
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddVariable();
    }
  };

  if (templateLoading) {
    return (
      <Modal isOpen onClose={onClose} title={isEditing ? 'Edit Template' : 'New Template'} size="lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? 'Edit Template' : 'New Template'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        {/* Basic Information */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Template Name"
              placeholder="Enter template name"
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              error={errors.name}
              required
              disabled={isLoading}
            />
            <Select
              label="Type"
              value={formData.type}
              onChange={(value) => setFormData(prev => ({ ...prev, type: value as NotificationType }))}
              options={typeOptions}
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Service"
              value={formData.service}
              onChange={(value) => setFormData(prev => ({ ...prev, service: value }))}
              options={serviceOptions}
              disabled={isLoading}
              placeholder="Select a service"
              required
              error={errors.service}
            />
          </div>
          <div className="mt-4">
            <Input
              label="Description"
              placeholder="Enter template description (optional)"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              disabled={isLoading}
            />
          </div>
          {formData.type === 'email' && (
            <div className="mt-4">
              <Input
                label="Subject"
                placeholder="Enter email subject"
                value={formData.subject}
                onChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                error={errors.subject}
                required
                disabled={isLoading}
              />
            </div>
          )}
        </Card>

        {/* Template Content */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Template Content</h3>
            <RichTextEditor
              label="Content"
              value={formData.content || ''}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, content: value }));
              }}
              placeholder="Enter your template content here..."
              disabled={isLoading}
              error={errors.content}
              required
            />
          <div className="mt-2">
            <p className="text-xs text-gray-500 mt-2">
              Use variables like {'{{variableName}}'} in your content. Variables will be replaced with actual values when sending notifications.
            </p>
          </div>
        </Card>

        {/* Variables */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Variables</h3>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter variable name"
                value={newVariable}
                onChange={setNewVariable}
                disabled={isLoading}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleKeyPress(e);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddVariable}
                disabled={!newVariable.trim() || isLoading}
              >
                Add
              </Button>
            </div>
            {(formData.variables ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(formData.variables ?? []).map((variable) => (
                  <span
                    key={variable}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {`{${variable}}`}
                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(variable)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Settings */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Template is active and can be used for notifications
            </label>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
            {isEditing ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TemplateForm;

