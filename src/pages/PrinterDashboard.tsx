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
  MenuItem,
  Divider,
  Stack
} from '@mui/material';
import {
  Print as PrintIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { printerService } from '../api/services';

interface PrintJob {
  id: number;
  application_id: number;
  license_id: number;
  status: string;
  priority: number;
  assigned_to: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  front_pdf_path?: string;
  back_pdf_path?: string;
  combined_pdf_path?: string;
  printer_name?: string;
  notes?: string;
}

interface PrintJobStatistics {
  total_assigned: number;
  total_printing: number;
  total_completed_today: number;
  total_failed: number;
  average_print_time_minutes: number;
}

interface PrinterDashboard {
  user: {
    id: number;
    username: string;
    full_name: string;
    role: string;
  };
  assigned_jobs: PrintJob[];
  queue_statistics: any;
  user_statistics: PrintJobStatistics;
  timestamp: string;
}

const PrinterDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState<PrinterDashboard | null>(null);
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);
  
  // Dialog states
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPrintJob, setSelectedPrintJob] = useState<PrintJob | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [qualityCheckPassed, setQualityCheckPassed] = useState(true);
  const [completionNotes, setCompletionNotes] = useState('');
  const [applicationData, setApplicationData] = useState<any>(null);

  useEffect(() => {
    loadPrinterData();
    loadAvailablePrinters();
  }, []);

  const loadPrinterData = async () => {
    try {
      setLoading(true);
      setError('');

      const [dashboardResponse, queueResponse] = await Promise.all([
        printerService.getDashboard(),
        printerService.getPrintQueue()
      ]);

      setDashboardData(dashboardResponse);
      setPrintQueue(queueResponse.print_jobs || []);

    } catch (err: any) {
      console.error('Error loading printer data:', err);
      setError(err.response?.data?.detail || 'Failed to load printer data');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePrinters = async () => {
    try {
      const printers = await printerService.getAvailablePrinters();
      setAvailablePrinters(printers);
    } catch (err: any) {
      console.error('Error loading printers:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'queued': return 'default';
      case 'assigned': return 'info';
      case 'printing': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const handleStartPrintJob = async () => {
    if (!selectedPrintJob || !selectedPrinter) return;

    try {
      await printerService.startPrintJob(selectedPrintJob.id, {
        printer_name: selectedPrinter
      });
      
      setStartDialogOpen(false);
      setSelectedPrintJob(null);
      setSelectedPrinter('');
      loadPrinterData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start print job');
    }
  };

  const handleCompletePrintJob = async () => {
    if (!selectedPrintJob) return;

    try {
      await printerService.completePrintJob(selectedPrintJob.id, {
        quality_check_passed: qualityCheckPassed,
        notes: completionNotes
      });
      
      setCompleteDialogOpen(false);
      setSelectedPrintJob(null);
      setQualityCheckPassed(true);
      setCompletionNotes('');
      loadPrinterData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete print job');
    }
  };

  const handleViewApplication = async (printJob: PrintJob) => {
    try {
      const appData = await printerService.getApplicationForPrintJob(printJob.id);
      setApplicationData(appData);
      setSelectedPrintJob(printJob);
      setViewDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load application data');
    }
  };

  const downloadPrintFile = (filePath: string, fileName: string) => {
    // Create download link
    const link = document.createElement('a');
    link.href = `/api/v1/files/download?path=${encodeURIComponent(filePath)}`;
    link.download = fileName;
    link.click();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'error';
    if (priority === 2) return 'warning';
    return 'default';
  };

  if (loading && !dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading printer dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Printer Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* User Info & Quick Stats */}
      {dashboardData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <PersonIcon color="primary" />
                  <Box>
                    <Typography variant="h6">
                      {dashboardData.user.full_name || dashboardData.user.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Printer Operator
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <AssignmentIcon color="info" />
                  <Box>
                    <Typography variant="h4">
                      {dashboardData.user_statistics.total_assigned}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Assigned Jobs
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <PrintIcon color="warning" />
                  <Box>
                    <Typography variant="h4">
                      {dashboardData.user_statistics.total_printing}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Currently Printing
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CheckCircleIcon color="success" />
                  <Box>
                    <Typography variant="h4">
                      {dashboardData.user_statistics.total_completed_today}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed Today
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Print Queue */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">My Print Queue</Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadPrinterData}
              variant="outlined"
              size="small"
            >
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job ID</TableCell>
                  <TableCell>Application</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Printer</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {printQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">No print jobs in queue</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  printQueue.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>{job.id}</TableCell>
                      <TableCell>{job.application_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={job.priority === 1 ? 'High' : job.priority === 2 ? 'Medium' : 'Normal'}
                          color={getPriorityColor(job.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.status}
                          color={getStatusColor(job.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(job.created_at)}</TableCell>
                      <TableCell>{job.printer_name || '-'}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Application">
                            <IconButton
                              size="small"
                              onClick={() => handleViewApplication(job)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          {job.status === 'assigned' && (
                            <Tooltip title="Start Printing">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setSelectedPrintJob(job);
                                  setStartDialogOpen(true);
                                }}
                              >
                                <StartIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {job.status === 'printing' && (
                            <Tooltip title="Complete Job">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  setSelectedPrintJob(job);
                                  setCompleteDialogOpen(true);
                                }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Start Print Job Dialog */}
      <Dialog open={startDialogOpen} onClose={() => setStartDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start Print Job</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Printer</InputLabel>
              <Select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                label="Select Printer"
              >
                {availablePrinters.map((printer) => (
                  <MenuItem key={printer.name} value={printer.name}>
                    {printer.name} ({printer.status})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStartPrintJob}
            variant="contained"
            disabled={!selectedPrinter}
          >
            Start Printing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Print Job Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Print Job</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Quality Check</InputLabel>
              <Select
                value={qualityCheckPassed}
                onChange={(e) => setQualityCheckPassed(e.target.value as boolean)}
                label="Quality Check"
              >
                <MenuItem value={true}>Passed</MenuItem>
                <MenuItem value={false}>Failed</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (Optional)"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Add any notes about the print job..."
            />
          </Box>
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

      {/* View Application Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent>
          {applicationData && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Citizen Information</Typography>
                  <Typography><strong>Name:</strong> {applicationData.citizen?.first_name} {applicationData.citizen?.last_name}</Typography>
                  <Typography><strong>ID Number:</strong> {applicationData.citizen?.id_number}</Typography>
                  <Typography><strong>Birth Date:</strong> {applicationData.citizen?.birth_date}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>License Information</Typography>
                  <Typography><strong>License Number:</strong> {applicationData.license?.license_number}</Typography>
                  <Typography><strong>Category:</strong> {applicationData.license?.category}</Typography>
                  <Typography><strong>Issue Date:</strong> {applicationData.license?.issue_date}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Print Files</Typography>
                  <Stack direction="row" spacing={2}>
                    {applicationData.print_files?.front_pdf && (
                      <Button
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadPrintFile(applicationData.print_files.front_pdf, 'license_front.pdf')}
                      >
                        Front PDF
                      </Button>
                    )}
                    {applicationData.print_files?.back_pdf && (
                      <Button
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadPrintFile(applicationData.print_files.back_pdf, 'license_back.pdf')}
                      >
                        Back PDF
                      </Button>
                    )}
                    {applicationData.print_files?.combined_pdf && (
                      <Button
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadPrintFile(applicationData.print_files.combined_pdf, 'license_combined.pdf')}
                      >
                        Combined PDF
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrinterDashboard; 