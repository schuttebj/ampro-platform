import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string | React.ReactNode;
}

export interface DataTableProps {
  columns: Column[];
  rows: any[];
  total: number;
  page: number;
  rowsPerPage: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  title?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  total,
  page,
  rowsPerPage,
  loading = false,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onEdit,
  onDelete,
  title
}) => {
  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(0);
  };

  const getStatusChip = (status: string) => {
    const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      ACTIVE: 'success',
      APPROVED: 'success',
      COMPLETED: 'success',
      PENDING: 'warning',
      UNDER_REVIEW: 'warning',
      SUBMITTED: 'info',
      EXPIRED: 'error',
      REJECTED: 'error',
      CANCELLED: 'error',
      SUSPENDED: 'error',
      REVOKED: 'error'
    };

    return (
      <Chip
        label={status}
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  const formatCellValue = (column: Column, value: any) => {
    if (column.format) {
      return column.format(value);
    }
    
    // Auto-format common field types
    if (column.id.includes('status') && typeof value === 'string') {
      return getStatusChip(value);
    }
    
    if (column.id.includes('date') && value) {
      return new Date(value).toLocaleDateString();
    }
    
    if (column.id.includes('amount') && typeof value === 'number') {
      return `$${value.toFixed(2)}`;
    }
    
    return value;
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
        </Box>
      )}
      
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
              {(onView || onEdit || onDelete) && (
                <TableCell align="center" style={{ minWidth: 120 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={row.id || index}>
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {formatCellValue(column, value)}
                      </TableCell>
                    );
                  })}
                  {(onView || onEdit || onDelete) && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {onView && (
                          <IconButton
                            size="small"
                            onClick={() => onView(row)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        )}
                        {onEdit && (
                          <IconButton
                            size="small"
                            onClick={() => onEdit(row)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                        {onDelete && (
                          <IconButton
                            size="small"
                            onClick={() => onDelete(row)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default DataTable;