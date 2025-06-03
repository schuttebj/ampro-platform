import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Tooltip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Circle as CircleIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Assignment as ApplicationIcon,
  Print as PrintIcon,
  LocalShipping as ShippingIcon,
  Security as ComplianceIcon,
  LocationOn as CollectionIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  NotificationsActive as ActiveIcon,
  NotificationsOff as PausedIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';

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
  group_id?: string; // For grouping related notifications
}

interface NotificationGroup {
  id: string;
  category: string;
  notifications: Notification[];
  latest_timestamp: Date;
  unread_count: number;
}

interface NotificationSettings {
  enabled: boolean;
  sound_enabled: boolean;
  desktop_notifications: boolean;
  polling_interval: number;
  categories: {
    [key: string]: {
      enabled: boolean;
      priority_filter: 'all' | 'critical' | 'high' | 'normal';
      email_notifications: boolean;
    };
  };
  auto_mark_read_delay: number; // seconds
  max_notifications_display: number;
}

interface NotificationSystemProps {
  enableRealTime?: boolean;
  defaultPollingInterval?: number;
  maxNotifications?: number;
  enableGrouping?: boolean;
  enableDesktopNotifications?: boolean;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  enableRealTime = true,
  defaultPollingInterval = 15000, // Optimized to 15 seconds for licensing workflow
  maxNotifications = 100,
  enableGrouping = true,
  enableDesktopNotifications = true
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationGroups, setNotificationGroups] = useState<NotificationGroup[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarQueue, setSnackbarQueue] = useState<Notification[]>([]);
  const [currentSnackbar, setCurrentSnackbar] = useState<Notification | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Settings state
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound_enabled: true,
    desktop_notifications: enableDesktopNotifications,
    polling_interval: defaultPollingInterval,
    categories: {
      application: { enabled: true, priority_filter: 'all', email_notifications: false },
      print_job: { enabled: true, priority_filter: 'all', email_notifications: false },
      shipping: { enabled: true, priority_filter: 'high', email_notifications: true },
      collection: { enabled: true, priority_filter: 'normal', email_notifications: false },
      iso_compliance: { enabled: true, priority_filter: 'high', email_notifications: true },
      system: { enabled: true, priority_filter: 'critical', email_notifications: true },
      user_action: { enabled: true, priority_filter: 'all', email_notifications: false }
    },
    auto_mark_read_delay: 30,
    max_notifications_display: 50
  });

  // Refs for managing state
  const lastNotificationCount = useRef(0);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const autoMarkReadTimers = useRef<Map<string, number>>(new Map());

  // Initialize notification sound
  useEffect(() => {
    if (settings.sound_enabled) {
      // Create a subtle notification sound (you would replace this with an actual audio file)
      notificationSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbBAI=');
      notificationSound.current.volume = 0.3;
    }
  }, [settings.sound_enabled]);

  const fetchNotifications = async (): Promise<Notification[]> => {
    try {
      // Enhanced mock data representing real licensing workflow notifications
      const currentTime = new Date();
      const mockNotifications: Notification[] = [
        {
          id: `notif_${Date.now()}_1`,
          type: 'success',
          priority: 'normal',
          title: 'Application Approved',
          message: 'Application APP-002847 for Commercial License has been approved and forwarded to print queue',
          timestamp: new Date(currentTime.getTime() - 2 * 60 * 1000), // 2 minutes ago
          read: false,
          category: 'application',
          actionUrl: '/workflow/applications',
          actionLabel: 'View Application',
          data: {
            entity_id: 2847,
            entity_type: 'application',
            auto_dismissible: true
          },
          group_id: 'app_approvals'
        },
        {
          id: `notif_${Date.now()}_2`,
          type: 'info',
          priority: 'normal',
          title: 'Print Job Completed',
          message: 'Batch printing completed: 24 licenses printed successfully, 1 failed',
          timestamp: new Date(currentTime.getTime() - 8 * 60 * 1000), // 8 minutes ago
          read: false,
          category: 'print_job',
          actionUrl: '/workflow/print-queue',
          actionLabel: 'View Print Queue',
          data: {
            entity_id: 156,
            entity_type: 'print_batch',
            progress: 100,
            auto_dismissible: false
          },
          group_id: 'print_jobs'
        },
        {
          id: `notif_${Date.now()}_3`,
          type: 'warning',
          priority: 'high',
          title: 'ISO Compliance Issue Detected',
          message: 'Critical compliance failure: 3 licenses failed MRZ validation. Immediate attention required.',
          timestamp: new Date(currentTime.getTime() - 15 * 60 * 1000), // 15 minutes ago
          read: false,
          category: 'iso_compliance',
          actionUrl: '/workflow/iso-compliance',
          actionLabel: 'Review Compliance',
          data: {
            entity_id: 0,
            entity_type: 'compliance_batch',
            auto_dismissible: false
          },
          group_id: 'compliance_issues'
        },
        {
          id: `notif_${Date.now()}_4`,
          type: 'error',
          priority: 'critical',
          title: 'Printer Malfunction',
          message: 'Printer HP-DL-001 has encountered a hardware error. Production halted.',
          timestamp: new Date(currentTime.getTime() - 25 * 60 * 1000), // 25 minutes ago
          read: false,
          category: 'system',
          actionUrl: '/admin/printer-management',
          actionLabel: 'Check Printer',
          data: {
            entity_id: 1,
            entity_type: 'printer',
            retry_count: 3,
            auto_dismissible: false
          },
          group_id: 'system_alerts'
        },
        {
          id: `notif_${Date.now()}_5`,
          type: 'info',
          priority: 'normal',
          title: 'Shipping Batch Ready',
          message: 'Shipment SH-789 (127 licenses) ready for dispatch to Northern Region Collection Center',
          timestamp: new Date(currentTime.getTime() - 35 * 60 * 1000), // 35 minutes ago
          read: true,
          category: 'shipping',
          actionUrl: '/workflow/shipping',
          actionLabel: 'View Shipment',
          data: {
            entity_id: 789,
            entity_type: 'shipment',
            estimated_completion: new Date(currentTime.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
            auto_dismissible: true
          },
          group_id: 'shipping_updates'
        },
        {
          id: `notif_${Date.now()}_6`,
          type: 'success',
          priority: 'low',
          title: 'Collection Center Update',
          message: '45 licenses collected from Main Office today. 12 pending collection.',
          timestamp: new Date(currentTime.getTime() - 45 * 60 * 1000), // 45 minutes ago
          read: true,
          category: 'collection',
          actionUrl: '/workflow/collection',
          actionLabel: 'View Collections',
          data: {
            entity_id: 0,
            entity_type: 'collection_summary',
            auto_dismissible: true
          },
          group_id: 'collection_updates'
        }
      ];

      // Filter notifications based on settings
      return mockNotifications
        .filter(notification => {
          const categorySettings = settings.categories[notification.category];
          if (!categorySettings?.enabled) return false;
          
          const priorityLevels = ['low', 'normal', 'high', 'critical'];
          const filterLevel = priorityLevels.indexOf(categorySettings.priority_filter);
          const notificationLevel = priorityLevels.indexOf(notification.priority);
          
          return categorySettings.priority_filter === 'all' || notificationLevel >= filterLevel;
        })
        .slice(0, settings.max_notifications_display);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      return notifications; // Return current state on error
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev: Notification[]) => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    
    // Clear auto-mark timer if exists
    const timer = autoMarkReadTimers.current.get(notificationId);
    if (timer) {
      window.clearTimeout(timer);
      autoMarkReadTimers.current.delete(notificationId);
    }
  };

  const updateNotificationGroups = (notifications: Notification[]) => {
    const groups = notifications.reduce((acc, notification) => {
      const groupId = notification.group_id || notification.category;
      if (!acc[groupId]) {
        acc[groupId] = {
          id: groupId,
          category: notification.category,
          notifications: [],
          latest_timestamp: notification.timestamp,
          unread_count: 0
        };
      }
      
      acc[groupId].notifications.push(notification);
      if (notification.timestamp > acc[groupId].latest_timestamp) {
        acc[groupId].latest_timestamp = notification.timestamp;
      }
      if (!notification.read) {
        acc[groupId].unread_count++;
      }
      
      return acc;
    }, {} as { [key: string]: NotificationGroup });

    setNotificationGroups(Object.values(groups).sort((a, b) => 
      b.latest_timestamp.getTime() - a.latest_timestamp.getTime()
    ));
  };

  const handleNewNotifications = useCallback((newNotifications: Notification[]) => {
    if (!newNotifications) return;

    const previousIds = new Set(notifications.map((n: Notification) => n.id));
    const actuallyNewNotifications = newNotifications.filter((n: Notification) => !previousIds.has(n.id));

    if (actuallyNewNotifications.length > 0) {
      // Handle desktop notifications
      if (settings.desktop_notifications && 'Notification' in window) {
        actuallyNewNotifications
          .filter((n: Notification) => n.priority === 'critical' || n.priority === 'high')
          .forEach(notification => {
            if (Notification.permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id
              });
            }
          });
      }

      // Play notification sound for high priority items
      if (settings.sound_enabled && notificationSound.current) {
        const hasHighPriority = actuallyNewNotifications.some((n: Notification) => 
          n.priority === 'critical' || n.priority === 'high'
        );
        if (hasHighPriority) {
          notificationSound.current.play().catch((e: any) => console.log('Could not play notification sound:', e));
        }
      }

      // Show snackbar for critical/high priority notifications
      const priorityNotifications = actuallyNewNotifications.filter((n: Notification) => 
        n.priority === 'critical' || n.priority === 'high'
      );
      
      if (priorityNotifications.length > 0) {
        setSnackbarQueue((prev: Notification[]) => [...prev, ...priorityNotifications]);
      }

      // Setup auto-mark as read for auto-dismissible notifications
      actuallyNewNotifications
        .filter((n: Notification) => n.data?.auto_dismissible && settings.auto_mark_read_delay > 0)
        .forEach(notification => {
          const timer = window.setTimeout(() => {
            markAsRead(notification.id);
            autoMarkReadTimers.current.delete(notification.id);
          }, settings.auto_mark_read_delay * 1000) as unknown as number;
          
          autoMarkReadTimers.current.set(notification.id, timer);
        });
    }

    setNotifications(newNotifications);
    
    // Update grouped notifications if grouping is enabled
    if (enableGrouping) {
      updateNotificationGroups(newNotifications);
    }
  }, [notifications, settings, enableGrouping]);

  // Enhanced notification fetching with real-world data structure
  const { data: notificationData, isLoading } = useQuery(
    'notifications',
    fetchNotifications,
    {
      enabled: settings.enabled && enableRealTime,
      refetchInterval: settings.polling_interval,
      refetchIntervalInBackground: true,
      onSuccess: handleNewNotifications,
      onError: (error: any) => {
        console.error('Failed to fetch notifications:', error);
        // Fallback to less frequent polling on error
        queryClient.setQueryData('notifications', notifications);
      }
    }
  );

  // Process snackbar queue
  useEffect(() => {
    if (snackbarQueue.length > 0 && !currentSnackbar) {
      setCurrentSnackbar(snackbarQueue[0]);
      setSnackbarQueue(prev => prev.slice(1));
    }
  }, [snackbarQueue, currentSnackbar]);

  // Request desktop notification permission
  useEffect(() => {
    if (settings.desktop_notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [settings.desktop_notifications]);

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setCurrentSnackbar(null);
  };

  const markAllAsRead = () => {
    setNotifications((prev: Notification[]) => 
      prev.map((notification: Notification) => ({ ...notification, read: true }))
    );
    
    // Clear all auto-mark timers
    autoMarkReadTimers.current.forEach((timer: number) => window.clearTimeout(timer));
    autoMarkReadTimers.current.clear();
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications((prev: Notification[]) => prev.filter((n: Notification) => n.id !== notificationId));
    
    // Clear auto-mark timer if exists
    const timer = autoMarkReadTimers.current.get(notificationId);
    if (timer) {
      window.clearTimeout(timer);
      autoMarkReadTimers.current.delete(notificationId);
    }
  };

  const handleNotificationAction = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      handleNotificationClose();
    }
  };

  const getNotificationIcon = (type: string, category: string) => {
    // Priority-based icon selection
    const iconProps = { fontSize: 'small' as const };
    
    if (type === 'error') return <ErrorIcon color="error" {...iconProps} />;
    if (type === 'warning') return <WarningIcon color="warning" {...iconProps} />;
    if (type === 'success') return <CheckIcon color="success" {...iconProps} />;
    
    // Category-based icons for info type
    switch (category) {
      case 'application': return <ApplicationIcon color="info" {...iconProps} />;
      case 'print_job': return <PrintIcon color="info" {...iconProps} />;
      case 'shipping': return <ShippingIcon color="info" {...iconProps} />;
      case 'collection': return <CollectionIcon color="info" {...iconProps} />;
      case 'iso_compliance': return <ComplianceIcon color="info" {...iconProps} />;
      case 'system': return <ErrorIcon color="warning" {...iconProps} />;
      default: return <InfoIcon color="info" {...iconProps} />;
    }
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'default';
      default: return 'default';
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

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => !n.read && n.priority === 'critical').length;

  const filteredNotificationsByTab = () => {
    const categories = ['all', 'application', 'print_job', 'shipping', 'collection', 'iso_compliance', 'system'];
    const selectedCategory = categories[selectedTab];
    
    if (selectedCategory === 'all') {
      return notifications;
    }
    
    return notifications.filter(n => n.category === selectedCategory);
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Update query interval if changed
    if (newSettings.polling_interval) {
      queryClient.invalidateQueries('notifications');
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <IconButton
        color="inherit"
        onClick={handleNotificationClick}
        sx={{ mr: 1 }}
      >
        <Badge 
          badgeContent={criticalCount > 0 ? criticalCount : unreadCount} 
          color={criticalCount > 0 ? "error" : "primary"}
          overlap="circular"
        >
          {settings.enabled ? (
            criticalCount > 0 ? <ActiveIcon sx={{ color: 'error.main' }} /> : <NotificationIcon />
          ) : (
            <PausedIcon sx={{ color: 'text.disabled' }} />
          )}
        </Badge>
      </IconButton>

      {/* Enhanced Notification Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: { width: 420, maxHeight: 600 }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header with controls */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Notifications</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={() => queryClient.invalidateQueries('notifications')}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton size="small" onClick={() => setSettingsDialogOpen(true)}>
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <Chip 
                label={`${unreadCount} unread`} 
                color="primary" 
                size="small"
                onClick={markAllAsRead}
                clickable
              />
            )}
            {criticalCount > 0 && (
              <Chip 
                label={`${criticalCount} critical`} 
                color="error" 
                size="small"
                sx={{ ml: 1 }}
              />
            )}
            {isLoading && <LinearProgress sx={{ width: 60, height: 2 }} />}
          </Box>
        </Box>

        {/* Category Tabs */}
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All" />
          <Tab label="Apps" />
          <Tab label="Print" />
          <Tab label="Ship" />
          <Tab label="Collect" />
          <Tab label="ISO" />
          <Tab label="System" />
        </Tabs>

        {/* Notifications List */}
        {filteredNotificationsByTab().length === 0 ? (
          <MenuItem disabled>
            <Typography color="textSecondary">No notifications</Typography>
          </MenuItem>
        ) : (
          <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
            {filteredNotificationsByTab().map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationAction(notification)}
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    borderLeft: `4px solid ${
                      notification.priority === 'critical' ? 'red' :
                      notification.priority === 'high' ? 'orange' :
                      notification.priority === 'normal' ? 'blue' : 'gray'
                    }`,
                    '&:hover': {
                      backgroundColor: 'action.selected'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type, notification.category)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography 
                          variant="body2" 
                          fontWeight={notification.read ? 'normal' : 'bold'}
                          sx={{ flex: 1, mr: 1 }}
                        >
                          {notification.title}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography variant="caption" color="textSecondary">
                            {formatTimeAgo(notification.timestamp)}
                          </Typography>
                          <Chip
                            label={notification.priority.toUpperCase()}
                            size="small"
                            color={getPriorityColor(notification.priority)}
                            sx={{ mt: 0.5, fontSize: '0.6rem', height: 16 }}
                          />
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            label={notification.category.replace('_', ' ')}
                            size="small"
                            color={getCategoryColor(notification.category)}
                            variant="outlined"
                          />
                          {notification.actionLabel && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Button size="small" startIcon={<OpenIcon />}>
                                {notification.actionLabel}
                              </Button>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(notification.id);
                                }}
                              >
                                <ClearIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                        {notification.data?.progress !== undefined && (
                          <LinearProgress 
                            variant="determinate" 
                            value={notification.data.progress} 
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                  {!notification.read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        ml: 1
                      }}
                    />
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
            <MenuItem
              onClick={() => {
                navigate('/notifications');
                handleNotificationClose();
              }}
              sx={{ justifyContent: 'center' }}
            >
              <Typography variant="body2" color="primary">
                View All Notifications & History
              </Typography>
            </MenuItem>
          </Box>
        )}
      </Menu>

      {/* Enhanced Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {/* General Settings */}
            <Typography variant="h6" gutterBottom>General Settings</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled}
                  onChange={(e) => updateSettings({ enabled: e.target.checked })}
                />
              }
              label="Enable Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.sound_enabled}
                  onChange={(e) => updateSettings({ sound_enabled: e.target.checked })}
                />
              }
              label="Sound Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.desktop_notifications}
                  onChange={(e) => updateSettings({ desktop_notifications: e.target.checked })}
                />
              }
              label="Desktop Notifications"
            />

            {/* Category Settings */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Category Settings</Typography>
            {Object.entries(settings.categories).map(([category, categorySettings]: [string, any]) => (
              <Accordion key={category}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ textTransform: 'capitalize' }}>
                    {category.replace('_', ' ')} Notifications
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={categorySettings.enabled}
                        onChange={(e: any) => updateSettings({
                          categories: {
                            ...settings.categories,
                            [category]: { ...categorySettings, enabled: e.target.checked }
                          }
                        })}
                      />
                    }
                    label="Enabled"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={categorySettings.email_notifications}
                        onChange={(e: any) => updateSettings({
                          categories: {
                            ...settings.categories,
                            [category]: { ...categorySettings, email_notifications: e.target.checked }
                          }
                        })}
                      />
                    }
                    label="Email Notifications"
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => setSettingsDialogOpen(false)}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Snackbar for priority notifications */}
      <Snackbar
        open={!!currentSnackbar}
        autoHideDuration={currentSnackbar?.priority === 'critical' ? 10000 : 6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={currentSnackbar?.type || 'info'}
          variant="filled"
          sx={{ minWidth: 400 }}
        >
          <Typography variant="body2" fontWeight="bold">
            {currentSnackbar?.title || ''}
          </Typography>
          <Typography variant="body2">
            {currentSnackbar?.message || ''}
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationSystem; 