import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  IconButton,
  Chip,
  Tooltip,
  Skeleton,
  Stack,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationStore } from '../../store/useNotificationStore';
import { NotificationFilters } from './NotificationFilters';
import { NotificationDetails } from './NotificationDetails';
import type { NotificationFilters as FilterType, Notification } from '../../types';

// Configuration objects for better maintainability
const STATUS_CONFIG = {
  pending: { color: 'warning' as const, label: 'Pending', icon: '⏳' },
  sent: { color: 'info' as const, label: 'Sent', icon: '📤' },
  delivered: { color: 'success' as const, label: 'Delivered', icon: '✓' },
  failed: { color: 'error' as const, label: 'Failed', icon: '✗' },
  cancelled: { color: 'default' as const, label: 'Cancelled', icon: '⏹' },
} as const;

const PRIORITY_CONFIG = {
  low: { color: 'default' as const, label: 'Low' },
  normal: { color: 'info' as const, label: 'Normal' },
  high: { color: 'warning' as const, label: 'High' },
  urgent: { color: 'error' as const, label: 'Urgent' },
} as const;

/**
 * Reusable StatusChip component
 */
const StatusChip: React.FC<{ status: Notification['status'] }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  return (
    <Chip 
      label={config.label} 
      color={config.color} 
      size="small"
      sx={{ 
        fontWeight: 600,
        minWidth: 90,
        height: 28,
        fontSize: '0.8rem',
        '& .MuiChip-label': { px: 1.5, py: 0 }
      }}
    />
  );
};

/**
 * Reusable PriorityChip component
 */
const PriorityChip: React.FC<{ priority: Notification['priority'] }> = ({ priority }) => {
  const config = PRIORITY_CONFIG[priority];
  return (
    <Chip 
      label={config.label} 
      color={config.color} 
      size="small" 
      variant="outlined"
      sx={{ 
        fontWeight: 500,
        minWidth: 80,
        height: 28,
        fontSize: '0.8rem',
        textTransform: 'capitalize',
        '& .MuiChip-label': { px: 1.5, py: 0 }
      }}
    />
  );
};

