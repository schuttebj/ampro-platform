import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  CheckCircle as DeliverIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { workflowService } from '../../api/services';

interface ShippingRecord {
  id: number;
  application_id: number;
  license_id: number;
  print_job_id: number;
  status: string;
  tracking_number?: string;
  collection_point: string;
  collection_address?: string;
  shipped_at?: string;
  delivered_at?: string;
  shipping_method?: string;
  shipping_notes?: string;
  citizen_name?: string;
  license_number?: string;
}

interface ShippingStatistics {
  pending: number;
  in_transit: number;
  delivered: number;
  failed: number;
  total: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`shipping-tabpanel-${index}`}
      aria-labelledby={`shipping-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ShippingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data state
  const [shipments, setShipments] = useState<ShippingRecord[]>([]);
  const [statistics, setStatistics] = useState<ShippingStatistics | null>(null);
  
  // Dialog state
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShippingRecord | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Available shipping methods
  const shippingMethods = [
    'Internal Courier',
    'External Courier',
    'Postal Service',
    'Direct Delivery',
    'Pickup Service'
  ];

  useEffect(() => {
    loadShippingData();
  }, []);

  const loadShippingData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        pendingShipments,
        statsData
      ] = await Promise.all([
        workflowService.getPendingShipments(),
        workflowService.getShippingStatistics()
      ]);

      // In a real implementation, you'd fetch all shipments by status
      setShipments(pendingShipments);
      setStatistics(statsData);

    } catch (err: any) {
      console.error('Error loading shipping data:', err);
      setError(err.response?.data?.detail || 'Failed to load shipping data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'in_transit': return 'info';
      case 'delivered': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Dialog handlers
  const handleShipDialogOpen = (shipment: ShippingRecord) => {
    setSelectedShipment(shipment);
    setTrackingNumber('');
    setShippingMethod('');
    setShipDialogOpen(true);
  };

  const handleDeliverDialogOpen = (shipment: ShippingRecord) => {
    setSelectedShipment(shipment);
    setDeliveryNotes('');
    setDeliverDialogOpen(true);
  };

  const handleShipLicense = async () => {
    if (!selectedShipment || !trackingNumber || !shippingMethod) return;

    try {
      await workflowService.shipLicense(selectedShipment.id, {
        user_id: 1, // This should be the current user ID
        tracking_number: trackingNumber,
        shipping_method: shippingMethod
      });
      
      setShipDialogOpen(false);
      setSelectedShipment(null);
      setTrackingNumber('');
      setShippingMethod('');
      loadShippingData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to ship license');
    }
  };

  const handleDeliverLicense = async () => {
    if (!selectedShipment) return;

    try {
      await workflowService.deliverLicense(selectedShipment.id, {
        user_id: 1, // This should be the current user ID
        notes: deliveryNotes
      });
      
      setDeliverDialogOpen(false);
      setSelectedShipment(null);
      setDeliveryNotes('');
      loadShippingData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to deliver license');
    }
  };

  const filterShipmentsByStatus = (status: string[]) => {
    return shipments.filter(shipment => status.includes(shipment.status));
  };

  const renderShipmentTable = (shipments: ShippingRecord[]) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Shipment ID</TableCell>
            <TableCell>Application</TableCell>
            <TableCell>Citizen</TableCell>
            <TableCell>License #</TableCell>
            <TableCell>Collection Point</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Tracking #</TableCell>
            <TableCell>Method</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow key={shipment.id}>
              <TableCell>SH-{shipment.id.toString().padStart(6, '0')}</TableCell>
              <TableCell>APP-{shipment.application_id.toString().padStart(6, '0')}</TableCell>
              <TableCell>{shipment.citizen_name || 'Unknown'}</TableCell>
              <TableCell>{shipment.license_number || 'Pending'}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2">{shipment.collection_point}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={shipment.status.replace('_', ' ')} 
                  color={getStatusColor(shipment.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {shipment.tracking_number || (
                  <Typography variant="body2" color="text.secondary">Not assigned</Typography>
                )}
              </TableCell>
              <TableCell>
                {shipment.shipping_method || (
                  <Typography variant="body2" color="text.secondary">Not set</Typography>
                )}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {shipment.status === 'pending' && (
                    <Tooltip title="Ship License">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleShipDialogOpen(shipment)}
                      >
                        <ShippingIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {shipment.status === 'in_transit' && (
                    <Tooltip title="Mark as Delivered">
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={() => handleDeliverDialogOpen(shipment)}
                      >
                        <DeliverIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small"
                      onClick={() => navigate(`/applications/${shipment.application_id}`)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const pendingShipments = filterShipmentsByStatus(['pending']);
  const inTransitShipments = filterShipmentsByStatus(['in_transit']);
  const deliveredShipments = filterShipmentsByStatus(['delivered']);
  const failedShipments = filterShipmentsByStatus(['failed']);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Shipping & Logistics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Shipments">
            <IconButton onClick={loadShippingData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate('/workflow')}
          >
            Back to Workflow
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {statistics.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Shipment
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {statistics.in_transit}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Transit
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {statistics.delivered}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Delivered
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main">
                  {statistics.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Shipments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab 
            label={
              <Badge badgeContent={pendingShipments.length} color="warning">
                Pending
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={inTransitShipments.length} color="info">
                In Transit
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={deliveredShipments.length} color="success">
                Delivered
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={failedShipments.length} color="error">
                Failed
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {pendingShipments.length === 0 ? (
          <Alert severity="info">No pending shipments</Alert>
        ) : (
          renderShipmentTable(pendingShipments)
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {inTransitShipments.length === 0 ? (
          <Alert severity="info">No shipments in transit</Alert>
        ) : (
          renderShipmentTable(inTransitShipments)
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {deliveredShipments.length === 0 ? (
          <Alert severity="info">No delivered shipments</Alert>
        ) : (
          renderShipmentTable(deliveredShipments)
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {failedShipments.length === 0 ? (
          <Alert severity="info">No failed shipments</Alert>
        ) : (
          renderShipmentTable(failedShipments)
        )}
      </TabPanel>

      {/* Loading Overlay */}
      {loading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Ship Dialog */}
      <Dialog open={shipDialogOpen} onClose={() => setShipDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ship License</DialogTitle>
        <DialogContent>
          {selectedShipment && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Shipment: SH-{selectedShipment.id.toString().padStart(6, '0')}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Collection Point: {selectedShipment.collection_point}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                License: {selectedShipment.license_number || 'Pending'}
              </Typography>

              <TextField
                fullWidth
                label="Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                sx={{ mt: 3, mb: 2 }}
                placeholder="Enter tracking number"
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Shipping Method</InputLabel>
                <Select
                  value={shippingMethod}
                  label="Shipping Method"
                  onChange={(e) => setShippingMethod(e.target.value)}
                >
                  {shippingMethods.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShipDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleShipLicense} 
            variant="contained" 
            color="primary"
            disabled={!trackingNumber || !shippingMethod}
          >
            Ship License
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deliver Dialog */}
      <Dialog open={deliverDialogOpen} onClose={() => setDeliverDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark as Delivered</DialogTitle>
        <DialogContent>
          {selectedShipment && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Shipment: SH-{selectedShipment.id.toString().padStart(6, '0')}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tracking: {selectedShipment.tracking_number}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Collection Point: {selectedShipment.collection_point}
              </Typography>

              <TextField
                fullWidth
                label="Delivery Notes (Optional)"
                multiline
                rows={3}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Add any delivery notes..."
                sx={{ mt: 3 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliverDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeliverLicense} 
            variant="contained" 
            color="success"
          >
            Mark as Delivered
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShippingDashboard; 