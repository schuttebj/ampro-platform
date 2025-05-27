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
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import api from '../../api/api';
import ImageUpload from '../../components/ImageUpload';

// Define the Citizen type for form
interface CitizenFormData {
  id_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: string;
  marital_status?: string;
  phone_number?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  birth_place?: string;
  nationality?: string;
  photo_url?: string;
  is_active: boolean;
}

// Validation schema
const schema = yup.object({
  id_number: yup.string().required('ID number is required'),
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  middle_name: yup.string(),
  date_of_birth: yup.string().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  marital_status: yup.string(),
  phone_number: yup.string(),
  email: yup.string().email('Must be a valid email'),
  address_line1: yup.string(),
  address_line2: yup.string(),
  city: yup.string(),
  state_province: yup.string(),
  postal_code: yup.string(),
  country: yup.string(),
  birth_place: yup.string(),
  nationality: yup.string(),
  is_active: yup.boolean().default(true)
}).required();

const defaultValues: CitizenFormData = {
  id_number: '',
  first_name: '',
  last_name: '',
  middle_name: '',
  date_of_birth: '',
  gender: '',
  marital_status: '',
  phone_number: '',
  email: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state_province: '',
  postal_code: '',
  country: 'South Africa',
  birth_place: '',
  nationality: '',
  photo_url: '',
  is_active: true
};

const CitizenForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [error, setError] = useState('');
  const isEditMode = !!id;

  const { 
    control, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CitizenFormData>({
    resolver: yupResolver(schema),
    defaultValues
  });

  // Load citizen data if in edit mode
  useEffect(() => {
    const fetchCitizen = async () => {
      try {
        setInitialLoading(true);
        setError('');
        
        const response = await api.get(`/citizens/${id}`);
        // Format date to YYYY-MM-DD for the date input
        const citizen = {
          ...response.data,
          date_of_birth: response.data.date_of_birth ? 
            new Date(response.data.date_of_birth).toISOString().split('T')[0] : 
            ''
        };
        reset(citizen);
      } catch (error: any) {
        console.error('Error fetching citizen:', error);
        setError(error.response?.data?.detail || 'Failed to load citizen details.');
      } finally {
        setInitialLoading(false);
      }
    };

    if (isEditMode) {
      fetchCitizen();
    }
  }, [id, reset, isEditMode]);

  const onSubmit = async (data: CitizenFormData) => {
    try {
      setLoading(true);
      setError('');
      
      if (isEditMode) {
        await api.put(`/citizens/${id}`, data);
      } else {
        await api.post('/citizens', data);
      }
      
      navigate('/citizens');
    } catch (error: any) {
      console.error('Error saving citizen:', error);
      setError(error.response?.data?.detail || 'Failed to save citizen.');
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
          onClick={() => navigate('/citizens')}
        >
          Back to Citizens
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Citizen' : 'New Citizen'}
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Personal Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Controller
                name="id_number"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ID Number *"
                    fullWidth
                    error={!!errors.id_number}
                    helperText={errors.id_number?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="first_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name *"
                    fullWidth
                    error={!!errors.first_name}
                    helperText={errors.first_name?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="last_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name *"
                    fullWidth
                    error={!!errors.last_name}
                    helperText={errors.last_name?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="middle_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Middle Name"
                    fullWidth
                    error={!!errors.middle_name}
                    helperText={errors.middle_name?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="date_of_birth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Date of Birth *"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.date_of_birth}
                    helperText={errors.date_of_birth?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.gender}>
                    <InputLabel id="gender-label">Gender *</InputLabel>
                    <Select
                      {...field}
                      labelId="gender-label"
                      label="Gender *"
                      disabled={loading}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                    {errors.gender && (
                      <FormHelperText>{errors.gender.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="marital_status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="marital-status-label">Marital Status</InputLabel>
                    <Select
                      {...field}
                      labelId="marital-status-label"
                      label="Marital Status"
                      disabled={loading}
                    >
                      <MenuItem value="single">Single</MenuItem>
                      <MenuItem value="married">Married</MenuItem>
                      <MenuItem value="divorced">Divorced</MenuItem>
                      <MenuItem value="widowed">Widowed</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="nationality"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nationality"
                    fullWidth
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="birth_place"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Birth Place"
                    fullWidth
                    disabled={loading}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Photo Upload Section */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Photo
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Controller
                name="photo_url"
                control={control}
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    label="Citizen Photo"
                    maxSize={2} // 2MB limit
                    width={150}
                    height={180}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Photo Guidelines:</strong>
                </Typography>
                <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                  <li>Use a recent, clear photo of the citizen</li>
                  <li>Photo should be passport-style (head and shoulders)</li>
                  <li>Ensure good lighting and neutral background</li>
                  <li>Maximum file size: 2MB</li>
                  <li>Accepted formats: JPG, PNG</li>
                </Typography>
              </Alert>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Contact Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="phone_number"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number"
                    fullWidth
                    error={!!errors.phone_number}
                    helperText={errors.phone_number?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Address
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="address_line1"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address Line 1"
                    fullWidth
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="address_line2"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address Line 2"
                    fullWidth
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="City"
                    fullWidth
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="state_province"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="State/Province"
                    fullWidth
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="postal_code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Postal Code"
                    fullWidth
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Country"
                    fullWidth
                    disabled={loading}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={loading}
                      />
                    }
                    label="Active"
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/citizens')}
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

export default CitizenForm; 