import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import api from '../../api/api';

interface Location {
  id: number;
  name: string;
  code: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone_number?: string;
  email?: string;
  manager_name?: string;
  capacity_per_day: number;
  is_active: boolean;
  accepts_applications: boolean;
  accepts_collections: boolean;
  notes?: string;
}

interface LocationFormData {
  name: string;
  code: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone_number: string;
  email: string;
  manager_name: string;
  capacity_per_day: number;
  is_active: boolean;
  accepts_applications: boolean;
  accepts_collections: boolean;
  notes: string;
}

const defaultFormData: LocationFormData = {
  name: '',
  code: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state_province: 'Western Cape',
  postal_code: '',
  country: 'South Africa',
  phone_number: '',
  email: '',
  manager_name: '',
  capacity_per_day: 50,
  is_active: true,
  accepts_applications: true,
  accepts_collections: true,
  notes: ''
};

const LocationManagement: React.FC = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLocation(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      code: location.code,
      address_line1: location.address_line1,
      address_line2: location.address_line2 || '',
      city: location.city,
      state_province: location.state_province,
      postal_code: location.postal_code,
      country: location.country,
      phone_number: location.phone_number || '',
      email: location.email || '',
      manager_name: location.manager_name || '',
      capacity_per_day: location.capacity_per_day,
      is_active: location.is_active,
      accepts_applications: location.accepts_applications,
      accepts_collections: location.accepts_collections,
      notes: location.notes || ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (editingLocation) {
        await api.put(`/locations/${editingLocation.id}`, formData);
      } else {
        await api.post('/locations', formData);
      }

      setDialogOpen(false);
      fetchLocations();
    } catch (error: any) {
      console.error('Error saving location:', error);
      setError(error.response?.data?.detail || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (location: Location) => {
    if (window.confirm(`Are you sure you want to delete ${location.name}?`)) {
      try {
        await api.delete(`/locations/${location.id}`);
        fetchLocations();
      } catch (error: any) {
        console.error('Error deleting location:', error);
        setError(error.response?.data?.detail || 'Failed to delete location');
      }
    }
  };

  const handleInputChange = (field: keyof LocationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Location Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add Location
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Capacity/Day</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Services</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {location.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {location.address_line1}, {location.city}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={location.code} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{location.city}</TableCell>
                  <TableCell>{location.manager_name || '-'}</TableCell>
                  <TableCell>{location.capacity_per_day}</TableCell>
                  <TableCell>
                    <Chip
                      label={location.is_active ? 'Active' : 'Inactive'}
                      color={location.is_active ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {location.accepts_applications && (
                        <Chip label="Apps" size="small" color="primary" variant="outlined" />
                      )}
                      {location.accepts_collections && (
                        <Chip label="Collections" size="small" color="secondary" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(location)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(location)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Location Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLocation ? 'Edit Location' : 'Add New Location'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Location Name *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Location Code *"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                inputProps={{ maxLength: 8 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 1 *"
                value={formData.address_line1}
                onChange={(e) => handleInputChange('address_line1', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 2"
                value={formData.address_line2}
                onChange={(e) => handleInputChange('address_line2', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City *"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Province *"
                value={formData.state_province}
                onChange={(e) => handleInputChange('state_province', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Postal Code *"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Manager Name"
                value={formData.manager_name}
                onChange={(e) => handleInputChange('manager_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Capacity per Day"
                type="number"
                value={formData.capacity_per_day}
                onChange={(e) => handleInputChange('capacity_per_day', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.accepts_applications}
                    onChange={(e) => handleInputChange('accepts_applications', e.target.checked)}
                  />
                }
                label="Accepts Applications"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.accepts_collections}
                    onChange={(e) => handleInputChange('accepts_collections', e.target.checked)}
                  />
                }
                label="Accepts Collections"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.name || !formData.code}
          >
            {saving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationManagement; 