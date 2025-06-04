import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import api from '../../api/api';

interface FeeData {
  id: number;
  license_category: string;
  transaction_type: string;
  application_type: string;
  base_fee: number;
  processing_fee: number;
  delivery_fee: number;
  total_fee_rands: number;
  minimum_age?: number;
  maximum_age?: number;
  description?: string;
  is_active: boolean;
  effective_date: string;
}

interface FeeFormData {
  license_category: string;
  transaction_type: string;
  application_type: string;
  base_fee: number;
  processing_fee: number;
  delivery_fee: number;
  minimum_age?: number;
  maximum_age?: number;
  description?: string;
  effective_date: string;
}

const FeeManagement: React.FC = () => {
  const [fees, setFees] = useState<FeeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeData | null>(null);
  const [matrixView, setMatrixView] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FeeFormData>();

  const licenseCategories = [
    'A1', 'A', 'B', 'C1', 'C', 'EB', 'EC1', 'EC'
  ];

  const transactionTypes = [
    { value: 'driving_licence', label: 'Driving licence' },
    { value: 'govt_dept_licence', label: 'Government Department licence' },
    { value: 'foreign_replacement', label: 'Replacement of foreign licence' },
    { value: 'id_paper_replacement', label: 'Replacement from ID/paper card' },
    { value: 'temporary_licence', label: 'Temporary driving licence' },
    { value: 'new_licence_card', label: 'New licence card / Duplicate' },
    { value: 'change_particulars', label: 'Change of particulars' },
    { value: 'change_licence_doc', label: 'Change of licence document' }
  ];

  const applicationTypes = [
    { value: 'new', label: 'New License' },
    { value: 'renewal', label: 'License Renewal' },
    { value: 'replacement', label: 'Replacement' },
    { value: 'upgrade', label: 'Category Upgrade' },
    { value: 'conversion', label: 'Foreign License Conversion' }
  ];

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fees/', { params: { is_active: true } });
      setFees(response.data);
    } catch (error: any) {
      setError('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  const loadFeeMatrix = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fees/matrix/all');
      setFees(response.data);
      setMatrixView(true);
    } catch (error: any) {
      setError('Failed to load fee matrix');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingFee(null);
    reset({
      license_category: '',
      transaction_type: '',
      application_type: '',
      base_fee: 0,
      processing_fee: 0,
      delivery_fee: 0,
      effective_date: new Date().toISOString().split('T')[0]
    });
    setDialogOpen(true);
  };

  const openEditDialog = (fee: FeeData) => {
    setEditingFee(fee);
    reset({
      license_category: fee.license_category,
      transaction_type: fee.transaction_type,
      application_type: fee.application_type,
      base_fee: fee.base_fee / 100, // Convert cents to rands
      processing_fee: fee.processing_fee / 100,
      delivery_fee: fee.delivery_fee / 100,
      minimum_age: fee.minimum_age,
      maximum_age: fee.maximum_age,
      description: fee.description,
      effective_date: fee.effective_date
    });
    setDialogOpen(true);
  };

  const handleSave = async (data: FeeFormData) => {
    try {
      setLoading(true);
      
      // Convert rands to cents
      const payload = {
        ...data,
        base_fee: Math.round(data.base_fee * 100),
        processing_fee: Math.round(data.processing_fee * 100),
        delivery_fee: Math.round(data.delivery_fee * 100)
      };

      if (editingFee) {
        await api.put(`/fees/${editingFee.id}`, payload);
        setSuccess('Fee updated successfully');
      } else {
        await api.post('/fees/', payload);
        setSuccess('Fee created successfully');
      }
      
      setDialogOpen(false);
      await loadFees();
    } catch (error: any) {
      setError('Failed to save fee: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feeId: number) => {
    if (!window.confirm('Are you sure you want to deactivate this fee?')) return;

    try {
      setLoading(true);
      await api.delete(`/fees/${feeId}`);
      setSuccess('Fee deactivated successfully');
      await loadFees();
    } catch (error: any) {
      setError('Failed to deactivate fee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Fee Management
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
            >
              Add Fee Configuration
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={loadFeeMatrix}
            >
              View Fee Matrix
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => {
                setMatrixView(false);
                loadFees();
              }}
            >
              View Active Fees
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Fee Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>License Category</TableCell>
              <TableCell>Transaction Type</TableCell>
              <TableCell>Application Type</TableCell>
              <TableCell align="right">Base Fee (R)</TableCell>
              <TableCell align="right">Processing Fee (R)</TableCell>
              <TableCell align="right">Delivery Fee (R)</TableCell>
              <TableCell align="right">Total Fee (R)</TableCell>
              <TableCell>Age Requirements</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fees.map((fee) => (
              <TableRow key={fee.id}>
                <TableCell>{fee.license_category}</TableCell>
                <TableCell>
                  {transactionTypes.find(t => t.value === fee.transaction_type)?.label || fee.transaction_type}
                </TableCell>
                <TableCell>
                  {applicationTypes.find(t => t.value === fee.application_type)?.label || fee.application_type}
                </TableCell>
                <TableCell align="right">{(fee.base_fee / 100).toFixed(2)}</TableCell>
                <TableCell align="right">{(fee.processing_fee / 100).toFixed(2)}</TableCell>
                <TableCell align="right">{(fee.delivery_fee / 100).toFixed(2)}</TableCell>
                <TableCell align="right">
                  <strong>{fee.total_fee_rands.toFixed(2)}</strong>
                </TableCell>
                <TableCell>
                  {fee.minimum_age || fee.maximum_age ? (
                    `${fee.minimum_age || 'No min'} - ${fee.maximum_age || 'No max'} years`
                  ) : (
                    'No restrictions'
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={fee.is_active ? 'Active' : 'Inactive'} 
                    color={fee.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => openEditDialog(fee)}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(fee.id)}
                    title="Deactivate"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {fees.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No fee configurations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Fee Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingFee ? 'Edit Fee Configuration' : 'Create Fee Configuration'}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleSave)}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="license_category"
                  control={control}
                  rules={{ required: 'License category is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.license_category}>
                      <InputLabel>License Category</InputLabel>
                      <Select {...field} label="License Category">
                        {licenseCategories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="transaction_type"
                  control={control}
                  rules={{ required: 'Transaction type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.transaction_type}>
                      <InputLabel>Transaction Type</InputLabel>
                      <Select {...field} label="Transaction Type">
                        {transactionTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="application_type"
                  control={control}
                  rules={{ required: 'Application type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.application_type}>
                      <InputLabel>Application Type</InputLabel>
                      <Select {...field} label="Application Type">
                        {applicationTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="base_fee"
                  control={control}
                  rules={{ required: 'Base fee is required', min: 0 }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Base Fee (R)"
                      error={!!errors.base_fee}
                      helperText={errors.base_fee?.message}
                      inputProps={{ step: "0.01", min: "0" }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="processing_fee"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Processing Fee (R)"
                      inputProps={{ step: "0.01", min: "0" }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="delivery_fee"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Delivery Fee (R)"
                      inputProps={{ step: "0.01", min: "0" }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="minimum_age"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Minimum Age"
                      inputProps={{ min: "16", max: "100" }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="maximum_age"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Maximum Age"
                      inputProps={{ min: "16", max: "100" }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="effective_date"
                  control={control}
                  rules={{ required: 'Effective date is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Effective Date"
                      error={!!errors.effective_date}
                      helperText={errors.effective_date?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      placeholder="Optional description or notes about this fee configuration"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {editingFee ? 'Update' : 'Create'} Fee
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default FeeManagement; 