/**
 * Stats card component for summary metrics
 */
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ sx?: any }>;
  color: 'primary' | 'success' | 'error' | 'warning';
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: IconComponent, color, isLoading }) => (
  <Card sx={{ 
    p: 3, 
    height: '100%',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 3,
    }
  }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Box>
        {isLoading ? (
          <Skeleton width={60} height={32} />
        ) : (
          <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main` }}>
            {value.toLocaleString()}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ 
        width: 56, 
        height: 56, 
        borderRadius: 2, 
        bgcolor: `${color}.50`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: `${color}.main`
      }}>
        <IconComponent sx={{ fontSize: '1.5rem' }} />
      </Box>
    </Stack>
  </Card>
);

/**
 * Enhanced notifications page with improved design and performance
 * Features: memoized components, better error handling, responsive design
 */
export const NotificationsPage: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  
  const { filters, sort, pagination, setFilters, setSort, setPagination } = useNotificationStore();
  
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch
  } = useNotifications(filters, sort, pagination.page, pagination.limit);

  // Memoized handlers for better performance
  const handleFilterChange = useCallback((newFilters: Partial<FilterType>) => {
    setFilters(newFilters);
  }, [setFilters]);

  const handleSortChange = useCallback((newSort: { column: string; direction: 'asc' | 'desc' }) => {
    setSort(newSort);
  }, [setSort]);

  const handlePageChange = useCallback((page: number) => {
    setPagination({ page });
  }, [setPagination]);

  const handleLimitChange = useCallback((limit: number) => {
    setPagination({ page: 1, limit });
  }, [setPagination]);

  const handleRowClick = useCallback((notificationId: string) => {
    setSelectedNotification(notificationId);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedNotification(null);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Memoized stats calculations
  const stats = useMemo(() => {
    const data = notificationsData?.data || [];
    return {
      total: notificationsData?.pagination?.total || 0,
      delivered: data.filter(n => n.status === 'delivered').length,
      failed: data.filter(n => n.status === 'failed').length,
      pending: data.filter(n => n.status === 'pending').length,
    };
  }, [notificationsData]);

  // Memoized column configuration
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'title',
      headerName: 'Notification',
      flex: 1,
      minWidth: 300,
      maxWidth: 400,
      renderCell: (params: GridRenderCellParams<Notification>) => (
        <Box sx={{ py: 1, width: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600, 
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3
            }}
            title={params.value}
          >
            {params.value}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block'
            }}
            title={`To: ${params.row.recipient}`}
          >
            To: {params.row.recipient}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 240,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<Notification>) => (
        <Chip 
          label={params.value} 
          size="small" 
          variant="outlined"
          sx={{ 
            textTransform: 'capitalize',
            fontWeight: 500,
            bgcolor: 'background.paper',
            fontSize: '0.8rem',
            height: 28,
            '& .MuiChip-label': { px: 1.5 }
          }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 240,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<Notification>) => 
        <StatusChip status={params.value} />,
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 230,
      minWidth: 110,
      renderCell: (params: GridRenderCellParams<Notification>) => 
        <PriorityChip priority={params.value} />,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 260,
      minWidth: 140,
      renderCell: (params: GridRenderCellParams<Notification>) => {
        const date = new Date(params.value);
        const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {dateString}
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.75rem', ml: 1 }}
            >
              {timeString}
            </Typography>
          </Typography>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      minWidth: 80,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams<Notification>) => (
        <Tooltip title="View Details" arrow>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(params.row.id);
            }}
            sx={{ 
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.50',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ], [handleRowClick]);

  // Error state
  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 400,
        textAlign: 'center',
        px: 3,
      }}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            maxWidth: 500,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="h6" gutterBottom>
            Failed to Load Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There was an error fetching your notifications. Please try again.
          </Typography>
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          sx={{ minWidth: 140 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: { xs: 2, sm: 3 } }}>
      {/* Enhanced page header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        justifyContent: 'space-between',
        gap: 2,
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
            Notifications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage notification delivery across all channels
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant={showFilters ? 'contained' : 'outlined'}
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ minWidth: 100 }}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Export
          </Button>
        </Stack>
      </Box>

      {/* Collapsible filters */}
      {showFilters && (
        <Card sx={{ 
          border: '1px solid',
          borderColor: 'primary.200',
          boxShadow: 1,
        }}>
          <CardContent>
            <NotificationFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
              onClose={() => setShowFilters(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Enhanced summary stats */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          lg: 'repeat(4, 1fr)' 
        }, 
        gap: 2 
      }}>
        <StatsCard
          title="Total Notifications"
          value={stats.total}
          icon={BarChartIcon}
          color="primary"
          isLoading={isLoading}
        />
        <StatsCard
          title="Successfully Delivered"
          value={stats.delivered}
          icon={CheckCircleIcon}
          color="success"
          isLoading={isLoading}
        />
        <StatsCard
          title="Failed Deliveries"
          value={stats.failed}
          icon={ErrorIcon}
          color="error"
          isLoading={isLoading}
        />
        <StatsCard
          title="Pending Delivery"
          value={stats.pending}
          icon={HourglassEmptyIcon}
          color="warning"
          isLoading={isLoading}
        />
      </Box>

      {/* Enhanced data table */}
      <Card sx={{ 
        boxShadow: 2,
        '&:hover': {
          boxShadow: 4,
        },
        transition: 'box-shadow 0.2s ease-in-out',
      }}>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={notificationsData?.data || []}
            columns={columns}
            loading={isLoading}
            initialState={{
              pagination: {
          paginationModel: {
            pageSize: pagination.limit,
            page: pagination.page - 1,
          },
              },
            }}
            rowCount={notificationsData?.pagination?.total || 0}
            paginationMode="server"
            onPaginationModelChange={(model) => {
              handlePageChange(model.page + 1);
              if (model.pageSize !== pagination.limit) {
          handleLimitChange(model.pageSize);
              }
            }}
            onSortModelChange={(model) => {
              if (model.length > 0) {
          const sortModel = model[0];
          handleSortChange({
            column: sortModel.field,
            direction: sortModel.sort || 'asc',
          });
              }
            }}
            sortModel={[{
              field: sort.column,
              sort: sort.direction,
            }]}
            disableRowSelectionOnClick
            getRowHeight={() => 70}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f4f8',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.9rem',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: 'text.primary',
                height: 56,
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }
              },
              '& .MuiDataGrid-row': {
                height: 70,
                '&:hover': {
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                },
                '&.Mui-selected': {
                  backgroundColor: '#e0f2fe',
                  '&:hover': {
                    backgroundColor: '#b3e5fc',
                  },
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: 'text.primary',
                minHeight: 56,
              },
              '& .MuiDataGrid-virtualScroller': {
                overflowX: 'auto',
              },
              '& .MuiDataGrid-main': {
                overflowX: 'auto',
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Notification details modal */}
      {selectedNotification && (
        <NotificationDetails
          notificationId={selectedNotification}
          onClose={handleCloseDetails}
        />
      )}
    </Box>
  );
};