import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import api from '../../api/api';
import LicensePreview from '../../components/LicensePreview';

// Define the Application interface
interface Application {
  id: number;
  license_type: string;
  application_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  citizen_id: number;
  citizen_name?: string;
  license_class?: string;
  notes?: string;
  reviewer_id?: number;
  reviewer_name?: string;
  created_at: string;
  updated_at: string;
  // Additional fields that might be in the response
  application_fee?: number;
  payment_status?: string;
  documents?: string[];
  rejection_reason?: string;
}

// Status color mapping
const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  processing: 'info',
};

const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [citizen, setCitizen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await api.get(`/applications/${id}`);
        setApplication(response.data);
        
        // Fetch citizen data for license preview
        if (response.data.citizen_id) {
          try {
            const citizenResponse = await api.get(`/citizens/${response.data.citizen_id}`);
            setCitizen(citizenResponse.data);
          } catch (citizenError) {
            console.error('Error fetching citizen details:', citizenError);
            // Don't set main error, just log it
          }
        }
      } catch (error: any) {
        console.error('Error fetching application details:', error);
        setError(error.response?.data?.detail || 'Failed to load application details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchApplicationDetails();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!application) return;
    
    if (window.confirm(`Are you sure you want to delete this application?`)) {
      try {
        setLoading(true);
        const response = await api.delete(`/applications/${id}`);
        
        if (response.status === 204 || response.status === 200) {
          navigate('/applications');
        } else {
          throw new Error('Failed to delete application');
        }
      } catch (error: any) {
        console.error('Error deleting application:', error);
        setError(error.response?.data?.detail || 'Failed to delete application.');
        setLoading(false);
      }
    }
  };

  const handleApprove = async () => {
    if (!application) return;
    
    if (window.confirm('Are you sure you want to approve this application? This will generate a license.')) {
      try {
        setLoading(true);
        await api.post(`/applications/${id}/approve`);
        // Reload the application details after approval
        const response = await api.get(`/applications/${id}`);
        setApplication(response.data);
        setLoading(false);
      } catch (error: any) {
        console.error('Error approving application:', error);
        setError(error.response?.data?.detail || 'Failed to approve application.');
        setLoading(false);
      }
    }
  };

  const handleRejectDialogOpen = () => {
    setRejectDialogOpen(true);
  };

  const handleRejectDialogClose = () => {
    setRejectDialogOpen(false);
  };

  const handleReject = async () => {
    if (!application) return;
    
    try {
      setLoading(true);
      await api.post(`/applications/${id}/reject`, { 
        rejection_reason: rejectionReason 
      });
      
      // Reload the application details after rejection
      const response = await api.get(`/applications/${id}`);
      setApplication(response.data);
      setRejectDialogOpen(false);
      setLoading(false);
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      setError(error.response?.data?.detail || 'Failed to reject application.');
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/applications')}
        >
          Back to Applications
        </Button>
      </Box>
    );
  }

  if (!application) {
    return (
      <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 3 }}>
        <Alert severity="warning">Application not found.</Alert>
        <Button
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/applications')}
        >
          Back to Applications
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/applications')}
        >
          Back to Applications
        </Button>
        <Box>
          {application.status === 'pending' && (
            <>
              <IconButton 
                color="success" 
                onClick={handleApprove}
                sx={{ mr: 1 }}
                title="Approve application"
              >
                <ApproveIcon />
              </IconButton>
              <IconButton 
                color="error" 
                onClick={handleRejectDialogOpen}
                sx={{ mr: 1 }}
                title="Reject application"
              >
                <RejectIcon />
              </IconButton>
            </>
          )}
          <IconButton 
            color="primary" 
            onClick={() => navigate(`/applications/${id}/edit`)}
            sx={{ mr: 1 }}
            title="Edit application"
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            color="error" 
            onClick={handleDelete}
            title="Delete application"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            License Application #{application.id}
          </Typography>
          <Chip 
            label={application.status} 
            color={statusColors[application.status] || 'default'} 
          />
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Application Information" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">License Type</Typography>
                    <Typography variant="body1">{application.license_type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">License Class</Typography>
                    <Typography variant="body1">{application.license_class || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Application Date</Typography>
                    <Typography variant="body1">{formatDate(application.application_date)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Application Fee</Typography>
                    <Typography variant="body1">
                      {application.application_fee ? `$${application.application_fee.toFixed(2)}` : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Payment Status</Typography>
                    <Typography variant="body1">{application.payment_status || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                    <Typography variant="body1">{application.notes || 'No notes'}</Typography>
                  </Grid>
                  {application.status === 'rejected' && application.rejection_reason && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Rejection Reason</Typography>
                      <Typography variant="body1" color="error">{application.rejection_reason}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Applicant Information" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Citizen Name</Typography>
                    <Typography variant="body1">
                      {application.citizen_name || 'Unknown'}
                      <Button 
                        size="small" 
                        onClick={() => navigate(`/citizens/${application.citizen_id}`)}
                        sx={{ ml: 1 }}
                      >
                        View Citizen
                      </Button>
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Citizen ID</Typography>
                    <Typography variant="body1">{application.citizen_id}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {application.reviewer_id && (
              <Card sx={{ mt: 2 }}>
                <CardHeader title="Review Information" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Reviewer</Typography>
                      <Typography variant="body1">{application.reviewer_name || `ID: ${application.reviewer_id}`}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                      <Typography variant="body1">{formatDate(application.updated_at)}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* License Preview Section */}
        {citizen && (application.status === 'pending' || application.status === 'approved') && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="License Preview" 
                  avatar={<PreviewIcon />}
                  subheader="Preview of the license that will be generated upon approval"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <LicensePreview
                      application={{
                        id: application.id,
                        license_type: application.license_type,
                        license_class: application.license_class,
                        status: application.status
                      }}
                      citizen={{
                        id: citizen.id,
                        id_number: citizen.id_number,
                        first_name: citizen.first_name,
                        last_name: citizen.last_name,
                        date_of_birth: citizen.date_of_birth,
                        gender: citizen.gender,
                        address_line1: citizen.address_line1,
                        city: citizen.city,
                        state_province: citizen.state_province,
                        photo_url: citizen.photo_url
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={() => navigate(`/applications/${id}/edit`)}
            sx={{ mr: 2 }}
          >
            Edit Application
          </Button>
          {application.status === 'pending' && (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={handleApprove}
                sx={{ mr: 2 }}
              >
                Approve Application
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleRejectDialogOpen}
              >
                Reject Application
              </Button>
            </>
          )}
        </Box>
      </Paper>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleRejectDialogClose}>
        <DialogTitle>Reject Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting this application.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="rejection-reason"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectDialogClose}>Cancel</Button>
          <Button onClick={handleReject} color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationDetails; 