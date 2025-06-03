import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Badge,
  Tooltip,
  CircularProgress,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  People as PeopleIcon, 
  DirectionsCar as LicenseIcon,
  Description as ApplicationIcon,
  Assignment as TransactionIcon,
  Print as PrintIcon,
  LocalShipping as ShippingIcon,
  LocationOn as CollectionIcon,
  Security as ComplianceIcon,
  Warning as AlertIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as ApprovedIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  PlayArrow as QuickActionIcon,
  MoreVert as MoreIcon,
  Assessment as ReportsIcon,
  Notifications as NotificationIcon,
  Speed as PerformanceIcon,
  Settings as SettingsIcon,
  Clear as ClearIcon,
  Circle as CircleIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';

// Dashboard Statistics Interface
interface DashboardStats {
  citizens: {
    total: number;
    new_today: number;
    active: number;
  };
  applications: {
    total: number;
    pending_review: number;
    approved_today: number;
    rejected_today: number;
    pending_documents: number;
    pending_payment: number;
  };
  licenses: {
    total_active: number;
    issued_today: number;
    expiring_30_days: number;
    suspended: number;
    pending_collection: number;
  };
  print_jobs: {
    queued: number;
    printing: number;
    completed_today: number;
    failed: number;
  };
  shipping: {
    pending: number;
    in_transit: number;
    delivered_today: number;
    failed: number;
  };
  compliance: {
    compliant_rate: number;
    critical_issues: number;
    pending_validation: number;
  };
  system_performance: {
    avg_processing_time: number;
    uptime_percentage: number;
    queue_health: 'good' | 'warning' | 'critical';
  };
}

