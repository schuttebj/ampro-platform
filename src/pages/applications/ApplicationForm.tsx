import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Divider,
  CircularProgress,
  Alert,
  Autocomplete
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import api from '../../api/api';

// Define the application form data interface
interface ApplicationFormData {
  citizen_id: number;
  license_type: string;
  license_class?: string;
  application_date: string;
  notes?: string;
  application_fee?: number;
  payment_status?: string;
}

// Define the citizen interface for the dropdown
interface Citizen {
  id: number;
  id_number: string;
  first_name: string;
  last_name: string;
  full_name?: string; // This will be computed
}

// License type options
const licenseTypes = [
  'Driver',
  'Vehicle',
  'Business',
  'Professional',
  'Recreational'
];

// License classes (for driver's licenses)
const licenseClasses = [
  'A',
  'B',
  'C',
  'D',
  'E'
];

// Payment status options
const paymentStatuses = [
  'paid',
  'pending',
  'waived'
];

// Validation schema
const schema = yup.object({
  citizen_id: yup.number().required('Citizen is required'),
  license_type: yup.string().required('License type is required'),
  license_class: yup.string().when('license_type', (license_type: string | undefined, schema: yup.StringSchema) => {
    return license_type === 'Driver' 
      ? schema.required('License class is required for driver licenses')
      : schema;
  }),
  application_date: yup.string().required('Application date is required'),
  notes: yup.string(),
  application_fee: yup.number().nullable().transform((v) => (isNaN(v) ? null : v)),
  payment_status: yup.string()
}).required();

// Default values for the form
const defaultValues: ApplicationFormData = {
  citizen_id: 0,
  license_type: '',
  license_class: '',
  application_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  notes: '',
  application_fee: undefined,
  payment_status: 'pending'
};

const ApplicationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const isEditMode = !!id;

  const { 
    control, 
    handleSubmit, 
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ApplicationFormData>({
    resolver: yupResolver(schema),
    defaultValues
  });

  // Watch license type to show/hide license class field
  const licenseType = watch('license_type');

  // Fetch all citizens for the dropdown
  useEffect(() => {
    const fetchCitizens = async () => {
      try {
        const response = await api.get('/citizens');
        // Add full name property to each citizen for display in dropdown
        const citizensWithFullName = response.data.map((citizen: Citizen) => ({
          ...citizen,
          full_name: `${citizen.first_name} ${citizen.last_name} (ID: ${citizen.id_number})`
        }));
        setCitizens(citizensWithFullName);
      } catch (error: any) {
        console.error('Error fetching citizens:', error);
        setError('Failed to load citizens. Please try again later.');
      }
    };
    fetchCitizens();
  }, []);

  // Load application data if in edit mode
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setInitialLoading(true);
        setError('');
        
        const response = await api.get(`/applications/${id}`);
        const applicationData = response.data;
        
        // Format the application date
        const formattedData = {
          ...applicationData,
          application_date: applicationData.application_date ? 
            new Date(applicationData.application_date).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0]
        };
        
        reset(formattedData);
        
        // Find the selected citizen for the Autocomplete
        if (applicationData.citizen_id && citizens.length > 0) {
          const citizen = citizens.find((c) => c.id === applicationData.citizen_id);
          if (citizen) {
            setSelectedCitizen(citizen);
          }
        }
      } catch (error: any) {
        console.error('Error fetching application:', error);
        setError(error.response?.data?.detail || 'Failed to load application details.');
      } finally {
        setInitialLoading(false);
      }
    };

    if (isEditMode && id) {
      fetchApplication();
    }
  }, [id, reset, isEditMode, citizens]);

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      setLoading(true);
      setError('');
      
      // Only include license_class if license_type is 'Driver'
      const submissionData = {
        ...data,
        license_class: data.license_type === 'Driver' ? data.license_class : undefined
      };
      
      if (isEditMode) {
        await api.put(`/applications/${id}`, submissionData);
      } else {
        await api.post('/applications', submissionData);
      }
      
      navigate('/applications');
    } catch (error: any) {
      console.error('Error saving application:', error);
      setError(error.response?.data?.detail || 'Failed to save application.');
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/applications')}
        >
          Back to Applications
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Application' : 'New Application'}
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="citizen_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={citizens}
                    getOptionLabel={(option) => option.full_name || ''}
                    value={selectedCitizen}
                    onChange={(_, newValue) => {
                      setSelectedCitizen(newValue);
                      setValue('citizen_id', newValue?.id || 0);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Citizen *"
                        error={!!errors.citizen_id}
                        helperText={errors.citizen_id?.message}
                        disabled={loading}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="license_type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.license_type}>
                    <InputLabel id="license-type-label">License Type *</InputLabel>
                    <Select
                      {...field}
                      labelId="license-type-label"
                      label="License Type *"
                      disabled={loading}
                    >
                      {licenseTypes.map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                    {errors.license_type && (
                      <FormHelperText>{errors.license_type.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            {licenseType === 'Driver' && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="license_class"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.license_class}>
                      <InputLabel id="license-class-label">License Class *</InputLabel>
                      <Select
                        {...field}
                        labelId="license-class-label"
                        label="License Class *"
                        disabled={loading}
                      >
                        {licenseClasses.map((cls) => (
                          <MenuItem key={cls} value={cls}>Class {cls}</MenuItem>
                        ))}
                      </Select>
                      {errors.license_class && (
                        <FormHelperText>{errors.license_class.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <Controller
                name="application_date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Application Date *"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.application_date}
                    helperText={errors.application_date?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="application_fee"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Application Fee"
                    type="number"
                    fullWidth
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    error={!!errors.application_fee}
                    helperText={errors.application_fee?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="payment_status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.payment_status}>
                    <InputLabel id="payment-status-label">Payment Status</InputLabel>
                    <Select
                      {...field}
                      labelId="payment-status-label"
                      label="Payment Status"
                      disabled={loading}
                    >
                      {paymentStatuses.map((status) => (
                        <MenuItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</MenuItem>
                      ))}
                    </Select>
                    {errors.payment_status && (
                      <FormHelperText>{errors.payment_status.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes"
                    fullWidth
                    multiline
                    rows={4}
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/applications')}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ApplicationForm; 