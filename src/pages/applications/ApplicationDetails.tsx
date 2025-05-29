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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as PreviewIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { applicationService, workflowService } from '../../api/services';
import { Application } from '../../types';
import LicensePreview from '../../components/LicensePreview';
import api from '../../api/api';

// Status color mapping
const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warning',
  PENDING_DOCUMENTS: 'warning',
  PENDING_PAYMENT: 'warning',
  APPROVED: 'success',
  LICENSE_GENERATED: 'success',
  QUEUED_FOR_PRINTING: 'info',
  PRINTING: 'info',
  PRINTED: 'success',
  SHIPPED: 'success',
  READY_FOR_COLLECTION: 'success',
  COMPLETED: 'success',
  REJECTED: 'error',
  CANCELLED: 'error'
};

// Application type labels
const applicationTypeLabels: Record<string, string> = {
  'new': 'New License',
  'renewal': 'License Renewal',
  'replacement': 'Replacement (Lost/Damaged)',
  'upgrade': 'Category Upgrade',
  'conversion': 'Foreign License Conversion'
};

// License category descriptions
const licenseCategoryDescriptions: Record<string, string> = {
  'A': 'Category A - Motorcycles',
  'B': 'Category B - Light Motor Vehicles',
  'C': 'Category C - Heavy Motor Vehicles',
  'D': 'Category D - Buses',
  'EB': 'Category EB - Light Motor Vehicle with Trailer',
  'EC': 'Category EC - Heavy Motor Vehicle with Trailer'
};

// Collection points - this should ideally come from a configuration or API
const COLLECTION_POINTS = [
  'Cape Town Central',
  'Johannesburg Central', 
  'Durban Central',
  'Pretoria Central',
  'Port Elizabeth Central',
  'Bloemfontein Central'
];

