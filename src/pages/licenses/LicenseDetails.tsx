import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Edit as EditIcon,
  Print as PrintIcon,
  QrCode as QrCodeIcon,
  Block as SuspendIcon,
  Delete as RevokeIcon,
  Refresh as RenewIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import api from '../../api/api';
import LicenseFileManager from '../../components/LicenseFileManager';

// Define interfaces
interface License {
  id: number;
  license_number: string;
  category?: string;
  issue_date: string;
  expiry_date: string;
  status?: 'active' | 'expired' | 'suspended' | 'revoked' | 'pending';
  citizen_id: number;
  citizen_name?: string;
  citizen_id_number?: string;
  restrictions?: string;
  medical_conditions?: string;
  file_url?: string;
  barcode_data?: string;
  created_at?: string;
  updated_at?: string;
}

interface Citizen {
  id: number;
  id_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string;
  address: string;
}

// Map status to colors
const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  active: 'success',
  expired: 'error',
  suspended: 'warning',
  revoked: 'error',
  pending: 'info',
};

const LicenseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [license, setLicense] = useState<License | null>(null);
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  const [dialogReason, setDialogReason] = useState('');

  useEffect(() => {
    fetchLicenseDetails();
  }, [id]);

  const fetchLicenseDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get license details
      const licenseResponse = await api.get(`/licenses/${id}`);
      const responseData = licenseResponse.data;
      console.log('License API response:', responseData);
      
      // Handle the new API response format where license details are nested in a 'license' property
      // and citizen data is directly included
      let licenseData = responseData;
      let citizenData = null;
      
      // Check if we have the new response format with nested license and citizen
      if (responseData && typeof responseData === 'object') {
        if (responseData.license) {
          licenseData = responseData.license;
          console.log('Found license data in nested format:', licenseData);
        }
        
        if (responseData.citizen) {
          citizenData = responseData.citizen;
          console.log('Found citizen data in response:', citizenData);
          // Set citizen directly from response - no need for another API call
          setCitizen(citizenData);
        }
      }
      
      // Only show error if we got no license data at all
      if (!licenseData) {
        console.error('No license data found in the response');
        setError('License data not available');
        setLoading(false);
        return;
      }
      
      // The license data might be empty object with just status, or it might have status as a property
      // Handle both cases
      if (typeof licenseData === 'object') {
        // Create a processed version with fallbacks for missing fields
        const processedData = {
          id: parseInt(id),
          license_number: licenseData.license_number || 'N/A',
          category: licenseData.category || 'N/A',
          issue_date: licenseData.issue_date || new Date().toISOString().split('T')[0],
          expiry_date: licenseData.expiry_date || new Date().toISOString().split('T')[0],
          status: licenseData.status || 'pending',
          citizen_id: licenseData.citizen_id || 0,
          restrictions: licenseData.restrictions || '',
          medical_conditions: licenseData.medical_conditions || '',
          ...licenseData
        };
        
        console.log('Processed license data:', processedData);
        setLicense(processedData);
        
        // Only fetch citizen details if not already provided in the response
        if (!citizenData && processedData.citizen_id) {
          try {
            const citizenResponse = await api.get(`/citizens/${processedData.citizen_id}`);
            setCitizen(citizenResponse.data);
          } catch (citizenError) {
            console.error('Error fetching citizen details:', citizenError);
            // Don't set main error, just log it
          }
        }
      } else {
        console.error('Received invalid license data format:', licenseData);
        setError('Invalid license data format');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error fetching license details:', error);
      setError(error.response?.data?.detail || 'Failed to retrieve license details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setDialogAction(status);
    setDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      let endpoint;
      const payload = dialogReason ? { reason: dialogReason } : {};
      
      switch (dialogAction) {
        case 'suspend':
          endpoint = `/licenses/${id}/suspend`;
          break;
        case 'revoke':
          endpoint = `/licenses/${id}/revoke`;
          break;
        case 'renew':
          endpoint = `/licenses/${id}/renew`;
          break;
        case 'reactivate':
          endpoint = `/licenses/${id}/reactivate`;
          break;
        default:
          throw new Error('Invalid action');
      }
      
      await api.post(endpoint, payload);
      // Refresh license data
      await fetchLicenseDetails();
      
      // Reset dialog state
      setDialogOpen(false);
      setDialogReason('');
      setDialogAction('');
    } catch (error: any) {
      console.error('Error updating license status:', error);
      setError(error.response?.data?.detail || `Failed to ${dialogAction} license.`);
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogReason('');
    setDialogAction('');
  };

  const generateQRCode = async () => {
    if (!id) return;
    
    try {
      window.open(`${api.defaults.baseURL}/licenses/${id}/qr-code`, '_blank');
    } catch (error: any) {
      setError('Failed to generate QR code.');
    }
  };

  const deleteLicense = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this license?')) {
      try {
        setLoading(true);
        const response = await api.delete(`/licenses/${id}`);
        
        if (response.status === 204 || response.status === 200) {
          navigate('/licenses');
        } else {
          throw new Error('Failed to delete license');
        }
      } catch (error: any) {
        console.error('Error deleting license:', error);
        setError(error.response?.data?.detail || 'Failed to delete license.');
        setLoading(false);
      }
    }
  };

  const printLicense = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      await api.post(`/licenses/${id}/print`);
      alert('License sent to printer successfully!');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to print license.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Invalid Date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  // Check if license is expired
  const isExpired = (license: License) => {
    if (!license.status || !license.expiry_date) return false;
    try {
      return new Date(license.expiry_date) < new Date() && license.status === 'active';
    } catch (e) {
      console.error('Error checking if license is expired:', e);
      return false;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!license) {
    return (
      <Alert severity="warning">
        License not found.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<BackIcon />} 
            onClick={() => navigate('/licenses')}
            sx={{ mr: 2 }}
          >
            Back to Licenses
          </Button>
          <Typography variant="h4" component="h1">
            License Details
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />}
            onClick={() => navigate(`/licenses/${id}/edit`)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<QrCodeIcon />}
            onClick={generateQRCode}
            sx={{ mr: 1 }}
          >
            QR Code
          </Button>
          <Button 
            variant="contained" 
            startIcon={<PrintIcon />}
            onClick={printLicense}
            sx={{ mr: 1 }}
          >
            Print
          </Button>
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<RevokeIcon />}
            onClick={deleteLicense}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* License File Manager - Full Width */}
        <Grid item xs={12}>
          <LicenseFileManager 
            licenseId={license.id} 
            licenseNumber={license.license_number || 'N/A'} 
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" gutterBottom>
                License Information
              </Typography>
              {license.status !== undefined && (
                <Chip 
                  label={license.status.toUpperCase()} 
                  color={statusColors[license.status] || 'default'} 
                  size="medium"
                />
              )}
              {!license.status && (
                <Chip 
                  label="PENDING" 
                  color="default" 
                  size="medium"
                />
              )}
              {license.status && isExpired(license) && (
                <Chip 
                  label="EXPIRED" 
                  color="error" 
                  size="medium" 
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">License Number</Typography>
                <Typography variant="body1" fontWeight="bold">{license.license_number || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">License Category</Typography>
                <Typography variant="body1">{license.category || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Issue Date</Typography>
                <Typography variant="body1">{license.issue_date ? formatDate(license.issue_date) : 'Invalid Date'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Expiry Date</Typography>
                <Typography variant="body1">{license.expiry_date ? formatDate(license.expiry_date) : 'Invalid Date'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Restrictions</Typography>
                <Typography variant="body1">{license.restrictions || 'None'}</Typography>
              </Grid>
              {license.medical_conditions && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Medical Conditions</Typography>
                  <Typography variant="body1">{license.medical_conditions}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              License Status Management
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {license.status === 'active' && (
                <>
                  <Button 
                    variant="outlined"
                    color="warning"
                    startIcon={<SuspendIcon />}
                    onClick={() => handleStatusChange('suspend')}
                  >
                    Suspend License
                  </Button>
                  <Button 
                    variant="outlined"
                    color="error"
                    startIcon={<RevokeIcon />}
                    onClick={() => handleStatusChange('revoke')}
                  >
                    Revoke License
                  </Button>
                </>
              )}
              {license.status === 'suspended' && (
                <Button 
                  variant="outlined"
                  color="success"
                  startIcon={<BackIcon />}
                  onClick={() => handleStatusChange('reactivate')}
                >
                  Reactivate License
                </Button>
              )}
              {(license.status === 'active' || license.status === 'expired') && (
                <Button 
                  variant="outlined"
                  color="primary"
                  startIcon={<RenewIcon />}
                  onClick={() => handleStatusChange('renew')}
                >
                  Renew License
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Citizen Information
            </Typography>
            {citizen ? (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Full Name</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {`${citizen.first_name} ${citizen.last_name}`}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">ID Number</Typography>
                    <Typography variant="body1">{citizen.id_number}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1">{formatDate(citizen.date_of_birth)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1">{citizen.gender}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Contact Number</Typography>
                    <Typography variant="body1">{citizen.contact_number}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{citizen.email || 'N/A'}</Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Button 
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate(`/citizens/${citizen.id}`)}
                >
                  View Citizen Details
                </Button>
              </Box>
            ) : (
              <Alert severity="warning">Citizen information not available</Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Status Change Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>
          {dialogAction === 'suspend' && 'Suspend License'}
          {dialogAction === 'revoke' && 'Revoke License'}
          {dialogAction === 'renew' && 'Renew License'}
          {dialogAction === 'reactivate' && 'Reactivate License'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction === 'suspend' && 'Are you sure you want to suspend this license? Please provide a reason for the suspension.'}
            {dialogAction === 'revoke' && 'Are you sure you want to revoke this license? This action is permanent. Please provide a reason for the revocation.'}
            {dialogAction === 'renew' && 'Are you sure you want to renew this license? This will extend the expiry date.'}
            {dialogAction === 'reactivate' && 'Are you sure you want to reactivate this license?'}
          </DialogContentText>
          {(dialogAction === 'suspend' || dialogAction === 'revoke') && (
            <TextField
              autoFocus
              margin="dense"
              id="reason"
              label="Reason"
              type="text"
              fullWidth
              variant="outlined"
              value={dialogReason}
              onChange={(e) => setDialogReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button 
            onClick={confirmStatusChange} 
            color={
              dialogAction === 'suspend' ? 'warning' : 
              dialogAction === 'revoke' ? 'error' : 
              'primary'
            }
            disabled={(dialogAction === 'suspend' || dialogAction === 'revoke') && !dialogReason}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LicenseDetails; 