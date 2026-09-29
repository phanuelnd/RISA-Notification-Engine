import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Skeleton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { NotificationActivity } from '../../types';

interface ActivityFeedProps {
  activities: NotificationActivity[];
  loading?: boolean;
}

/**
 * Activity feed component showing recent system activities
 * Displays notifications, template changes, and other events
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities, 
  loading = false 
}) => {
  const getActivityIcon = (type: NotificationActivity['type']) => {
    switch (type) {
      case 'notification_sent':
        return <NotificationsIcon />;
      case 'notification_delivered':
        return <CheckCircleIcon />;
      case 'notification_failed':
        return <ErrorIcon />;
      case 'template_created':
      case 'template_updated':
        return <DescriptionIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getActivityColor = (type: NotificationActivity['type']) => {
    switch (type) {
      case 'notification_sent':
        return 'primary';
      case 'notification_delivered':
        return 'success';
      case 'notification_failed':
        return 'error';
      case 'template_created':
      case 'template_updated':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Recent Activity
          </Typography>
          <List>
            {[...Array(5)].map((_, i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="80%" />}
                  secondary={<Skeleton variant="text" width="40%" />}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Recent Activity
        </Typography>
        {activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ScheduleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              No recent activity
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem sx={{ px: 0, py: 2 }}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: `${getActivityColor(activity.type)}.light`,
                        color: `${getActivityColor(activity.type)}.main`,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {activity.message}
                        </Typography>
                        <Chip
                          label={formatTimeAgo(activity.timestamp)}
                          size="small"
                          variant="outlined"
                          color={getActivityColor(activity.type)}
                        />
                      </Box>
                    }
                    secondary={
                      activity.metadata && Object.keys(activity.metadata).length > 0 ? (
                        <Box sx={{ mt: 1 }}>
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <Chip
                              key={key}
                              label={`${key}: ${String(value)}`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      ) : null
                    }
                  />
                </ListItem>
                {index < activities.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
