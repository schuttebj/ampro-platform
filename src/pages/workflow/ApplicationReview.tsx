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
import { applicationService, workflowService } from '../../api/services';
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

const ApplicationReview: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Applications data
  const [pendingApplications, setPendingApplications] = useState<Application[]>([]);
  const [underReviewApplications, setUnderReviewApplications] = useState<Application[]>([]);
  const [completedApplications, setCompletedApplications] = useState<Application[]>([]);
  
  // Dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [collectionPoint, setCollectionPoint] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  
  // Available collection points
  const collectionPoints = [
    'Main Office - Johannesburg',
    'Cape Town Branch',
    'Durban Branch',
    'Pretoria Branch',
    'Port Elizabeth Branch',
    'Bloemfontein Branch'
  ];

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');

      // Load applications - API returns direct array, not PaginatedResponse
      const allApplications = await applicationService.getApplications();
      
      // Check if the response is an array
      if (!Array.isArray(allApplications)) {
        throw new Error('Invalid response format from applications API');
      }
      
      const pending = allApplications.filter(app => app.status === 'SUBMITTED');
      const underReview = allApplications.filter(app => app.status === 'UNDER_REVIEW');
      const completed = allApplications.filter(app => 
        ['APPROVED', 'LICENSE_GENERATED', 'QUEUED_FOR_PRINTING'].includes(app.status)
      );

      setPendingApplications(pending);
      setUnderReviewApplications(underReview);
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

  const handleApprovalDialogOpen = (application: Application) => {
    setSelectedApplication(application);
    setCollectionPoint('');
    setReviewNotes('');
    setApprovalDialogOpen(true);
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
                    {application.status === 'SUBMITTED' && (
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
              <Typography variant="h6" color="warning.main">
                {underReviewApplications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Under Review
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
                {pendingApplications.length + underReviewApplications.length + completedApplications.length}
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
              <Badge badgeContent={underReviewApplications.length} color="warning">
                Under Review
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
        {underReviewApplications.length === 0 ? (
          <Alert severity="info">No applications under review</Alert>
        ) : (
          renderApplicationTable(underReviewApplications)
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
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
                  {collectionPoints.map((point) => (
                    <MenuItem key={point} value={point}>
                      {point}
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