const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [citizen, setCitizen] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        const applicationData = await applicationService.getApplication(parseInt(id!));
        setApplication(applicationData);
        
        // Fetch citizen data for license preview
        if (applicationData.citizen_id) {
          try {
            const citizenData = await applicationService.getCitizenApplications(applicationData.citizen_id);
            // This is a workaround - we should have a proper citizen service call
            setCitizen(applicationData.citizen);
          } catch (citizenError) {
            console.error('Error fetching citizen details:', citizenError);
            // Don't set main error, just log it
          }
        }

        // Fetch location data if location_id exists
        if (applicationData.location_id) {
          try {
            const locationResponse = await api.get(`/locations/${applicationData.location_id}`);
            setLocation(locationResponse.data);
          } catch (locationError) {
            console.error('Error fetching location details:', locationError);
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
        await applicationService.deleteApplication(application.id);
        navigate('/applications');
      } catch (error: any) {
        console.error('Error deleting application:', error);
        setError(error.response?.data?.detail || 'Failed to delete application.');
        setLoading(false);
      }
    }
  };

  const handleApproveDialogOpen = () => {
    setApproveDialogOpen(true);
  };

  const handleApproveDialogClose = () => {
    setApproveDialogOpen(false);
    setSelectedCollectionPoint('');
    setApprovalNotes('');
  };

  const handleApprove = async () => {
    if (!application || !selectedCollectionPoint) return;
    
    try {
      setLoading(true);
      await workflowService.approveApplication(application.id, {
        collection_point: selectedCollectionPoint,
        notes: approvalNotes
      });
      
      // Reload the application details after approval
      const updatedApplication = await applicationService.getApplication(application.id);
      setApplication(updatedApplication);
      setApproveDialogOpen(false);
      setLoading(false);
    } catch (error: any) {
      console.error('Error approving application:', error);
      setError(error.response?.data?.detail || 'Failed to approve application.');
      setLoading(false);
    }
  };

  const handleRejectDialogOpen = () => {
    setRejectDialogOpen(true);
  };

  const handleRejectDialogClose = () => {
    setRejectDialogOpen(false);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!application) return;
    
    try {
      setLoading(true);
      // Update application status to rejected
      await applicationService.updateApplication(application.id, {
        status: 'REJECTED',
        review_notes: rejectionReason
      });
      
      // Reload the application details after rejection
      const updatedApplication = await applicationService.getApplication(application.id);
      setApplication(updatedApplication);
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

  const canApprove = () => {
    return application?.status === 'UNDER_REVIEW' && 
           application?.documents_verified && 
           application?.medical_verified && 
           application?.payment_verified;
  };

  const canReject = () => {
    return application?.status === 'UNDER_REVIEW' || application?.status === 'SUBMITTED';
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
        <Alert severity="warning">
          Application not found.
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

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', mt: 3, p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/applications')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            Application #{application.id}
          </Typography>
          <Chip 
            label={application.status.replace('_', ' ')} 
            color={statusColors[application.status] || 'default'}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canApprove() && (
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={handleApproveDialogOpen}
            >
              Approve with ISO Compliance
            </Button>
          )}
          {canReject() && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={handleRejectDialogOpen}
            >
              Reject
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/applications/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Application Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Application Details"
              action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="caption">ISO 18013 Compliant</Typography>
                </Box>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Application ID
                  </Typography>
                  <Typography variant="body1">
                    {application.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Applied Category
                  </Typography>
                  <Typography variant="body1">
                    {licenseCategoryDescriptions[application.applied_category] || application.applied_category}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Application Type
                  </Typography>
                  <Typography variant="body1">
                    {applicationTypeLabels[application.application_type] || application.application_type}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Application Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(application.application_date)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(application.last_updated)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Collection Point
                  </Typography>
                  <Typography variant="body1">
                    {location ? `${location.name} (${location.code}) - ${location.city}` : 'Not assigned'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Preferred Collection Date
                  </Typography>
                  <Typography variant="body1">
                    {application.preferred_collection_date ? formatDate(application.preferred_collection_date) : 'Not specified'}
                  </Typography>
                </Grid>
                {application.previous_license_id && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Previous License ID
                    </Typography>
                    <Typography variant="body1">
                      {application.previous_license_id}
                    </Typography>
                  </Grid>
                )}
                {application.approved_license_id && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Approved License ID
                    </Typography>
                    <Typography variant="body1">
                      {application.approved_license_id}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(application.created_at)}
                  </Typography>
                </Grid>
                {application.review_date && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Review Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(application.review_date)}
                    </Typography>
                  </Grid>
                )}
                {application.reviewer && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reviewed By
                    </Typography>
                    <Typography variant="body1">
                      {application.reviewer.first_name} {application.reviewer.last_name}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Notes Section */}
              {application.notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Application Notes
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body1">
                      {application.notes}
                    </Typography>
                  </Paper>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Verification Status */}
              <Typography variant="h6" gutterBottom>
                Verification Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label="Documents" 
                      color={application.documents_verified ? 'success' : application.documents_verified === false ? 'error' : 'warning'}
                      size="small"
                    />
                    <Typography variant="body2">
                      {application.documents_verified === true ? 'Verified' : application.documents_verified === false ? 'Not Verified' : 'Pending'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label="Medical" 
                      color={application.medical_verified ? 'success' : application.medical_verified === false ? 'error' : 'warning'}
                      size="small"
                    />
                    <Typography variant="body2">
                      {application.medical_verified === true ? 'Verified' : application.medical_verified === false ? 'Not Verified' : 'Pending'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label="Payment" 
                      color={application.payment_verified ? 'success' : application.payment_verified === false ? 'error' : 'warning'}
                      size="small"
                    />
                    <Typography variant="body2">
                      {application.payment_verified === true ? 'Verified' : application.payment_verified === false ? 'Not Verified' : 'Pending'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Payment Information */}
              {(application.payment_amount || application.payment_reference) && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Payment Information
                  </Typography>
                  <Grid container spacing={2}>
                    {application.payment_amount && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Payment Amount
                        </Typography>
                        <Typography variant="body1">
                          R{(application.payment_amount / 100).toFixed(2)}
                        </Typography>
                      </Grid>
                    )}
                    {application.payment_reference && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Payment Reference
                        </Typography>
                        <Typography variant="body1">
                          {application.payment_reference}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Review Notes */}
              {application.review_notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Review Notes
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body1">
                      {application.review_notes}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Citizen Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Citizen Information" />
            <CardContent>
              {application.citizen ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography variant="body1">
                      {application.citizen.first_name} {application.citizen.middle_name ? `${application.citizen.middle_name} ` : ''}{application.citizen.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ID Number
                    </Typography>
                    <Typography variant="body1">
                      {application.citizen.id_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date of Birth
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(application.citizen.date_of_birth)}
                    </Typography>
                  </Grid>
                  {application.citizen.gender && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Gender
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {application.citizen.gender}
                      </Typography>
                    </Grid>
                  )}
                  {application.citizen.nationality && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Nationality
                      </Typography>
                      <Typography variant="body1">
                        {application.citizen.nationality}
                      </Typography>
                    </Grid>
                  )}
                  {application.citizen.marital_status && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Marital Status
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {application.citizen.marital_status}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Contact Information
                    </Typography>
                    <Typography variant="body2">
                      📞 {application.citizen.phone_number}
                    </Typography>
                    <Typography variant="body2">
                      ✉️ {application.citizen.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body2">
                      {application.citizen.address_line1}
                      {application.citizen.address_line2 && (
                        <><br />{application.citizen.address_line2}</>
                      )}
                      <br />
                      {application.citizen.city}, {application.citizen.state_province}
                      <br />
                      {application.citizen.postal_code}
                      {application.citizen.country && application.citizen.country !== 'South Africa' && (
                        <><br />{application.citizen.country}</>
                      )}
                    </Typography>
                  </Grid>
                  {application.citizen.birth_place && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Place of Birth
                      </Typography>
                      <Typography variant="body2">
                        {application.citizen.birth_place}
                      </Typography>
                    </Grid>
                  )}
                  {application.citizen.photo_url && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Photo
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <img 
                          src={application.citizen.photo_url}
                          alt="Citizen Photo"
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px', 
                            borderRadius: '8px',
                            border: '1px solid #ddd'
                          }}
                        />
                      </Box>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Citizen information not available
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* License Preview */}
          {application.approved_license_id && (
            <Card sx={{ mt: 2 }}>
              <CardHeader 
                title="License Preview" 
                action={
                  <IconButton>
                    <PreviewIcon />
                  </IconButton>
                }
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  License ID: {application.approved_license_id}
                </Typography>
                {/* Add license preview component here if needed */}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Approval Dialog */}
      <Dialog open={approveDialogOpen} onClose={handleApproveDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            Approve Application with ISO 18013 Compliance
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will approve the application and generate an ISO 18013-1:2018 compliant driver's license.
            Please select a collection point for the citizen.
          </DialogContentText>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Collection Point *</InputLabel>
            <Select
              value={selectedCollectionPoint}
              onChange={(e) => setSelectedCollectionPoint(e.target.value)}
              required
            >
              {COLLECTION_POINTS.map((point) => (
                <MenuItem key={point} value={point}>
                  {point}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Approval Notes"
            multiline
            rows={3}
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Optional notes about the approval..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleApproveDialogClose}>Cancel</Button>
          <Button 
            onClick={handleApprove} 
            variant="contained" 
            color="success"
            disabled={!selectedCollectionPoint}
          >
            Approve & Generate ISO License
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleRejectDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Application</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting this application.
          </DialogContentText>
          <TextField
            fullWidth
            label="Rejection Reason *"
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectDialogClose}>Cancel</Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error"
            disabled={!rejectionReason.trim()}
          >
            Reject Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationDetails; 