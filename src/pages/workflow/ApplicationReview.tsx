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
  LinearProgress,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  Checkbox
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
  Settings as RulesIcon,
  AutoMode as AutoIcon,
  PlayArrow as ProcessIcon,
  ExpandMore as ExpandMoreIcon,
  Rule as RuleIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { applicationService, workflowService, locationService } from '../../api/services';
import { Application } from '../../types';
import api from '../../api/api';

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

interface ApprovalRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: {
    license_categories: string[];
    require_payment_verified: boolean;
    require_documents_verified: boolean;
    require_medical_verified: boolean;
    max_age_limit?: number;
    min_age_limit?: number;
    exclude_categories?: string[];
    require_biometric_enrollment?: boolean;
  };
  actions: {
    auto_approve: boolean;
    default_collection_point?: string;
    priority_level: 'normal' | 'high' | 'urgent';
    add_notes?: string;
  };
}

interface BatchProcessResult {
  total: number;
  auto_approved: number;
  manual_review: number;
  failed: number;
  rules_applied: { [ruleId: string]: number };
}

const ApplicationReview: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Applications data
  const [pendingApplications, setPendingApplications] = useState<Application[]>([]);
  const [completedApplications, setCompletedApplications] = useState<Application[]>([]);
  
  // Dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [bulkApprovalDialogOpen, setBulkApprovalDialogOpen] = useState(false);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [batchProcessDialogOpen, setBatchProcessDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [collectionPoint, setCollectionPoint] = useState('');
  const [bulkCollectionPoint, setBulkCollectionPoint] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [bulkReviewNotes, setBulkReviewNotes] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  
  // Rule-based processing state
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [useRulesEngine, setUseRulesEngine] = useState(true);
  const [batchProcessResult, setBatchProcessResult] = useState<BatchProcessResult | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Available collection points - loaded from API
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);

  useEffect(() => {
    loadApplications();
    loadCollectionLocations();
    loadApprovalRules();
  }, []);

  const loadCollectionLocations = async () => {
    try {
      const locations = await locationService.getLocationsAcceptingCollections();
      setAvailableLocations(locations);
    } catch (err) {
      console.error('Error loading collection locations:', err);
      setAvailableLocations([]);
    }
  };

  const loadApprovalRules = async () => {
    try {
      // Mock rules data - replace with actual API call
      const mockRules: ApprovalRule[] = [
        {
          id: 'rule_1',
          name: 'Standard Driver License - Verified Applications',
          enabled: true,
          priority: 1,
          conditions: {
            license_categories: ['B', 'A1', 'A2'],
            require_payment_verified: true,
            require_documents_verified: true,
            require_medical_verified: true,
            max_age_limit: 75,
            min_age_limit: 18
          },
          actions: {
            auto_approve: true,
            priority_level: 'normal',
            add_notes: 'Auto-approved via standard verification rule'
          }
        },
        {
          id: 'rule_2',
          name: 'Commercial License - Enhanced Verification',
          enabled: true,
          priority: 2,
          conditions: {
            license_categories: ['C', 'D', 'CE', 'DE'],
            require_payment_verified: true,
            require_documents_verified: true,
            require_medical_verified: true,
            require_biometric_enrollment: true,
            max_age_limit: 65
          },
          actions: {
            auto_approve: false, // Requires manual review
            priority_level: 'high',
            add_notes: 'Commercial license requires manual verification'
          }
        },
        {
          id: 'rule_3',
          name: 'Youth Driver License (16-18)',
          enabled: true,
          priority: 3,
          conditions: {
            license_categories: ['AM', 'A1'],
            require_payment_verified: true,
            require_documents_verified: true,
            require_medical_verified: true,
            max_age_limit: 18,
            min_age_limit: 16
          },
          actions: {
            auto_approve: false, // Requires manual review for youth
            priority_level: 'normal',
            add_notes: 'Youth license requires manual guardian consent verification'
          }
        }
      ];
      
      setApprovalRules(mockRules);
    } catch (err) {
      console.error('Error loading approval rules:', err);
      setApprovalRules([]);
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const pendingApps = await applicationService.getPendingApplications();
      const allApplications = await applicationService.getApplications();
      
      const allAppsArray = Array.isArray(allApplications) ? allApplications : allApplications.items || [];
      
      let pending = Array.isArray(pendingApps) ? pendingApps : [];
      
      const underReviewApps = allAppsArray.filter(app => 
        app.status?.toUpperCase() === 'UNDER_REVIEW'
      );
      
      const pendingIds = new Set(pending.map(app => app.id));
      underReviewApps.forEach(app => {
        if (!pendingIds.has(app.id)) {
          pending.push(app);
        }
      });
      
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

  const evaluateApplicationAgainstRules = (application: Application): { rule: ApprovalRule | null; autoApprove: boolean; notes: string } => {
    if (!useRulesEngine) {
      return { rule: null, autoApprove: false, notes: 'Rules engine disabled' };
    }

    // Sort rules by priority
    const sortedRules = [...approvalRules]
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (applicationMatchesRule(application, rule)) {
        return {
          rule,
          autoApprove: rule.actions.auto_approve,
          notes: rule.actions.add_notes || ''
        };
      }
    }

    return { rule: null, autoApprove: false, notes: 'No matching rules found - requires manual review' };
  };

  const applicationMatchesRule = (application: Application, rule: ApprovalRule): boolean => {
    const { conditions } = rule;

    // Check license category
    if (conditions.license_categories.length > 0 && 
        !conditions.license_categories.includes(application.applied_category)) {
      return false;
    }

    // Check verification requirements
    if (conditions.require_payment_verified && !application.payment_verified) {
      return false;
    }
    if (conditions.require_documents_verified && !application.documents_verified) {
      return false;
    }
    if (conditions.require_medical_verified && !application.medical_verified) {
      return false;
    }

    // Check age limits (mock - would need actual citizen age calculation)
    if (application.citizen) {
      const citizenAge = calculateAge(application.citizen.date_of_birth);
      if (conditions.min_age_limit && citizenAge < conditions.min_age_limit) {
        return false;
      }
      if (conditions.max_age_limit && citizenAge > conditions.max_age_limit) {
        return false;
      }
    }

    // Check excluded categories
    if (conditions.exclude_categories?.includes(application.applied_category)) {
      return false;
    }

    return true;
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleBatchProcessWithRules = async (preview: boolean = false) => {
    if (selectedApplications.length === 0) {
      setError('No applications selected for batch processing');
      return;
    }

    try {
      setBulkProcessing(true);
      setError('');
      setPreviewMode(preview);
      
      const result: BatchProcessResult = {
        total: selectedApplications.length,
        auto_approved: 0,
        manual_review: 0,
        failed: 0,
        rules_applied: {}
      };

      const autoApprovalCandidates: Array<{ applicationId: number; rule: ApprovalRule; notes: string }> = [];
      const manualReviewCandidates: Array<{ applicationId: number; reason: string }> = [];

      // Evaluate each application against rules
      for (const applicationId of selectedApplications) {
        const application = pendingApplications.find(app => app.id === applicationId);
        if (!application) {
          result.failed++;
          continue;
        }

        const evaluation = evaluateApplicationAgainstRules(application);
        
        if (evaluation.autoApprove && evaluation.rule) {
          autoApprovalCandidates.push({
            applicationId,
            rule: evaluation.rule,
            notes: evaluation.notes
          });
          result.auto_approved++;
          
          // Count rule applications
          if (result.rules_applied[evaluation.rule.id]) {
            result.rules_applied[evaluation.rule.id]++;
          } else {
            result.rules_applied[evaluation.rule.id] = 1;
          }
        } else {
          manualReviewCandidates.push({
            applicationId,
            reason: evaluation.notes
          });
          result.manual_review++;
        }
      }

      setBatchProcessResult(result);

      if (!preview) {
        // Process auto-approvals
        for (const candidate of autoApprovalCandidates) {
          try {
            await api.post(`/applications/${candidate.applicationId}/approve`, {
              collection_point: bulkCollectionPoint || 'Main Office',
              review_notes: candidate.notes,
              auto_approved: true,
              applied_rule: candidate.rule.id
            });
          } catch (err) {
            console.error(`Failed to approve application ${candidate.applicationId}:`, err);
            result.failed++;
            result.auto_approved--;
          }
        }

        setSuccess(`Batch processing completed: ${result.auto_approved} auto-approved, ${result.manual_review} require manual review`);
        setSelectedApplications([]);
        setBatchProcessDialogOpen(false);
        loadApplications();
      } else {
        setBatchProcessDialogOpen(true);
      }

    } catch (err: any) {
      setError(`Batch processing failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setBulkProcessing(false);
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
      
      const response = await api.post(`/applications/${selectedApplication.id}/approve`, {
        collection_point: collectionPoint,
        review_notes: reviewNotes
      });

      console.log('Approval response:', response.data);
      
      handleApprovalDialogClose();
      loadApplications();
      setSuccess(`Application ${selectedApplication.id} approved successfully`);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve application');
      console.error('Approval error:', err);
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

  const updateRule = (ruleId: string, updates: Partial<ApprovalRule>) => {
    setApprovalRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  };

  const renderApplicationTable = (applications: Application[], showActions = true) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {showActions && (
              <TableCell padding="checkbox">
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedApplications(applications.map(app => app.id));
                    } else {
                      setSelectedApplications([]);
                    }
                  }}
                  checked={selectedApplications.length === applications.length && applications.length > 0}
                />
              </TableCell>
            )}
            <TableCell>Application ID</TableCell>
            <TableCell>Citizen</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Applied Date</TableCell>
            <TableCell>Verification Status</TableCell>
            <TableCell>Rule Match</TableCell>
            {showActions && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {applications.map((application) => {
            const ruleEvaluation = evaluateApplicationAgainstRules(application);
            return (
              <TableRow key={application.id}>
                {showActions && (
                  <TableCell padding="checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectedApplications.includes(application.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedApplications([...selectedApplications, application.id]);
                        } else {
                          setSelectedApplications(selectedApplications.filter(id => id !== application.id));
                        }
                      }}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {application.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  {application.citizen ? 
                    `${application.citizen.first_name} ${application.citizen.last_name}` : 
                    'Unknown'
                  }
                </TableCell>
                <TableCell>
                  <Chip 
                    label={application.applied_category} 
                    color="primary" 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={application.status.replace('_', ' ').toUpperCase()} 
                    color={getStatusColor(application.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(application.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip
                      size="small"
                      label="Payment"
                      color={application.payment_verified ? 'success' : 'error'}
                      icon={application.payment_verified ? <VerifiedIcon /> : undefined}
                    />
                    <Chip
                      size="small"
                      label="Docs"
                      color={application.documents_verified ? 'success' : 'error'}
                      icon={application.documents_verified ? <VerifiedIcon /> : undefined}
                    />
                    <Chip
                      size="small"
                      label="Medical"
                      color={application.medical_verified ? 'success' : 'error'}
                      icon={application.medical_verified ? <VerifiedIcon /> : undefined}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  {ruleEvaluation.rule ? (
                    <Tooltip title={ruleEvaluation.notes}>
                      <Chip
                        size="small"
                        label={ruleEvaluation.autoApprove ? 'Auto-Approve' : 'Manual Review'}
                        color={ruleEvaluation.autoApprove ? 'success' : 'warning'}
                        icon={<RuleIcon />}
                      />
                    </Tooltip>
                  ) : (
                    <Chip
                      size="small"
                      label="No Rule"
                      color="default"
                    />
                  )}
                </TableCell>
                {showActions && (
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Application">
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewApplication(application.id)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {canApprove(application) && (
                        <Tooltip title="Approve">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleApprovalDialogOpen(application)}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
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
          <Button
            variant="outlined"
            startIcon={<RulesIcon />}
            onClick={() => setRulesDialogOpen(true)}
          >
            Approval Rules
          </Button>
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

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Rules Engine Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">Rule-Based Processing</Typography>
              <Typography variant="body2" color="textSecondary">
                {useRulesEngine ? 
                  `${approvalRules.filter(r => r.enabled).length} active rules` : 
                  'Rules engine disabled - all applications require manual review'
                }
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={useRulesEngine}
                  onChange={(e) => setUseRulesEngine(e.target.checked)}
                />
              }
              label="Enable Rules Engine"
            />
          </Box>
        </CardContent>
      </Card>

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
              <Typography variant="h6" color="warning.main">
                {pendingApplications.filter(app => !canApprove(app)).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Incomplete Verification
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary.main">
                {pendingApplications.filter(app => evaluateApplicationAgainstRules(app).autoApprove).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ready for Auto-Approval
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bulk Actions Bar */}
      {selectedApplications.length > 0 && (
        <Card sx={{ mb: 3, backgroundColor: 'action.hover' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                {selectedApplications.length} application(s) selected
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<AutoIcon />}
                  onClick={() => handleBatchProcessWithRules(true)}
                  disabled={bulkProcessing || !useRulesEngine}
                >
                  Preview Rule Processing
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<ProcessIcon />}
                  onClick={() => handleBatchProcessWithRules(false)}
                  disabled={bulkProcessing}
                >
                  Process Selected
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ApproveIcon />}
                  onClick={() => setBulkApprovalDialogOpen(true)}
                  disabled={bulkProcessing}
                >
                  Manual Bulk Approve
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedApplications([])}
                >
                  Clear Selection
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

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

      {/* Approval Rules Dialog */}
      <Dialog 
        open={rulesDialogOpen} 
        onClose={() => setRulesDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Approval Rules Configuration
          <Typography variant="subtitle2" color="textSecondary">
            Configure automatic approval rules for different license categories and conditions
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {approvalRules.map((rule) => (
              <Accordion key={rule.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={rule.enabled}
                          onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      }
                      label=""
                    />
                    <Typography variant="h6" sx={{ flex: 1 }}>
                      {rule.name}
                    </Typography>
                    <Chip
                      label={`Priority ${rule.priority}`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={rule.actions.auto_approve ? 'Auto-Approve' : 'Manual Review'}
                      size="small"
                      color={rule.actions.auto_approve ? 'success' : 'warning'}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Conditions
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><RuleIcon /></ListItemIcon>
                          <ListItemText 
                            primary="License Categories"
                            secondary={rule.conditions.license_categories.join(', ')}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><VerifiedIcon /></ListItemIcon>
                          <ListItemText 
                            primary="Verification Requirements"
                            secondary={
                              [
                                rule.conditions.require_payment_verified && 'Payment',
                                rule.conditions.require_documents_verified && 'Documents',
                                rule.conditions.require_medical_verified && 'Medical'
                              ].filter(Boolean).join(', ')
                            }
                          />
                        </ListItem>
                        {(rule.conditions.min_age_limit || rule.conditions.max_age_limit) && (
                          <ListItem>
                            <ListItemIcon><RuleIcon /></ListItemIcon>
                            <ListItemText 
                              primary="Age Limits"
                              secondary={`${rule.conditions.min_age_limit || 0} - ${rule.conditions.max_age_limit || 'No limit'} years`}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Actions
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            {rule.actions.auto_approve ? <AutoIcon color="success" /> : <RuleIcon color="warning" />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={rule.actions.auto_approve ? 'Auto-Approve' : 'Manual Review Required'}
                            secondary={rule.actions.add_notes}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><AssignmentIcon /></ListItemIcon>
                          <ListItemText 
                            primary="Priority Level"
                            secondary={rule.actions.priority_level.toUpperCase()}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRulesDialogOpen(false)}>Close</Button>
          <Button variant="contained" disabled>
            Save Rules (Feature Coming Soon)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batch Process Results Dialog */}
      <Dialog
        open={batchProcessDialogOpen}
        onClose={() => setBatchProcessDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {previewMode ? 'Batch Processing Preview' : 'Batch Processing Results'}
        </DialogTitle>
        <DialogContent>
          {batchProcessResult && (
            <Box sx={{ py: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {batchProcessResult.total}
                      </Typography>
                      <Typography variant="body2">Total Selected</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {batchProcessResult.auto_approved}
                      </Typography>
                      <Typography variant="body2">Auto-Approved</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {batchProcessResult.manual_review}
                      </Typography>
                      <Typography variant="body2">Manual Review</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">
                        {batchProcessResult.failed}
                      </Typography>
                      <Typography variant="body2">Failed</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {Object.keys(batchProcessResult.rules_applied).length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Rules Applied
                  </Typography>
                  {Object.entries(batchProcessResult.rules_applied).map(([ruleId, count]) => {
                    const rule = approvalRules.find(r => r.id === ruleId);
                    return (
                      <Box key={ruleId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {rule?.name || ruleId}
                        </Typography>
                        <Chip label={`${count} applications`} size="small" />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchProcessDialogOpen(false)}>
            {previewMode ? 'Cancel' : 'Close'}
          </Button>
          {previewMode && batchProcessResult && batchProcessResult.auto_approved > 0 && (
            <Button 
              variant="contained" 
              color="success"
              onClick={() => {
                setBatchProcessDialogOpen(false);
                handleBatchProcessWithRules(false);
              }}
            >
              Proceed with Processing
            </Button>
          )}
        </DialogActions>
      </Dialog>

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

      {/* Bulk Approval Dialog */}
      <Dialog 
        open={bulkApprovalDialogOpen} 
        onClose={() => setBulkApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bulk Application Approval
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            You are about to approve {selectedApplications.length} applications.
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Collection Point *</InputLabel>
            <Select
              value={bulkCollectionPoint}
              label="Collection Point *"
              onChange={(e) => setBulkCollectionPoint(e.target.value)}
            >
              {availableLocations.map((location) => (
                <MenuItem key={location.id} value={location.name}>
                  {location.name} - {location.city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Review Notes (Optional)"
            multiline
            rows={3}
            value={bulkReviewNotes}
            onChange={(e) => setBulkReviewNotes(e.target.value)}
            placeholder="Add notes that will apply to all approved applications..."
          />
          
          {bulkProcessing && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Processing {selectedApplications.length} applications...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setBulkApprovalDialogOpen(false)}
            disabled={bulkProcessing}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleBatchProcessWithRules}
            disabled={!bulkCollectionPoint || bulkProcessing}
          >
            {bulkProcessing ? 'Processing...' : `Approve ${selectedApplications.length} Applications`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationReview; 