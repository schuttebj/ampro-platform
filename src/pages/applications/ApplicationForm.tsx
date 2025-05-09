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
  applied_category: string;
  status: string;
  application_date: string;
  notes?: string;
  documents_verified?: boolean | null;
  medical_verified?: boolean | null;
  payment_verified?: boolean | null;
  review_notes?: string | null;
}

// Define the citizen interface for the dropdown
interface Citizen {
  id: number;
  id_number: string;
  first_name: string;
  last_name: string;
  full_name?: string; // This will be computed
}

// License category options
const licenseCategories = [
  'A',
  'B',
  'C',
  'D',
  'EB',
  'EC'
];

// Status options
const statusOptions = [
  'submitted',
  'under_review',
  'approved',
  'rejected'
];

// Validation schema
const schema = yup.object({
  citizen_id: yup.number()
    .required('Citizen is required')
    .test('is-valid-citizen', 'Please select a valid citizen', (value) => value > 0),
  applied_category: yup.string().required('License category is required'),
  status: yup.string().required('Status is required'),
  application_date: yup.string().required('Application date is required'),
  notes: yup.string(),
  documents_verified: yup.boolean().nullable(),
  medical_verified: yup.boolean().nullable(),
  payment_verified: yup.boolean().nullable(),
  review_notes: yup.string().nullable()
}).required();

// Default values for the form
const defaultValues: ApplicationFormData = {
  citizen_id: 0,
  applied_category: '',
  status: 'submitted',
  application_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  notes: '',
  documents_verified: null,
  medical_verified: null,
  payment_verified: null,
  review_notes: null
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
    setValue,
    formState: { errors }
  } = useForm<ApplicationFormData>({
    resolver: yupResolver(schema),
    defaultValues
  });

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
      
      // Validate citizen_id is not zero
      if (data.citizen_id === 0) {
        setError('Please select a valid citizen');
        setLoading(false);
        return;
      }
      
      console.log('Submitting application with data:', data);
      
      // Format the date correctly with ISO string
      const formattedDate = new Date(data.application_date);
      const isoDate = formattedDate.toISOString();
      
      // Prepare submission data with all required fields
      const submissionData = {
        citizen_id: data.citizen_id,
        applied_category: data.applied_category,
        status: data.status,
        application_date: isoDate,
        notes: data.notes || '',
        documents_verified: data.documents_verified,
        medical_verified: data.medical_verified,
        payment_verified: data.payment_verified,
        review_notes: data.review_notes
      };
      
      console.log('Processed submission data:', submissionData);
      
      let response;
      
      if (isEditMode) {
        console.log(`Updating application with ID: ${id}`);
        response = await api.put(`/applications/${id}`, submissionData);
        console.log('Update response:', response);
        
        // Navigate to application detail page
        setLoading(false);
        navigate(`/applications/${id}`);
      } else {
        console.log('Creating new application');
        response = await api.post('/applications', submissionData);
        console.log('Create response:', response);
        
        // Check if we're getting a proper API response
        if (response.status !== 200 && response.status !== 201) {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
        
        // Navigate to the new application detail page
        setLoading(false);
        const newApplicationId = response.data.id;
        navigate(`/applications/${newApplicationId}`);
      }
      
      // Add success message
      console.log(`Application ${isEditMode ? 'updated' : 'created'} successfully`);
    } catch (error: any) {
      console.error('Error saving application:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Better error message display from API validation errors
      if (error.response?.data?.detail) {
        try {
          // Handle the array of validation errors from Pydantic
          if (Array.isArray(error.response.data.detail)) {
            const errorMessages = error.response.data.detail.map((err: any) => {
              return `${err.loc[err.loc.length - 1]}: ${err.msg}`;
            });
            setError(errorMessages.join(', '));
          } else {
            setError(error.response.data.detail);
          }
        } catch (parseError) {
          setError(error.response.data.detail);
        }
      } else if (typeof error.response?.data === 'object') {
        // Format validation errors from the API
        const errorMessages = [];
        for (const key in error.response.data) {
          const errorMsg = `${key}: ${error.response.data[key]}`;
          errorMessages.push(errorMsg);
        }
        if (errorMessages.length > 0) {
          setError(errorMessages.join(', '));
        } else {
          setError('Failed to save application data: ' + error.message);
        }
      } else {
        setError('Failed to save application data: ' + error.message);
      }
      
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
                name="applied_category"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.applied_category}>
                    <InputLabel id="applied-category-label">License Category *</InputLabel>
                    <Select
                      {...field}
                      labelId="applied-category-label"
                      label="License Category *"
                      disabled={loading}
                    >
                      {licenseCategories.map((category) => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                    {errors.applied_category && (
                      <FormHelperText>{errors.applied_category.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.status}>
                    <InputLabel id="status-label">Status *</InputLabel>
                    <Select
                      {...field}
                      labelId="status-label"
                      label="Status *"
                      disabled={loading}
                    >
                      {statusOptions.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.status && (
                      <FormHelperText>{errors.status.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
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
                name="documents_verified"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="documents-verified-label">Documents Verified</InputLabel>
                    <Select
                      {...field}
                      labelId="documents-verified-label"
                      label="Documents Verified"
                      disabled={loading}
                      value={field.value === null ? "" : field.value ? "true" : "false"}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? null : value === "true");
                      }}
                    >
                      <MenuItem value="">Not Verified</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="medical_verified"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="medical-verified-label">Medical Verified</InputLabel>
                    <Select
                      {...field}
                      labelId="medical-verified-label"
                      label="Medical Verified"
                      disabled={loading}
                      value={field.value === null ? "" : field.value ? "true" : "false"}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? null : value === "true");
                      }}
                    >
                      <MenuItem value="">Not Verified</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="payment_verified"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="payment-verified-label">Payment Verified</InputLabel>
                    <Select
                      {...field}
                      labelId="payment-verified-label"
                      label="Payment Verified"
                      disabled={loading}
                      value={field.value === null ? "" : field.value ? "true" : "false"}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? null : value === "true");
                      }}
                    >
                      <MenuItem value="">Not Verified</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
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
                    rows={2}
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="review_notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Review Notes"
                    fullWidth
                    multiline
                    rows={2}
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