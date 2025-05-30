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
  FormControlLabel,
  Switch,
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
  Computer as PrinterIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pause as PauseIcon
} from '@mui/icons-material';
import {
  Printer,
  PrinterCreate,
  PrinterUpdate,
  PrinterType,
  PrinterStatus,
  Location
} from '../../types';
import {
  adminPrinterService,
  locationService
} from '../../api/services';

const PrinterManagement: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
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
  const [printerDialogOpen, setPrinterDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);

  // Form state
  const [printerForm, setPrinterForm] = useState<PrinterCreate>({
    name: '',
    code: '',
    printer_type: 'card_printer',
    model: '',
    manufacturer: '',
    serial_number: '',
    ip_address: '',
    status: 'active',
    location_id: undefined,
    notes: ''
  });
  const [statusForm, setStatusForm] = useState({
    status: 'active' as PrinterStatus,
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

      const [printersData, locationsData] = await Promise.all([
        adminPrinterService.getPrinters({
          location_id: locationFilter ? parseInt(locationFilter) : undefined,
          status: statusFilter || undefined,
          printer_type: typeFilter || undefined,
          search: searchFilter || undefined
        }),
        locationService.getActiveLocations()
      ]);

      setPrinters(printersData);
      setLocations(locationsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPrinterForm({
      name: '',
      code: '',
      printer_type: 'card_printer',
      model: '',
      manufacturer: '',
      serial_number: '',
      ip_address: '',
      status: 'active',
      location_id: undefined,
      notes: ''
    });
    setIsEditing(false);
  };

  const handleCreatePrinter = () => {
    resetForm();
    setPrinterDialogOpen(true);
  };

  const handleEditPrinter = (printer: Printer) => {
    setPrinterForm({
      name: printer.name,
      code: printer.code,
      printer_type: printer.printer_type,
      model: printer.model || '',
      manufacturer: printer.manufacturer || '',
      serial_number: printer.serial_number || '',
      ip_address: printer.ip_address || '',
      status: printer.status,
      location_id: printer.location_id,
      notes: printer.notes || '',
      last_maintenance: printer.last_maintenance,
      next_maintenance: printer.next_maintenance
    });
    setSelectedPrinter(printer);
    setIsEditing(true);
    setPrinterDialogOpen(true);
  };

  const handleDeletePrinter = (printer: Printer) => {
    setSelectedPrinter(printer);
    setDeleteDialogOpen(true);
  };

  const handleUpdateStatus = (printer: Printer) => {
    setSelectedPrinter(printer);
    setStatusForm({
      status: printer.status,
      notes: ''
    });
    setStatusDialogOpen(true);
  };

  const handleSavePrinter = async () => {
    try {
      setLoading(true);
      setError('');

      if (isEditing && selectedPrinter) {
        const updateData: PrinterUpdate = { ...printerForm };
        await adminPrinterService.updatePrinter(selectedPrinter.id, updateData);
        setSuccess('Printer updated successfully');
      } else {
        await adminPrinterService.createPrinter(printerForm);
        setSuccess('Printer created successfully');
      }

      setPrinterDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Error saving printer:', err);
      setError(err.response?.data?.detail || 'Failed to save printer');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedPrinter) return;

    try {
      setLoading(true);
      setError('');

      await adminPrinterService.updatePrinterStatus(
        selectedPrinter.id,
        statusForm.status,
        statusForm.notes
      );

      setSuccess('Printer status updated successfully');
      setStatusDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPrinter) return;

    try {
      setLoading(true);
      setError('');

      await adminPrinterService.deletePrinter(selectedPrinter.id);
      setSuccess('Printer deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPrinter(null);
      loadData();
    } catch (err: any) {
      console.error('Error deleting printer:', err);
      setError(err.response?.data?.detail || 'Failed to delete printer');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PrinterStatus) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'maintenance': return 'warning';
      case 'offline': return 'error';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: PrinterStatus) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'inactive': return <PauseIcon />;
      case 'maintenance': return <MaintenanceIcon />;
      case 'offline': return <ErrorIcon />;
      case 'error': return <WarningIcon />;
      default: return <PrinterIcon />;
    }
  };

  const getTypeDisplayName = (type: PrinterType) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getLocationName = (locationId: number) => {
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const isMaintenanceDue = (printer: Printer) => {
    if (!printer.next_maintenance) return false;
    const nextMaintenance = new Date(printer.next_maintenance);
    const now = new Date();
    return nextMaintenance <= now;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Printer Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePrinter}
            disabled={loading}
          >
            Add Printer
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {printers.filter(p => p.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Printers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {printers.filter(p => p.status === 'maintenance').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                In Maintenance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {printers.filter(p => p.status === 'offline' || p.status === 'error').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Offline/Error
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {printers.filter(isMaintenanceDue).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Maintenance Due
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search Printers"
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="card_printer">Card Printer</MenuItem>
                  <MenuItem value="document_printer">Document Printer</MenuItem>
                  <MenuItem value="photo_printer">Photo Printer</MenuItem>
                  <MenuItem value="thermal_printer">Thermal Printer</MenuItem>
                  <MenuItem value="inkjet_printer">Inkjet Printer</MenuItem>
                  <MenuItem value="laser_printer">Laser Printer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={locationFilter}
                  label="Location"
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <MenuItem value="">All Locations</MenuItem>
                  <MenuItem value="unassigned">Unassigned</MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Printers Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Printers ({printers.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Maintenance</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {printers.map((printer) => (
                  <TableRow key={printer.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(printer.status)}
                        <Typography variant="body2" fontWeight="medium">
                          {printer.name}
                        </Typography>
                        {isMaintenanceDue(printer) && (
                          <Tooltip title="Maintenance Due">
                            <WarningIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {printer.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getTypeDisplayName(printer.printer_type)}
                    </TableCell>
                    <TableCell>
                      {printer.manufacturer && printer.model 
                        ? `${printer.manufacturer} ${printer.model}`
                        : printer.model || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={printer.status.toUpperCase()}
                        color={getStatusColor(printer.status) as any}
                        size="small"
                        icon={getStatusIcon(printer.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        {printer.location_id ? getLocationName(printer.location_id) : 'Unassigned'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {printer.ip_address || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {printer.next_maintenance ? (
                        <Typography 
                          variant="body2"
                          color={isMaintenanceDue(printer) ? 'error' : 'textSecondary'}
                        >
                          {new Date(printer.next_maintenance).toLocaleDateString()}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Update Status">
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateStatus(printer)}
                          color="primary"
                        >
                          <MaintenanceIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Printer">
                        <IconButton
                          size="small"
                          onClick={() => handleEditPrinter(printer)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Printer">
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePrinter(printer)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {printers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No printers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Printer Create/Edit Dialog */}
      <Dialog
        open={printerDialogOpen}
        onClose={() => setPrinterDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Edit Printer' : 'Create New Printer'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Printer Name"
                value={printerForm.name}
                onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Printer Code"
                value={printerForm.code}
                onChange={(e) => setPrinterForm({ ...printerForm, code: e.target.value })}
                required
                helperText="Unique identifier for the printer"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Printer Type</InputLabel>
                <Select
                  value={printerForm.printer_type}
                  label="Printer Type"
                  onChange={(e) => setPrinterForm({ ...printerForm, printer_type: e.target.value as PrinterType })}
                >
                  <MenuItem value="card_printer">Card Printer</MenuItem>
                  <MenuItem value="document_printer">Document Printer</MenuItem>
                  <MenuItem value="photo_printer">Photo Printer</MenuItem>
                  <MenuItem value="thermal_printer">Thermal Printer</MenuItem>
                  <MenuItem value="inkjet_printer">Inkjet Printer</MenuItem>
                  <MenuItem value="laser_printer">Laser Printer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={printerForm.status}
                  label="Status"
                  onChange={(e) => setPrinterForm({ ...printerForm, status: e.target.value as PrinterStatus })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacturer"
                value={printerForm.manufacturer}
                onChange={(e) => setPrinterForm({ ...printerForm, manufacturer: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={printerForm.model}
                onChange={(e) => setPrinterForm({ ...printerForm, model: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Serial Number"
                value={printerForm.serial_number}
                onChange={(e) => setPrinterForm({ ...printerForm, serial_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IP Address"
                value={printerForm.ip_address}
                onChange={(e) => setPrinterForm({ ...printerForm, ip_address: e.target.value })}
                helperText="e.g., 192.168.1.100"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={printerForm.location_id || ''}
                  label="Location"
                  onChange={(e) => setPrinterForm({ ...printerForm, location_id: e.target.value ? parseInt(e.target.value as string) : undefined })}
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
                label="Last Maintenance"
                type="date"
                value={printerForm.last_maintenance?.split('T')[0] || ''}
                onChange={(e) => setPrinterForm({ 
                  ...printerForm, 
                  last_maintenance: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next Maintenance"
                type="date"
                value={printerForm.next_maintenance?.split('T')[0] || ''}
                onChange={(e) => setPrinterForm({ 
                  ...printerForm, 
                  next_maintenance: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={printerForm.notes}
                onChange={(e) => setPrinterForm({ ...printerForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrinterDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSavePrinter}
            variant="contained"
            disabled={loading || !printerForm.name || !printerForm.code}
          >
            {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Status: {selectedPrinter?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusForm.status}
                  label="Status"
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as PrinterStatus })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={statusForm.notes}
                onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                helperText="Optional reason for status change"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveStatus}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete printer "{selectedPrinter?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PrinterManagement; 