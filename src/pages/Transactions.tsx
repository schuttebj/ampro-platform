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
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import DataTable, { Column } from '../components/DataTable';
import SearchFilter, { FilterField } from '../components/SearchFilter';
import { transactionService } from '../api/services';
import { Transaction } from '../types';

const Transactions: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
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
    if (filters.transaction_type) {
      params.transaction_type = filters.transaction_type;
    }
    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.date_from) {
      params.date_from = filters.date_from;
    }
    if (filters.date_to) {
      params.date_to = filters.date_to;
    }
    if (filters.amount_min) {
      params.amount_min = parseFloat(filters.amount_min);
    }
    if (filters.amount_max) {
      params.amount_max = parseFloat(filters.amount_max);
    }

    return params;
  }, [page, rowsPerPage, searchTerm, filters]);

  // Fetch transactions with React Query
  const { data: transactionsData, isLoading, error, refetch } = useQuery(
    ['transactions', queryFilters],
    () => transactionService.getTransactions(queryFilters),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
      onSuccess: (data) => {
        console.log('Transactions API Response:', data);
        console.log('Number of transactions:', data?.items?.length || 0);
      },
      onError: (error) => {
        console.error('Transactions API Error:', error);
      }
    }
  );

  // Define table columns
  const columns: Column[] = [
    {
      id: 'transaction_ref',
      label: 'Reference',
      minWidth: 120,
      format: (value: string) => (
        <Typography variant="body2" fontFamily="monospace">
          {value}
        </Typography>
      )
    },
    {
      id: 'transaction_type',
      label: 'Type',
      minWidth: 150,
      format: (value: string) => {
        const typeColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default'> = {
          license_issuance: 'primary',
          license_renewal: 'secondary',
          license_replacement: 'warning',
          application_submission: 'default',
          application_approval: 'success',
          application_rejection: 'error',
          fee_payment: 'warning',
          document_upload: 'default'
        };
        const displayName = value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return (
          <Chip
            label={displayName}
            color={typeColors[value] || 'default'}
            size="small"
          />
        );
      }
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      minWidth: 100,
      format: (value: number | null) => value ? `$${value.toFixed(2)}` : 'N/A'
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      format: (value: string) => {
        const statusColors: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'default'> = {
          pending: 'warning',
          completed: 'success',
          failed: 'error',
          cancelled: 'default'
        };
        return (
          <Chip
            label={value.toUpperCase()}
            color={statusColors[value] || 'default'}
            size="small"
          />
        );
      }
    },
    {
      id: 'citizen',
      label: 'Citizen',
      minWidth: 200,
      format: (citizen: any) => 
        citizen ? `${citizen.first_name} ${citizen.last_name}` : 'N/A'
    },
    {
      id: 'user',
      label: 'Initiated By',
      minWidth: 150,
      format: (user: any) => 
        user ? user.full_name : 'System'
    },
    {
      id: 'initiated_at',
      label: 'Date',
      minWidth: 120,
      format: (value: string) => new Date(value).toLocaleDateString()
    }
  ];

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      name: 'transaction_type',
      label: 'Transaction Type',
      type: 'select',
      options: [
        { value: 'license_issuance', label: 'License Issuance' },
        { value: 'license_renewal', label: 'License Renewal' },
        { value: 'license_replacement', label: 'License Replacement' },
        { value: 'application_submission', label: 'Application Submission' },
        { value: 'application_approval', label: 'Application Approval' },
        { value: 'application_rejection', label: 'Application Rejection' },
        { value: 'fee_payment', label: 'Fee Payment' },
        { value: 'document_upload', label: 'Document Upload' }
      ]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
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
    },
    {
      name: 'amount_min',
      label: 'Min Amount',
      type: 'text',
      placeholder: '0.00'
    },
    {
      name: 'amount_max',
      label: 'Max Amount',
      type: 'text',
      placeholder: '1000.00'
    }
  ];

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    if (!transactionsData?.items) return null;

    const transactions = transactionsData.items;
    const totalAmount = transactions.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
    const completedTransactions = transactions.filter((t: Transaction) => t.status === 'completed');
    const pendingTransactions = transactions.filter((t: Transaction) => t.status === 'pending');

    return {
      total: transactions.length,
      totalAmount,
      completed: completedTransactions.length,
      pending: pendingTransactions.length,
      completedAmount: completedTransactions.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
    };
  }, [transactionsData]);

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
      const blob = await transactionService.exportTransactions({
        ...filters,
        format: 'csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
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

  const viewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedTransaction(null);
  };

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Transactions
        </Typography>
        <Alert severity="error">
          Failed to load transactions. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Transaction History
        </Typography>
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
                <Typography color="textSecondary" gutterBottom>
                  Total Transactions
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
                <Typography color="textSecondary" gutterBottom>
                  Total Amount
                </Typography>
                <Typography variant="h5" component="div">
                  ${summaryStats.totalAmount.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h5" component="div" color="success.main">
                  {summaryStats.completed}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ${summaryStats.completedAmount.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h5" component="div" color="warning.main">
                  {summaryStats.pending}
                </Typography>
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
        searchPlaceholder="Search by reference, citizen name, or amount..."
        filterFields={filterFields}
      />

      {/* Transactions Table */}
      <DataTable
        columns={columns}
        rows={transactionsData?.items || []}
        total={transactionsData?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        loading={isLoading}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onView={viewTransaction}
        title="All Transactions"
      />

      {/* Transaction Details Modal */}
      <Dialog 
        open={detailsOpen} 
        onClose={closeDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Transaction Details
          {selectedTransaction && (
            <Typography variant="subtitle1" color="textSecondary">
              {selectedTransaction.transaction_ref}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell variant="head">Reference</TableCell>
                    <TableCell>{selectedTransaction.transaction_ref}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Type</TableCell>
                    <TableCell>
                      {selectedTransaction.transaction_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Status</TableCell>
                    <TableCell>
                      <Chip 
                        label={selectedTransaction.status.toUpperCase()} 
                        color={selectedTransaction.status === 'completed' ? 'success' : 
                               selectedTransaction.status === 'pending' ? 'warning' : 
                               selectedTransaction.status === 'failed' ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Amount</TableCell>
                    <TableCell>{selectedTransaction.amount ? `$${selectedTransaction.amount.toFixed(2)}` : 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Citizen</TableCell>
                    <TableCell>
                      {selectedTransaction.citizen 
                        ? `${selectedTransaction.citizen.first_name} ${selectedTransaction.citizen.last_name} (${selectedTransaction.citizen.id_number})`
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Initiated By</TableCell>
                    <TableCell>{selectedTransaction.user?.full_name || 'System'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">Initiated At</TableCell>
                    <TableCell>{new Date(selectedTransaction.initiated_at).toLocaleString()}</TableCell>
                  </TableRow>
                  {selectedTransaction.completed_at && (
                    <TableRow>
                      <TableCell variant="head">Completed At</TableCell>
                      <TableCell>{new Date(selectedTransaction.completed_at).toLocaleString()}</TableCell>
                    </TableRow>
                  )}
                  {selectedTransaction.payment_method && (
                    <TableRow>
                      <TableCell variant="head">Payment Method</TableCell>
                      <TableCell>{selectedTransaction.payment_method}</TableCell>
                    </TableRow>
                  )}
                  {selectedTransaction.payment_reference && (
                    <TableRow>
                      <TableCell variant="head">Payment Reference</TableCell>
                      <TableCell>{selectedTransaction.payment_reference}</TableCell>
                    </TableRow>
                  )}
                  {selectedTransaction.notes && (
                    <TableRow>
                      <TableCell variant="head">Notes</TableCell>
                      <TableCell>{selectedTransaction.notes}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions; 