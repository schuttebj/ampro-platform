import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { workflowService } from '../../api/services';

const WorkflowAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Analytics data
  const [printStats, setPrintStats] = useState<any>(null);
  const [shippingStats, setShippingStats] = useState<any>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        printStatsData,
        shippingStatsData
      ] = await Promise.all([
        workflowService.getPrintJobStatistics(),
        workflowService.getShippingStatistics()
      ]);

      setPrintStats(printStatsData);
      setShippingStats(shippingStatsData);

    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      setError(err.response?.data?.detail || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateEfficiency = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Workflow Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Analytics">
            <IconButton onClick={loadAnalyticsData} disabled={loading}>
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

      {/* Overall Performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Overall Workflow Performance
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {printStats && shippingStats ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Print Job Efficiency
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateEfficiency(printStats.completed, printStats.total)}
                        color={getProgressColor(calculateEfficiency(printStats.completed, printStats.total))}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {calculateEfficiency(printStats.completed, printStats.total)}% completion rate
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Shipping Efficiency
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateEfficiency(shippingStats.delivered, shippingStats.total)}
                        color={getProgressColor(calculateEfficiency(shippingStats.delivered, shippingStats.total))}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {calculateEfficiency(shippingStats.delivered, shippingStats.total)}% delivery rate
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">Loading performance data...</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Print Job Analytics */}
      {printStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Print Job Analytics
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="default">
                        {printStats.queued}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Queued
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {printStats.assigned}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Assigned
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {printStats.printing}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Printing
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {printStats.completed}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main">
                        {printStats.failed}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Failed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary.main">
                        {printStats.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Shipping Analytics */}
      {shippingStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Shipping Analytics
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {shippingStats.pending}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pending
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {shippingStats.in_transit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        In Transit
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {shippingStats.delivered}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Delivered
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary.main">
                        {shippingStats.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Processing Speed
                </Typography>
              </Box>
              <Typography variant="h4" color="primary.main" gutterBottom>
                2.3 days
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average processing time from application to collection
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Bottleneck Alert
                </Typography>
              </Box>
              <Typography variant="h4" color="warning.main" gutterBottom>
                Print Queue
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current bottleneck in the workflow process
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Daily Throughput
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main" gutterBottom>
                47
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Licenses completed today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loading Overlay */}
      {loading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};

export default WorkflowAnalytics; 