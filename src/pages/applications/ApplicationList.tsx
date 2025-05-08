import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as ApproveIcon
} from '@mui/icons-material';
import api from '../../api/api';

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
}

const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  processing: 'info',
};

const ApplicationList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  // Load all applications on initial load
  useEffect(() => {
    fetchApplications();
  }, []);

  // Fetch all applications or filtered by status
  const fetchApplications = async (query?: string, status?: string) => {
    setLoading(true);
    setError('');

    try {
      let endpoint = '/applications';
      let params: Record<string, any> = {};
      
      if (status && status !== 'all') {
        params.status = status;
      }
      
      if (query) {
        params.search = query;
      }
      
      const response = await api.get(endpoint, { params });
      console.log('API Response:', response.data);
      
      setApplications(response.data);
      if (response.data.length === 0) {
        setError('No applications found with the given criteria.');
      }
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      setError(error.response?.data?.detail || 'Failed to retrieve application data.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications(searchTerm, statusFilter);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchApplications(searchTerm, status);
  };

  // Navigate to application details
  const viewApplication = (id: number) => {
    navigate(`/applications/${id}`);
  };

  // Navigate to edit application
  const editApplication = (id: number) => {
    navigate(`/applications/${id}/edit`);
  };

  // Handle delete application
  const deleteApplication = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    try {
      setLoading(true);
      const response = await api.delete(`/applications/${id}`);
      
      if (response.status === 204 || response.status === 200) {
        // Successfully deleted - remove from the local state
        setApplications(applications.filter(application => application.id !== id));
      } else {
        throw new Error('Failed to delete application');
      }
    } catch (error: any) {
      console.error('Error deleting application:', error);
      setError(error.response?.data?.detail || 'Failed to delete application.');
    } finally {
      setLoading(false);
    }
  };

  // Handle approve application
  const approveApplication = async (id: number) => {
    if (!window.confirm('Are you sure you want to approve this application? This will generate a license.')) return;

    try {
      setLoading(true);
      await api.post(`/applications/${id}/approve`);
      // Refresh the list after approval
      fetchApplications(searchTerm, statusFilter);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to approve application.');
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          License Applications
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/applications/new')}
        >
          New Application
        </Button>
      </Box>

      {/* Search and Filter Form */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Search & Filter Applications
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by ID or citizen name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mr: 2 }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{ minWidth: '120px' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Box>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Status"
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator when no results yet */}
      {loading && applications.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Results Table */}
      {applications.length > 0 && (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Citizen</TableCell>
                <TableCell>License Type</TableCell>
                <TableCell>Application Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>{application.id}</TableCell>
                  <TableCell>{application.citizen_name || `Citizen #${application.citizen_id}`}</TableCell>
                  <TableCell>
                    {application.license_type}
                    {application.license_class && <span> - Class {application.license_class}</span>}
                  </TableCell>
                  <TableCell>{formatDate(application.application_date)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={application.status} 
                      color={statusColors[application.status] || 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="primary" 
                      onClick={() => viewApplication(application.id)}
                      size="small"
                      title="View details"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      color="secondary" 
                      onClick={() => editApplication(application.id)}
                      size="small"
                      title="Edit application"
                    >
                      <EditIcon />
                    </IconButton>
                    {application.status === 'pending' && (
                      <IconButton 
                        color="success" 
                        onClick={() => approveApplication(application.id)}
                        size="small"
                        title="Approve application"
                      >
                        <ApproveIcon />
                      </IconButton>
                    )}
                    <IconButton 
                      color="error" 
                      onClick={() => deleteApplication(application.id)}
                      size="small"
                      title="Delete application"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ApplicationList; 