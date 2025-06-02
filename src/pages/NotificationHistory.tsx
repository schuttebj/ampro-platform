import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Alert,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Refresh as RefreshIcon,
  ArrowBack as BackIcon,
  Download as ExportIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CompliantIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Assignment as ApplicationIcon,
  Print as PrintIcon,
  LocalShipping as ShippingIcon,
  Security as ComplianceIcon,
  LocationOn as CollectionIcon,
  Computer as SystemIcon,
  Person as UserIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

// Reuse notification interfaces from NotificationSystem
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  priority: 'critical' | 'high' | 'normal' | 'low';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'application' | 'print_job' | 'shipping' | 'collection' | 'iso_compliance' | 'system' | 'user_action';
  actionUrl?: string;
  actionLabel?: string;
  data?: {
    entity_id?: number;
    entity_type?: string;
    progress?: number;
    estimated_completion?: string;
    retry_count?: number;
    auto_dismissible?: boolean;
  };
  expires_at?: Date;
  group_id?: string;
  archived?: boolean;
  dismissed?: boolean;
}

interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  critical_count: number;
  category_breakdown: { [key: string]: number };
  daily_trend: Array<{ date: string; count: number }>;
  response_time_avg: number; // Average time to mark as read (minutes)
}

const NotificationHistory: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  useEffect(() => {
    loadNotificationHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [notifications, searchTerm, categoryFilter, priorityFilter, statusFilter, dateRange, selectedTab]);

  const loadNotificationHistory = async () => {
    try {
      setLoading(true);
      setError('');

      // Enhanced mock notification history data
      const currentTime = new Date();
      const mockNotifications: Notification[] = [
        // Last 24 hours - Recent critical notifications
        {
          id: 'notif_001',
          type: 'error',
          priority: 'critical',
          title: 'Printer Malfunction Critical Error',
          message: 'Primary license printer HP-DL-001 has encountered hardware failure. Production completely halted.',
          timestamp: new Date(currentTime.getTime() - 2 * 60 * 60 * 1000),
          read: false,
          category: 'system',
          actionUrl: '/admin/printer-management',
          actionLabel: 'Check Printer Status',
          data: { entity_id: 1, entity_type: 'printer', retry_count: 5 },
          group_id: 'system_alerts'
        },
        {
          id: 'notif_002',
          type: 'warning',
          priority: 'high',
          title: 'ISO Compliance Batch Failure',
          message: 'Critical compliance failure: 8 licenses in batch BCH-2024-0156 failed MRZ validation. Manual review required.',
          timestamp: new Date(currentTime.getTime() - 4 * 60 * 60 * 1000),
          read: true,
          category: 'iso_compliance',
          actionUrl: '/workflow/iso-compliance',
          actionLabel: 'Review Compliance Issues',
          data: { entity_id: 156, entity_type: 'compliance_batch' },
          group_id: 'compliance_issues'
        },
        // Application workflow notifications
        {
          id: 'notif_003',
          type: 'success',
          priority: 'normal',
          title: 'Bulk Application Approval Completed',
          message: '47 commercial license applications have been approved and forwarded to print queue.',
          timestamp: new Date(currentTime.getTime() - 6 * 60 * 60 * 1000),
          read: true,
          category: 'application',
          actionUrl: '/workflow/applications',
          actionLabel: 'View Applications',
          data: { entity_id: 0, entity_type: 'bulk_approval', auto_dismissible: true },
          group_id: 'app_approvals'
        },
        // Print job notifications
        {
          id: 'notif_004',
          type: 'info',
          priority: 'normal',
          title: 'Print Job Batch Completed',
          message: 'Print batch PB-789 completed: 156 licenses printed successfully, 4 failed due to material shortage.',
          timestamp: new Date(currentTime.getTime() - 8 * 60 * 60 * 1000),
          read: true,
          category: 'print_job',
          actionUrl: '/workflow/print-queue',
          actionLabel: 'View Print Queue',
          data: { entity_id: 789, entity_type: 'print_batch', progress: 97 },
          group_id: 'print_jobs'
        },
        // Shipping notifications
        {
          id: 'notif_005',
          type: 'info',
          priority: 'normal',
          title: 'Shipment Dispatched',
          message: 'Shipment SH-456 (234 licenses) dispatched to Regional Collection Centers. Expected delivery: 2 business days.',
          timestamp: new Date(currentTime.getTime() - 12 * 60 * 60 * 1000),
          read: true,
          category: 'shipping',
          actionUrl: '/workflow/shipping',
          actionLabel: 'Track Shipment',
          data: { 
            entity_id: 456, 
            entity_type: 'shipment', 
            estimated_completion: new Date(currentTime.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() 
          },
          group_id: 'shipping_updates'
        },
        // Collection center notifications
        {
          id: 'notif_006',
          type: 'success',
          priority: 'low',
          title: 'Collection Center Daily Report',
          message: 'Main Office: 67 licenses collected, 23 pending. Northern Branch: 45 collected, 12 pending.',
          timestamp: new Date(currentTime.getTime() - 1 * 24 * 60 * 60 * 1000),
          read: true,
          category: 'collection',
          actionUrl: '/workflow/collection',
          actionLabel: 'View Collection Dashboard',
          data: { entity_id: 0, entity_type: 'daily_report', auto_dismissible: true },
          group_id: 'collection_updates'
        },
        // Older notifications for history
        {
          id: 'notif_007',
          type: 'warning',
          priority: 'high',
          title: 'License Expiry Alert',
          message: '156 driver licenses are expiring within 30 days. Renewal notifications have been sent.',
          timestamp: new Date(currentTime.getTime() - 3 * 24 * 60 * 60 * 1000),
          read: true,
          category: 'system',
          actionUrl: '/renewals/expiring',
          actionLabel: 'View Expiring Licenses',
          data: { entity_id: 0, entity_type: 'expiry_alert' },
          group_id: 'system_alerts'
        },
        {
          id: 'notif_008',
          type: 'error',
          priority: 'critical',
          title: 'Database Backup Failure',
          message: 'Automated database backup failed. Manual intervention required to ensure data integrity.',
          timestamp: new Date(currentTime.getTime() - 5 * 24 * 60 * 60 * 1000),
          read: true,
          category: 'system',
          actionUrl: '/admin/database',
          actionLabel: 'Check Database Status',
          data: { entity_id: 0, entity_type: 'backup_failure', retry_count: 3 },
          group_id: 'system_alerts',
          archived: true
        }
      ];

      // Generate statistics
      const mockStats: NotificationStats = {
        total_notifications: mockNotifications.length,
        unread_count: mockNotifications.filter(n => !n.read).length,
        critical_count: mockNotifications.filter(n => n.priority === 'critical').length,
        category_breakdown: {
          application: mockNotifications.filter(n => n.category === 'application').length,
          print_job: mockNotifications.filter(n => n.category === 'print_job').length,
          shipping: mockNotifications.filter(n => n.category === 'shipping').length,
          collection: mockNotifications.filter(n => n.category === 'collection').length,
          iso_compliance: mockNotifications.filter(n => n.category === 'iso_compliance').length,
          system: mockNotifications.filter(n => n.category === 'system').length,
          user_action: mockNotifications.filter(n => n.category === 'user_action').length
        },
        daily_trend: [
          { date: '2024-01-15', count: 12 },
          { date: '2024-01-14', count: 8 },
          { date: '2024-01-13', count: 15 },
          { date: '2024-01-12', count: 6 },
          { date: '2024-01-11', count: 9 }
        ],
        response_time_avg: 23.5
      };

      setNotifications(mockNotifications);
      setStats(mockStats);

    } catch (err: any) {
      console.error('Error loading notification history:', err);
      setError('Failed to load notification history');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = notifications;

    // Apply tab filter first
    if (selectedTab === 1) {
      filtered = filtered.filter(n => !n.read);
    } else if (selectedTab === 2) {
      filtered = filtered.filter(n => n.priority === 'critical' || n.priority === 'high');
    } else if (selectedTab === 3) {
      filtered = filtered.filter(n => n.archived);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(n => n.category === categoryFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(n => n.priority === priorityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'read') {
        filtered = filtered.filter(n => n.read);
      } else if (statusFilter === 'unread') {
        filtered = filtered.filter(n => !n.read);
      }
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const ranges = {
        'today': 1,
        'week': 7,
        'month': 30,
        'quarter': 90
      };
      const days = ranges[dateRange as keyof typeof ranges] || 365;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(n => n.timestamp >= cutoff);
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getNotificationIcon = (type: string, category: string) => {
    const iconProps = { fontSize: 'small' as const };
    
    if (type === 'error') return <ErrorIcon color="error" {...iconProps} />;
    if (type === 'warning') return <WarningIcon color="warning" {...iconProps} />;
    if (type === 'success') return <CompliantIcon color="success" {...iconProps} />;
    
    switch (category) {
      case 'application': return <ApplicationIcon color="info" {...iconProps} />;
      case 'print_job': return <PrintIcon color="info" {...iconProps} />;
      case 'shipping': return <ShippingIcon color="info" {...iconProps} />;
      case 'collection': return <CollectionIcon color="info" {...iconProps} />;
      case 'iso_compliance': return <ComplianceIcon color="info" {...iconProps} />;
      case 'system': return <SystemIcon color="warning" {...iconProps} />;
      case 'user_action': return <UserIcon color="info" {...iconProps} />;
      default: return <InfoIcon color="info" {...iconProps} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const colorMap = {
      critical: 'error',
      high: 'warning',
      normal: 'info',
      low: 'default'
    } as const;
    return colorMap[priority as keyof typeof colorMap] || 'default';
  };

  const getCategoryColor = (category: string) => {
    const colorMap = {
      application: 'primary',
      print_job: 'secondary',
      shipping: 'warning',
      collection: 'success',
      iso_compliance: 'error',
      system: 'error',
      user_action: 'info'
    } as const;
    return colorMap[category as keyof typeof colorMap] || 'default';
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleArchive = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, archived: true } : n)
    );
    setSuccess('Notification archived successfully');
  };

  const handleBulkAction = (action: 'read' | 'archive' | 'delete') => {
    setNotifications(prev =>
      prev.map(n => {
        if (selectedNotifications.includes(n.id)) {
          switch (action) {
            case 'read':
              return { ...n, read: true };
            case 'archive':
              return { ...n, archived: true };
            case 'delete':
              return n; // Would actually remove in real implementation
            default:
              return n;
          }
        }
        return n;
      })
    );
    
    setSelectedNotifications([]);
    setBulkActionDialogOpen(false);
    setSuccess(`${action === 'read' ? 'Marked as read' : action === 'archive' ? 'Archived' : 'Deleted'} ${selectedNotifications.length} notifications`);
  };

  const exportNotifications = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      total_notifications: filteredNotifications.length,
      filters: {
        search: searchTerm,
        category: categoryFilter,
        priority: priorityFilter,
        status: statusFilter,
        date_range: dateRange
      },
      notifications: filteredNotifications,
      statistics: stats
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notification_history_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    setSuccess('Notification history exported successfully');
  };

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationIcon />
            Notification History
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Comprehensive notification management and historical tracking
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={exportNotifications}
          >
            Export History
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadNotificationHistory}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/workflow')}
          >
            Back to Workflow
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Statistics Dashboard */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Notifications
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.total_notifications}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Unread
                </Typography>
                <Typography variant="h4" component="div" color="warning.main">
                  {stats.unread_count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Critical
                </Typography>
                <Typography variant="h4" component="div" color="error.main">
                  {stats.critical_count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Response Time
                </Typography>
                <Typography variant="h4" component="div" color="info.main">
                  {stats.response_time_avg}m
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Search notifications"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="application">Applications</MenuItem>
                  <MenuItem value="print_job">Print Jobs</MenuItem>
                  <MenuItem value="shipping">Shipping</MenuItem>
                  <MenuItem value="collection">Collection</MenuItem>
                  <MenuItem value="iso_compliance">ISO Compliance</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="user_action">User Actions</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="read">Read</MenuItem>
                  <MenuItem value="unread">Unread</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Date Range"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="quarter">Last Quarter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setPriorityFilter('all');
                  setStatusFilter('all');
                  setDateRange('all');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs
        value={selectedTab}
        onChange={(e, newValue) => setSelectedTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab 
          label={
            <Badge badgeContent={notifications.length} color="primary">
              All Notifications
            </Badge>
          }
        />
        <Tab 
          label={
            <Badge badgeContent={stats?.unread_count || 0} color="warning">
              Unread
            </Badge>
          }
        />
        <Tab 
          label={
            <Badge badgeContent={stats?.critical_count || 0} color="error">
              High Priority
            </Badge>
          }
        />
        <Tab label="Archived" />
      </Tabs>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'action.selected' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                {selectedNotifications.length} notification{selectedNotifications.length > 1 ? 's' : ''} selected
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => handleBulkAction('read')}
                >
                  Mark as Read
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBulkAction('archive')}
                >
                  Archive
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => setBulkActionDialogOpen(true)}
                >
                  Delete
                </Button>
                <Button
                  size="small"
                  onClick={() => setSelectedNotifications([])}
                >
                  Clear Selection
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Notifications Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNotifications(paginatedNotifications.map(n => n.id));
                        } else {
                          setSelectedNotifications([]);
                        }
                      }}
                      checked={selectedNotifications.length === paginatedNotifications.length && paginatedNotifications.length > 0}
                    />
                  </TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <LinearProgress />
                      <Typography align="center" sx={{ mt: 2 }}>
                        Loading notifications...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography align="center" color="textSecondary">
                        No notifications found matching the current filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedNotifications.map((notification) => (
                    <TableRow 
                      key={notification.id}
                      sx={{ 
                        backgroundColor: notification.read ? 'transparent' : 'action.hover',
                        opacity: notification.archived ? 0.6 : 1
                      }}
                    >
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNotifications([...selectedNotifications, notification.id]);
                            } else {
                              setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {getNotificationIcon(notification.type, notification.category)}
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight={notification.read ? 'normal' : 'bold'}
                        >
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {notification.message.length > 60 
                            ? `${notification.message.substring(0, 60)}...` 
                            : notification.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={notification.category.replace('_', ' ')}
                          size="small"
                          color={getCategoryColor(notification.category)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={notification.priority.toUpperCase()}
                          size="small"
                          color={getPriorityColor(notification.priority)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {!notification.read && (
                            <Chip label="Unread" size="small" color="warning" />
                          )}
                          {notification.archived && (
                            <Chip label="Archived" size="small" color="default" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatTimeAgo(notification.timestamp)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {notification.timestamp.toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedNotification(notification);
                                setDetailsDialogOpen(true);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {!notification.read && (
                            <Tooltip title="Mark as Read">
                              <IconButton 
                                size="small"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <CompliantIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {!notification.archived && (
                            <Tooltip title="Archive">
                              <IconButton 
                                size="small"
                                onClick={() => handleArchive(notification.id)}
                              >
                                <ArchiveIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Notification Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Notification Details
          {selectedNotification && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              {getNotificationIcon(selectedNotification.type, selectedNotification.category)}
              <Typography variant="subtitle1">
                {selectedNotification.title}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {selectedNotification.message}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Category
                  </Typography>
                  <Chip
                    label={selectedNotification.category.replace('_', ' ')}
                    color={getCategoryColor(selectedNotification.category)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Priority
                  </Typography>
                  <Chip
                    label={selectedNotification.priority.toUpperCase()}
                    color={getPriorityColor(selectedNotification.priority)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body2">
                    {selectedNotification.timestamp.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Typography variant="body2">
                    {selectedNotification.read ? 'Read' : 'Unread'}
                    {selectedNotification.archived && ' (Archived)'}
                  </Typography>
                </Grid>
                {selectedNotification.data && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Additional Data
                    </Typography>
                    <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
                      {JSON.stringify(selectedNotification.data, null, 2)}
                    </pre>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {selectedNotification?.actionUrl && (
            <Button 
              variant="contained"
              onClick={() => {
                navigate(selectedNotification.actionUrl!);
                setDetailsDialogOpen(false);
              }}
            >
              {selectedNotification.actionLabel || 'View'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog
        open={bulkActionDialogOpen}
        onClose={() => setBulkActionDialogOpen(false)}
      >
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedNotifications.length} selected notifications? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => handleBulkAction('delete')}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationHistory; 