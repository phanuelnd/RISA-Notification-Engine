import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Paper,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Message as MessageIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Send as SendIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  Person as PersonIcon,
  VpnKey as VpnKeyIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useDashboardStats } from '../../hooks/useDashboard';
import { sendBulkNotifications, getNotificationRequestStatus } from '../../api/notifications';
import { parseCSVFile, convertRowsToRecipients } from '../../utils/csvParser';
import { VariablesPanel } from '../../components/VariablesPanel';
import { ApiKeyModal } from '../../components/ApiKeyModal';
import { Alert as MuiAlert, LinearProgress, Chip as MuiChip, Snackbar } from '@mui/material';

/**
 * Main dashboard page displaying key metrics and charts
 * Shows notification statistics, recent activity, and performance charts
 */
export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const { error: statsError } = useDashboardStats();

  // Dashboard filters state
  const [selectedTimeRange, setSelectedTimeRange] = React.useState('week');
  const [selectedNotificationType, setSelectedNotificationType] = React.useState('sms');
  const [selectedDeliveryStatuses, setSelectedDeliveryStatuses] = React.useState({
    accepted: true,
    expired: true,
    rejected: true,
    delivered: true,
    failed: true,
    undelivered: true,
  });

  // Send Message form state (Email only for now)
  const [recipients, setRecipients] = React.useState('');
  const [csvRecipients, setCsvRecipients] = React.useState<Array<Record<string, any>>>([]);
  const [csvHeaders, setCsvHeaders] = React.useState<string[]>([]);
  const [csvFileName, setCsvFileName] = React.useState<string | null>(null);
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [campaignId, setCampaignId] = React.useState('HEALTH_2025_Q1');
  const [priority, setPriority] = React.useState<'low' | 'normal' | 'high' | 'urgent'>('high');
  const [isSending, setIsSending] = React.useState(false);
  const [isParsingCsv, setIsParsingCsv] = React.useState(false);
  const [csvError, setCsvError] = React.useState<string | null>(null);
  const [requestId, setRequestId] = React.useState<string | null>(null);
  const [requestStatus, setRequestStatus] = React.useState<any>(null);
  const [subjectCursorPosition, setSubjectCursorPosition] = React.useState<number>(0);
  const [messageCursorPosition, setMessageCursorPosition] = React.useState<number>(0);
  const [showApiKeyModal, setShowApiKeyModal] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const subjectInputRef = React.useRef<HTMLInputElement>(null);
  const messageInputRef = React.useRef<HTMLTextAreaElement>(null);
  const pollTimerRef = React.useRef<number | null>(null);
  const pollStartTimeRef = React.useRef<number | null>(null);

  const ensureApiKey = async (): Promise<string | null> => {
    let key = localStorage.getItem('risa_api_key');
    if (!key) {
      // Show modal to enter API key
      setShowApiKeyModal(true);
      return null;
    }
    return key;
  };

  const handleSaveApiKey = (apiKey: string) => {
    localStorage.setItem('risa_api_key', apiKey);
    setSnackbar({
      open: true,
      message: 'API key saved successfully',
      severity: 'success',
    });
  };

  const handleUpdateApiKey = () => {
    setShowApiKeyModal(true);
  };

  const parseRecipientsInput = (text: string) => {
    return text
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(value => ({ email: value }));
  };

  // Get available variables from CSV headers
  const availableVariables = React.useMemo(() => {
    return csvHeaders.filter(header => header.trim() !== '');
  }, [csvHeaders]);

  // Insert variable at cursor position
  const insertVariable = (variable: string, isSubject: boolean) => {
    const variableText = `{{${variable}}}`;
    const input = isSubject ? subjectInputRef.current : messageInputRef.current;
    const currentValue = isSubject ? subject : message;
    const cursorPos = isSubject ? subjectCursorPosition : messageCursorPosition;
    
    if (input) {
      const start = cursorPos;
      const end = cursorPos;
      const newValue = currentValue.slice(0, start) + variableText + currentValue.slice(end);
      
      if (isSubject) {
        setSubject(newValue);
        // Set cursor position after inserted variable
        setTimeout(() => {
          if (subjectInputRef.current) {
            const newPos = start + variableText.length;
            subjectInputRef.current.setSelectionRange(newPos, newPos);
            setSubjectCursorPosition(newPos);
          }
        }, 0);
      } else {
        setMessage(newValue);
        setTimeout(() => {
          if (messageInputRef.current) {
            const newPos = start + variableText.length;
            messageInputRef.current.setSelectionRange(newPos, newPos);
            setMessageCursorPosition(newPos);
          }
        }, 0);
      }
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDeliveryStatusChange = (status: string) => {
    setSelectedDeliveryStatuses(prev => ({
      ...prev,
      [status]: !prev[status as keyof typeof prev],
    }));
  };

  // Send Message form handlers
  const handleSendMessage = async () => {
    const apiKey = await ensureApiKey();
    if (!apiKey) {
      setSnackbar({
        open: true,
        message: 'Please configure your API key to send notifications',
        severity: 'error',
      });
      return;
    }

    // Determine recipients - prefer CSV if available, otherwise use text input
    const recipientList = csvRecipients.length > 0 
      ? csvRecipients 
      : parseRecipientsInput(recipients);

    if (recipientList.length === 0) {
      alert('Please provide recipients either via CSV upload or text input');
      return;
    }

    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    // Backend requires subject for all notifications
    if (!subject.trim()) {
      alert('Please enter a subject');
      return;
    }

    // Ensure all recipients have an email field (required by backend)
    // Backend serializer requires 'email' field for each recipient
    const validatedRecipients = recipientList.map((recipient, index) => {
      const validated: Record<string, any> = { ...recipient };
      
      // Backend requires 'email' field - check various possible field names
      if (!validated.email) {
        // Try common email field names
        const emailFields = ['email', 'email_address', 'e_mail', 'Email', 'EMAIL'];
        const foundEmailField = emailFields.find(field => validated[field]);
        
        if (foundEmailField) {
          validated.email = validated[foundEmailField];
        } else {
          // Try to find any field that looks like an email
          const emailLikeField = Object.keys(validated).find(key => 
            typeof validated[key] === 'string' && validated[key].includes('@')
          );
          
          if (emailLikeField) {
            validated.email = validated[emailLikeField];
          } else {
            // Last resort: use first string value
            const firstStringValue = Object.values(validated).find(
              val => typeof val === 'string' && val.trim() !== ''
            ) as string;
            
            if (firstStringValue) {
              validated.email = firstStringValue;
            } else {
              throw new Error(`Recipient ${index + 1} is missing required email field. Please ensure your CSV has an "email" column.`);
            }
          }
        }
      }
      
      // Ensure email is a valid string
      if (typeof validated.email !== 'string' || !validated.email.trim()) {
        throw new Error(`Recipient ${index + 1} has invalid email field`);
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(validated.email.trim())) {
        throw new Error(`Recipient ${index + 1} has invalid email format: ${validated.email}`);
      }
      
      return validated;
    });

    const payload: {
      recipients: Array<Record<string, any>>;
      subject: string;
      message: string;
      webhook_url?: string;
      metadata: Record<string, any>;
    } = {
      recipients: validatedRecipients,
      subject: subject.trim(),
      message: message.trim(),
      metadata: {
        campaign_id: campaignId || 'HEALTH_2025_Q1',
        priority: priority || 'high',
        request_type: 'EMAIL', // Email notifications only
      },
    };

    if (webhookUrl.trim()) {
      payload.webhook_url = webhookUrl.trim();
    }

    // Reset previous state
    setRequestStatus(null);
    setRequestId(null);
    setIsSending(true);
    pollStartTimeRef.current = Date.now();

    try {
      const resp = await sendBulkNotifications(payload, apiKey);
      const id = resp?.data?.request_id || resp?.request_id || null;
      
      if (!id) {
        throw new Error('Failed to get request ID from response');
      }
      
      setRequestId(id);
      setSnackbar({
        open: true,
        message: 'Notification request queued successfully',
        severity: 'success',
      });

      if (id) {
        // Begin polling request status every 3 seconds
        if (pollTimerRef.current) {
          window.clearInterval(pollTimerRef.current);
        }
        pollTimerRef.current = window.setInterval(async () => {
          try {
            // Check for timeout (2 minutes)
            if (pollStartTimeRef.current && Date.now() - pollStartTimeRef.current > 120000) {
              if (pollTimerRef.current) {
                window.clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              setIsSending(false);
              return;
            }

            const statusResp = await getNotificationRequestStatus(id, apiKey);
            const statusData = statusResp?.data || statusResp;
            setRequestStatus(statusData);
            
            if (
              statusData?.status === 'COMPLETED' ||
              statusData?.status === 'FAILED' ||
              statusData?.status === 'CANCELLED'
            ) {
              if (pollTimerRef.current) {
                window.clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              setIsSending(false);
            }
          } catch (e) {
            console.error('Error polling status:', e);
            // Continue polling on error, but stop after timeout
            if (pollStartTimeRef.current && Date.now() - pollStartTimeRef.current > 120000) {
              if (pollTimerRef.current) {
                window.clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              setIsSending(false);
            }
          }
        }, 3000);
      } else {
        setIsSending(false);
      }
    } catch (e: any) {
      console.error('Error sending notification:', e);
      
      // Handle specific error cases
      let errorMessage = 'Failed to send notification. Please try again.';
      
      if (e?.message?.includes('Failed to fetch') || e?.message?.includes('NetworkError')) {
        errorMessage = 'Network error: Could not connect to the server. Please check your connection and try again.';
      } else if (e?.message?.includes('API key') || e?.response?.status === 401 || e?.response?.status === 403) {
        errorMessage = 'Invalid or missing API key. Please update your API key.';
        // Clear invalid API key and prompt for new one
        localStorage.removeItem('risa_api_key');
        setTimeout(() => {
          setShowApiKeyModal(true);
        }, 1000);
      } else if (e?.message?.includes('missing required email') || e?.message?.includes('invalid email')) {
        errorMessage = e.message + '. Please ensure your CSV has an "email" column or update your recipient data.';
      } else if (e?.message?.includes('Invalid request data')) {
        // Try to extract more details from error response
        errorMessage = 'Invalid request data. Please check:\n- All recipients have an "email" field\n- Subject is provided\n- Message is not empty';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
      setIsSending(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  const handleCancel = () => {
    setRecipients('');
    setCsvRecipients([]);
    setCsvHeaders([]);
    setCsvFileName(null);
    setSubject('');
    setMessage('');
    setWebhookUrl('');
    setCsvError(null);
    setRequestId(null);
    setRequestStatus(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv')) {
      setCsvError('Please upload a CSV file');
      return;
    }

    setIsParsingCsv(true);
    setCsvError(null);

    try {
      const parsedData = await parseCSVFile(file);
      
      if (parsedData.errors.length > 0 && parsedData.rows.length === 0) {
        setCsvError('Failed to parse CSV file. Please check the file format.');
        setIsParsingCsv(false);
        return;
      }

      if (parsedData.headers.length === 0) {
        setCsvError('CSV file has no headers. Please ensure the first row contains column names.');
        setIsParsingCsv(false);
        return;
      }

      if (parsedData.rows.length === 0) {
        setCsvError('CSV file has no data rows.');
        setIsParsingCsv(false);
        return;
      }

      const recipients = convertRowsToRecipients(parsedData.rows);
      setCsvRecipients(recipients);
      setCsvHeaders(parsedData.headers);
      setCsvFileName(file.name);
      setRecipients(''); // Clear text input when CSV is loaded
      
      // Show success message
      console.log(`Successfully parsed ${recipients.length} recipients from CSV`);
    } catch (error: any) {
      setCsvError(error?.message || 'Failed to parse CSV file');
      setCsvRecipients([]);
      setCsvHeaders([]);
      setCsvFileName(null);
    } finally {
      setIsParsingCsv(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Dummy data for dashboard - API ready
  const timeRanges = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ];

  const notificationTypes = [
    { value: 'sms', label: 'SMS' },
    { value: 'email', label: 'Email' },
  ];

  const deliveryStatuses = [
    { value: 'accepted', label: 'Accepted' },
    { value: 'expired', label: 'Expired' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed', label: 'Failed' },
    { value: 'undelivered', label: 'Undelivered' },
  ];

  // Dummy summary data - API ready
  const getSummaryData = () => {
    const baseData = {
      sms: {
        totalMessages: 1250,
        succeededMessages: 1180,
        failedMessages: 70,
        totalTrend: 5.2,
        succeededTrend: 3.8,
        failedTrend: -12.5,
      },
      email: {
        totalMessages: 890,
        succeededMessages: 845,
        failedMessages: 45,
        totalTrend: 8.1,
        succeededTrend: 6.3,
        failedTrend: -8.2,
      },
    };
    return baseData[selectedNotificationType as keyof typeof baseData];
  };

  // Dummy chart data - API ready
  const getChartData = () => {
    const timeLabels = {
      day: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      month: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      quarter: ['Month 1', 'Month 2', 'Month 3'],
      year: ['Q1', 'Q2', 'Q3', 'Q4'],
    };

    const labels = timeLabels[selectedTimeRange as keyof typeof timeLabels];
    
    return labels.map((label) => {
      const dataPoint: {
        time: string;
        accepted: number;
        expired: number;
        rejected: number;
        delivered: number;
        failed: number;
        undelivered: number;
        total: number;
      } = {
        time: label,
        accepted: Math.floor(Math.random() * 100) + 50,
        expired: Math.floor(Math.random() * 20) + 5,
        rejected: Math.floor(Math.random() * 15) + 3,
        delivered: Math.floor(Math.random() * 80) + 40,
        failed: Math.floor(Math.random() * 10) + 2,
        undelivered: Math.floor(Math.random() * 8) + 1,
        total: 0,
      };
      
      // Calculate combined total for selected statuses
      const selectedStatuses = Object.keys(selectedDeliveryStatuses).filter(
        status => selectedDeliveryStatuses[status as keyof typeof selectedDeliveryStatuses]
      );
      
      dataPoint.total = selectedStatuses.reduce((sum, status) => {
        return sum + (dataPoint[status as keyof typeof dataPoint] as number);
      }, 0);
      
      return dataPoint;
    });
  };

  if (statsError) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Error Loading Dashboard
          </Typography>
          <Typography variant="body2">
            Please try refreshing the page.
          </Typography>
        </Alert>
      </Box>
    );
  }





  // Card sx for charts (shared)
  const chartCardSx = () => ({
    borderRadius: 4,
    border: '1px solid #e2e8f0',
    borderTop: 'none',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    boxShadow:
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow:
        '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
  });


  // Tab configs for Tabs
  const tabConfigs = [
    { label: 'Dashboard' },
    { label: 'Send Message' },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 3, sm: 4, md: 5 },
        p: { xs: 4, sm: 5, md: 6 },
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      {/* Enhanced Tabs */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px 0 rgba(16, 24, 40, 0.06)',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              py: 2,
              px: 4,
              minHeight: 56,
              color: '#334155',
              '&.Mui-selected': {
                color: '#4f46e5',
                fontWeight: 700,
              },
              '&:hover': {
                color: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.07)',
              },
            },
          }}
        >
          {tabConfigs.map((tab) => (
            <Tab
              key={tab.label}
              label={tab.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab content */}
      {activeTab === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 3, sm: 4, md: 5 },
          }}
        >
          {/* Filters Section */}
          <Card sx={chartCardSx()}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box
              sx={{
                display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 3,
                  alignItems: { xs: 'stretch', md: 'center' },
                  justifyContent: 'space-between',
                }}
              >
                {/* Time Range Filters */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography
                    variant="subtitle2"
                sx={{
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '0.875rem',
                    }}
                  >
                    Time Range
                  </Typography>
                  <ButtonGroup
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiButton-root': {
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        px: 2,
                        py: 0.5,
                        borderColor: '#d1d5db',
                        color: 'black',
                        '&:hover': {
                          borderColor: '#6366f1',
                  color: '#6366f1',
                          backgroundColor: 'rgba(99, 102, 241, 0.04)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#6366f1',
                          color: 'white',
                          borderColor: '#6366f1',
                          '&:hover': {
                            backgroundColor: '#4f46e5',
                            borderColor: '#4f46e5',
                          },
                        },
                      },
                    }}
                  >
                    {timeRanges.map((range) => (
                      <Button
                        key={range.value}
                        onClick={() => setSelectedTimeRange(range.value)}
                        variant={selectedTimeRange === range.value ? 'contained' : 'outlined'}
                      >
                        {range.label}
                      </Button>
                    ))}
                  </ButtonGroup>
                </Box>

                {/* Notification Type Selector */}
                <Box sx={{ minWidth: 120 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#374151',
                      }}
                    >
                      Notification Type
                    </InputLabel>
                    <Select
                      value={selectedNotificationType}
                      onChange={(e) => setSelectedNotificationType(e.target.value)}
                      label="Notification Type"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#d1d5db',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366f1',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366f1',
                        },
                      }}
                    >
                      {notificationTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: { xs: 2, sm: 3 },
            }}
          >
            {(() => {
              const summaryData = getSummaryData();
              const cards = [
                {
                  title: 'Messages',
                  value: summaryData.totalMessages,
                  trend: summaryData.totalTrend,
                  icon: <MessageIcon sx={{ fontSize: 24 }} />,
                  color: '#6366f1',
                  bgColor: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)',
                },
                {
                  title: 'Succeeded Messages',
                  value: summaryData.succeededMessages,
                  trend: summaryData.succeededTrend,
                  icon: <CheckCircleIcon sx={{ fontSize: 24 }} />,
                  color: '#10b981',
                  bgColor: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                },
                {
                  title: 'Failed Messages',
                  value: summaryData.failedMessages,
                  trend: summaryData.failedTrend,
                  icon: <ErrorIcon sx={{ fontSize: 24 }} />,
                  color: '#ef4444',
                  bgColor: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                },
              ];

              return cards.map((card, index) => (
                <Card
                  key={index}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    boxShadow: '0 2px 8px 0 rgba(16, 24, 40, 0.06)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          background: card.bgColor,
                          color: card.color,
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: '#6b7280',
                          fontSize: '0.875rem',
                        }}
                      >
                        {card.title}
            </Typography>
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: '#111827',
                        mb: 1,
                        fontSize: '2rem',
                      }}
                    >
                      {card.value.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {card.trend > 0 ? (
                        <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      ) : (
                        <TrendingDownIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 500,
                          color: card.trend > 0 ? '#10b981' : '#ef4444',
                          fontSize: '0.75rem',
                        }}
                      >
                        {card.trend > 0 ? '+' : ''}{card.trend}% from last {selectedTimeRange}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ));
            })()}
          </Box>

          {/* Delivery Status Card */}
            <Card sx={chartCardSx()}>
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                      sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                    boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <AssessmentIcon sx={{ color: 'white', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.375rem',
                      color: '#0f172a',
                      lineHeight: 1.2,
                      mb: 0.5,
                    }}
                  >
                    {selectedNotificationType.toUpperCase()} Delivery Status
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#64748b',
                      fontWeight: 500,
                    }}
                  >
                    Track delivery performance and status distribution
                  </Typography>
                </Box>
              </Box>

              {/* Delivery Status Filters */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '0.875rem',
                    mb: 1.5,
                  }}
                >
                  Filter by Status
                </Typography>
                <FormGroup
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  {deliveryStatuses.map((status) => (
                    <FormControlLabel
                      key={status.value}
                      control={
                        <Checkbox
                          checked={selectedDeliveryStatuses[status.value as keyof typeof selectedDeliveryStatuses]}
                          onChange={() => handleDeliveryStatusChange(status.value)}
                          sx={{
                            color: '#6366f1',
                            '&.Mui-checked': {
                              color: '#6366f1',
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(99, 102, 241, 0.04)',
                            },
                      }}
                    />
                  }
                      label={
                        <Typography
                    sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#374151',
                          }}
                        >
                          {status.label}
                        </Typography>
                      }
                      sx={{
                        margin: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.875rem',
                      },
                    }}
                  />
                  ))}
                </FormGroup>
              </Box>

              {/* Line Graph */}
                  <Box
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.07)',
                    }}
                  >
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={getChartData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                      strokeOpacity={0.6}
                        />
                        <XAxis
                      dataKey="time"
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                          axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                          tickLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                          axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                          tickLine={{ stroke: '#cbd5e1' }}
                        />
                        <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const selectedStatuses = Object.keys(selectedDeliveryStatuses).filter(
                            status => selectedDeliveryStatuses[status as keyof typeof selectedDeliveryStatuses]
                          );
                          
                          return (
                            <Box
                              sx={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                p: 2,
                                minWidth: 200,
                              }}
                            >
                              <Typography
                                sx={{
                            color: '#0f172a',
                            fontWeight: 700,
                                  fontSize: '14px',
                                  mb: 1,
                                }}
                              >
                                {label}
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {selectedStatuses.map((status) => {
                                  const statusLabel = deliveryStatuses.find(s => s.value === status)?.label;
                                  const value = data[status];
                                  return (
                                    <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>
                                        {statusLabel}:
                                      </Typography>
                                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                                        {value}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                                <Box sx={{ borderTop: '1px solid #e2e8f0', mt: 0.5, pt: 0.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                                      Total:
                                    </Typography>
                                    <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#6366f1' }}>
                                      {data.total}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#6366f1"
                      strokeWidth={4}
                      dot={{ fill: '#6366f1', strokeWidth: 3, r: 5 }}
                      activeDot={{ r: 8, stroke: '#6366f1', strokeWidth: 3 }}
                      name="Total Messages"
                    />
                  </LineChart>
                    </ResponsiveContainer>
                  </Box>
              </CardContent>
            </Card>
          </Box>
      )}

      {activeTab === 1 && (
        <Box
              sx={{
                display: 'flex',
            flexDirection: 'column',
            gap: 3,
            p: { xs: 3, sm: 4 },
          }}
        >
          {/* Header with title and API Key button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
                alignItems: 'center',
              mb: 2,
              flexWrap: 'wrap',
              gap: 2,
              }}
            >
            <Typography
              variant="h4"
                sx={{
                fontWeight: 700,
                color: '#1e293b',
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              Send Email
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VpnKeyIcon />}
              onClick={handleUpdateApiKey}
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderColor: '#d1d5db',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#6366f1',
                  color: '#6366f1',
                  backgroundColor: 'rgba(99, 102, 241, 0.04)',
                },
              }}
            >
              {localStorage.getItem('risa_api_key') ? 'Update API Key' : 'Set API Key'}
            </Button>
          </Box>

          {/* CSV Upload Status */}
          {csvFileName && (
            <MuiAlert 
              severity="success" 
              sx={{ mb: 2 }}
              onClose={() => {
                setCsvRecipients([]);
                setCsvHeaders([]);
                setCsvFileName(null);
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                CSV Loaded: {csvFileName}
              </Typography>
              <Typography variant="caption">
                {csvRecipients.length} recipient(s) loaded • {csvHeaders.length} variable(s) available
              </Typography>
            </MuiAlert>
          )}

          {csvError && (
            <MuiAlert severity="error" sx={{ mb: 2 }} onClose={() => setCsvError(null)}>
              {csvError}
            </MuiAlert>
          )}

          {/* Variables Panel */}
          {availableVariables.length > 0 && (
            <VariablesPanel
              variables={availableVariables}
              onVariableClick={(variable) => {
                // Determine which field to insert into based on focus
                const subjectFocused = document.activeElement === subjectInputRef.current;
                insertVariable(variable, subjectFocused);
              }}
            />
          )}

          {/* Two-column layout */}
            <Box
              sx={{
                display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            {/* Left column - Select your audience */}
            <Box>
              <Paper
                          sx={{
                  p: 3,
                            borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 2px 8px 0 rgba(16, 24, 40, 0.06)',
                  height: '100%',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#1e293b',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <PersonIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                  Select your audience
                </Typography>
                
                {csvRecipients.length === 0 ? (
                  <>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                      placeholder="Enter email addresses (one per line or comma-separated)..."
                      disabled={csvRecipients.length > 0}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.875rem',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                          '&:hover fieldset': {
                            borderColor: '#6366f1',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#6366f1',
                          },
                        },
                      }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <input
                        accept=".csv"
                        style={{ display: 'none' }}
                        id="csv-upload"
                        type="file"
                        onChange={handleFileUpload}
                        disabled={isParsingCsv}
                      />
                      <label htmlFor="csv-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<UploadIcon />}
                          disabled={isParsingCsv}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            borderColor: '#d1d5db',
                            color: '#6b7280',
                            '&:hover': {
                              borderColor: '#6366f1',
                              color: '#6366f1',
                              backgroundColor: 'rgba(99, 102, 241, 0.04)',
                            },
                          }}
                        >
                          {isParsingCsv ? 'Parsing...' : 'Browse CSV file'}
                        </Button>
                      </label>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#6b7280',
                          fontSize: '0.75rem',
                        }}
                      >
                        Upload a CSV file with recipient data (columns become variables)
                      </Typography>
                    </Box>
                    {isParsingCsv && (
                      <LinearProgress sx={{ mt: 1 }} />
                    )}
                  </>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <MuiChip
                      label={`${csvRecipients.length} recipient(s) from CSV`}
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      CSV data loaded. Use variables panel above to insert dynamic fields into your message.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Right column - Compose your message */}
            <Box>
              <Paper
          sx={{
                  p: 3,
                  borderRadius: 3,
            border: '1px solid #e2e8f0',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 2px 8px 0 rgba(16, 24, 40, 0.06)',
                  height: '100%',
            }}
          >
            <Typography
                  variant="h6"
              sx={{
                    fontWeight: 600,
                color: '#1e293b',
                    mb: 2,
                display: 'flex',
                alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <MessageIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
                  Compose your Email
                </Typography>
                
                <TextField
                  fullWidth
                  label="Subject"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setSubjectCursorPosition(e.target.selectionStart || 0);
                  }}
                  onSelect={(e) => {
                    const target = e.target as HTMLInputElement;
                    setSubjectCursorPosition(target.selectionStart || 0);
                  }}
                  inputRef={subjectInputRef}
                  placeholder="Enter email subject (use {{variable}} for dynamic content)..."
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem',
                      '& fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&:hover fieldset': {
                        borderColor: '#6366f1',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#6366f1',
                      },
                    },
                  }}
                />
                
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setMessageCursorPosition(e.target.selectionStart || 0);
                  }}
                  onSelect={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    setMessageCursorPosition(target.selectionStart || 0);
                  }}
                  inputRef={messageInputRef}
                  placeholder="Type your email message here (use {{variable}} for dynamic content)..."
                sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.875rem',
                      '& fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&:hover fieldset': {
                        borderColor: '#6366f1',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#6366f1',
                      },
                    },
                  }}
                />
              </Paper>
            </Box>
          </Box>

          {/* Additional Options */}
          <Paper
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Additional Options
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Webhook URL (optional)"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="http://localhost:8000/api/webhook/notification-status"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.875rem',
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Campaign ID"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="HEALTH_2025_Q1"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.875rem',
                  },
                }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  label="Priority"
                  sx={{
                    fontSize: '0.875rem',
                  }}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Action buttons */}
          <Box
              sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              mt: 2,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={isSending}
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                px: 3,
                py: 1,
                borderColor: '#d1d5db',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#9ca3af',
                  color: '#374151',
                  backgroundColor: 'rgba(156, 163, 175, 0.04)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={
                isSending || 
                (csvRecipients.length === 0 && !recipients.trim()) || 
                !message.trim() ||
                !subject.trim()
              }
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                px: 3,
                py: 1,
                backgroundColor: '#6366f1',
                '&:hover': {
                  backgroundColor: '#4f46e5',
                },
                '&:disabled': {
                  backgroundColor: '#d1d5db',
                  color: '#9ca3af',
                },
              }}
            >
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </Box>
          {/* Request Status */}
          {!!requestId && (
            <Paper
              sx={{
                mt: 2,
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  Notification Request Status
                </Typography>
                {requestStatus?.status && (
                  <MuiChip
                    label={requestStatus.status}
                    color={
                      requestStatus.status === 'COMPLETED' ? 'success' :
                      requestStatus.status === 'FAILED' ? 'error' :
                      requestStatus.status === 'CANCELLED' ? 'default' :
                      'warning'
                    }
                    size="small"
                  />
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Request ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                  {requestId}
                </Typography>
              </Box>

              {requestStatus && (
                <>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Total Recipients
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {requestStatus.total_recipients ?? requestStatus.totalRecipients ?? '--'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Successful
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {requestStatus.successful_count ?? '--'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Failed
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                        {requestStatus.failed_count ?? '--'}
                      </Typography>
                    </Box>
                  </Box>

                  {requestStatus.status === 'PENDING' || requestStatus.status === 'PROCESSING' ? (
                    <Box>
                      <LinearProgress sx={{ mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Processing notifications...
                      </Typography>
                    </Box>
                  ) : null}

                  {requestStatus.service_name && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Service
                      </Typography>
                      <Typography variant="body2">
                        {requestStatus.service_name} ({requestStatus.service_code})
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Paper>
          )}
        </Box>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleSaveApiKey}
        currentApiKey={localStorage.getItem('risa_api_key') || undefined}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};
