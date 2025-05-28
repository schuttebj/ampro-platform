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
  CircularProgress,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Tooltip,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon
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
  operating_hours?: string;
  services_offered?: string;
  capacity_per_day: number;
  is_active: boolean;
  accepts_applications: boolean;
  accepts_collections: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
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
  operating_hours: string;
  services_offered: string;
  capacity_per_day: number;
  is_active: boolean;
  accepts_applications: boolean;
  accepts_collections: boolean;
  notes: string;
}

interface FormErrors {
  name?: string;
  code?: string;
  address_line1?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  email?: string;
  capacity_per_day?: string;
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
  operating_hours: 'Monday - Friday: 08:00 - 17:00',
  services_offered: 'License Applications, License Collections, Document Verification',
  capacity_per_day: 50,
  is_active: true,
  accepts_applications: true,
  accepts_collections: true,
  notes: ''
};

const southAfricanProvinces = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
];

const LocationManagement: React.FC = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    filterLocations();
  }, [locations, searchTerm, statusFilter]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const filterLocations = () => {
    let filtered = locations;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(location =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(location =>
        statusFilter === 'active' ? location.is_active : !location.is_active
      );
    }

    setFilteredLocations(filtered);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Location name is required';
    }

    if (!formData.code.trim()) {
      errors.code = 'Location code is required';
    } else if (formData.code.length < 2) {
      errors.code = 'Location code must be at least 2 characters';
    } else {
      // Check for duplicate codes (exclude current location if editing)
      const existingLocation = locations.find(loc => 
        loc.code.toUpperCase() === formData.code.toUpperCase() && 
        loc.id !== editingLocation?.id
      );
      if (existingLocation) {
        errors.code = `Location code "${formData.code}" already exists. Use "${generateLocationCode(formData.name, locations)}" instead.`;
      }
    }

    if (!formData.address_line1.trim()) {
      errors.address_line1 = 'Address is required';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.state_province.trim()) {
      errors.state_province = 'Province is required';
    }

    if (!formData.postal_code.trim()) {
      errors.postal_code = 'Postal code is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (formData.capacity_per_day < 1) {
      errors.capacity_per_day = 'Capacity must be at least 1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    setEditingLocation(null);
    setFormData(defaultFormData);
    setFormErrors({});
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
      operating_hours: location.operating_hours || 'Monday - Friday: 08:00 - 17:00',
      services_offered: location.services_offered || 'License Applications, License Collections',
      capacity_per_day: location.capacity_per_day,
      is_active: location.is_active,
      accepts_applications: location.accepts_applications,
      accepts_collections: location.accepts_collections,
      notes: location.notes || ''
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        ...formData,
        // Convert empty strings to null for optional fields
        address_line2: formData.address_line2 || null,
        phone_number: formData.phone_number || null,
        email: formData.email || null,
        manager_name: formData.manager_name || null,
        operating_hours: formData.operating_hours || null,
        services_offered: formData.services_offered || null,
        notes: formData.notes || null
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      if (editingLocation) {
        await api.put(`/locations/${editingLocation.id}`, payload);
        setSuccess('Location updated successfully');
      } else {
        await api.post('/locations', payload);
        setSuccess('Location created successfully');
      }

      setDialogOpen(false);
      fetchLocations();
    } catch (error: any) {
      console.error('Error saving location:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          const errorMessages = error.response.data.detail.map((err: any) => 
            `${err.loc[err.loc.length - 1]}: ${err.msg}`
          );
          setError(errorMessages.join(', '));
        } else {
          setError(error.response.data.detail);
        }
      } else if (error.response?.data) {
        // Show the raw error data for debugging
        setError(`API Error: ${JSON.stringify(error.response.data)}`);
      } else {
        setError('Failed to save location');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (location: Location) => {
    const confirmMessage = `Are you sure you want to delete "${location.name}"?\n\nThis action cannot be undone and may affect applications and collections associated with this location.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await api.delete(`/locations/${location.id}`);
        setSuccess('Location deleted successfully');
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

    // Auto-generate code when name changes (only for new locations)
    if (field === 'name' && !editingLocation && value) {
      const generatedCode = generateLocationCode(value, locations);
      setFormData(prev => ({
        ...prev,
        code: generatedCode
      }));
    }

    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const generateLocationCode = (name: string, existingLocations: Location[]) => {
    // Generate base code from name (first 3 letters + 3 numbers)
    const baseCode = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
    const existingCodes = existingLocations.map(loc => loc.code.toUpperCase());
    
    // Try incremental numbers starting from 001
    for (let i = 1; i <= 999; i++) {
      const code = `${baseCode}${i.toString().padStart(3, '0')}`;
      if (!existingCodes.includes(code)) {
        return code;
      }
    }
    
    // Fallback to timestamp if all combinations are taken
    return `LOC${Date.now().toString().slice(-6)}`;
  };

  const getLocationStats = () => {
    const active = locations.filter(l => l.is_active).length;
    const totalCapacity = locations.reduce((sum, l) => sum + l.capacity_per_day, 0);
    const acceptingApps = locations.filter(l => l.accepts_applications).length;
    const acceptingCollections = locations.filter(l => l.accepts_collections).length;

    return { active, totalCapacity, acceptingApps, acceptingCollections };
  };

  const stats = getLocationStats();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Location Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchLocations}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Add Location
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.active}</Typography>
                  <Typography color="text.secondary">Active Locations</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.totalCapacity}</Typography>
                  <Typography color="text.secondary">Daily Capacity</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.acceptingApps}</Typography>
                  <Typography color="text.secondary">Accept Applications</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.acceptingCollections}</Typography>
                  <Typography color="text.secondary">Accept Collections</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <MenuItem value="all">All Locations</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredLocations.length} of {locations.length} locations
            </Typography>
          </Grid>
        </Grid>
      </Paper>

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
                <TableCell>Location Details</TableCell>
                <TableCell>Contact Info</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Services</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      {locations.length === 0 ? 'No locations found. Create your first location!' : 'No locations match your search criteria.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLocations.map((location) => (
                  <TableRow key={location.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {location.name}
                          </Typography>
                          <Chip label={location.code} size="small" variant="outlined" sx={{ mr: 1, mb: 0.5 }} />
                          <Typography variant="caption" color="text.secondary" display="block">
                            {location.address_line1}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {location.city}, {location.state_province} {location.postal_code}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {location.manager_name && (
                          <Typography variant="body2" fontWeight="medium">
                            {location.manager_name}
                          </Typography>
                        )}
                        {location.phone_number && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            📞 {location.phone_number}
                          </Typography>
                        )}
                        {location.email && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            ✉️ {location.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {location.capacity_per_day}/day
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={location.is_active ? 'Active' : 'Inactive'}
                        color={location.is_active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {location.accepts_applications && (
                          <Chip label="Applications" size="small" color="primary" variant="outlined" />
                        )}
                        {location.accepts_collections && (
                          <Chip label="Collections" size="small" color="secondary" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Location">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(location)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Location">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(location)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Location Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingLocation ? `Edit Location: ${editingLocation.name}` : 'Create New Location'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Location Name *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label="Location Code *"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  inputProps={{ maxLength: 8 }}
                  error={!!formErrors.code}
                  helperText={formErrors.code || 'Unique identifier (e.g., CPT001)'}
                />
                {!editingLocation && (
                  <Tooltip title="Generate new code">
                    <IconButton
                      onClick={() => {
                        const newCode = generateLocationCode(formData.name || 'LOC', locations);
                        handleInputChange('code', newCode);
                      }}
                      sx={{ mt: 1 }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>

            {/* Address Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Address Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 1 *"
                value={formData.address_line1}
                onChange={(e) => handleInputChange('address_line1', e.target.value)}
                error={!!formErrors.address_line1}
                helperText={formErrors.address_line1}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 2"
                value={formData.address_line2}
                onChange={(e) => handleInputChange('address_line2', e.target.value)}
                helperText="Suite, apartment, floor, etc."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City *"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                error={!!formErrors.city}
                helperText={formErrors.city}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={!!formErrors.state_province}>
                <InputLabel>Province *</InputLabel>
                <Select
                  value={formData.state_province}
                  label="Province *"
                  onChange={(e) => handleInputChange('state_province', e.target.value)}
                >
                  {southAfricanProvinces.map((province) => (
                    <MenuItem key={province} value={province}>
                      {province}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.state_province && (
                  <FormHelperText>{formErrors.state_province}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Postal Code *"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                error={!!formErrors.postal_code}
                helperText={formErrors.postal_code}
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

            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                helperText="e.g., +27 21 123 4567"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
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
                label="Daily Capacity *"
                type="number"
                value={formData.capacity_per_day}
                onChange={(e) => handleInputChange('capacity_per_day', parseInt(e.target.value) || 0)}
                error={!!formErrors.capacity_per_day}
                helperText={formErrors.capacity_per_day || 'Maximum applications per day'}
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Operational Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Operational Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Operating Hours"
                value={formData.operating_hours}
                onChange={(e) => handleInputChange('operating_hours', e.target.value)}
                placeholder="e.g., Monday - Friday: 08:00 - 17:00, Saturday: 08:00 - 12:00"
                helperText="Specify the operating hours for this location"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Services Offered"
                value={formData.services_offered}
                onChange={(e) => handleInputChange('services_offered', e.target.value)}
                placeholder="e.g., License Applications, License Collections, Document Verification"
                helperText="List the services available at this location"
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
                placeholder="Additional information about this location..."
              />
            </Grid>

            {/* Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Location Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    color="success"
                  />
                }
                label="Location Active"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.accepts_applications}
                    onChange={(e) => handleInputChange('accepts_applications', e.target.checked)}
                    color="primary"
                  />
                }
                label="Accept Applications"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.accepts_collections}
                    onChange={(e) => handleInputChange('accepts_collections', e.target.checked)}
                    color="secondary"
                  />
                }
                label="Accept Collections"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.name || !formData.code}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LocationManagement; 