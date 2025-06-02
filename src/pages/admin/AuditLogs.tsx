import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Security as SecurityIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  GetApp as ExportIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import DataTable, { Column } from '../../components/DataTable';
import SearchFilter, { FilterField } from '../../components/SearchFilter';
import { auditService, adminUserService } from '../../api/services';
import { AuditLog, User } from '../../types';

const AuditLogs: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Build query filters
  const queryFilters = React.useMemo(() => {
    const params: any = {
      skip: page * rowsPerPage,
      limit: rowsPerPage,
    };

    if (searchTerm) {
      params.search = searchTerm;
    }

    // Apply filters
    if (filters.user_id) {
      params.user_id = filters.user_id;
    }
    if (filters.action_type) {
      params.action_type = filters.action_type;
    }
    if (filters.resource_type) {
      params.resource_type = filters.resource_type;
    }
    if (filters.resource_id) {
      params.resource_id = filters.resource_id;
    }
    if (filters.date_from) {
      params.date_from = filters.date_from;
    }
    if (filters.date_to) {
      params.date_to = filters.date_to;
    }

    return params;
  }, [page, rowsPerPage, searchTerm, filters]);

  // Fetch audit logs with React Query
  const { data: auditLogsData, isLoading, error, refetch } = useQuery(
    ['auditLogs', queryFilters],
    () => auditService.getAuditLogs(queryFilters),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
      onSuccess: (data) => {
        console.log('Audit Logs API Response:', data);
        console.log('Number of audit logs:', data?.items?.length || 0);
      },
      onError: (error) => {
        console.error('Audit Logs API Error:', error);
      }
    }
  );

  // Fetch users for filter dropdown
  const { data: users } = useQuery(
    'users',
    () => adminUserService.getUsers(),
    {
      staleTime: 300000, // 5 minutes
    }
  );

  // Define table columns
  const columns: Column[] = [
    {
      id: 'timestamp',
      label: 'Timestamp',
      minWidth: 150,
      format: (value: string) => new Date(value).toLocaleString()
    },
    {
      id: 'user',
      label: 'User',
      minWidth: 150,
      format: (user: User | null) => user ? user.full_name : 'System'
    },
    {
      id: 'action_type',
      label: 'Action',
      minWidth: 100,
      format: (value: string) => {
        const actionColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default'> = {
          CREATE: 'success',
          READ: 'primary',
          UPDATE: 'warning',
          DELETE: 'error',
          LOGIN: 'default',
          LOGOUT: 'default',
          PRINT: 'secondary',
          EXPORT: 'secondary',
          VERIFY: 'success',
          GENERATE: 'primary'
        };
        return (
          <Chip
            label={value}
            color={actionColors[value] || 'default'}
            size="small"
          />
        );
      }
    },
    {
      id: 'resource_type',
      label: 'Resource',
      minWidth: 120,
      format: (value: string) => {
        const resourceColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default'> = {
          USER: 'primary',
          CITIZEN: 'secondary',
          LICENSE: 'success',
          APPLICATION: 'warning',
          LOCATION: 'default',
          FILE: 'default',
          SYSTEM: 'error'
        };
        return (
          <Chip
            label={value}
            color={resourceColors[value] || 'default'}
            size="small"
          />
        );
      }
    },
    {
      id: 'resource_id',
      label: 'Resource ID',
      minWidth: 100,
      format: (value: string | null) => value || 'N/A'
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 200,
      format: (value: string | null) => {
        if (!value) return 'N/A';
        return value.length > 50 ? `${value.substring(0, 50)}...` : value;
      }
    },
    {
      id: 'ip_address',
      label: 'IP Address',
      minWidth: 120,
      format: (value: string | null) => value || 'N/A'
    }
  ];

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      name: 'user_id',
      label: 'User',
      type: 'select',
      options: users?.map(user => ({
        value: user.id.toString(),
        label: user.full_name
      })) || []
    },
    {
      name: 'action_type',
      label: 'Action Type',
      type: 'select',
      options: [
        { value: 'CREATE', label: 'Create' },
        { value: 'READ', label: 'Read' },
        { value: 'UPDATE', label: 'Update' },
        { value: 'DELETE', label: 'Delete' },
        { value: 'LOGIN', label: 'Login' },
        { value: 'LOGOUT', label: 'Logout' },
        { value: 'PRINT', label: 'Print' },
        { value: 'EXPORT', label: 'Export' },
        { value: 'VERIFY', label: 'Verify' },
        { value: 'GENERATE', label: 'Generate' }
      ]
    },
    {
      name: 'resource_type',
      label: 'Resource Type',
      type: 'select',
      options: [
        { value: 'USER', label: 'User' },
        { value: 'CITIZEN', label: 'Citizen' },
        { value: 'LICENSE', label: 'License' },
        { value: 'APPLICATION', label: 'Application' },
        { value: 'LOCATION', label: 'Location' },
        { value: 'FILE', label: 'File' },
        { value: 'SYSTEM', label: 'System' }
      ]
    },
    {
      name: 'resource_id',
      label: 'Resource ID',
      type: 'text',
      placeholder: 'Enter resource ID...'
    },
    {
      name: 'date_from',
      label: 'From Date',
      type: 'date'
    },
    {
      name: 'date_to',
      label: 'To Date',
      type: 'date'
    }
  ];

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    if (!auditLogsData?.items || !auditLogsData?.total) return null;

    const logs = auditLogsData.items;
    const total = auditLogsData.total; // Use total from API instead of current page items
    const actionCounts = logs.reduce((acc: Record<string, number>, log: AuditLog) => {
      acc[log.action_type] = (acc[log.action_type] || 0) + 1;
      return acc;
    }, {});

    const uniqueUsers = new Set(logs.filter((log: AuditLog) => log.user_id).map((log: AuditLog) => log.user_id)).size;
    const systemActions = logs.filter((log: AuditLog) => !log.user_id).length;

    return {
      total, // Use API total instead of logs.length
      uniqueUsers,
      systemActions,
      actionCounts
    };
  }, [auditLogsData]);

  // Function to get changed values between old and new
  const getChangedValues = (oldValues: Record<string, any> | null, newValues: Record<string, any> | null) => {
    if (!oldValues && !newValues) return {};
    if (!oldValues) return newValues || {};
    if (!newValues) return {};

    const changes: Record<string, { old: any; new: any }> = {};
    
    // Check all keys from both objects
    const allKeys = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)]));
    
    for (const key of allKeys) {
      const oldVal = oldValues[key];
      const newVal = newValues[key];
      
      // Compare values (handle different types)
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[key] = { old: oldVal, new: newVal };
      }
    }
    
    return changes;
  };

  // Function to format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
      // Try to format as date
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    return String(value);
  };

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    setPage(0);
  };

  const handleFilter = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleClear = () => {
    setSearchTerm('');
    setFilters({});
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await auditService.exportAuditLogs({
        ...filters,
        format: 'csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const viewAuditLog = (auditLog: AuditLog) => {
    setSelectedAuditLog(auditLog);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedAuditLog(null);
  };

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Audit Logs
        </Typography>
        <Alert severity="error">
          Failed to load audit logs. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            Audit Logs
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Monitor all system activities and user actions
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={exporting ? <CircularProgress size={16} /> : <ExportIcon />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </Box>

      {/* Summary Statistics */}
      {summaryStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon fontSize="small" />
                  Total Actions
                </Typography>
                <Typography variant="h5" component="div">
                  {summaryStats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" />
                  Active Users
                </Typography>
                <Typography variant="h5" component="div">
                  {summaryStats.uniqueUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ComputerIcon fontSize="small" />
                  System Actions
                </Typography>
                <Typography variant="h5" component="div">
                  {summaryStats.systemActions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Action Breakdown
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Object.entries(summaryStats.actionCounts).map(([action, count]) => (
                    <Chip 
                      key={action} 
                      label={`${action}: ${count}`} 
                      size="small" 
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filter */}
      <SearchFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        onClear={handleClear}
        searchPlaceholder="Search by description, user, or resource..."
        filterFields={filterFields}
      />

      {/* Audit Logs Table */}
      <DataTable
        columns={columns}
        rows={auditLogsData?.items || []}
        total={auditLogsData?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        loading={isLoading}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onView={viewAuditLog}
        title="System Audit Trail"
      />

      {/* Audit Log Details Modal */}
      <Dialog 
        open={detailsOpen} 
        onClose={closeDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Audit Log Details
          {selectedAuditLog && (
            <Typography variant="subtitle1" color="textSecondary">
              {new Date(selectedAuditLog.timestamp).toLocaleString()}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedAuditLog && (
            <Box>
              <TableContainer sx={{ mb: 2 }}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell variant="head">Timestamp</TableCell>
                      <TableCell>{new Date(selectedAuditLog.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell variant="head">User</TableCell>
                      <TableCell>{selectedAuditLog.user?.full_name || 'System'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell variant="head">Action</TableCell>
                      <TableCell>
                        <Chip 
                          label={selectedAuditLog.action_type} 
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell variant="head">Resource Type</TableCell>
                      <TableCell>
                        <Chip 
                          label={selectedAuditLog.resource_type} 
                          size="small"
                          color="secondary"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell variant="head">Resource ID</TableCell>
                      <TableCell>{selectedAuditLog.resource_id || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell variant="head">IP Address</TableCell>
                      <TableCell>{selectedAuditLog.ip_address || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell variant="head">User Agent</TableCell>
                      <TableCell sx={{ wordBreak: 'break-all' }}>
                        {selectedAuditLog.user_agent || 'N/A'}
                      </TableCell>
                    </TableRow>
                    {selectedAuditLog.description && (
                      <TableRow>
                        <TableCell variant="head">Description</TableCell>
                        <TableCell>{selectedAuditLog.description}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Changed Values and Full Values Sections */}
              {(selectedAuditLog.old_values || selectedAuditLog.new_values) && (
                <Box>
                  {/* Show Changed Values First */}
                  {(() => {
                    const changedValues = getChangedValues(
                      selectedAuditLog.old_values || null, 
                      selectedAuditLog.new_values || null
                    );
                    const hasChanges = Object.keys(changedValues).length > 0;
                    
                    return hasChanges ? (
                      <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="h6" color="primary">
                            Changed Values ({Object.keys(changedValues).length} fields)
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell><strong>Field</strong></TableCell>
                                  <TableCell><strong>Previous Value</strong></TableCell>
                                  <TableCell><strong>New Value</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.entries(changedValues).map(([field, { old, new: newVal }]) => (
                                  <TableRow key={field}>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="bold">
                                        {field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="error.main">
                                        {formatValue(old)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="success.main">
                                        {formatValue(newVal)}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    ) : null;
                  })()}
                  
                  {/* Show Full Previous Values */}
                  {selectedAuditLog.old_values && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">All Previous Values</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              {Object.entries(selectedAuditLog.old_values).map(([field, value]) => (
                                <TableRow key={field}>
                                  <TableCell variant="head" sx={{ width: '30%' }}>
                                    {field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </TableCell>
                                  <TableCell>{formatValue(value)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  )}
                  
                  {/* Show Full New Values */}
                  {selectedAuditLog.new_values && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">All New Values</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              {Object.entries(selectedAuditLog.new_values).map(([field, value]) => (
                                <TableRow key={field}>
                                  <TableCell variant="head" sx={{ width: '30%' }}>
                                    {field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </TableCell>
                                  <TableCell>{formatValue(value)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogs; 