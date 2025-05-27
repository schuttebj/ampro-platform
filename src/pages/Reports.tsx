import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  DateRange as DateIcon,
  People as PeopleIcon,
  DirectionsCar as LicenseIcon,
  Description as ApplicationIcon,
  AccountBalance as TransactionIcon,
  TrendingUp as TrendingIcon,
  PieChart as ChartIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface ReportConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'operational' | 'financial' | 'compliance' | 'analytics';
  parameters?: string[];
}

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dateTo, setDateTo] = useState<Date | null>(new Date());
  const [format, setFormat] = useState<string>('pdf');
  const [generating, setGenerating] = useState<boolean>(false);

  const reportTypes: ReportConfig[] = [
    {
      id: 'license-summary',
      title: 'License Summary Report',
      description: 'Overview of all licenses issued, renewed, and expired',
      icon: <LicenseIcon />,
      category: 'operational',
      parameters: ['date_range', 'license_category', 'status']
    },
    {
      id: 'application-status',
      title: 'Application Status Report',
      description: 'Current status of all license applications',
      icon: <ApplicationIcon />,
      category: 'operational',
      parameters: ['date_range', 'status', 'application_type']
    },
    {
      id: 'citizen-registration',
      title: 'Citizen Registration Report',
      description: 'New citizen registrations and demographics',
      icon: <PeopleIcon />,
      category: 'operational',
      parameters: ['date_range', 'demographics']
    },
    {
      id: 'financial-summary',
      title: 'Financial Summary Report',
      description: 'Revenue from fees, penalties, and transactions',
      icon: <TransactionIcon />,
      category: 'financial',
      parameters: ['date_range', 'transaction_type']
    },
    {
      id: 'compliance-audit',
      title: 'Compliance Audit Report',
      description: 'System access logs and compliance tracking',
      icon: <ReportIcon />,
      category: 'compliance',
      parameters: ['date_range', 'user_role', 'action_type']
    },
    {
      id: 'performance-analytics',
      title: 'Performance Analytics',
      description: 'Processing times and system performance metrics',
      icon: <TrendingIcon />,
      category: 'analytics',
      parameters: ['date_range', 'metric_type']
    },
    {
      id: 'license-expiry',
      title: 'License Expiry Report',
      description: 'Licenses expiring in the next 30/60/90 days',
      icon: <DateIcon />,
      category: 'operational',
      parameters: ['expiry_period', 'license_category']
    },
    {
      id: 'revenue-analysis',
      title: 'Revenue Analysis',
      description: 'Detailed breakdown of revenue sources and trends',
      icon: <ChartIcon />,
      category: 'financial',
      parameters: ['date_range', 'revenue_source']
    }
  ];

  const categoryColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning'> = {
    operational: 'primary',
    financial: 'success',
    compliance: 'warning',
    analytics: 'secondary'
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      alert('Please select a report type');
      return;
    }

    setGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call the API
      const reportData = {
        type: selectedReport,
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
        format
      };
      
      console.log('Generating report with config:', reportData);
      alert(`Report "${selectedReport}" generated successfully! Download will start shortly.`);
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getReportsByCategory = (category: string) => {
    return reportTypes.filter(report => report.category === category);
  };

  const selectedReportConfig = reportTypes.find(r => r.id === selectedReport);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Reports & Analytics
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Generate comprehensive reports for system monitoring and compliance
        </Typography>

        <Grid container spacing={3}>
          {/* Report Selection */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Reports
              </Typography>
              
              {/* Operational Reports */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Operational" color="primary" size="small" />
                  Daily Operations & Management
                </Typography>
                <Grid container spacing={2}>
                  {getReportsByCategory('operational').map((report) => (
                    <Grid item xs={12} sm={6} key={report.id}>
                      <Card 
                        variant={selectedReport === report.id ? "outlined" : "elevation"}
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedReport === report.id ? 2 : 0,
                          borderColor: 'primary.main'
                        }}
                        onClick={() => setSelectedReport(report.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {report.icon}
                            <Typography variant="h6" sx={{ ml: 1 }}>
                              {report.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {report.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Financial Reports */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Financial" color="success" size="small" />
                  Revenue & Financial Analysis
                </Typography>
                <Grid container spacing={2}>
                  {getReportsByCategory('financial').map((report) => (
                    <Grid item xs={12} sm={6} key={report.id}>
                      <Card 
                        variant={selectedReport === report.id ? "outlined" : "elevation"}
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedReport === report.id ? 2 : 0,
                          borderColor: 'primary.main'
                        }}
                        onClick={() => setSelectedReport(report.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {report.icon}
                            <Typography variant="h6" sx={{ ml: 1 }}>
                              {report.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {report.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Compliance & Analytics */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Compliance & Analytics" color="warning" size="small" />
                  Audit Trails & Performance Metrics
                </Typography>
                <Grid container spacing={2}>
                  {[...getReportsByCategory('compliance'), ...getReportsByCategory('analytics')].map((report) => (
                    <Grid item xs={12} sm={6} key={report.id}>
                      <Card 
                        variant={selectedReport === report.id ? "outlined" : "elevation"}
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedReport === report.id ? 2 : 0,
                          borderColor: 'primary.main'
                        }}
                        onClick={() => setSelectedReport(report.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {report.icon}
                            <Typography variant="h6" sx={{ ml: 1 }}>
                              {report.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {report.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Report Configuration */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom>
                Report Configuration
              </Typography>

              {selectedReportConfig ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      {selectedReportConfig.title}
                    </Typography>
                    <Typography variant="body2">
                      {selectedReportConfig.description}
                    </Typography>
                  </Alert>

                  <Box sx={{ mb: 2 }}>
                    <DatePicker
                      label="From Date"
                      value={dateFrom}
                      onChange={setDateFrom}
                      slots={{
                        textField: TextField
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: 'normal'
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <DatePicker
                      label="To Date"
                      value={dateTo}
                      onChange={setDateTo}
                      slots={{
                        textField: TextField
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: 'normal'
                        }
                      }}
                    />
                  </Box>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={format}
                      label="Format"
                      onChange={(e) => setFormat(e.target.value)}
                    >
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="excel">Excel</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<DownloadIcon />}
                    onClick={handleGenerateReport}
                    disabled={generating}
                    sx={{ mt: 2 }}
                  >
                    {generating ? 'Generating...' : 'Generate Report'}
                  </Button>
                </Box>
              ) : (
                <Alert severity="info">
                  Select a report type to configure generation parameters
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports; 