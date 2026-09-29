import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useTemplate } from '../../hooks/useTemplates';
import { useAuthStore } from '../../store/useAuthStore';

interface PreviewTemplateModalProps {
  templateId: string | null;
  onClose: () => void;
}

export const PreviewTemplateModal: React.FC<PreviewTemplateModalProps> = ({
  templateId,
  onClose
}) => {
  const { accessToken } = useAuthStore();
  const { data: template, isLoading, refetch } = useTemplate(
    templateId || '',
    accessToken || ''
  ) as { data: any, isLoading: boolean, refetch: () => void };
  
  useEffect(() => {
    if (templateId && accessToken) {
      refetch();
    }
  }, [templateId, accessToken, refetch]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      );
    }

    if (!template) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Template not found
        </Alert>
      );
    }

    if (template.channel_type === 'EMAIL') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {template.subject_template && (
            <Box>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.secondary',
                  mb: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.75rem'
                }}
              >
                Email Subject
              </Typography>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'grey.50',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                {template.subject_template}
              </Box>
            </Box>
          )}
          <Box>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600, 
                color: 'text.secondary',
                mb: 1.5,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem'
              }}
            >
              Email Template Content
            </Typography>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3,
                bgcolor: 'grey.50',
                minHeight: 200,
                '& *': {
                  maxWidth: '100%'
                }
              }}
              dangerouslySetInnerHTML={{ 
                __html: template.body_tempate || '<p style="color: #999;">No content available</p>' 
              }}
            />
          </Box>
        </Box>
      );
    }

    if (template.type === 'sms' || template.channel_type === 'SMS') {
      return (
        <Box>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600, 
              color: 'text.secondary',
              mb: 1.5,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.75rem'
            }}
          >
            SMS Template Content
          </Typography>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 3,
              bgcolor: 'grey.50',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {template.body_tempate || 'No content available'}
          </Box>
        </Box>
      );
    }

    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Unknown template type
      </Alert>
    );
  };

  return (
    <Modal
      isOpen={!!templateId}
      onClose={onClose}
      title="Template Preview"
      size="lg"
    >
      <Box sx={{ mb: 3 }}>
        {renderContent()}
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
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </Box>
    </Modal>
  );
};
