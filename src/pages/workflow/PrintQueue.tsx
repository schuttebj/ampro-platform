import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  Print as PrintIcon,
  PlayArrow as StartIcon,
  Assignment as AssignIcon,
  CheckCircle as CompleteIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { workflowService, userService } from '../../api/services';
import { PrintJob, User, PrintJobStatistics } from '../../types';

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
      id={`print-tabpanel-${index}`}
      aria-labelledby={`print-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PrintQueue: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data state
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [statistics, setStatistics] = useState<PrintJobStatistics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  
  // Dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedPrintJob, setSelectedPrintJob] = useState<PrintJob | null>(null);
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [copiesCount, setCopiesCount] = useState(1);
  const [completionNotes, setCompletionNotes] = useState('');

  // Manual testing state
  const [approvedApps, setApprovedApps] = useState<any[]>([]);
  const [testingDialogOpen, setTestingDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPrintQueueData();
    loadApprovedApplications();
  }, []);

  const loadPrintQueueData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        queueData,
        statsData,
        usersData,
        printersData
      ] = await Promise.all([
        workflowService.getPrintQueue(),
        workflowService.getPrintJobStatistics(),
        userService.getUsers(),
        workflowService.getAvailablePrinters()
      ]);

      setPrintJobs(queueData.print_jobs || []);
      setStatistics(statsData);
      setUsers(usersData.filter((user: User) => ['admin', 'printer'].includes(user.role)));
      setPrinters(printersData);

    } catch (err: any) {
      console.error('Error loading print queue data:', err);
      setError(err.response?.data?.detail || 'Failed to load print queue data');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedApplications = async () => {
    try {
      const approvedAppsData = await workflowService.getApprovedApplicationsWithoutPrintJobs();
      setApprovedApps(approvedAppsData);
    } catch (err: any) {
      console.warn('Failed to load approved applications:', err);
      setApprovedApps([]);
    }
  };

  const handleCreateTestPrintJob = async () => {
    try {
      setLoading(true);
      const result = await workflowService.createTestPrintJob();
      setSuccessMessage(`Test print job created successfully! Job ID: ${result.print_job_id}`);
      loadPrintQueueData();
      loadApprovedApplications();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create test print job');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrintJobForApplication = async (applicationId: number) => {
    try {
      setLoading(true);
      const result = await workflowService.createPrintJobForApplication(applicationId);
      setSuccessMessage(`Print job created for application ${applicationId}! Job ID: ${result.print_job_id}`);
      loadPrintQueueData();
      loadApprovedApplications();
      setTestingDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create print job');
    } finally {
      setLoading(false);
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
      case 'cancelled': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return 'error'; // Urgent
      case 2: return 'warning'; // High
      case 1: return 'default'; // Normal
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3: return 'Urgent';
      case 2: return 'High';
      case 1: return 'Normal';
      default: return 'Normal';
    }
  };

  // Dialog handlers
  const handleAssignDialogOpen = (printJob: PrintJob) => {
    setSelectedPrintJob(printJob);
    setAssigneeUserId('');
    setAssignDialogOpen(true);
  };

  const handleStartDialogOpen = (printJob: PrintJob) => {
    setSelectedPrintJob(printJob);
    setSelectedPrinter('');
    setStartDialogOpen(true);
  };

  const handleCompleteDialogOpen = (printJob: PrintJob) => {
    setSelectedPrintJob(printJob);
    setCopiesCount(1);
    setCompletionNotes('');
    setCompleteDialogOpen(true);
  };

  const handleAssignPrintJob = async () => {
    if (!selectedPrintJob || !assigneeUserId) return;

    try {
      await workflowService.assignPrintJob(selectedPrintJob.id, {
        assigned_to_user_id: parseInt(assigneeUserId)
      });
      
      setAssignDialogOpen(false);
      setSelectedPrintJob(null);
      setAssigneeUserId('');
      loadPrintQueueData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign print job');
    }
  };

  const handleStartPrintJob = async () => {
    if (!selectedPrintJob) return;

    try {
      await workflowService.startPrintJob(selectedPrintJob.id, {
        started_at: new Date().toISOString(),
        printer_name: selectedPrinter
      });
      
      setStartDialogOpen(false);
      setSelectedPrintJob(null);
      setSelectedPrinter('');
      loadPrintQueueData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start print job');
    }
  };

  const handleCompletePrintJob = async () => {
    if (!selectedPrintJob) return;

    try {
      await workflowService.completePrintJob(selectedPrintJob.id, {
        completed_at: new Date().toISOString(),
        success: true,
        copies_printed: copiesCount,
        notes: completionNotes
      });
      
      setCompleteDialogOpen(false);
      setSelectedPrintJob(null);
      setCopiesCount(1);
      setCompletionNotes('');
      loadPrintQueueData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete print job');
    }
  };

  const handlePrintLicenseCard = async (printJobId: number) => {
    try {
      await workflowService.printLicenseCard(printJobId);
      // Show success message or update status
      loadPrintQueueData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to print license card');
    }
  };

  const filterPrintJobsByStatus = (status: string[]) => {
    return printJobs.filter(job => status.includes(job.status));
  };

  const renderPrintJobTable = (jobs: PrintJob[]) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Job ID</TableCell>
            <TableCell>Application</TableCell>
            <TableCell>Citizen</TableCell>
            <TableCell>License #</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Assigned To</TableCell>
            <TableCell>Queued</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>PJ-{job.id.toString().padStart(4, '0')}</TableCell>
              <TableCell>APP-{job.application_id.toString().padStart(6, '0')}</TableCell>
              <TableCell>{'Unknown Citizen'}</TableCell>
              <TableCell>{'License Pending'}</TableCell>
              <TableCell>
                <Chip 
                  label={getPriorityLabel(job.priority)} 
                  color={getPriorityColor(job.priority)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={job.status.replace('_', ' ')} 
                  color={getStatusColor(job.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {job.assigned_to?.full_name ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2">{job.assigned_to.full_name}</Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">Unassigned</Typography>
                )}
              </TableCell>
              <TableCell>
                {new Date(job.queued_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {job.status === 'QUEUED' && (
                    <Tooltip title="Assign to Operator">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleAssignDialogOpen(job)}
                      >
                        <AssignIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {job.status === 'ASSIGNED' && (
                    <Tooltip title="Start Printing">
                      <IconButton 
                        size="small" 
                        color="warning"
                        onClick={() => handleStartDialogOpen(job)}
                      >
                        <StartIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {job.status === 'PRINTING' && (
                    <>
                      <Tooltip title="Print License Card">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handlePrintLicenseCard(job.id)}
                        >
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Complete Job">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleCompleteDialogOpen(job)}
                        >
                          <CompleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="View Files">
                    <IconButton 
                      size="small"
                      onClick={() => navigate(`/licenses/${job.license_id}`)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const queuedJobs = filterPrintJobsByStatus(['QUEUED']);
  const assignedJobs = filterPrintJobsByStatus(['ASSIGNED']);
  const printingJobs = filterPrintJobsByStatus(['PRINTING']);
  const completedJobs = filterPrintJobsByStatus(['COMPLETED']);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Print Queue Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadPrintQueueData}
            disabled={loading}
            variant="outlined"
          >
            Refresh
          </Button>
          <Button
            startIcon={<SettingsIcon />}
            onClick={() => setTestingDialogOpen(true)}
            variant="outlined"
            color="info"
          >
            Manual Testing
          </Button>
        </Box>
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Alert 
          severity="success" 
          onClose={() => setSuccessMessage('')} 
          sx={{ mb: 2 }}
        >
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError('')} 
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="default">
                  {statistics.queued}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Queued
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {statistics.assigned}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assigned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {statistics.printing}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Printing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {statistics.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {statistics.failed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main">
                  {statistics.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab 
            label={
              <Badge badgeContent={queuedJobs.length} color="default">
                Queued
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={assignedJobs.length} color="info">
                Assigned
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={printingJobs.length} color="warning">
                Printing
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={completedJobs.length} color="success">
                Completed
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {queuedJobs.length === 0 ? (
          <Alert severity="info">No print jobs in queue</Alert>
        ) : (
          renderPrintJobTable(queuedJobs)
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {assignedJobs.length === 0 ? (
          <Alert severity="info">No assigned print jobs</Alert>
        ) : (
          renderPrintJobTable(assignedJobs)
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {printingJobs.length === 0 ? (
          <Alert severity="info">No print jobs currently printing</Alert>
        ) : (
          renderPrintJobTable(printingJobs)
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {completedJobs.length === 0 ? (
          <Alert severity="info">No completed print jobs</Alert>
        ) : (
          renderPrintJobTable(completedJobs)
        )}
      </TabPanel>

      {/* Loading Overlay */}
      {loading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Print Job</DialogTitle>
        <DialogContent>
          {selectedPrintJob && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Print Job: PJ-{selectedPrintJob.id.toString().padStart(4, '0')}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Application: APP-{selectedPrintJob.application_id.toString().padStart(6, '0')}
              </Typography>

              <FormControl fullWidth sx={{ mt: 3 }}>
                <InputLabel>Assign to User</InputLabel>
                <Select
                  value={assigneeUserId}
                  label="Assign to User"
                  onChange={(e) => setAssigneeUserId(e.target.value)}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id.toString()}>
                      {user.full_name} ({user.username}) - {user.role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAssignPrintJob} 
            variant="contained" 
            disabled={!assigneeUserId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Start Dialog */}
      <Dialog open={startDialogOpen} onClose={() => setStartDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start Print Job</DialogTitle>
        <DialogContent>
          {selectedPrintJob && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Print Job: PJ-{selectedPrintJob.id.toString().padStart(4, '0')}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Assigned to: {selectedPrintJob.assigned_to?.full_name || 'Unknown'}
              </Typography>

              <FormControl fullWidth sx={{ mt: 3 }}>
                <InputLabel>Select Printer</InputLabel>
                <Select
                  value={selectedPrinter}
                  label="Select Printer"
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                >
                  {printers.map((printer) => (
                    <MenuItem key={printer.name} value={printer.name}>
                      {printer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleStartPrintJob} 
            variant="contained" 
            color="warning"
            disabled={!selectedPrinter}
          >
            Start Printing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Print Job</DialogTitle>
        <DialogContent>
          {selectedPrintJob && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Print Job: PJ-{selectedPrintJob.id.toString().padStart(4, '0')}
              </Typography>

              <TextField
                fullWidth
                label="Copies Printed"
                type="number"
                value={copiesCount}
                onChange={(e) => setCopiesCount(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 10 }}
                sx={{ mt: 2, mb: 2 }}
              />

              <TextField
                fullWidth
                label="Completion Notes (Optional)"
                multiline
                rows={3}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any notes about the printing process..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCompletePrintJob} 
            variant="contained" 
            color="success"
          >
            Complete Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Testing Dialog */}
      <Dialog open={testingDialogOpen} onClose={() => setTestingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manual Testing</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Use the dedicated Manual Print Job Creator tool to:
            </Typography>
            <Box component="ul" sx={{ mb: 2 }}>
              <li>Create test print jobs for system testing</li>
              <li>Generate print jobs for approved applications</li>
              <li>View applications ready for print job creation</li>
            </Box>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                navigate('/workflow/manual-print-jobs');
                setTestingDialogOpen(false);
              }}
            >
              Open Manual Print Job Creator
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestingDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrintQueue; 