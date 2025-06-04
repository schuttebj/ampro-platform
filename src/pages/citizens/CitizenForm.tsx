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
import WebcamCapture from '../../components/WebcamCapture';

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
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [photoUploading, setPhotoUploading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CitizenFormData>({
    resolver: yupResolver(schema),
    defaultValues
  });

  const watchedPhotoUrl = watch('photo_url');

  useEffect(() => {
    if (isEdit && id) {
      fetchCitizen(id);
    }
  }, [id, isEdit]);

  const fetchCitizen = async (citizenId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/citizens/${citizenId}`);
      const citizen = response.data;
      
      // Reset form with citizen data
      reset({
        ...citizen,
        date_of_birth: citizen.date_of_birth ? new Date(citizen.date_of_birth).toISOString().split('T')[0] : '',
        is_active: citizen.is_active ?? true
      });
    } catch (err: any) {
      console.error('Error fetching citizen:', err);
      setError(err.response?.data?.detail || 'Failed to fetch citizen data');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (photoUrl: string | null) => {
    if (!photoUrl) {
      setValue('photo_url', '');
      return;
    }

    // If editing an existing citizen, update photo immediately
    if (isEdit && id) {
      try {
        setPhotoUploading(true);
        await api.post(`/citizens/${id}/photo/update`, null, {
          params: { photo_url: photoUrl }
        });
        setValue('photo_url', photoUrl);
        // No automatic navigation - stay on the edit screen
      } catch (err: any) {
        console.error('Error updating photo:', err);
        setError(err.response?.data?.detail || 'Failed to update photo');
      } finally {
        setPhotoUploading(false);
      }
    } else {
      // For new citizens, just set the URL
      setValue('photo_url', photoUrl);
    }
  };

  const onSubmit = async (data: CitizenFormData) => {
    console.log('Form submission started', { isEdit, id, data });
    console.log('Form errors:', errors);
    console.log('Form is valid:', Object.keys(errors).length === 0);
    
    try {
      setLoading(true);
      setError('');

      if (isEdit && id) {
        // Update existing citizen
        console.log('Updating citizen with ID:', id);
        const response = await api.put(`/citizens/${id}`, data);
        console.log('Update response:', response);
      } else {
        // Create new citizen
        console.log('Creating new citizen');
        const response = await api.post('/citizens/', data);
        console.log('Create response:', response);
      }

      console.log('Success - navigating to citizens list');
      navigate('/citizens');
    } catch (err: any) {
      console.error('Error saving citizen:', err);
      setError(err.response?.data?.detail || 'Failed to save citizen');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/citizens')}
          variant="outlined"
        >
          Back to Citizens
        </Button>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Edit Citizen' : 'Add New Citizen'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Personal Information Section */}
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="id_number"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ID Number"
                    fullWidth
                    required
                    disabled={loading || isEdit} // Disable editing ID number
                    error={!!errors.id_number}
                    helperText={errors.id_number?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="first_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    fullWidth
                    required
                    disabled={loading}
                    error={!!errors.first_name}
                    helperText={errors.first_name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="last_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    fullWidth
                    required
                    disabled={loading}
                    error={!!errors.last_name}
                    helperText={errors.last_name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="middle_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Middle Name"
                    fullWidth
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
                    label="Date of Birth"
                    type="date"
                    fullWidth
                    required
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.date_of_birth}
                    helperText={errors.date_of_birth?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.gender}>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      {...field}
                      label="Gender"
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
                    <InputLabel>Marital Status</InputLabel>
                    <Select
                      {...field}
                      label="Marital Status"
                      disabled={loading}
                    >
                      <MenuItem value="">Select Status</MenuItem>
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
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Controller
                name="photo_url"
                control={control}
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={handlePhotoChange}
                    label="Citizen Photo"
                    maxSize={2} // 2MB limit
                    width={150}
                    height={180}
                  />
                )}
              />
              {photoUploading && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Processing photo...
                  </Typography>
                </Box>
              )}
              
              {/* Webcam Capture Option */}
              {isEdit && id && (
                <Box sx={{ mt: 2 }}>
                  <WebcamCapture
                    citizenId={parseInt(id)}
                    onPhotoCapture={handlePhotoChange}
                    disabled={loading || photoUploading}
                  />
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={8}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Photo Options:</strong>
                </Typography>
                <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                  <li><strong>Upload:</strong> Select and upload a photo file from your device</li>
                  {isEdit && <li><strong>Webcam:</strong> Capture a live photo using connected webcam hardware</li>}
                  <li>Use a recent, clear photo of the citizen</li>
                  <li>Photo should be passport-style (head and shoulders)</li>
                  <li>Ensure good lighting and neutral background</li>
                  <li>Maximum file size: 2MB</li>
                  <li>Accepted formats: JPG, PNG</li>
                  <li>Photo will be automatically processed for ISO compliance</li>
                </Typography>
              </Alert>
            </Grid>
          </Grid>

          {/* Contact Information Section */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Contact Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="phone_number"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number"
                    fullWidth
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
                    type="email"
                    fullWidth
                    disabled={loading}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Address Information Section */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Address Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
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
          </Grid>

          {/* Status Section */}
          {isEdit && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Status
              </Typography>
              
              <Grid container spacing={3}>
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
            </>
          )}

          {/* Submit Button */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading || photoUploading}
              size="large"
              onClick={() => {
                console.log('Submit button clicked!');
                console.log('Current form errors:', errors);
                console.log('Form is valid:', Object.keys(errors).length === 0);
                console.log('Loading state:', loading);
                console.log('Photo uploading state:', photoUploading);
              }}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Citizen' : 'Create Citizen'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/citizens')}
              disabled={loading}
              size="large"
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CitizenForm; 