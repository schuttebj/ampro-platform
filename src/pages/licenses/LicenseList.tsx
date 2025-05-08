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
  Print as PrintIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import api from '../../api/api';

// Define the License interface
interface License {
  id: number;
  license_number: string;
  license_class: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked' | 'pending';
  citizen_id: number;
  citizen_name?: string;
  restrictions?: string;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  active: 'success',
  expired: 'error',
  suspended: 'warning',
  revoked: 'error',
  pending: 'info',
};

const LicenseList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  // Load all licenses on initial load
  useEffect(() => {
    fetchLicenses();
  }, []);

  // Fetch all licenses or filtered by status
  const fetchLicenses = async (query?: string, status?: string) => {
    setLoading(true);
    setError('');

    try {
      let endpoint = '/licenses';
      let params: Record<string, any> = {};
      
      if (status && status !== 'all') {
        params.status = status;
      }
      
      if (query) {
        // If query looks like a license number format
        if (/^[A-Z]{2}\d+$/.test(query)) {
          params.license_number = query;
        } else {
          // Otherwise search by citizen name or ID
          params.search = query;
        }
      }
      
      const response = await api.get(endpoint, { params });
      console.log('API Response:', response.data);
      
      setLicenses(response.data);
      if (response.data.length === 0) {
        setError('No licenses found with the given criteria.');
      }
    } catch (error: any) {
      console.error('Error fetching licenses:', error);
      setError(error.response?.data?.detail || 'Failed to retrieve license data.');
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchLicenses(searchTerm, statusFilter);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchLicenses(searchTerm, status);
  };

  // Navigate to license details
  const viewLicense = (id: number) => {
    navigate(`/licenses/${id}`);
  };

  // Navigate to edit license
  const editLicense = (id: number) => {
    navigate(`/licenses/${id}/edit`);
  };

  // Handle delete license
  const deleteLicense = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this license?')) return;

    try {
      setLoading(true);
      const response = await api.delete(`/licenses/${id}`);
      
      if (response.status === 204 || response.status === 200) {
        // Successfully deleted - remove from the local state
        setLicenses(licenses.filter(license => license.id !== id));
      } else {
        throw new Error('Failed to delete license');
      }
    } catch (error: any) {
      console.error('Error deleting license:', error);
      setError(error.response?.data?.detail || 'Failed to delete license.');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code for a license
  const generateQRCode = async (id: number) => {
    try {
      window.open(`${api.defaults.baseURL}/licenses/${id}/qr-code`, '_blank');
    } catch (error: any) {
      setError('Failed to generate QR code.');
    }
  };

  // Print license
  const printLicense = async (id: number) => {
    try {
      setLoading(true);
      await api.post(`/licenses/${id}/print`);
      alert('License sent to printer successfully!');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to print license.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check if a license is expired
  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          License Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/licenses/new')}
        >
          New License
        </Button>
      </Box>

      {/* Search and Filter Form */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Search & Filter Licenses
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by license number or citizen name"
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
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="revoked">Revoked</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
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
      {loading && licenses.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Results Table */}
      {licenses.length > 0 && (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>License Number</TableCell>
                <TableCell>Citizen Name</TableCell>
                <TableCell>License Class</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {licenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell>{license.license_number}</TableCell>
                  <TableCell>{license.citizen_name}</TableCell>
                  <TableCell>{license.license_class}</TableCell>
                  <TableCell>{formatDate(license.issue_date)}</TableCell>
                  <TableCell>
                    {formatDate(license.expiry_date)}
                    {isExpired(license.expiry_date) && license.status === 'active' && (
                      <Chip 
                        size="small" 
                        color="error" 
                        label="Expired" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={license.status.toUpperCase()} 
                      color={statusColors[license.status] || 'default'} 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="primary" 
                      onClick={() => viewLicense(license.id)}
                      size="small"
                      title="View"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      color="secondary" 
                      onClick={() => editLicense(license.id)}
                      size="small"
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="info" 
                      onClick={() => generateQRCode(license.id)}
                      size="small"
                      title="Generate QR Code"
                    >
                      <QrCodeIcon />
                    </IconButton>
                    <IconButton 
                      color="success" 
                      onClick={() => printLicense(license.id)}
                      size="small"
                      title="Print License"
                    >
                      <PrintIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => deleteLicense(license.id)}
                      size="small"
                      title="Delete"
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

export default LicenseList; 