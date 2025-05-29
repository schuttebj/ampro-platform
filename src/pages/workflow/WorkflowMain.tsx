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
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Assignment as ApplicationIcon,
  Security as ISOIcon,
  Print as PrintIcon,
  LocalShipping as ShippingIcon,
  Store as CollectionIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { workflowService, isoComplianceService, applicationService } from '../../api/services';

interface WorkflowStats {
  applications: {
    pending_review: number;
    approved: number;
    total: number;
  };
  print_jobs: {
    queued: number;
    assigned: number;
    printing: number;
    completed: number;
    total: number;
  };
  shipping: {
    pending: number;
    in_transit: number;
    delivered: number;
    total: number;
  };
  collection: {
    ready: number;
    collected: number;
    total: number;
  };
}

const WorkflowMain: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<WorkflowStats | null>(null);

  useEffect(() => {
    loadWorkflowStats();
  }, []);

  const loadWorkflowStats = async () => {
    try {
      setLoading(true);
      setError('');

      // Try to load statistics, but don't fail if they're not available
      let printStats;
      let shippingStats;
      
      try {
        printStats = await workflowService.getPrintJobStatistics();
      } catch (err) {
        console.warn('Failed to load print job statistics:', err);
        printStats = {
          queued: 0,
          assigned: 0,
          printing: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
          total: 0
        };
      }

      try {
        shippingStats = await workflowService.getShippingStatistics();
      } catch (err) {
        console.warn('Failed to load shipping statistics:', err);
        shippingStats = {
          pending: 0,
          in_transit: 0,
          delivered: 0,
          failed: 0,
          total: 0
        };
      }

      // Load real application stats from the API
      let applicationStats;
      try {
        // Get pending applications
        const pendingApps = await applicationService.getPendingApplications();
        // Get all applications to count other statuses
        const allApplications = await applicationService.getApplications();
        const allAppsArray = Array.isArray(allApplications) ? allApplications : allApplications.items || [];
        
        // Include both SUBMITTED and UNDER_REVIEW as pending
        let pendingCount = Array.isArray(pendingApps) ? pendingApps.length : 0;
        const underReviewCount = allAppsArray.filter(app => app.status?.toLowerCase() === 'under_review').length;
        
        // Total pending includes both submitted and under review
        const totalPendingCount = pendingCount + underReviewCount;
        
        const approvedCount = allAppsArray.filter(app => 
          ['approved', 'license_generated', 'queued_for_printing', 'printing', 'printed', 'shipped', 'ready_for_collection', 'completed'].includes(app.status?.toLowerCase())
        ).length;
        
        applicationStats = {
          pending_review: totalPendingCount,
          approved: approvedCount,
          total: totalPendingCount + approvedCount
        };
      } catch (err) {
        console.warn('Failed to load application statistics:', err);
        applicationStats = {
          pending_review: 0,
          approved: 0,
          total: 0
        };
      }

      // Mock collection stats - you can implement this endpoint
      const collectionStats = {
        ready: 15,
        collected: 45,
        total: 60
      };

      setStats({
        applications: applicationStats,
        print_jobs: printStats,
        shipping: shippingStats,
        collection: collectionStats
      });

    } catch (err: any) {
      console.error('Error loading workflow stats:', err);
      setError(err.response?.data?.detail || 'Failed to load workflow statistics');
    } finally {
      setLoading(false);
    }
  };

  const workflowSteps = [
    {
      label: 'Application Review',
      description: 'Review and approve license applications',
      icon: <ApplicationIcon />,
      path: '/workflow/applications',
      stats: stats?.applications,
      color: 'primary'
    },
    {
      label: 'ISO Compliance',
      description: 'Validate ISO 18013 compliance',
      icon: <ISOIcon />,
      path: '/workflow/iso-compliance',
      stats: null,
      color: 'secondary'
    },
    {
      label: 'Print Management',
      description: 'Manage license printing queue',
      icon: <PrintIcon />,
      path: '/workflow/print-queue',
      stats: stats?.print_jobs,
      color: 'info'
    },
    {
      label: 'Shipping & Logistics',
      description: 'Track license shipments',
      icon: <ShippingIcon />,
      path: '/workflow/shipping',
      stats: stats?.shipping,
      color: 'warning'
    },
    {
      label: 'Collection Points',
      description: 'Manage license collection',
      icon: <CollectionIcon />,
      path: '/workflow/collection',
      stats: stats?.collection,
      color: 'success'
    },
    {
      label: 'Analytics',
      description: 'Monitor workflow performance',
      icon: <AnalyticsIcon />,
      path: '/workflow/analytics',
      stats: null,
      color: 'default'
    }
  ];

  const getWorkflowProgress = () => {
    if (!stats) return 0;
    const total = stats.applications.total + stats.print_jobs.total + stats.shipping.total;
    const completed = stats.applications.approved + stats.print_jobs.completed + stats.shipping.delivered;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getPriorityAlerts = () => {
    const alerts = [];
    if (stats?.print_jobs?.queued && stats.print_jobs.queued > 10) {
      alerts.push('High print queue volume - consider assigning more printers');
    }
    if (stats?.shipping?.pending && stats.shipping.pending > 5) {
      alerts.push('Pending shipments require attention');
    }
    if (stats?.applications?.pending_review && stats.applications.pending_review > 15) {
      alerts.push('Many applications awaiting review');
    }
    return alerts;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Workflow Management
        </Typography>
        <Tooltip title="Refresh Statistics">
          <IconButton onClick={loadWorkflowStats} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Priority Alerts */}
      {stats && getPriorityAlerts().map((alert, index) => (
        <Alert key={index} severity="warning" sx={{ mb: 2 }}>
          {alert}
        </Alert>
      ))}

      {/* Overall Progress */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Overall Workflow Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={getWorkflowProgress()} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {Math.round(getWorkflowProgress())}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Current workflow efficiency across all stages
          </Typography>
        </CardContent>
      </Card>

      {/* Workflow Steps Grid */}
      <Grid container spacing={3}>
        {workflowSteps.map((step, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => navigate(step.path)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: `${step.color}.main`, mr: 2 }}>
                    {step.icon}
                  </Box>
                  <Typography variant="h6" component="h2">
                    {step.label}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>

                {step.stats && (
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={1}>
                      {Object.entries(step.stats).map(([key, value]) => (
                        key !== 'total' && (
                          <Grid item xs={6} key={key}>
                            <Chip 
                              label={`${key.replace('_', ' ')}: ${value}`}
                              size="small"
                              variant="outlined"
                            />
                          </Grid>
                        )
                      ))}
                    </Grid>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Total: {step.stats.total}
                    </Typography>
                  </Box>
                )}

                <Button 
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  fullWidth
                  size="small"
                >
                  Open {step.label}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<ApplicationIcon />}
                onClick={() => navigate('/workflow/applications/pending')}
              >
                Review Applications
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<PrintIcon />}
                onClick={() => navigate('/workflow/print-queue')}
              >
                Manage Print Queue
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<ShippingIcon />}
                onClick={() => navigate('/workflow/shipping')}
              >
                Process Shipments
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<AnalyticsIcon />}
                onClick={() => navigate('/workflow/analytics')}
              >
                View Analytics
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      {loading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};

export default WorkflowMain; 