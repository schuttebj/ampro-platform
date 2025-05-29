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
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { applicationService, workflowService, locationService } from '../../api/services';
import { Application } from '../../types';

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
      id={`review-tabpanel-${index}`}
      aria-labelledby={`review-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface Location {
  id: number;
  name: string;
  code: string;
  city: string;
  is_active: boolean;
  accepts_collections: boolean;
}

const ApplicationReview: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Applications data
  const [pendingApplications, setPendingApplications] = useState<Application[]>([]);
  const [completedApplications, setCompletedApplications] = useState<Application[]>([]);
  
  // Dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [collectionPoint, setCollectionPoint] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  
  // Available collection points - loaded from API
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);

  useEffect(() => {
    loadApplications();
    loadCollectionLocations();
  }, []);

  const loadCollectionLocations = async () => {
    try {
      const locations = await locationService.getLocationsAcceptingCollections();
      setAvailableLocations(locations);
    } catch (err) {
      console.error('Error loading collection locations:', err);
      // Fallback to empty array if API fails
      setAvailableLocations([]);
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');

      // Load pending applications using the correct endpoint
      const pendingApps = await applicationService.getPendingApplications();
      
      // Also load all applications to get other statuses  
      const allApplications = await applicationService.getApplications();
      
      // Check if the response is an array for all applications
      const allAppsArray = Array.isArray(allApplications) ? allApplications : allApplications.items || [];
      
      // Pending applications include both SUBMITTED and UNDER_REVIEW statuses
      // Get from both API and filter to ensure we capture all pending statuses
      let pending = Array.isArray(pendingApps) ? pendingApps : [];
      
      // Also include UNDER_REVIEW applications as pending
      const underReviewApps = allAppsArray.filter(app => 
        app.status?.toUpperCase() === 'UNDER_REVIEW'
      );
      
      // Merge and deduplicate pending applications
      const pendingIds = new Set(pending.map(app => app.id));
      underReviewApps.forEach(app => {
        if (!pendingIds.has(app.id)) {
          pending.push(app);
        }
      });
      
      // Completed applications are those approved, generated, or further along
      const completed = allAppsArray.filter(app => 
        ['APPROVED', 'LICENSE_GENERATED', 'QUEUED_FOR_PRINTING', 'PRINTING', 'PRINTED', 'SHIPPED', 'READY_FOR_COLLECTION', 'COMPLETED'].includes(app.status?.toUpperCase())
      );

      setPendingApplications(pending);
      setCompletedApplications(completed);

    } catch (err: any) {
      console.error('Error loading applications:', err);
      setError(err.response?.data?.detail || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted': return 'info';
      case 'under_review': return 'warning';
      case 'approved': return 'success';
      case 'license_generated': return 'primary';
      case 'queued_for_printing': return 'secondary';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const handleApprovalDialogOpen = async (application: Application) => {
    setSelectedApplication(application);
    setReviewNotes('');
    setApprovalDialogOpen(true);
    
    // Auto-populate collection point if application has a location_id
    if (application.location_id) {
      try {
        const location = await locationService.getLocation(application.location_id);
        setCollectionPoint(location.name);
      } catch (err) {
        console.error('Error loading application location:', err);
        setCollectionPoint('');
      }
    } else {
      setCollectionPoint('');
    }
  };

  const handleApprovalDialogClose = () => {
    setApprovalDialogOpen(false);
    setSelectedApplication(null);
    setCollectionPoint('');
    setReviewNotes('');
  };

  const handleApproveApplication = async () => {
    if (!selectedApplication || !collectionPoint) return;

    try {
      setLoading(true);
      
      await workflowService.approveApplication(selectedApplication.id, {
        collection_point: collectionPoint
      });

      handleApprovalDialogClose();
      loadApplications();
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve application');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = (applicationId: number) => {
    navigate(`/applications/${applicationId}`);
  };

  const canApprove = (application: Application) => {
    return application.payment_verified && 
           application.documents_verified && 
           application.medical_verified;
  };

  const renderApplicationTable = (applications: Application[], showActions = true) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Application #</TableCell>
            <TableCell>Citizen</TableCell>
            <TableCell>ID Number</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Verification</TableCell>
            <TableCell>Status</TableCell>
            {showActions && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell>APP-{application.id.toString().padStart(6, '0')}</TableCell>
              <TableCell>{application.citizen ? `${application.citizen.first_name} ${application.citizen.last_name}` : 'Unknown'}</TableCell>
              <TableCell>{application.citizen?.id_number || 'N/A'}</TableCell>
              <TableCell>{application.applied_category}</TableCell>
              <TableCell>
                <Chip 
                  label={application.applied_category} 
                  size="small" 
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {new Date(application.application_date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip 
                    label="Pay" 
                    size="small" 
                    color={application.payment_verified ? 'success' : 'default'}
                    variant={application.payment_verified ? 'filled' : 'outlined'}
                  />
                  <Chip 
                    label="Doc" 
                    size="small" 
                    color={application.documents_verified ? 'success' : 'default'}
                    variant={application.documents_verified ? 'filled' : 'outlined'}
                  />
                  <Chip 
                    label="Med" 
                    size="small" 
                    color={application.medical_verified ? 'success' : 'default'}
                    variant={application.medical_verified ? 'filled' : 'outlined'}
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={application.status.replace('_', ' ')} 
                  color={getStatusColor(application.status)}
                  size="small"
                />
              </TableCell>
              {showActions && (
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewApplication(application.id)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {application.status.toLowerCase() === 'submitted' && (
                      <Tooltip title={canApprove(application) ? "Approve Application" : "Complete verification first"}>
                        <span>
                          <IconButton 
                            size="small" 
                            color="success"
                            disabled={!canApprove(application)}
                            onClick={() => handleApprovalDialogOpen(application)}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Application Review Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Applications">
            <IconButton onClick={loadApplications} disabled={loading}>
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
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {pendingApplications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {completedApplications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved/Processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary.main">
                {pendingApplications.length + completedApplications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Applications
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab 
            label={
              <Badge badgeContent={pendingApplications.length} color="info">
                Pending Review
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={completedApplications.length} color="success">
                Completed
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {pendingApplications.length === 0 ? (
          <Alert severity="info">No applications pending review</Alert>
        ) : (
          renderApplicationTable(pendingApplications)
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {completedApplications.length === 0 ? (
          <Alert severity="info">No completed applications</Alert>
        ) : (
          renderApplicationTable(completedApplications, false)
        )}
      </TabPanel>

      {/* Loading Overlay */}
      {loading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={handleApprovalDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Application</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Application: APP-{selectedApplication.id.toString().padStart(6, '0')}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Citizen: {selectedApplication.citizen ? `${selectedApplication.citizen.first_name} ${selectedApplication.citizen.last_name}` : 'Unknown'} ({selectedApplication.citizen?.id_number || 'N/A'})
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Category: {selectedApplication.applied_category}
              </Typography>

              <FormControl fullWidth sx={{ mt: 3, mb: 2 }}>
                <InputLabel>Collection Point</InputLabel>
                <Select
                  value={collectionPoint}
                  label="Collection Point"
                  onChange={(e) => setCollectionPoint(e.target.value)}
                >
                  {availableLocations.map((location) => (
                    <MenuItem key={location.id} value={location.name}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Review Notes (Optional)"
                multiline
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any additional notes about this approval..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleApprovalDialogClose}>Cancel</Button>
          <Button 
            onClick={handleApproveApplication} 
            variant="contained" 
            color="success"
            disabled={!collectionPoint}
          >
            Approve & Generate License
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationReview; 