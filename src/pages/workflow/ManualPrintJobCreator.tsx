import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as TestIcon,
  Person as PersonIcon,
  Assignment as ApplicationIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { workflowService } from '../../api/services';

interface ApprovedApplication {
  application_id: number;
  citizen_name: string;
  citizen_id_number: string;
  applied_category: string;
  approved_date: string;
  license_id: number | null;
  license_number: string | null;
  collection_point: string;
}

const ManualPrintJobCreator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approvedApps, setApprovedApps] = useState<ApprovedApplication[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    applicationId?: number;
    citizenName?: string;
  }>({ open: false });

  useEffect(() => {
    loadApprovedApplications();
  }, []);

  const loadApprovedApplications = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getApprovedApplicationsWithoutPrintJobs();
      setApprovedApps(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load approved applications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestPrintJob = async () => {
    try {
      setLoading(true);
      const result = await workflowService.createTestPrintJob();
      setSuccess(`Test print job created successfully! Job ID: ${result.print_job_id}`);
      loadApprovedApplications();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create test print job');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrintJob = async (applicationId: number) => {
    try {
      setLoading(true);
      const result = await workflowService.createPrintJobForApplication(applicationId);
      setSuccess(`Print job created for application ${applicationId}! Job ID: ${result.print_job_id}`);
      setConfirmDialog({ open: false });
      loadApprovedApplications();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create print job');
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (applicationId: number, citizenName: string) => {
    setConfirmDialog({ open: true, applicationId, citizenName });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Manual Print Job Creator
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create print jobs manually for testing or for approved applications that don't have print jobs yet.
      </Typography>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Print Job
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create a test print job using an existing approved application
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<TestIcon />}
                onClick={handleCreateTestPrintJob}
                disabled={loading}
                fullWidth
              >
                Create Test Job
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Approved Applications
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {approvedApps.length} applications ready for print jobs
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadApprovedApplications}
                disabled={loading}
                fullWidth
              >
                Refresh List
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Approved Applications Table */}
      <Typography variant="h6" gutterBottom>
        Approved Applications Without Print Jobs
      </Typography>
      
      {approvedApps.length === 0 ? (
        <Alert severity="info">
          No approved applications without print jobs found.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Application ID</TableCell>
                <TableCell>Citizen</TableCell>
                <TableCell>ID Number</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>License</TableCell>
                <TableCell>Collection Point</TableCell>
                <TableCell>Approved</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvedApps.map((app) => (
                <TableRow key={app.application_id}>
                  <TableCell>APP-{app.application_id.toString().padStart(6, '0')}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" />
                      {app.citizen_name}
                    </Box>
                  </TableCell>
                  <TableCell>{app.citizen_id_number}</TableCell>
                  <TableCell>
                    <Chip label={app.applied_category} size="small" />
                  </TableCell>
                  <TableCell>
                    {app.license_number ? (
                      <Chip label={app.license_number} color="success" size="small" />
                    ) : (
                      <Chip label="Pending" color="warning" size="small" />
                    )}
                  </TableCell>
                  <TableCell>{app.collection_point}</TableCell>
                  <TableCell>
                    {new Date(app.approved_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Create Print Job">
                      <IconButton
                        size="small"
                        onClick={() => openConfirmDialog(app.application_id, app.citizen_name)}
                        disabled={loading}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={() => setConfirmDialog({ open: false })}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Create Print Job</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to create a print job for application {confirmDialog.applicationId} 
            for citizen {confirmDialog.citizenName}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This will create a new print job and move the application to "Queued for Printing" status.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false })}>
            Cancel
          </Button>
          <Button 
            onClick={() => confirmDialog.applicationId && handleCreatePrintJob(confirmDialog.applicationId)}
            variant="contained"
            disabled={loading}
          >
            Create Print Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManualPrintJobCreator; 