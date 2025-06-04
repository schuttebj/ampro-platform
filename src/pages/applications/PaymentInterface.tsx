import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Money as CashIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import api from '../../api/api';

interface ApplicationData {
  id: number;
  citizen: {
    first_name: string;
    last_name: string;
    id_number: string;
  };
  applied_category: string;
  transaction_type: string;
  application_type: string;
  status: string;
  payment_amount?: number;
}

interface PaymentData {
  id: number;
  payment_reference: string;
  amount: number;
  payment_method: string;
  status: string;
  payment_date?: string;
}

const PaymentInterface: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [feeInfo, setFeeInfo] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false);
  const [existingPayments, setExistingPayments] = useState<PaymentData[]>([]);
  const [paymentCreated, setPaymentCreated] = useState<PaymentData | null>(null);

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: <CashIcon /> },
    { value: 'card', label: 'Credit/Debit Card', icon: <CreditCardIcon /> },
    { value: 'eft', label: 'Electronic Transfer', icon: <BankIcon /> },
    { value: 'cheque', label: 'Bank Cheque', icon: <ReceiptIcon /> }
  ];

  useEffect(() => {
    if (applicationId) {
      loadApplicationData();
      loadExistingPayments();
    }
  }, [applicationId]);

  const loadApplicationData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/applications/${applicationId}`);
      setApplication(response.data);
      
      // Load fee calculation
      await loadFeeCalculation();
    } catch (error: any) {
      setError('Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  const loadFeeCalculation = async () => {
    try {
      const response = await api.get(`/applications/${applicationId}/calculate-fee`);
      setFeeInfo(response.data);
    } catch (error: any) {
      console.log('Fee calculation not available');
    }
  };

  const loadExistingPayments = async () => {
    try {
      const response = await api.get('/payments/', {
        params: { application_id: applicationId }
      });
      setExistingPayments(response.data);
    } catch (error: any) {
      console.log('No existing payments found');
    }
  };

  const createPayment = async () => {
    if (!selectedPaymentMethod || !application) return;

    try {
      setLoading(true);
      const response = await api.post(`/applications/${applicationId}/create-payment`, null, {
        params: { payment_method: selectedPaymentMethod }
      });
      
      setPaymentCreated(response.data);
      setSuccess('Payment created successfully!');
      setPaymentConfirmOpen(false);
      
      // Reload payments
      await loadExistingPayments();
      
    } catch (error: any) {
      setError('Failed to create payment: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const markPaymentAsPaid = async (paymentId: number) => {
    try {
      setLoading(true);
      await api.post(`/payments/${paymentId}/mark-paid`);
      setSuccess('Payment marked as paid successfully!');
      
      // Reload data
      await loadApplicationData();
      await loadExistingPayments();
      
    } catch (error: any) {
      setError('Failed to mark payment as paid: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'paid': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (loading && !application) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!application) {
    return (
      <Box>
        <Alert severity="error">Application not found</Alert>
      </Box>
    );
  }

  const hasUnpaidPayments = existingPayments.some(p => p.status === 'pending');
  const hasPaidPayments = existingPayments.some(p => p.status === 'paid');

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/applications')}
          sx={{ mb: 2 }}
        >
          Back to Applications
        </Button>
        
        <Typography variant="h4" gutterBottom>
          Payment for Application #{application.id}
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
      </Box>

      <Grid container spacing={3}>
        {/* Application Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Details
              </Typography>
              <Typography>
                <strong>Applicant:</strong> {application.citizen.first_name} {application.citizen.last_name}
              </Typography>
              <Typography>
                <strong>ID Number:</strong> {application.citizen.id_number}
              </Typography>
              <Typography>
                <strong>License Category:</strong> {application.applied_category}
              </Typography>
              <Typography>
                <strong>Application Type:</strong> {application.application_type}
              </Typography>
              <Chip 
                label={`Status: ${application.status}`} 
                color={application.status === 'pending_payment' ? 'warning' : 'primary'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Fee Information */}
        <Grid item xs={12} md={6}>
          {feeInfo ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fee Breakdown
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  R{feeInfo.total_fee_rands}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemText primary="Base Fee" secondary={`R${feeInfo.fee_breakdown?.base_fee_rands || 0}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Processing Fee" secondary={`R${feeInfo.fee_breakdown?.processing_fee_rands || 0}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Delivery Fee" secondary={`R${feeInfo.fee_breakdown?.delivery_fee_rands || 0}`} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fee Information
                </Typography>
                <Typography color="textSecondary">
                  Fee calculation not available
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Existing Payments */}
        {existingPayments.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment History
                </Typography>
                {existingPayments.map((payment) => (
                  <Card key={payment.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} md={3}>
                          <Typography variant="subtitle2">Payment Reference</Typography>
                          <Typography>{payment.payment_reference}</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="subtitle2">Amount</Typography>
                          <Typography>R{(payment.amount / 100).toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="subtitle2">Method</Typography>
                          <Typography>{payment.payment_method}</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Chip 
                            label={payment.status} 
                            color={getStatusColor(payment.status)}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          {payment.status === 'pending' && (
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => markPaymentAsPaid(payment.id)}
                              disabled={loading}
                              startIcon={<CheckCircleIcon />}
                            >
                              Mark as Paid
                            </Button>
                          )}
                          {payment.payment_date && (
                            <Typography variant="body2" color="textSecondary">
                              Paid: {new Date(payment.payment_date).toLocaleDateString()}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Payment Actions */}
        {!hasPaidPayments && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Create Payment
                </Typography>
                
                {!hasUnpaidPayments ? (
                  <Box>
                    <Typography sx={{ mb: 3 }}>
                      Select a payment method to create a payment record:
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={selectedPaymentMethod}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        label="Payment Method"
                      >
                        {paymentMethods.map((method) => (
                          <MenuItem key={method.value} value={method.value}>
                            <Box display="flex" alignItems="center">
                              {method.icon}
                              <Box ml={1}>{method.label}</Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => setPaymentConfirmOpen(true)}
                      disabled={!selectedPaymentMethod || loading}
                      startIcon={<PaymentIcon />}
                      fullWidth
                    >
                      Create Payment Record
                    </Button>
                  </Box>
                ) : (
                  <Alert severity="info">
                    A payment record already exists for this application. 
                    Mark the existing payment as paid once payment is received.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {hasPaidPayments && (
          <Grid item xs={12}>
            <Alert severity="success">
              Payment has been completed for this application. 
              The application will now proceed to the review stage.
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentConfirmOpen} onClose={() => setPaymentConfirmOpen(false)}>
        <DialogTitle>Confirm Payment Creation</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            You are about to create a payment record with the following details:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Payment Method" secondary={
                paymentMethods.find(m => m.value === selectedPaymentMethod)?.label
              } />
            </ListItem>
            <ListItem>
              <ListItemText primary="Amount" secondary={
                feeInfo ? `R${feeInfo.total_fee_rands}` : 'Amount to be determined'
              } />
            </ListItem>
            <ListItem>
              <ListItemText primary="Application" secondary={`#${application.id} - ${application.citizen.first_name} ${application.citizen.last_name}`} />
            </ListItem>
          </List>
          <Typography variant="body2" color="textSecondary">
            This will create a payment record that can be marked as paid once payment is received.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentConfirmOpen(false)}>Cancel</Button>
          <Button onClick={createPayment} variant="contained" disabled={loading}>
            Create Payment Record
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentInterface; 