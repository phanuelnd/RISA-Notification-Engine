import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useDeleteTemplate } from '../../hooks/useTemplates';
import { useAuthStore } from '../../store/useAuthStore';

interface DeleteTemplateModalProps {
  templateId: string;
  onClose: () => void;
}

export const DeleteTemplateModal: React.FC<DeleteTemplateModalProps> = ({ 
  templateId, 
  onClose 
}) => {
  const deleteTemplate = useDeleteTemplate();
  const { accessToken } = useAuthStore();
  const isLoading = deleteTemplate.isPending;

  const handleDelete = async () => {
    if (!accessToken || !templateId) return;
    
    try {
      await deleteTemplate.mutateAsync({ id: templateId, accessToken });
      onClose();
    } catch (error) {
      // Error handling is managed by the mutation
    }
  };

  return (
    <Modal
      isOpen={!!templateId}
      onClose={onClose}
      title="Delete Template"
      size="sm"
    >
      <Box sx={{ mb: 3 }}>
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3,
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
        >
          This action cannot be undone.
        </Alert>
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'text.primary',
            lineHeight: 1.6
          }}
        >
          Are you sure you want to delete this template? This will permanently remove 
          the template and all associated data.
        </Typography>
      </Box>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 2,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleDelete}
          loading={isLoading}
          disabled={isLoading}
        >
          Delete
        </Button>
      </Box>
    </Modal>
  );
};
