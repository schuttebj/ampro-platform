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
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterIcon
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

  // Fetch transactions with React Query
  const { data: transactionsData, isLoading, error, refetch } = useQuery(
    ['transactions', page, rowsPerPage, searchTerm, filters],
    () => transactionService.getTransactions(),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
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
        const typeColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning'> = {
          LICENSE_ISSUE: 'primary',
          LICENSE_RENEWAL: 'secondary',
          APPLICATION_FEE: 'warning',
          PENALTY: 'error'
        };
        return (
          <Chip
            label={value.replace('_', ' ')}
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
      format: (value: number) => `$${value.toFixed(2)}`
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100
    },
    {
      id: 'citizen',
      label: 'Citizen',
      minWidth: 200,
      format: (citizen: any) => 
        citizen ? `${citizen.first_name} ${citizen.last_name}` : 'N/A'
    },
    {
      id: 'processor',
      label: 'Processed By',
      minWidth: 150,
      format: (processor: any) => 
        processor ? processor.full_name : 'System'
    },
    {
      id: 'created_at',
      label: 'Date',
      minWidth: 120
    }
  ];

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      name: 'transaction_type',
      label: 'Transaction Type',
      type: 'select',
      options: [
        { value: 'LICENSE_ISSUE', label: 'License Issue' },
        { value: 'LICENSE_RENEWAL', label: 'License Renewal' },
        { value: 'APPLICATION_FEE', label: 'Application Fee' },
        { value: 'PENALTY', label: 'Penalty' }
      ]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'FAILED', label: 'Failed' },
        { value: 'CANCELLED', label: 'Cancelled' }
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
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const completedTransactions = transactions.filter(t => t.status === 'COMPLETED');
    const pendingTransactions = transactions.filter(t => t.status === 'PENDING');

    return {
      total: transactions.length,
      totalAmount,
      completed: completedTransactions.length,
      pending: pendingTransactions.length,
      completedAmount: completedTransactions.reduce((sum, t) => sum + t.amount, 0)
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

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality will be implemented');
  };

  const viewTransaction = (transaction: Transaction) => {
    // TODO: Implement transaction details modal or page
    console.log('View transaction:', transaction);
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
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Export
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
    </Box>
  );
};

export default Transactions; 