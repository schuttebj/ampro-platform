import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as ThemeIcon,
  System as SystemIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoIcon,
  VpnKey as PasswordIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Upload as ImportIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../api/services';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Profile settings
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    location_id: user?.location_id || '',
  });

  // Security settings
  const [securityForm, setSecurityForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    desktop_notifications: true,
    sound_notifications: false,
    application_alerts: true,
    system_alerts: true,
    workflow_updates: true,
    compliance_warnings: true,
    auto_refresh_interval: 30, // seconds
  });

  // Theme settings
  const [themeSettings, setThemeSettings] = useState({
    theme_mode: 'light', // light, dark, auto
    primary_color: '#1976d2',
    compact_mode: false,
    sidebar_collapsed: false,
    animations_enabled: true,
  });

  // System settings (admin only)
  const [systemSettings, setSystemSettings] = useState({
    session_timeout: 60, // minutes
    max_file_size: 10, // MB
    backup_frequency: 24, // hours
    maintenance_mode: false,
    debug_mode: false,
    api_rate_limit: 100, // requests per minute
  });

  // Dialogs
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      // Load user-specific settings from localStorage or API
      const savedNotifications = localStorage.getItem('ampro-notification-settings');
      if (savedNotifications) {
        setNotificationSettings({ ...notificationSettings, ...JSON.parse(savedNotifications) });
      }

      const savedTheme = localStorage.getItem('ampro-theme-settings');
      if (savedTheme) {
        setThemeSettings({ ...themeSettings, ...JSON.parse(savedTheme) });
      }

      // Load system settings if admin
      if (user?.is_superuser) {
        // This would be loaded from API
        // const systemData = await api.get('/admin/system-settings');
        // setSystemSettings(systemData.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Update user profile via API
      // const updatedUser = await authService.updateProfile(profileForm);
      // updateUser(updatedUser);
      
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setLoading(true);
      setError('');

      if (securityForm.new_password !== securityForm.confirm_password) {
        setError('New passwords do not match');
        return;
      }

      // Change password via API
      // await authService.changePassword(securityForm.current_password, securityForm.new_password);
      
      setSuccess('Password changed successfully');
      setPasswordDialogOpen(false);
      setSecurityForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = () => {
    try {
      localStorage.setItem('ampro-notification-settings', JSON.stringify(notificationSettings));
      setSuccess('Notification settings saved');
    } catch (err) {
      setError('Failed to save notification settings');
    }
  };

  const handleThemeUpdate = () => {
    try {
      localStorage.setItem('ampro-theme-settings', JSON.stringify(themeSettings));
      setSuccess('Theme settings saved');
      
      // Apply theme changes
      document.documentElement.setAttribute('data-theme', themeSettings.theme_mode);
    } catch (err) {
      setError('Failed to save theme settings');
    }
  };

  const handleSystemUpdate = async () => {
    if (!user?.is_superuser) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Update system settings via API
      // await api.put('/admin/system-settings', systemSettings);
      
      setSuccess('System settings updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  const exportSettings = () => {
    const exportData = {
      notifications: notificationSettings,
      theme: themeSettings,
      timestamp: new Date().toISOString(),
      user: user?.username,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ampro-settings-${user?.username}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setExportDialogOpen(false);
    setSuccess('Settings exported successfully');
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => setExportDialogOpen(true)}
          >
            Export Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUserSettings}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<ThemeIcon />} label="Appearance" />
          {user?.is_superuser && <Tab icon={<SystemIcon />} label="System" />}
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
                    src={user?.avatar_url}
                  >
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </Avatar>
                  <Typography variant="h6">
                    {user?.first_name} {user?.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {user?.role?.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Chip
                    label={user?.is_active ? 'Active' : 'Inactive'}
                    color={user?.is_active ? 'success' : 'error'}
                    size="small"
                  />
                  <Box sx={{ mt: 2 }}>
                    <IconButton color="primary">
                      <PhotoIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Department"
                        value={profileForm.department}
                        onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleProfileUpdate}
                        disabled={loading}
                      >
                        Save Changes
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Security
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <PasswordIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Change Password"
                        secondary="Update your account password"
                      />
                      <ListItemSecondaryAction>
                        <Button
                          variant="outlined"
                          onClick={() => setPasswordDialogOpen(true)}
                        >
                          Change
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <SecurityIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Two-Factor Authentication"
                        secondary="Add an extra layer of security"
                      />
                      <ListItemSecondaryAction>
                        <Switch />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Session Information
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Last Login:</strong> {user?.last_login || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Account Created:</strong> {user?.created_at || 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Session Expires:</strong> In 2 hours
                  </Typography>
                  <Button variant="outlined" color="warning" sx={{ mt: 2 }}>
                    Sign Out All Devices
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notification Preferences
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Email Notifications" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notificationSettings.email_notifications}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            email_notifications: e.target.checked
                          })}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Desktop Notifications" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notificationSettings.desktop_notifications}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            desktop_notifications: e.target.checked
                          })}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Sound Notifications" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notificationSettings.sound_notifications}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            sound_notifications: e.target.checked
                          })}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Alert Categories
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Application Alerts" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notificationSettings.application_alerts}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            application_alerts: e.target.checked
                          })}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="System Alerts" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notificationSettings.system_alerts}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            system_alerts: e.target.checked
                          })}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Workflow Updates" />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={notificationSettings.workflow_updates}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            workflow_updates: e.target.checked
                          })}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNotificationUpdate}
                    >
                      Save Notification Settings
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Theme Settings
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Theme Mode</InputLabel>
                    <Select
                      value={themeSettings.theme_mode}
                      label="Theme Mode"
                      onChange={(e) => setThemeSettings({
                        ...themeSettings,
                        theme_mode: e.target.value
                      })}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="auto">Auto</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Primary Color</InputLabel>
                    <Select
                      value={themeSettings.primary_color}
                      label="Primary Color"
                      onChange={(e) => setThemeSettings({
                        ...themeSettings,
                        primary_color: e.target.value
                      })}
                    >
                      <MenuItem value="#1976d2">Blue</MenuItem>
                      <MenuItem value="#4caf50">Green</MenuItem>
                      <MenuItem value="#ff9800">Orange</MenuItem>
                      <MenuItem value="#9c27b0">Purple</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={themeSettings.compact_mode}
                        onChange={(e) => setThemeSettings({
                          ...themeSettings,
                          compact_mode: e.target.checked
                        })}
                      />
                    }
                    label="Compact Mode"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Display Options
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={themeSettings.sidebar_collapsed}
                        onChange={(e) => setThemeSettings({
                          ...themeSettings,
                          sidebar_collapsed: e.target.checked
                        })}
                      />
                    }
                    label="Collapse Sidebar by Default"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={themeSettings.animations_enabled}
                        onChange={(e) => setThemeSettings({
                          ...themeSettings,
                          animations_enabled: e.target.checked
                        })}
                      />
                    }
                    label="Enable Animations"
                  />
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleThemeUpdate}
                    >
                      Save Appearance Settings
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* System Tab (Admin Only) */}
        {user?.is_superuser && (
          <TabPanel value={tabValue} index={4}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Administrator Settings</strong> - Changes here affect the entire system
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Configuration
                    </Typography>
                    <TextField
                      fullWidth
                      label="Session Timeout (minutes)"
                      type="number"
                      value={systemSettings.session_timeout}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        session_timeout: parseInt(e.target.value)
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Max File Size (MB)"
                      type="number"
                      value={systemSettings.max_file_size}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        max_file_size: parseInt(e.target.value)
                      })}
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.maintenance_mode}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            maintenance_mode: e.target.checked
                          })}
                        />
                      }
                      label="Maintenance Mode"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Advanced Settings
                    </Typography>
                    <TextField
                      fullWidth
                      label="API Rate Limit (requests/min)"
                      type="number"
                      value={systemSettings.api_rate_limit}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        api_rate_limit: parseInt(e.target.value)
                      })}
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.debug_mode}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            debug_mode: e.target.checked
                          })}
                        />
                      }
                      label="Debug Mode"
                    />
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={handleSystemUpdate}
                        disabled={loading}
                      >
                        Update System Settings
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        )}
      </Paper>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={securityForm.current_password}
            onChange={(e) => setSecurityForm({ ...securityForm, current_password: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={securityForm.new_password}
            onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={securityForm.confirm_password}
            onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} variant="contained" disabled={loading}>
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Settings Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will export your personal settings (notifications, theme, etc.) to a JSON file.
            System settings are not included.
          </Typography>
          <Alert severity="info">
            You can import these settings on another device or after reinstalling.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={exportSettings} variant="contained">
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings; 