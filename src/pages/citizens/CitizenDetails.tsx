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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../../api/api';

// Define the Citizen interface
interface Citizen {
  id: number;
  id_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: string;
  marital_status?: string;
  phone_number?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  birth_place?: string;
  nationality?: string;
  photo_url?: string;
  is_active: boolean;
}

// Define License interface
interface License {
  id: number;
  license_number: string;
  category: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  is_active?: boolean;
}

const CitizenDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [licensesLoading, setLicensesLoading] = useState(true);
  const [error, setError] = useState('');
  const [licensesError, setLicensesError] = useState('');

  useEffect(() => {
    const fetchCitizen = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await api.get(`/citizens/${id}`);
        setCitizen(response.data);
      } catch (error: any) {
        console.error('Error fetching citizen:', error);
        setError(error.response?.data?.detail || 'Failed to load citizen details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCitizen();
    }
  }, [id]);

  // Fetch citizen licenses
  useEffect(() => {
    const fetchLicenses = async () => {
      if (!id) return;
      
      try {
        setLicensesLoading(true);
        setLicensesError('');
        
        const response = await api.get(`/citizens/${id}/licenses`);
        console.log('Citizen licenses response:', response.data);
        if (response.data.licenses) {
          setLicenses(response.data.licenses);
        } else {
          setLicenses([]);
        }
      } catch (error: any) {
        console.error('Error fetching citizen licenses:', error);
        setLicensesError(error.response?.data?.detail || 'Failed to load citizen licenses.');
      } finally {
        setLicensesLoading(false);
      }
    };

    if (id) {
      fetchLicenses();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!citizen) return;
    
    if (window.confirm(`Are you sure you want to delete ${citizen.first_name} ${citizen.last_name}?`)) {
      try {
        setLoading(true);
        await api.delete(`/citizens/${id}`);
        navigate('/citizens');
      } catch (error: any) {
        console.error('Error deleting citizen:', error);
        setError(error.response?.data?.detail || 'Failed to delete citizen.');
        setLoading(false);
      }
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
          onClick={() => navigate('/citizens')}
        >
          Back to Citizens
        </Button>
      </Box>
    );
  }

  if (!citizen) {
    return (
      <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 3 }}>
        <Alert severity="warning">Citizen not found.</Alert>
        <Button
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/citizens')}
        >
          Back to Citizens
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/citizens')}
        >
          Back to Citizens
        </Button>
        <Box>
          <IconButton 
            color="primary" 
            onClick={() => navigate(`/citizens/${id}/edit`)}
            sx={{ mr: 1 }}
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            color="error" 
            onClick={handleDelete}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {citizen.first_name} {citizen.middle_name ? citizen.middle_name + ' ' : ''}{citizen.last_name}
          </Typography>
          <Chip 
            label={citizen.is_active ? 'Active' : 'Inactive'} 
            color={citizen.is_active ? 'success' : 'error'} 
          />
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Personal Information" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">ID Number</Typography>
                    <Typography variant="body1">{citizen.id_number}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1">{new Date(citizen.date_of_birth).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1">{citizen.gender}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Marital Status</Typography>
                    <Typography variant="body1">{citizen.marital_status || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Nationality</Typography>
                    <Typography variant="body1">{citizen.nationality || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Birth Place</Typography>
                    <Typography variant="body1">{citizen.birth_place || 'Not specified'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Contact Information" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Phone Number</Typography>
                    <Typography variant="body1">{citizen.phone_number || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{citizen.email || 'Not specified'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Card sx={{ mt: 2 }}>
              <CardHeader title="Address" />
              <CardContent>
                <Typography variant="body1">
                  {citizen.address_line1 || 'Address not specified'}
                  {citizen.address_line2 && <><br />{citizen.address_line2}</>}
                  {(citizen.city || citizen.state_province || citizen.postal_code) && (
                    <><br />{[citizen.city, citizen.state_province, citizen.postal_code].filter(Boolean).join(', ')}</>
                  )}
                  {citizen.country && <><br />{citizen.country}</>}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Licenses Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Licenses & Applications
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={() => navigate(`/applications/new?citizen=${id}`)}
              sx={{ mr: 2 }}
            >
              Start New Application
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate(`/licenses/new?citizen=${id}`)}
            >
              Add New License
            </Button>
          </Box>
        </Box>
        
        {licensesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : licensesError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {licensesError}
          </Alert>
        ) : licenses.length === 0 ? (
          <Alert severity="info">
            No licenses found for this citizen.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>License Number</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>{license.license_number}</TableCell>
                    <TableCell>{license.category}</TableCell>
                    <TableCell>{formatDate(license.issue_date)}</TableCell>
                    <TableCell>{formatDate(license.expiry_date)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={license.status ? license.status.toUpperCase() : 'UNKNOWN'} 
                        color={
                          license.status === 'active' ? 'success' : 
                          license.status === 'expired' ? 'error' : 
                          license.status === 'suspended' ? 'warning' : 
                          license.status === 'revoked' ? 'error' : 
                          'default'
                        } 
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/licenses/${license.id}`)}
                        size="small"
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default CitizenDetails; 