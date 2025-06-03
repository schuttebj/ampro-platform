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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  Grid,
  InputAdornment,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Build as MaintenanceIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Computer as HardwareIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pause as PauseIcon,
  Camera as CameraIcon,
  Fingerprint as FingerprintIcon,
  Scanner as ScannerIcon
} from '@mui/icons-material';
import {
  Hardware,
  HardwareCreate,
  HardwareUpdate,
  HardwareType,
  HardwareStatus,
  Location
} from '../../types';

const HardwareManagement: React.FC = () => {
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Filters
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Dialogs
  const [hardwareDialogOpen, setHardwareDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHardware, setSelectedHardware] = useState<Hardware | null>(null);

  // Form state
  const [hardwareForm, setHardwareForm] = useState<HardwareCreate>({
    name: '',
    code: '',
    hardware_type: 'WEBCAM',
    model: '',
    manufacturer: '',
    serial_number: '',
    ip_address: '',
    usb_port: '',
    device_id: '',
    status: 'ACTIVE',
    location_id: undefined,
    notes: ''
  });
  const [statusForm, setStatusForm] = useState({
    status: 'ACTIVE' as HardwareStatus,
    notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, [locationFilter, statusFilter, typeFilter, searchFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Import the API service
      const { hardwareApi } = await import('../../api/api');
      
      // Prepare search parameters
      const searchParams: any = {};
      if (locationFilter) searchParams.location_id = parseInt(locationFilter);
      if (statusFilter) searchParams.status = statusFilter;
      if (typeFilter) searchParams.hardware_type = typeFilter;
      if (searchFilter) searchParams.search = searchFilter;

      // Make actual API calls instead of using mock data
      const [hardwareData, locationsData] = await Promise.all([
        hardwareApi.getAll(searchParams),
        // For locations, we'll need to import the locations API - for now using existing approach
        fetch('/api/v1/locations').then(res => res.json()).catch(() => [])
      ]);

      setHardware(hardwareData);
      setLocations(locationsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
      
      // Fallback to empty data instead of mock data
      setHardware([]);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setHardwareForm({
      name: '',
      code: '',
      hardware_type: 'WEBCAM',
      model: '',
      manufacturer: '',
      serial_number: '',
      ip_address: '',
      usb_port: '',
      device_id: '',
      status: 'ACTIVE',
      location_id: undefined,
      notes: ''
    });
    setIsEditing(false);
  };

  const handleCreateHardware = () => {
    resetForm();
    setHardwareDialogOpen(true);
  };

  const handleEditHardware = (hardware: Hardware) => {
    setHardwareForm({
      name: hardware.name,
      code: hardware.code,
      hardware_type: hardware.hardware_type,
      model: hardware.model || '',
      manufacturer: hardware.manufacturer || '',
      serial_number: hardware.serial_number || '',
      ip_address: hardware.ip_address || '',
      usb_port: hardware.usb_port || '',
      device_id: hardware.device_id || '',
      status: hardware.status,
      location_id: hardware.location_id,
      notes: hardware.notes || '',
      last_maintenance: hardware.last_maintenance,
      next_maintenance: hardware.next_maintenance
    });
    setSelectedHardware(hardware);
    setIsEditing(true);
    setHardwareDialogOpen(true);
  };

  const handleDeleteHardware = (hardware: Hardware) => {
    setSelectedHardware(hardware);
    setDeleteDialogOpen(true);
  };

  const handleUpdateStatus = (hardware: Hardware) => {
    setSelectedHardware(hardware);
    setStatusForm({
      status: hardware.status,
      notes: ''
    });
    setStatusDialogOpen(true);
  };

  const handleSaveHardware = async () => {
    try {
      setLoading(true);
      setError('');

      // Import the API service
      const { hardwareApi } = await import('../../api/api');

      if (isEditing && selectedHardware) {
        // Update existing hardware
        await hardwareApi.update(selectedHardware.id, hardwareForm);
        setSuccess('Hardware updated successfully');
      } else {
        // Create new hardware
        await hardwareApi.create(hardwareForm);
        setSuccess('Hardware created successfully');
      }

      setHardwareDialogOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('Error saving hardware:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to save hardware');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: HardwareStatus) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'MAINTENANCE': return 'warning';
      case 'OFFLINE': return 'error';
      case 'ERROR': return 'error';
      case 'CALIBRATING': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: HardwareStatus) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircleIcon />;
      case 'INACTIVE': return <PauseIcon />;
      case 'MAINTENANCE': return <MaintenanceIcon />;
      case 'OFFLINE': return <ErrorIcon />;
      case 'ERROR': return <WarningIcon />;
      case 'CALIBRATING': return <HardwareIcon />;
      default: return <HardwareIcon />;
    }
  };

  const getTypeIcon = (type: HardwareType) => {
    switch (type) {
      case 'WEBCAM':
      case 'SECURITY_CAMERA':
        return <CameraIcon />;
      case 'FINGERPRINT_SCANNER':
      case 'IRIS_SCANNER':
      case 'FACE_RECOGNITION':
        return <FingerprintIcon />;
      case 'DOCUMENT_SCANNER':
      case 'BARCODE_SCANNER':
        return <ScannerIcon />;
      default:
        return <HardwareIcon />;
    }
  };

  const getTypeDisplayName = (type: HardwareType) => {
    const typeNames = {
      'WEBCAM': 'Webcam',
      'SECURITY_CAMERA': 'Security Camera',
      'FINGERPRINT_SCANNER': 'Fingerprint Scanner',
      'IRIS_SCANNER': 'Iris Scanner',
      'FACE_RECOGNITION': 'Face Recognition',
      'CARD_READER': 'Card Reader',
      'SIGNATURE_PAD': 'Signature Pad',
      'DOCUMENT_SCANNER': 'Document Scanner',
      'BARCODE_SCANNER': 'Barcode Scanner',
      'THERMAL_SENSOR': 'Thermal Sensor',
      'OTHER': 'Other'
    };
    return typeNames[type] || type;
  };

  const getLocationName = (locationId?: number) => {
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Unassigned';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Hardware
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateHardware}
        >
          Add Hardware
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={locationFilter}
                  label="Location"
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="WEBCAM">Webcam</MenuItem>
                  <MenuItem value="SECURITY_CAMERA">Security Camera</MenuItem>
                  <MenuItem value="FINGERPRINT_SCANNER">Fingerprint Scanner</MenuItem>
                  <MenuItem value="IRIS_SCANNER">Iris Scanner</MenuItem>
                  <MenuItem value="FACE_RECOGNITION">Face Recognition</MenuItem>
                  <MenuItem value="CARD_READER">Card Reader</MenuItem>
                  <MenuItem value="SIGNATURE_PAD">Signature Pad</MenuItem>
                  <MenuItem value="DOCUMENT_SCANNER">Document Scanner</MenuItem>
                  <MenuItem value="BARCODE_SCANNER">Barcode Scanner</MenuItem>
                  <MenuItem value="THERMAL_SENSOR">Thermal Sensor</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="OFFLINE">Offline</MenuItem>
                  <MenuItem value="ERROR">Error</MenuItem>
                  <MenuItem value="CALIBRATING">Calibrating</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <IconButton onClick={loadData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Hardware Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Hardware</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell>Last Used</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hardware.map((hw) => (
                <TableRow key={hw.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTypeIcon(hw.hardware_type)}
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {hw.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {hw.code} • {hw.manufacturer} {hw.model}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTypeDisplayName(hw.hardware_type)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(hw.status)}
                      label={hw.status.charAt(0).toUpperCase() + hw.status.slice(1)}
                      color={getStatusColor(hw.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon fontSize="small" color="action" />
                      {getLocationName(hw.location_id)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {hw.usage_count} uses
                      </Typography>
                      {hw.error_count > 0 && (
                        <Typography variant="caption" color="error">
                          {hw.error_count} errors
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {hw.last_used ? new Date(hw.last_used).toLocaleDateString() : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditHardware(hw)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update Status">
                        <IconButton size="small" onClick={() => handleUpdateStatus(hw)}>
                          <MaintenanceIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteHardware(hw)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Hardware Dialog */}
      <Dialog open={hardwareDialogOpen} onClose={() => setHardwareDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Hardware' : 'Add New Hardware'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={hardwareForm.name}
                onChange={(e) => setHardwareForm({ ...hardwareForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code"
                value={hardwareForm.code}
                onChange={(e) => setHardwareForm({ ...hardwareForm, code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Hardware Type</InputLabel>
                <Select
                  value={hardwareForm.hardware_type}
                  label="Hardware Type"
                  onChange={(e) => setHardwareForm({ ...hardwareForm, hardware_type: e.target.value as HardwareType })}
                >
                  <MenuItem value="WEBCAM">Webcam</MenuItem>
                  <MenuItem value="SECURITY_CAMERA">Security Camera</MenuItem>
                  <MenuItem value="FINGERPRINT_SCANNER">Fingerprint Scanner</MenuItem>
                  <MenuItem value="IRIS_SCANNER">Iris Scanner</MenuItem>
                  <MenuItem value="FACE_RECOGNITION">Face Recognition</MenuItem>
                  <MenuItem value="CARD_READER">Card Reader</MenuItem>
                  <MenuItem value="SIGNATURE_PAD">Signature Pad</MenuItem>
                  <MenuItem value="DOCUMENT_SCANNER">Document Scanner</MenuItem>
                  <MenuItem value="BARCODE_SCANNER">Barcode Scanner</MenuItem>
                  <MenuItem value="THERMAL_SENSOR">Thermal Sensor</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={hardwareForm.location_id || ''}
                  label="Location"
                  onChange={(e) => setHardwareForm({ ...hardwareForm, location_id: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacturer"
                value={hardwareForm.manufacturer}
                onChange={(e) => setHardwareForm({ ...hardwareForm, manufacturer: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={hardwareForm.model}
                onChange={(e) => setHardwareForm({ ...hardwareForm, model: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Serial Number"
                value={hardwareForm.serial_number}
                onChange={(e) => setHardwareForm({ ...hardwareForm, serial_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IP Address"
                value={hardwareForm.ip_address}
                onChange={(e) => setHardwareForm({ ...hardwareForm, ip_address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="USB Port"
                value={hardwareForm.usb_port}
                onChange={(e) => setHardwareForm({ ...hardwareForm, usb_port: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Device ID"
                value={hardwareForm.device_id}
                onChange={(e) => setHardwareForm({ ...hardwareForm, device_id: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={hardwareForm.notes}
                onChange={(e) => setHardwareForm({ ...hardwareForm, notes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHardwareDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveHardware} variant="contained" disabled={loading}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HardwareManagement; 