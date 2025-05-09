import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  FormHelperText,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ArrowBack as BackIcon, Save as SaveIcon } from '@mui/icons-material';
import api from '../../api/api';
import { format, addYears } from 'date-fns';

// Define interfaces
interface Citizen {
  id: number;
  id_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
}

interface License {
  id?: number;
  license_number?: string;
  license_class: string;
  category?: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  citizen_id: number;
  restrictions?: string;
  medical_conditions?: string;
  file_url?: string;
  barcode_data?: string;
}

// Form validation schema
const schema = yup.object({
  license_number: yup.string().required('License number is required'),
  license_class: yup.string().required('License class is required'),
  issue_date: yup.string().required('Issue date is required'),
  expiry_date: yup.string().required('Expiry date is required')
    .test('is-after-issue-date', 'Expiry date must be after issue date', 
      function(value) {
        const { issue_date } = this.parent;
        return !issue_date || !value || new Date(value) > new Date(issue_date);
      }),
  status: yup.string().required('Status is required'),
  citizen_id: yup.number()
    .required('Citizen is required')
    .test('is-valid-citizen', 'Please select a valid citizen', value => value > 0),
  restrictions: yup.string(),
}).required();

// Default values for the form
const defaultValues: License = {
  license_class: 'B',
  issue_date: format(new Date(), 'yyyy-MM-dd'),
  expiry_date: format(addYears(new Date(), 5), 'yyyy-MM-dd'),
  status: 'active',
  citizen_id: 0,
  restrictions: '',
  license_number: '' // Empty string by default
};

const LicenseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [fetchingLicense, setFetchingLicense] = useState(isEditMode);
  const [error, setError] = useState('');
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [generatingNumber, setGeneratingNumber] = useState(false);
  
  // Initialize form
  const { control, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<License>({
    resolver: yupResolver(schema),
    defaultValues: defaultValues
  });
  
  // Watch values for dependencies
  const watchLicenseClass = watch('license_class');
  const watchIssueDate = watch('issue_date');
  
  // Set expiry date based on license class and issue date
  useEffect(() => {
    if (watchIssueDate) {
      const issueDate = new Date(watchIssueDate);
      let expiryYears = 5; // Default validity period
      
      // Different validity periods based on license class
      switch (watchLicenseClass) {
        case 'A':
          expiryYears = 10;
          break;
        case 'C':
        case 'EC':
          expiryYears = 3;
          break;
        default:
          expiryYears = 5;
      }
      
      const expiryDate = addYears(issueDate, expiryYears);
      setValue('expiry_date', format(expiryDate, 'yyyy-MM-dd'));
    }
  }, [watchLicenseClass, watchIssueDate, setValue]);
  
  // Load existing license if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchLicense = async () => {
        setFetchingLicense(true);
        try {
          const response = await api.get(`/licenses/${id}`);
          const licenseData = response.data;
          
          // Format dates properly
          licenseData.issue_date = licenseData.issue_date.split('T')[0];
          licenseData.expiry_date = licenseData.expiry_date.split('T')[0];
          
          // Set form values
          reset(licenseData);
          
          // Fetch citizen details
          if (licenseData.citizen_id) {
            console.log(`Fetching citizen details for ID: ${licenseData.citizen_id}`);
            try {
              const citizenResponse = await api.get(`/citizens/${licenseData.citizen_id}`);
              console.log('Found citizen for license:', citizenResponse.data);
              setSelectedCitizen(citizenResponse.data);
              setValue('citizen_id', citizenResponse.data.id);
            } catch (error) {
              console.error('Error fetching citizen:', error);
              setError('Could not fetch citizen data. The license may be associated with a deleted citizen.');
            }
          }
        } catch (error: any) {
          console.error('Error fetching license:', error);
          setError(error.response?.data?.detail || 'Failed to load license data.');
        } finally {
          setFetchingLicense(false);
        }
      };
      
      fetchLicense();
    }
  }, [id, isEditMode, reset, setValue]);
  
  // Load citizens for autocomplete
  useEffect(() => {
    const fetchCitizens = async () => {
      if (!searchTerm || searchTerm.length < 3) return;
      
      try {
        // Search citizens by name or ID number
        const params: Record<string, any> = {};
        
        // If search term is numeric, search by ID
        if (/^\d+$/.test(searchTerm)) {
          params.id_number = searchTerm;
        } else {
          // Otherwise search by name
          params.search = searchTerm;
        }
        
        const response = await api.get('/citizens/search', { params });
        setCitizens(response.data);
      } catch (error: any) {
        console.error('Error searching citizens:', error);
      }
    };
    
    fetchCitizens();
  }, [searchTerm]);
  
  // Handle citizen selection
  const handleCitizenChange = (citizen: Citizen | null) => {
    setSelectedCitizen(citizen);
    if (citizen) {
      console.log('Citizen selected:', citizen);
      setValue('citizen_id', citizen.id);
      // Log the current form values after selection
      console.log('Form values after citizen selection:', watch());
    } else {
      setValue('citizen_id', 0);
    }
  };
  
  // Generate a new license number
  const generateLicenseNumber = async () => {
    setGeneratingNumber(true);
    try {
      const response = await api.get('/licenses/generate-number');
      setValue('license_number', response.data.license_number);
      console.log('License number generated:', response.data.license_number);
    } catch (error: any) {
      console.error('Error generating license number:', error);
      setError(error.response?.data?.detail || 'Failed to generate license number.');
      
      // If we can't generate from API, create a simple random number
      const randomNumber = Math.floor(Math.random() * 10000000).toString();
      const generatedNumber = `LIC-${randomNumber}`;
      console.log('Generating fallback license number:', generatedNumber);
      setValue('license_number', generatedNumber);
    } finally {
      setGeneratingNumber(false);
    }
  };
  
  // Form submission handler
  const onSubmit = async (data: License) => {
    setLoading(true);
    setError('');
    
    // Log form state at submission time
    console.log('Form state at submission:', {
      data,
      selectedCitizen,
      watch: watch(),
      citizenId: data.citizen_id,
      citizens
    });
    
    // Validate citizen_id is not zero
    if (data.citizen_id === 0) {
      setError('Please select a valid citizen');
      setLoading(false);
      return;
    }
    
    // Ensure license number is provided
    if (!data.license_number || data.license_number.trim() === '') {
      setError('License number is required. Please provide a license number or generate one.');
      setLoading(false);
      return;
    }
    
    // Double check valid citizen
    const validCitizen = citizens.find(c => c.id === data.citizen_id);
    if (!validCitizen && data.citizen_id > 0) {
      console.log('Citizen found in form but not in citizens list. Using ID anyway.');
    }
    
    try {
      console.log('Original form data:', data);
      
      // Create API-compatible object
      const submissionData = {
        license_number: data.license_number, // Required field - never undefined
        citizen_id: data.citizen_id,
        category: data.license_class, // API expects category instead of license_class
        issue_date: data.issue_date,
        expiry_date: data.expiry_date,
        status: data.status,
        restrictions: data.restrictions || '',
        medical_conditions: '', // Required by API
        file_url: '',           // Required by API
        barcode_data: ''        // Required by API but will be generated server-side
      };
      
      console.log('Processed submission data:', submissionData);
      
      if (isEditMode) {
        // Update existing license
        console.log(`Updating license with ID: ${id}`);
        const response = await api.put(`/licenses/${id}`, submissionData);
        console.log('Update response:', response.data);
        setLoading(false);
        navigate(`/licenses/${id}`);
      } else {
        // Create new license
        console.log('Creating new license');
        const response = await api.post('/licenses', submissionData);
        console.log('Create response:', response.data);
        setLoading(false);
        navigate(`/licenses/${response.data.id}`);
      }
    } catch (error: any) {
      console.error('Error saving license:', error);
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
          setError('Failed to save license data: ' + error.message);
        }
      } else {
        setError('Failed to save license data: ' + error.message);
      }
      
      setLoading(false);
    }
  };
  
  if (fetchingLicense) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<BackIcon />} 
            onClick={() => navigate('/licenses')}
            sx={{ mr: 2 }}
          >
            Back to Licenses
          </Button>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit License' : 'New License'}
          </Typography>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  License Information
                </Typography>
                
                {/* License Number */}
                <Box sx={{ mb: 2 }}>
                  <Controller
                    name="license_number"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="License Number *"
                        variant="outlined"
                        fullWidth
                        disabled={isEditMode}
                        error={!!errors.license_number}
                        helperText={errors.license_number?.message || (isEditMode ? "License number can't be changed" : "Required field")}
                        InputProps={{
                          endAdornment: !isEditMode && (
                            <Button 
                              onClick={generateLicenseNumber}
                              disabled={generatingNumber}
                              variant="contained"
                              color="primary"
                              sx={{ ml: 1 }}
                            >
                              {generatingNumber ? <CircularProgress size={24} /> : 'Generate Number'}
                            </Button>
                          )
                        }}
                      />
                    )}
                  />
                  {!isEditMode && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      License number is required. You can enter one manually or click "Generate Number".
                    </Typography>
                  )}
                </Box>
                
                {/* License Class */}
                <Box sx={{ mb: 2 }}>
                  <Controller
                    name="license_class"
                    control={control}
                    render={({ field }) => (
                      <FormControl 
                        fullWidth 
                        error={!!errors.license_class}
                      >
                        <InputLabel id="license-class-label">License Class</InputLabel>
                        <Select
                          {...field}
                          labelId="license-class-label"
                          label="License Class"
                        >
                          <MenuItem value="A">A - Motorcycle</MenuItem>
                          <MenuItem value="B">B - Light vehicle (car)</MenuItem>
                          <MenuItem value="C">C - Heavy vehicle (truck)</MenuItem>
                          <MenuItem value="EB">EB - Light articulated vehicle</MenuItem>
                          <MenuItem value="EC">EC - Heavy articulated vehicle</MenuItem>
                        </Select>
                        {errors.license_class && (
                          <FormHelperText>{errors.license_class.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Box>
                
                {/* License Status */}
                <Box sx={{ mb: 2 }}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <FormControl 
                        fullWidth 
                        error={!!errors.status}
                      >
                        <InputLabel id="status-label">Status</InputLabel>
                        <Select
                          {...field}
                          labelId="status-label"
                          label="Status"
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="suspended">Suspended</MenuItem>
                          <MenuItem value="revoked">Revoked</MenuItem>
                          <MenuItem value="expired">Expired</MenuItem>
                        </Select>
                        {errors.status && (
                          <FormHelperText>{errors.status.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Box>
                
                {/* Restrictions */}
                <Box sx={{ mb: 2 }}>
                  <Controller
                    name="restrictions"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Restrictions"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Any restrictions or conditions (e.g., must wear glasses)"
                        error={!!errors.restrictions}
                        helperText={errors.restrictions?.message}
                      />
                    )}
                  />
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Validity & Citizen Information
                </Typography>
                
                {/* Issue Date */}
                <Box sx={{ mb: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Controller
                      name="issue_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          label="Issue Date"
                          value={field.value ? new Date(field.value) : null}
                          onChange={(date) => {
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: 'outlined',
                              error: !!errors.issue_date,
                              helperText: errors.issue_date?.message,
                            },
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Box>
                
                {/* Expiry Date */}
                <Box sx={{ mb: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Controller
                      name="expiry_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          label="Expiry Date"
                          value={field.value ? new Date(field.value) : null}
                          onChange={(date) => {
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: 'outlined',
                              error: !!errors.expiry_date,
                              helperText: errors.expiry_date?.message,
                            },
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Box>
                
                {/* Citizen Lookup */}
                <Box sx={{ mb: 2 }}>
                  <Autocomplete
                    id="citizen-autocomplete"
                    options={citizens}
                    value={selectedCitizen}
                    onChange={(_, newValue) => {
                      console.log('Citizen selected from dropdown:', newValue);
                      handleCitizenChange(newValue);
                    }}
                    getOptionLabel={(option) => 
                      `${option.id_number} - ${option.first_name} ${option.last_name}`
                    }
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Citizen" 
                        placeholder="Search by ID number or name"
                        error={!!errors.citizen_id}
                        helperText={errors.citizen_id?.message || "Type at least 3 characters to search"}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body1">
                            {`${option.first_name} ${option.last_name}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {option.id_number}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    disabled={isEditMode}
                  />
                  {isEditMode && selectedCitizen && (
                    <Chip
                      label={`${selectedCitizen.id_number} - ${selectedCitizen.first_name} ${selectedCitizen.last_name}`}
                      sx={{ mt: 1 }}
                    />
                  )}
                  <Controller
                    name="citizen_id"
                    control={control}
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />
                </Box>
                
                {/* Submit Button */}
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update License' : 'Create License')}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default LicenseForm; 