interface RecentActivity {
  id: string;
  type: 'application' | 'license' | 'print' | 'shipping' | 'compliance' | 'system';
  action: string;
  entity_id: string;
  user: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
  details?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  count?: number;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
  actionLabel?: string;
  dismissible: boolean;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [quickActionMenu, setQuickActionMenu] = useState<null | HTMLElement>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Mock fetch functions (replace with real API calls)
  const fetchDashboardStats = async (): Promise<DashboardStats> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      citizens: {
        total: 15847,
        new_today: 23,
        active: 15632
      },
      applications: {
        total: 8945,
        pending_review: 127,
        approved_today: 45,
        rejected_today: 3,
        pending_documents: 67,
        pending_payment: 89
      },
      licenses: {
        total_active: 12456,
        issued_today: 38,
        expiring_30_days: 234,
        suspended: 23,
        pending_collection: 156
      },
      print_jobs: {
        queued: 42,
        printing: 8,
        completed_today: 156,
        failed: 3
      },
      shipping: {
        pending: 67,
        in_transit: 23,
        delivered_today: 89,
        failed: 2
      },
      compliance: {
        compliant_rate: 96.8,
        critical_issues: 5,
        pending_validation: 23
      },
      system_performance: {
        avg_processing_time: 2.3,
        uptime_percentage: 99.7,
        queue_health: 'good'
      }
    };
  };

  const fetchRecentActivities = async (): Promise<RecentActivity[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const now = new Date();
    return [
      {
        id: 'act_1',
        type: 'application',
        action: 'Application Approved',
        entity_id: 'APP-008945',
        user: 'Sarah Johnson',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000),
        status: 'success',
        details: 'Class B Commercial License application approved and forwarded to print queue'
      },
      {
        id: 'act_2',
        type: 'print',
        action: 'Batch Print Completed',
        entity_id: 'BATCH-156',
        user: 'System',
        timestamp: new Date(now.getTime() - 25 * 60 * 1000),
        status: 'success',
        details: '45 licenses printed successfully'
      },
      {
        id: 'act_3',
        type: 'compliance',
        action: 'ISO Compliance Issue',
        entity_id: 'LIC-789456',
        user: 'System',
        timestamp: new Date(now.getTime() - 35 * 60 * 1000),
        status: 'error',
        details: 'Failed ISO 18013-5 validation - requires immediate review'
      },
      {
        id: 'act_4',
        type: 'shipping',
        action: 'Shipment Delivered',
        entity_id: 'SH-003421',
        user: 'Courier Services',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000),
        status: 'success',
        details: '127 licenses delivered to Northern Collection Point'
      },
      {
        id: 'act_5',
        type: 'license',
        action: 'License Collection',
        entity_id: 'LIC-567890',
        user: 'Mike Chen',
        timestamp: new Date(now.getTime() - 55 * 60 * 1000),
        status: 'success',
        details: 'License collected by citizen at Downtown Office'
      }
    ];
  };

  const fetchSystemAlerts = async (): Promise<SystemAlert[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const now = new Date();
    return [
      {
        id: 'alert_1',
        type: 'error',
        title: 'Printer Hardware Issue',
        message: 'Primary license printer HP-DL-001 has encountered a hardware error. Production temporarily halted.',
        timestamp: new Date(now.getTime() - 10 * 60 * 1000),
        actionUrl: '/admin/printer-management',
        actionLabel: 'Manage Printers',
        dismissible: false
      },
      {
        id: 'alert_2',
        type: 'warning',
        title: 'High Queue Volume',
        message: 'Print queue has 127+ pending jobs. Consider increasing printing capacity.',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        actionUrl: '/workflow/print-queue',
        actionLabel: 'View Queue',
        dismissible: true
      },
      {
        id: 'alert_3',
        type: 'info',
        title: 'Scheduled Maintenance',
        message: 'System maintenance scheduled for Sunday 2:00 AM - 4:00 AM.',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        dismissible: true
      }
    ];
  };

  // Data fetching with React Query
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery(
    'dashboard-stats',
    fetchDashboardStats,
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  const { data: activities, isLoading: activitiesLoading } = useQuery(
    'recent-activities',
    fetchRecentActivities,
    { refetchInterval: 10000 } // Refresh every 10 seconds
  );

  const { data: alerts, isLoading: alertsLoading } = useQuery(
    'system-alerts',
    fetchSystemAlerts,
    { refetchInterval: 15000 } // Refresh every 15 seconds
  );

  // Quick Actions Configuration
  const quickActions: QuickAction[] = [
    {
      id: 'bulk_approve',
      title: 'Bulk Approve Applications',
      description: 'Review and approve multiple applications',
      icon: <ApprovedIcon />,
      action: () => navigate('/workflow/applications'),
      color: 'success',
      count: stats?.applications.pending_review
    },
    {
      id: 'emergency_print',
      title: 'Emergency Print Job',
      description: 'Create urgent print job',
      icon: <PrintIcon />,
      action: () => navigate('/workflow/manual-print-jobs'),
      color: 'error'
    },
    {
      id: 'iso_compliance',
      title: 'ISO Compliance Check',
      description: 'Run compliance validation',
      icon: <ComplianceIcon />,
      action: () => navigate('/workflow/iso-compliance'),
      color: 'warning',
      count: stats?.compliance.critical_issues
    },
    {
      id: 'shipping_overview',
      title: 'Shipping Overview',
      description: 'Monitor shipments and deliveries',
      icon: <ShippingIcon />,
      action: () => navigate('/workflow/shipping'),
      color: 'primary',
      count: stats?.shipping.pending
    }
  ];

  const getActivityIcon = (type: string, status: string) => {
    const iconProps = { fontSize: 'small' as const };
    
    if (status === 'error') return <ErrorIcon color="error" {...iconProps} />;
    if (status === 'success') return <CheckCircleIcon color="success" {...iconProps} />;
    
    switch (type) {
      case 'application': return <ApplicationIcon color="primary" {...iconProps} />;
      case 'license': return <LicenseIcon color="secondary" {...iconProps} />;
      case 'print': return <PrintIcon color="info" {...iconProps} />;
      case 'shipping': return <ShippingIcon color="warning" {...iconProps} />;
      case 'compliance': return <ComplianceIcon color="error" {...iconProps} />;
      default: return <ScheduleIcon color="disabled" {...iconProps} />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const activeAlerts = alerts?.filter(alert => !dismissedAlerts.has(alert.id)) || [];
  const criticalAlerts = activeAlerts.filter(alert => alert.type === 'error');

  if (statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            AMPRO Control Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {user?.full_name || 'User'} • {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="System Alerts">
            <IconButton onClick={() => setAlertsDialogOpen(true)}>
              <Badge badgeContent={criticalAlerts.length} color="error">
                <NotificationIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetchStats()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<QuickActionIcon />}
            onClick={(e) => setQuickActionMenu(e.currentTarget)}
          >
            Quick Actions
          </Button>
        </Box>
      </Box>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setAlertsDialogOpen(true)}>
              View All
            </Button>
          }
        >
          <strong>{criticalAlerts.length} Critical System Alert{criticalAlerts.length > 1 ? 's' : ''}</strong>
          {criticalAlerts.length === 1 && ` - ${criticalAlerts[0].title}`}
        </Alert>
      )}

      {/* Key Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Applications */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ApplicationIcon sx={{ fontSize: 32, mr: 2, color: '#ff9800' }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.applications.pending_review || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Review
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  label={`${stats?.applications.approved_today || 0} approved today`} 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
                <Button size="small" onClick={() => navigate('/workflow/applications')}>
                  Review
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Print Queue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PrintIcon sx={{ fontSize: 32, mr: 2, color: '#2196f3' }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.print_jobs.queued || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Queued for Print
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  label={`${stats?.print_jobs.printing || 0} printing`} 
                  size="small" 
                  color="warning" 
                  variant="outlined"
                />
                <Button size="small" onClick={() => navigate('/workflow/print-queue')}>
                  Manage
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Licenses */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LicenseIcon sx={{ fontSize: 32, mr: 2, color: '#4caf50' }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.licenses.pending_collection || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Collection
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  label={`${stats?.licenses.issued_today || 0} issued today`} 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
                <Button size="small" onClick={() => navigate('/workflow/collection')}>
                  View
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Performance */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PerformanceIcon sx={{ fontSize: 32, mr: 2, color: '#9c27b0' }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.system_performance.uptime_percentage || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    System Uptime
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  label={`Queue: ${stats?.system_performance.queue_health || 'unknown'}`} 
                  size="small" 
                  color={getSystemHealthColor(stats?.system_performance.queue_health || 'unknown')} 
                  variant="outlined"
                />
                <Button size="small" onClick={() => navigate('/admin/system-status')}>
                  Monitor
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <CardHeader 
              title="ISO Compliance Status" 
              action={
                <Chip 
                  label={`${stats?.compliance.compliant_rate || 0}% Compliant`} 
                  color={stats?.compliance.compliant_rate! >= 95 ? 'success' : 'warning'}
                />
              }
            />
            <CardContent>
              <LinearProgress 
                variant="determinate" 
                value={stats?.compliance.compliant_rate || 0} 
                sx={{ mb: 2 }}
                color={stats?.compliance.compliant_rate! >= 95 ? 'success' : 'warning'}
              />
              <Typography variant="body2" color="text.secondary">
                {stats?.compliance.critical_issues || 0} critical issues requiring immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <CardHeader title="Today's Processing Summary" />
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Applications Processed:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(stats?.applications.approved_today || 0) + (stats?.applications.rejected_today || 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Licenses Printed:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats?.print_jobs.completed_today || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Deliveries Made:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats?.shipping.delivered_today || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Avg Processing Time:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats?.system_performance.avg_processing_time || 0}min
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <CardHeader title="Workflow Status" />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <ShippingIcon sx={{ mr: 1, color: 'orange' }} />
                  <Typography variant="body2">Shipping:</Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {stats?.shipping.in_transit || 0} in transit
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <CollectionIcon sx={{ mr: 1, color: 'green' }} />
                  <Typography variant="body2">Collection:</Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {stats?.licenses.pending_collection || 0} ready
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <AlertIcon sx={{ mr: 1, color: 'red' }} />
                  <Typography variant="body2">Issues:</Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {(stats?.print_jobs.failed || 0) + (stats?.shipping.failed || 0)} failed
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities and Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={2} sx={{ height: 400 }}>
            <CardHeader 
              title="Recent Activities" 
              action={
                <Button size="small" onClick={() => navigate('/audit/activity-log')}>
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ height: 320, overflow: 'auto' }}>
              {activitiesLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {activities?.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          {getActivityIcon(activity.type, activity.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {activity.action}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatTimeAgo(activity.timestamp)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {activity.entity_id} • {activity.user}
                              </Typography>
                              {activity.details && (
                                <Typography variant="caption" color="text.secondary">
                                  {activity.details}
                                </Typography>
                              )}
                            </Box>
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
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ height: 400 }}>
            <CardHeader title="Quick Actions" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                {quickActions.map((action) => (
                  <Grid item xs={12} key={action.id}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color={action.color}
                      startIcon={action.icon}
                      onClick={action.action}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textAlign: 'left',
                        py: 2,
                        position: 'relative'
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {action.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {action.description}
                        </Typography>
                      </Box>
                      {action.count !== undefined && action.count > 0 && (
                        <Badge 
                          badgeContent={action.count} 
                          color={action.color === 'error' ? 'error' : 'primary'}
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                        />
                      )}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions Menu */}
      <Menu
        anchorEl={quickActionMenu}
        open={Boolean(quickActionMenu)}
        onClose={() => setQuickActionMenu(null)}
      >
        {quickActions.map((action) => (
          <MenuItem 
            key={action.id} 
            onClick={() => {
              action.action();
              setQuickActionMenu(null);
            }}
          >
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText primary={action.title} secondary={action.description} />
            {action.count !== undefined && action.count > 0 && (
              <Chip label={action.count} size="small" color={action.color} />
            )}
          </MenuItem>
        ))}
      </Menu>

      {/* System Alerts Dialog */}
      <Dialog 
        open={alertsDialogOpen} 
        onClose={() => setAlertsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>System Alerts & Notifications</DialogTitle>
        <DialogContent>
          <List>
            {alerts?.map((alert) => (
              <ListItem key={alert.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                  <Alert severity={alert.type} sx={{ flex: 1, mr: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {alert.title}
                    </Typography>
                    <Typography variant="body2">
                      {alert.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTimeAgo(alert.timestamp)}
                    </Typography>
                  </Alert>
                  {alert.dismissible && (
                    <IconButton 
                      size="small"
                      onClick={() => setDismissedAlerts(prev => {
                        const newSet = new Set(prev);
                        newSet.add(alert.id);
                        return newSet;
                      })}
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                </Box>
                {alert.actionUrl && (
                  <Button 
                    size="small" 
                    onClick={() => {
                      navigate(alert.actionUrl!);
                      setAlertsDialogOpen(false);
                    }}
                    sx={{ mt: 1 }}
                  >
                    {alert.actionLabel || 'Take Action'}
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 