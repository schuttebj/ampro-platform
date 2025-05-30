import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Print as PrintIcon,
  LocalShipping as ShippingIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { workflowService, authService } from '../api/services';

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
      id={`workflow-tabpanel-${index}`}
      aria-labelledby={`workflow-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const WorkflowDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Statistics
  const [printStats, setPrintStats] = useState<any>(null);
  const [shippingStats, setShippingStats] = useState<any>(null);
  
  // Queue data
  const [printQueue, setPrintQueue] = useState<any[]>([]);
  const [pendingShipments, setPendingShipments] = useState<any[]>([]);
  const [readyForCollection, setReadyForCollection] = useState<any[]>([]);
  
  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPrintJob, setSelectedPrintJob] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [printerName, setPrinterName] = useState('');
  const [printerUsers, setPrinterUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        printStatsData,
        shippingStatsData,
        printQueueData,
        pendingShipmentsData
      ] = await Promise.all([
        workflowService.getPrintJobStatistics(),
        workflowService.getShippingStatistics(),
        workflowService.getPrintQueue(),
        workflowService.getPendingShipments()
      ]);

      setPrintStats(printStatsData);
      setShippingStats(shippingStatsData);
      setPrintQueue(printQueueData.print_jobs || []);
      setPendingShipments(pendingShipmentsData);

    } catch (err: any) {
      console.error('Error loading workflow data:', err);
      setError(err.response?.data?.detail || 'Failed to load workflow data');
    } finally {
      setLoading(false);
    }
  };

  const loadPrinterUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await workflowService.getPrinterUsers();
      setPrinterUsers(users);
    } catch (err: any) {
      console.error('Error loading printer users:', err);
      setError(err.response?.data?.detail || 'Failed to load printer users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'queued': return 'default';
      case 'assigned': return 'info';
      case 'printing': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'default';
      case 'in_transit': return 'info';
      case 'delivered': return 'success';
      default: return 'default';
    }
  };

  const handleAssignPrintJob = async () => {
    if (!selectedPrintJob || !selectedUserId) return;

    try {
      await workflowService.assignPrintJob(selectedPrintJob.id, {
        assigned_to_user_id: parseInt(selectedUserId),
        printer_name: printerName || undefined
      });
      
      setAssignDialogOpen(false);
      setSelectedPrintJob(null);
      setSelectedUserId('');
      setPrinterName('');
      loadWorkflowData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign print job');
    }
  };

  const handleStartPrintJob = async (printJobId: number) => {
    try {
      await workflowService.startPrintJob(printJobId, {
        started_at: new Date().toISOString()
      });
      loadWorkflowData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start print job');
    }
  };

  const handleCompletePrintJob = async (printJobId: number) => {
    try {
      await workflowService.completePrintJob(printJobId, {
        completed_at: new Date().toISOString(),
        success: true
      });
      loadWorkflowData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete print job');
    }
  };

  const handleShipLicense = async () => {
    if (!selectedShipment || !trackingNumber) return;

    try {
      // Get current user for user_id requirement
      const currentUser = await authService.getCurrentUser();
      
      await workflowService.shipLicense(selectedShipment.id, {
        user_id: currentUser.id,
        tracking_number: trackingNumber,
        shipping_method: shippingMethod,
        shipped_at: new Date().toISOString()
      });
      
      setShipDialogOpen(false);
      setSelectedShipment(null);
      setTrackingNumber('');
      setShippingMethod('');
      loadWorkflowData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to ship license');
    }
  };

  const handleOpenAssignDialog = (job: any) => {
    setSelectedPrintJob(job);
    setSelectedUserId('');
    setPrinterName('');
    setAssignDialogOpen(true);
    loadPrinterUsers(); // Load users when dialog opens
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Workflow Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadWorkflowData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Print Queue
              </Typography>
              <Typography variant="h4">
                {printStats?.total_queued || 0}
              </Typography>
              <Typography variant="body2">
                {printStats?.total_assigned || 0} assigned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Currently Printing
              </Typography>
              <Typography variant="h4">
                {printStats?.total_printing || 0}
              </Typography>
              <Typography variant="body2">
                Active jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Shipments
              </Typography>
              <Typography variant="h4">
                {shippingStats?.total_pending || 0}
              </Typography>
              <Typography variant="body2">
                Ready to ship
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Transit
              </Typography>
              <Typography variant="h4">
                {shippingStats?.total_in_transit || 0}
              </Typography>
              <Typography variant="body2">
                Being delivered
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Workflow Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label={
              <Badge badgeContent={printQueue.length} color="primary">
                Print Queue
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={pendingShipments.length} color="primary">
                Shipping
              </Badge>
            } 
          />
          <Tab label="Collection Points" />
        </Tabs>

        {/* Print Queue Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>License #</TableCell>
                  <TableCell>Citizen</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Queued</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {printQueue.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.license?.license_number}</TableCell>
                    <TableCell>
                      {job.application?.citizen?.first_name} {job.application?.citizen?.last_name}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={job.status} 
                        color={getStatusColor(job.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={job.priority === 3 ? 'Urgent' : job.priority === 2 ? 'High' : 'Normal'}
                        color={job.priority === 3 ? 'error' : job.priority === 2 ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(job.queued_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {job.assigned_to?.username || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      {job.status === 'QUEUED' && (
                        <Tooltip title="Assign Job">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenAssignDialog(job)}
                          >
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {job.status === 'ASSIGNED' && (
                        <Tooltip title="Start Printing">
                          <IconButton
                            size="small"
                            onClick={() => handleStartPrintJob(job.id)}
                          >
                            <StartIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {job.status === 'PRINTING' && (
                        <Tooltip title="Mark Complete">
                          <IconButton
                            size="small"
                            onClick={() => handleCompletePrintJob(job.id)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Shipping Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>License #</TableCell>
                  <TableCell>Citizen</TableCell>
                  <TableCell>Collection Point</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tracking #</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>{shipment.license?.license_number}</TableCell>
                    <TableCell>
                      {shipment.application?.citizen?.first_name} {shipment.application?.citizen?.last_name}
                    </TableCell>
                    <TableCell>{shipment.collection_point}</TableCell>
                    <TableCell>
                      <Chip 
                        label={shipment.status} 
                        color={getStatusColor(shipment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{shipment.tracking_number || 'Not assigned'}</TableCell>
                    <TableCell>
                      {shipment.status === 'pending' && (
                        <Tooltip title="Ship License">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedShipment(shipment);
                              setShipDialogOpen(true);
                            }}
                          >
                            <ShippingIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Collection Points Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Ready for Collection
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Collection point management will be implemented here.
          </Typography>
        </TabPanel>
      </Paper>

      {/* Assign Print Job Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogTitle>Assign Print Job</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Assignee User</InputLabel>
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                label="Assignee User"
                disabled={loadingUsers}
              >
                {loadingUsers ? (
                  <MenuItem disabled>Loading users...</MenuItem>
                ) : printerUsers.length === 0 ? (
                  <MenuItem disabled>No printer users available</MenuItem>
                ) : (
                  printerUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.full_name || user.username} ({user.username})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Printer Name (Optional)"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAssignPrintJob} 
            variant="contained"
            disabled={loading || loadingUsers || !selectedUserId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ship License Dialog */}
      <Dialog open={shipDialogOpen} onClose={() => setShipDialogOpen(false)}>
        <DialogTitle>Ship License</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Tracking Number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Shipping Method</InputLabel>
              <Select
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
                label="Shipping Method"
              >
                <MenuItem value="courier">Courier</MenuItem>
                <MenuItem value="internal">Internal Delivery</MenuItem>
                <MenuItem value="postal">Postal Service</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShipDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleShipLicense} variant="contained">
            Ship
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowDashboard; 