import React from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import { 
  Mail, 
  Phone, 
  Bell, 
  Link as LinkIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  User,
  Tag
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotifications';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

interface NotificationDetailsProps {
  notificationId: string;
  onClose: () => void;
}

/**
 * Notification details modal component
 * Displays comprehensive information about a selected notification
 */
export const NotificationDetails: React.FC<NotificationDetailsProps> = ({
  notificationId,
  onClose
}) => {
  const { data: notification, isLoading, error } = useNotification(notificationId);

  const getTypeIcon = (type?: string) => {
    const iconStyle = { width: 20, height: 20 };
    switch (type?.toLowerCase()) {
      case 'email':
        return <Mail style={iconStyle} />;
      case 'sms':
        return <Phone style={iconStyle} />;
      case 'push':
        return <Bell style={iconStyle} />;
      case 'webhook':
        return <LinkIcon style={iconStyle} />;
      default:
        return <Bell style={iconStyle} />;
    }
  };

  const getStatusConfig = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { 
          icon: <Clock style={{ width: 16, height: 16 }} />, 
          color: 'warning' as const,
          label: 'Pending'
        };
      case 'sent':
        return { 
          icon: <CheckCircle style={{ width: 16, height: 16 }} />, 
          color: 'info' as const,
          label: 'Sent'
        };
      case 'delivered':
        return { 
          icon: <CheckCircle style={{ width: 16, height: 16 }} />, 
          color: 'success' as const,
          label: 'Delivered'
        };
      case 'failed':
        return { 
          icon: <XCircle style={{ width: 16, height: 16 }} />, 
          color: 'error' as const,
          label: 'Failed'
        };
      case 'cancelled':
        return { 
          icon: <XCircle style={{ width: 16, height: 16 }} />, 
          color: 'default' as const,
          label: 'Cancelled'
        };
      default:
        return { 
          icon: <AlertCircle style={{ width: 16, height: 16 }} />, 
          color: 'default' as const,
          label: status || 'Unknown'
        };
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'low':
        return 'default' as const;
      case 'normal':
        return 'info' as const;
      case 'high':
        return 'warning' as const;
      case 'urgent':
        return 'error' as const;
      default:
        return 'default' as const;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const statusConfig = getStatusConfig(notification?.status);

  return (
    <Modal 
      isOpen={!!notificationId} 
      onClose={onClose} 
      title="Notification Details" 
      size="md"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Loading State */}
        {isLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <Stack spacing={2} alignItems="center">
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Loading notification details...
              </Typography>
            </Stack>
          </Box>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert 
            severity="error" 
            icon={<XCircle style={{ width: 20, height: 20 }} />}
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" gutterBottom>
              Error Loading Notification
            </Typography>
            <Typography variant="body2">
              Could not load notification details. Please try again.
            </Typography>
          </Alert>
        )}

        {/* Notification Content */}
        {!isLoading && !error && notification && (
          <>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: 'primary.50',
                  color: 'primary.main'
                }}>
                  {getTypeIcon(notification.type)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {notification.title || 'Untitled Notification'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {notification.id}
                  </Typography>
                </Box>
              </Box>
              <Chip
                icon={statusConfig.icon}
                label={statusConfig.label}
                color={statusConfig.color}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Divider />

            {/* Message Content */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Message Content
              </Typography>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'grey.50',
                  minHeight: 100
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'text.primary'
                  }}
                >
                  {notification.message || 'No message content'}
                </Typography>
              </Box>
            </Box>

            {/* Details Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {/* Recipient Info */}
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <User style={{ width: 16, height: 16 }} />
                  Recipient Information
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Email/Phone
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {notification.recipient || 'N/A'}
                    </Typography>
                  </Box>
                  {notification.recipientName && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {notification.recipientName}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Notification Details */}
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Tag style={{ width: 16, height: 16 }} />
                  Notification Details
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Type
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                      {notification.type || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Priority
                    </Typography>
                    <Chip
                      label={notification.priority || 'N/A'}
                      color={getPriorityColor(notification.priority)}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                  {notification.templateName && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Template
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {notification.templateName}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>

            {/* Timeline */}
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Calendar style={{ width: 16, height: 16 }} />
                Timeline
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatDate(notification.createdAt)}
                  </Typography>
                </Box>
                {notification.scheduledAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Scheduled
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(notification.scheduledAt)}
                    </Typography>
                  </Box>
                )}
                {notification.sentAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Sent
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(notification.sentAt)}
                    </Typography>
                  </Box>
                )}
                {notification.deliveredAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Delivered
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(notification.deliveredAt)}
                    </Typography>
                  </Box>
                )}
                {notification.failedAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Failed
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(notification.failedAt)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Error Details */}
            {notification.failureReason && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Failure Reason
                </Typography>
                <Typography variant="body2">
                  {notification.failureReason}
                </Typography>
              </Alert>
            )}

            {/* Metadata */}
            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Metadata
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    p: 2,
                    overflowX: 'auto'
                  }}
                >
                  <Typography
                    component="pre"
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      m: 0
                    }}
                  >
                    {JSON.stringify(notification.metadata, null, 2)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Actions */}
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
              {notification.status === 'failed' && (
                <Button variant="primary">
                  Retry
                </Button>
              )}
            </Box>
          </>
        )}

        {/* No Data State */}
        {!isLoading && !error && !notification && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Notification not found or could not be loaded.
            </Typography>
          </Alert>
        )}
      </Box>
    </Modal>
  );
};
