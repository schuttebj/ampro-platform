import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Snackbar,
  Grid,
  LinearProgress,
  Tooltip,
  Badge,
  SelectChangeEvent,
} from '@mui/material';
import {
  Print as PrintIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  Assignment as AssignmentIcon,
  PlayArrow as StartIcon,
  Done as CompleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { 
  workflowService, 
  isoComplianceService, 
  userService 
} from '../api/services';
import {
  PrintJob,
  PrintQueue,
  PrintJobStatistics,
  ShippingRecord,
  ShippingStatistics,
  Printer,
  User,
  ISOComplianceInfo
} from '../types';

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

interface WorkflowStatistics {
  print_jobs: PrintJobStatistics;
  shipping: ShippingStatistics;
}

const WorkflowManager: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [shippingRecords, setShippingRecords] = useState<ShippingRecord[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<WorkflowStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; printJobId?: number }>({ open: false });
  const [printDialog, setPrintDialog] = useState<{ open: boolean; printJobId?: number }>({ open: false });
  const [shipDialog, setShipDialog] = useState<{ open: boolean; shippingId?: number }>({ open: false });
  const [isoDialog, setIsoDialog] = useState<{ open: boolean; licenseId?: number; isoInfo?: ISOComplianceInfo }>({ open: false });

  // Form states
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [copies, setCopies] = useState<number>(1);
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    loadData();
    loadPrinters();
    loadUsers();
    loadStatistics();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load print queue
      const printData = await workflowService.getPrintQueue();
      setPrintJobs(printData.print_jobs);

      // Load pending shipments
      const shipData = await workflowService.getPendingShipments();
      setShippingRecords(shipData);
    } catch (err) {
      setError('Failed to load workflow data');
      console.error('Error loading workflow data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPrinters = async () => {
    try {
      const data = await workflowService.getAvailablePrinters();
      setPrinters(data);
    } catch (err) {
      console.error('Failed to load printers:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      const [printStats, shippingStats] = await Promise.all([
        workflowService.getPrintJobStatistics(),
        workflowService.getShippingStatistics()
      ]);
      
      setStatistics({
        print_jobs: printStats,
        shipping: shippingStats
      });
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleAssignPrintJob = async () => {
    if (!assignDialog.printJobId || !selectedUserId) return;
    
    try {
      await workflowService.assignPrintJob(assignDialog.printJobId, {
        assigned_to_user_id: selectedUserId as number
      });
      
      setSuccess('Print job assigned successfully');
      setAssignDialog({ open: false });
      setSelectedUserId('');
      loadData();
    } catch (err) {
      setError('Failed to assign print job');
      console.error('Error assigning print job:', err);
    }
  };

  const handleStartPrintJob = async (printJobId: number) => {
    if (!selectedPrinter) {
      setError('Please select a printer');
      return;
    }
    
    try {
      await workflowService.startPrintJob(printJobId, {
        started_at: new Date().toISOString(),
        printer_name: selectedPrinter
      });
      
      setSuccess('Print job started successfully');
      loadData();
    } catch (err) {
      setError('Failed to start print job');
      console.error('Error starting print job:', err);
    }
  };

  const handlePrintLicense = async () => {
    if (!printDialog.printJobId) return;
    
    try {
      await workflowService.printLicenseCard(
        printDialog.printJobId,
        selectedPrinter || undefined,
        copies
      );
      
      setSuccess('License card printed successfully');
      setPrintDialog({ open: false });
      setSelectedPrinter('');
      setCopies(1);
      loadData();
    } catch (err) {
      setError('Failed to print license card');
      console.error('Error printing license card:', err);
    }
  };

  const handleCompletePrintJob = async (printJobId: number) => {
    try {
      await workflowService.completePrintJob(printJobId, {
        completed_at: new Date().toISOString(),
        success: true,
        copies_printed: 1,
        notes: 'Completed successfully'
      });
      
      setSuccess('Print job completed successfully');
      loadData();
    } catch (err) {
      setError('Failed to complete print job');
      console.error('Error completing print job:', err);
    }
  };

  const handleShipLicense = async () => {
    if (!shipDialog.shippingId) return;
    
    try {
      await workflowService.shipLicense(shipDialog.shippingId, {
        user_id: 1, // Current user ID - should be from auth context
        tracking_number: trackingNumber,
        shipping_method: shippingMethod,
        notes: notes
      });
      
      setSuccess('License shipped successfully');
      setShipDialog({ open: false });
      setTrackingNumber('');
      setShippingMethod('');
      setNotes('');
      loadData();
    } catch (err) {
      setError('Failed to ship license');
      console.error('Error shipping license:', err);
    }
  };

  const handleViewISOCompliance = async (licenseId: number) => {
    try {
      const isoInfo = await isoComplianceService.getLicenseISOCompliance(licenseId);
      setIsoDialog({ open: true, licenseId, isoInfo });
    } catch (err) {
      setError('Failed to load ISO compliance information');
      console.error('Error loading ISO compliance:', err);
    }
  };

  const handleValidateISOCompliance = async (licenseId: number) => {
    try {
      const validationResult = await isoComplianceService.validateLicenseISOCompliance(licenseId);
      setSuccess(`ISO Compliance Score: ${validationResult.validation_result.score}/100`);
      
      // Refresh ISO info
      const isoInfo = await isoComplianceService.getLicenseISOCompliance(licenseId);
      setIsoDialog(prev => ({ ...prev, isoInfo }));
    } catch (err) {
      setError('Failed to validate ISO compliance');
      console.error('Error validating ISO compliance:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'queued': case 'pending': return 'warning';
      case 'assigned': case 'in_transit': return 'info';
      case 'printing': return 'secondary';
      case 'completed': case 'delivered': return 'success';
      case 'failed': case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return 'error';   // Urgent
      case 2: return 'warning'; // High
      case 1: return 'info';    // Normal
      default: return 'default';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 3: return 'Urgent';
      case 2: return 'High';
      case 1: return 'Normal';
      default: return 'Unknown';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Workflow Management
      </Typography>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Print Job Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Queued: {statistics.print_jobs.queued}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Printing: {statistics.print_jobs.printing}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Completed: {statistics.print_jobs.completed}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total: {statistics.print_jobs.total}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Shipping Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Pending: {statistics.shipping.pending}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      In Transit: {statistics.shipping.in_transit}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Delivered: {statistics.shipping.delivered}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total: {statistics.shipping.total}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab 
              label={
                <Badge badgeContent={statistics?.print_jobs.queued || 0} color="primary">
                  Print Queue
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={statistics?.shipping.pending || 0} color="primary">
                  Shipping
                </Badge>
              } 
            />
            <Tab label="Collection" />
          </Tabs>
        </Box>

        {loading && <LinearProgress />}

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Print Queue</Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job ID</TableCell>
                  <TableCell>License</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Queued</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>ISO Compliant</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {printJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.id}</TableCell>
                    <TableCell>
                      App #{job.application_id}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        License #{job.license_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        color={getStatusColor(job.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPriorityText(job.priority)}
                        color={getPriorityColor(job.priority) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(job.queued_at), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell>
                      {job.assigned_to?.full_name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View ISO Compliance">
                        <IconButton
                          size="small"
                          onClick={() => handleViewISOCompliance(job.license_id)}
                        >
                          <SecurityIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {job.status === 'QUEUED' && (
                          <Tooltip title="Assign Job">
                            <IconButton
                              size="small"
                              onClick={() => setAssignDialog({ open: true, printJobId: job.id })}
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
                          <>
                            <Tooltip title="Print License">
                              <IconButton
                                size="small"
                                onClick={() => setPrintDialog({ open: true, printJobId: job.id })}
                              >
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Complete Job">
                              <IconButton
                                size="small"
                                onClick={() => handleCompletePrintJob(job.id)}
                              >
                                <CompleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Shipping Management</Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Shipping ID</TableCell>
                  <TableCell>License</TableCell>
                  <TableCell>Collection Point</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tracking</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shippingRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.id}</TableCell>
                    <TableCell>
                      App #{record.application_id}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        License #{record.license_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{record.collection_point}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={getStatusColor(record.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{record.tracking_number || 'N/A'}</TableCell>
                    <TableCell>{record.shipping_method || 'N/A'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {record.status === 'PENDING' && (
                          <Tooltip title="Ship License">
                            <IconButton
                              size="small"
                              onClick={() => setShipDialog({ open: true, shippingId: record.id })}
                            >
                              <ShippingIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {record.status === 'IN_TRANSIT' && (
                          <Tooltip title="Mark as Delivered">
                            <IconButton
                              size="small"
                              onClick={() => workflowService.deliverLicense(record.id, { user_id: 1 })}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Collection Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Collection management features will be implemented here.
            This will show licenses ready for collection at various collection points.
          </Typography>
        </TabPanel>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false })}>
        <DialogTitle>Assign Print Job</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Assign to User</InputLabel>
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value as number)}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.full_name} ({user.username})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog({ open: false })}>Cancel</Button>
          <Button onClick={handleAssignPrintJob} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={printDialog.open} onClose={() => setPrintDialog({ open: false })}>
        <DialogTitle>Print License Card</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Printer</InputLabel>
            <Select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
            >
              {printers.map((printer) => (
                <MenuItem key={printer.name} value={printer.name}>
                  {printer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Number of Copies"
            type="number"
            value={copies}
            onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
            sx={{ mt: 2 }}
            inputProps={{ min: 1, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintDialog({ open: false })}>Cancel</Button>
          <Button onClick={handlePrintLicense} variant="contained">
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shipping Dialog */}
      <Dialog open={shipDialog.open} onClose={() => setShipDialog({ open: false })}>
        <DialogTitle>Ship License</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Shipping Method"
            value={shippingMethod}
            onChange={(e) => setShippingMethod(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShipDialog({ open: false })}>Cancel</Button>
          <Button onClick={handleShipLicense} variant="contained">
            Ship
          </Button>
        </DialogActions>
      </Dialog>

      {/* ISO Compliance Dialog */}
      <Dialog 
        open={isoDialog.open} 
        onClose={() => setIsoDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            ISO 18013 Compliance Information
          </Box>
        </DialogTitle>
        <DialogContent>
          {isoDialog.isoInfo && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Basic Information
                  </Typography>
                  <Typography variant="body2">
                    License: {isoDialog.isoInfo.license_number}
                  </Typography>
                  <Typography variant="body2">
                    ISO Version: {isoDialog.isoInfo.iso_version}
                  </Typography>
                  <Typography variant="body2">
                    Country: {isoDialog.isoInfo.iso_country_code}
                  </Typography>
                  <Typography variant="body2">
                    Authority: {isoDialog.isoInfo.iso_issuing_authority}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Compliance Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <VerifiedIcon color={isoDialog.isoInfo.iso_compliant ? 'success' : 'error'} />
                    <Typography variant="body2">
                      {isoDialog.isoInfo.iso_compliant ? 'ISO Compliant' : 'Not Compliant'}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    International Validity: {isoDialog.isoInfo.international_validity ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2">
                    Vienna Convention: {isoDialog.isoInfo.vienna_convention_compliant ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Security Features
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label="Digital Signature" 
                      color={isoDialog.isoInfo.digital_signature.has_signature ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label="Biometric Data" 
                      color={isoDialog.isoInfo.biometric_data.has_template ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label="RFID Chip" 
                      color={isoDialog.isoInfo.chip_data.has_encrypted_data ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label="MRZ Data" 
                      color={isoDialog.isoInfo.mrz_data.line1 ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => isoDialog.licenseId && handleValidateISOCompliance(isoDialog.licenseId)}
            startIcon={<SecurityIcon />}
          >
            Validate Compliance
          </Button>
          <Button onClick={() => setIsoDialog({ open: false })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkflowManager; 