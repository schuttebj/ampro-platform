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
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Card,
  CardContent,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Save as SaveIcon,
  Send as SendIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import api from '../../api/api';
import { SectionB, SectionC, SectionD } from './ApplicationSections';

// Interfaces
interface CitizenData {
  id?: number;
  id_number: string;
  identification_type: string;
  country_of_issue?: string;
  nationality?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  initials?: string;
  date_of_birth: string;
  gender: string;
  marital_status?: string;
  official_language?: string;
  email?: string;
  phone_home?: string;
  phone_daytime?: string;
  phone_cell?: string;
  fax_number?: string;
  postal_suburb?: string;
  postal_city?: string;
  postal_code?: string;
  street_address?: string;
  street_suburb?: string;
  street_city?: string;
  street_postal_code?: string;
  preferred_address_type?: string;
}

interface ApplicationFormData {
  citizen_id: number;
  applied_category: string;
  application_type: string;
  transaction_type: string;
  // Section A
  photograph_attached: boolean;
  photograph_count: number;
  // Section B
  previous_license_refusal: boolean;
  refusal_details?: string;
  // Section C
  card_notice_status?: string;
  police_report_station?: string;
  police_report_cas_number?: string;
  office_of_issue?: string;
  card_status_change_date?: string;
  // Section D - Legal declarations
  not_disqualified: boolean;
  not_suspended: boolean;
  not_cancelled: boolean;
  // Medical declarations
  no_uncontrolled_epilepsy: boolean;
  no_sudden_fainting: boolean;
  no_mental_illness: boolean;
  no_muscular_incoordination: boolean;
  no_uncontrolled_diabetes: boolean;
  no_defective_vision: boolean;
  no_unsafe_disability: boolean;
  no_narcotic_addiction: boolean;
  no_alcohol_addiction: boolean;
  medically_fit: boolean;
  // Declaration completion
  information_true_correct: boolean;
  applicant_signature_date?: string;
}

// Transaction types and their required sections
const transactionTypeConfig = {
  'DRIVING_LICENCE': { sections: ['A', 'B', 'D'], label: 'Driving licence' },
  'GOVT_DEPT_LICENCE': { sections: ['A', 'B', 'D'], label: 'Government Department licence' },
  'FOREIGN_REPLACEMENT': { sections: ['A', 'B', 'D'], label: 'Replacement of foreign driving licence' },
  'ID_PAPER_REPLACEMENT': { sections: ['A', 'B', 'D'], label: 'Replacement from ID document/paper card' },
  'TEMPORARY_LICENCE': { sections: ['A', 'B', 'D'], label: 'Temporary driving licence' },
  'NEW_LICENCE_CARD': { sections: ['A', 'C', 'D'], label: 'New licence card / Duplicate' },
  'CHANGE_PARTICULARS': { sections: ['A', 'D'], label: 'Change of particulars (ID, name, address)' },
  'CHANGE_LICENCE_DOC': { sections: ['A', 'C', 'D'], label: 'Change of licence document' }
};

// License categories with descriptions
const licenseCategories = [
  { value: 'A1', label: 'A1 - Motorcycle ≤125cm³ (16 years min)', ageMin: 16 },
  { value: 'A', label: 'A - Motorcycle >125cm³' },
  { value: 'B', label: 'B - Light motor vehicle ≤3,500 kg' },
  { value: 'C1', label: 'C1 - Heavy motor vehicle >3,500 kg and ≤16,000 kg' },
  { value: 'C', label: 'C - Extra heavy motor vehicle >16,000 kg' },
  { value: 'EB', label: 'EB - Light articulated vehicle' },
  { value: 'EC1', label: 'EC1 - Heavy articulated vehicle' },
  { value: 'EC', label: 'EC - Extra heavy articulated vehicle' }
];

// Validation schema
const schema = yup.object().shape({
  citizen_id: yup.number().required('Citizen is required'),
  applied_category: yup.string().required('License category is required'),
  application_type: yup.string().required('Application type is required'),
  transaction_type: yup.string().required('Transaction type is required'),
  
  // Section A - Now required
  photograph_attached: yup.boolean().required('Please indicate if photograph is attached'),
  photograph_count: yup.number().min(1, 'At least one photograph is required').required('Number of photographs is required'),
  
  // Section B
  previous_license_refusal: yup.boolean().default(false),
  refusal_details: yup.string().optional(),
  
  // Section C
  card_notice_status: yup.string().optional(),
  police_report_station: yup.string().optional(),
  police_report_cas_number: yup.string().optional(),
  office_of_issue: yup.string().optional(),
  card_status_change_date: yup.string().optional(),
  
  // Section D - Legal declarations
  not_disqualified: yup.boolean().default(false),
  not_suspended: yup.boolean().default(false),
  not_cancelled: yup.boolean().default(false),
  
  // Medical declarations
  no_uncontrolled_epilepsy: yup.boolean().default(false),
  no_sudden_fainting: yup.boolean().default(false),
  no_mental_illness: yup.boolean().default(false),
  no_muscular_incoordination: yup.boolean().default(false),
  no_uncontrolled_diabetes: yup.boolean().default(false),
  no_defective_vision: yup.boolean().default(false),
  no_unsafe_disability: yup.boolean().default(false),
  no_narcotic_addiction: yup.boolean().default(false),
  no_alcohol_addiction: yup.boolean().default(false),
  medically_fit: yup.boolean().default(false),
  
  // Declaration completion
  information_true_correct: yup.boolean().default(false),
  applicant_signature_date: yup.string().optional()
});

const EnhancedApplicationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCitizenSearch, setShowCitizenSearch] = useState(false);
  const [showNewCitizenForm, setShowNewCitizenForm] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [citizenSearchTerm, setCitizenSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CitizenData[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenData | null>(null);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [feeInfo, setFeeInfo] = useState<any>(null);
  const [requiredSections, setRequiredSections] = useState<string[]>(['A', 'B', 'C', 'D']);
  
  // New citizen form state
  const [newCitizenData, setNewCitizenData] = useState({
    id_number: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    contact_number: '',
    email: '',
    address: ''
  });

  const isEditMode = !!id;

  // Form setup
  const { 
    control, 
    handleSubmit, 
    watch,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm<ApplicationFormData>({
    resolver: yupResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      citizen_id: 0,
      applied_category: '',
      application_type: 'new',
      transaction_type: 'driving_licence',
      photograph_attached: true,
      photograph_count: 3,
      previous_license_refusal: false,
      not_disqualified: false,
      not_suspended: false,
      not_cancelled: false,
      no_uncontrolled_epilepsy: false,
      no_sudden_fainting: false,
      no_mental_illness: false,
      no_muscular_incoordination: false,
      no_uncontrolled_diabetes: false,
      no_defective_vision: false,
      no_unsafe_disability: false,
      no_narcotic_addiction: false,
      no_alcohol_addiction: false,
      medically_fit: false,
      information_true_correct: false
    }
  });

  const watchedValues = watch();

  // Check for citizen parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const citizenId = urlParams.get('citizen');
    
    if (citizenId && !isEditMode) {
      // Pre-load citizen data
      loadCitizenById(citizenId);
    }
  }, []);

  // Helper function to load citizen by ID
  const loadCitizenById = async (citizenId: string) => {
    try {
      const response = await api.get(`/citizens/${citizenId}`);
      const citizen = response.data;
      setSelectedCitizen(citizen);
      setValue('citizen_id', citizen.id || 0);
    } catch (error: any) {
      console.error('Failed to load citizen:', error);
      setError('Failed to load citizen data. Please search and select manually.');
    }
  };

  // Update required sections when transaction type changes
  useEffect(() => {
    if (watchedValues.transaction_type) {
      const config = transactionTypeConfig[watchedValues.transaction_type as keyof typeof transactionTypeConfig];
      if (config) {
        setRequiredSections(config.sections);
      }
    }
  }, [watchedValues.transaction_type]);

  // Tab configuration
  const tabs = [
    { label: 'Section A - Applicant Details', icon: <PersonIcon />, section: 'A' },
    { label: 'Section B - Vehicle Class', icon: <AssignmentIcon />, section: 'B' },
    { label: 'Section C - Card Status', icon: <DescriptionIcon />, section: 'C' },
    { label: 'Section D - Declaration', icon: <GavelIcon />, section: 'D' }
  ].filter(tab => requiredSections.includes(tab.section));

  // Load application data if editing
  useEffect(() => {
    if (isEditMode) {
      loadApplication();
    }
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/applications/${id}`);
      const appData = response.data;
      setApplicationData(appData);
      
      // Set form values
      Object.keys(appData).forEach(key => {
        if (key in watchedValues) {
          setValue(key as keyof ApplicationFormData, appData[key]);
        }
      });

      if (appData.citizen) {
        setSelectedCitizen(appData.citizen);
      }
    } catch (error: any) {
      setError('Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  const searchCitizens = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return;

    try {
      setSearchLoading(true);
      setSearchCompleted(false);
      setShowNewCitizenForm(false); // Hide new citizen form while searching
      
      const response = await api.get('/citizens/search', {
        params: { q: searchTerm, limit: 10 }
      });
      setSearchResults(response.data);
      setSearchCompleted(true);
      
      // Only show new citizen form AFTER search completes with no results
      if (response.data.length === 0) {
        setShowNewCitizenForm(true);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setError('Failed to search citizens');
      setSearchCompleted(true);
    } finally {
      setSearchLoading(false);
    }
  };

  // Manual search function for search button
  const handleManualSearch = () => {
    if (citizenSearchTerm.trim()) {
      searchCitizens(citizenSearchTerm.trim());
      setShowCitizenSearch(true);
    }
  };

  // Clear search function
  const clearSearch = () => {
    setCitizenSearchTerm('');
    setSearchResults([]);
    setShowCitizenSearch(false);
    setShowNewCitizenForm(false);
    setSearchCompleted(false);
  };

  const handleCitizenSelect = (citizen: CitizenData) => {
    setSelectedCitizen(citizen);
    setValue('citizen_id', citizen.id || 0);
    setShowCitizenSearch(false);
    setSearchResults([]);
    setCitizenSearchTerm('');
    setShowNewCitizenForm(false);
    setSearchCompleted(false);
    setSuccess(`Selected citizen: ${citizen.first_name} ${citizen.last_name}`);
  };

  const createNewCitizen = async () => {
    try {
      setLoading(true);
      const response = await api.post('/citizens/', newCitizenData);
      const newCitizen = response.data;
      
      // Automatically select the newly created citizen
      setSelectedCitizen(newCitizen);
      setValue('citizen_id', newCitizen.id || 0);
      
      // Reset forms
      setShowNewCitizenForm(false);
      setShowCitizenSearch(false);
      setCitizenSearchTerm('');
      setNewCitizenData({
        id_number: '',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        contact_number: '',
        email: '',
        address: ''
      });
      
      setSuccess('New citizen created and selected successfully!');
    } catch (error: any) {
      setError('Failed to create citizen: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateFee = async () => {
    if (!selectedCitizen || !watchedValues.applied_category || !watchedValues.transaction_type || !watchedValues.application_type) {
      return;
    }

    try {
      // Calculate age
      const birthDate = new Date(selectedCitizen.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear() - 
        (today.getMonth() < birthDate.getMonth() || 
         (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

      const response = await api.get('/fees/calculate', {
        params: {
          license_category: watchedValues.applied_category,
          transaction_type: watchedValues.transaction_type,
          application_type: watchedValues.application_type,
          applicant_age: age
        }
      });
      setFeeInfo(response.data);
    } catch (error: any) {
      console.log('Fee calculation not available:', error.response?.data?.detail);
    }
  };

  // Calculate fee when relevant fields change
  useEffect(() => {
    calculateFee();
  }, [selectedCitizen, watchedValues.applied_category, watchedValues.transaction_type, watchedValues.application_type]);

  const saveDraft = async (data: ApplicationFormData) => {
    try {
      setLoading(true);
      setError(''); // Clear any existing errors
      
      // Validate essential data
      if (!data.citizen_id || data.citizen_id === 0) {
        setError('Please select a citizen before saving draft');
        return;
      }
      
      if (!data.transaction_type || !data.application_type) {
        setError('Please select transaction type and application type before saving draft');
        return;
      }
      
      console.log('Saving draft with data:', data);
      
      const payload = {
        ...data,
        is_draft: true,
        status: 'applied'
      };

      console.log('Draft payload:', payload);

      if (isEditMode) {
        console.log('Updating existing application:', id);
        const response = await api.put(`/applications/${id}`, payload);
        console.log('Update response:', response.data);
        setSuccess('Draft saved successfully');
      } else {
        console.log('Creating new draft application');
        const response = await api.post('/applications/', payload);
        console.log('Create response:', response.data);
        setApplicationData(response.data);
        setSuccess('Draft created successfully');
        // Don't redirect immediately, let user continue editing
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'An unexpected error occurred';
      setError('Failed to save draft: ' + errorMessage);
      console.error('Save draft error:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const submitApplication = async (data: ApplicationFormData) => {
    try {
      setLoading(true);
      
      // Validate required sections are complete
      if (!data.information_true_correct) {
        setError('Please check the declaration that all information provided is true and correct before submitting');
        setCurrentTab(tabs.length - 1); // Go to declaration tab
        return;
      }

      // Additional validation for declaration section
      if (!data.medically_fit || !data.not_disqualified || !data.not_suspended || !data.not_cancelled) {
        setError('Please complete all required declarations in Section D before submitting');
        setCurrentTab(tabs.length - 1); // Go to declaration tab
        return;
      }

      if (isEditMode && applicationData) {
        // Submit existing draft
        await api.post(`/applications/${applicationData.id}/submit`);
        setSuccess('Application submitted successfully! Redirecting to payment...');
        
        setTimeout(() => {
          navigate(`/applications/${applicationData.id}/payment`);
        }, 2000);
      } else {
        // Create and submit new application
        const createResponse = await api.post('/applications/', {
          ...data,
          is_draft: false,
          status: 'submitted'
        });
        
        await api.post(`/applications/${createResponse.data.id}/submit`);
        setSuccess('Application submitted successfully! Redirecting to payment...');
        
        setTimeout(() => {
          navigate(`/applications/${createResponse.data.id}/payment`);
        }, 2000);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'An unexpected error occurred';
      setError('Failed to submit application: ' + errorMessage);
      console.error('Submit application error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (event: React.SyntheticEvent, newValue: number) => {
    // Auto-save when changing tabs
    if (selectedCitizen && isValid) {
      const data = { ...watchedValues, citizen_id: selectedCitizen.id || 0 } as ApplicationFormData;
      await saveDraft(data);
    }
    setCurrentTab(newValue);
  };

  const isTabComplete = (section: string): boolean => {
    switch (section) {
      case 'A':
        return !!selectedCitizen && 
               !!watchedValues.citizen_id && 
               !!watchedValues.photograph_attached && 
               !!watchedValues.photograph_count && 
               watchedValues.photograph_count >= 3;
      case 'B':
        return !!watchedValues.applied_category;
      case 'C':
        return requiredSections.includes('C') ? !!watchedValues.card_notice_status : true;
      case 'D':
        return watchedValues.information_true_correct === true && 
               watchedValues.medically_fit === true &&
               watchedValues.not_disqualified === true &&
               watchedValues.not_suspended === true &&
               watchedValues.not_cancelled === true;
      default:
        return false;
    }
  };

  if (loading && !applicationData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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
          {isEditMode ? 'Edit License Application' : 'New License Application'}
        </Typography>

        {applicationData && (
          <Box mb={2}>
            <Chip 
              label={`Status: ${applicationData.status}`} 
              color={applicationData.status === 'applied' ? 'warning' : 'primary'}
              sx={{ mr: 1 }}
            />
            {applicationData.is_draft && (
              <Chip label="Draft" color="secondary" />
            )}
          </Box>
        )}

        {feeInfo && (
          <Card sx={{ mb: 2, bgcolor: 'info.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fee Information
              </Typography>
              <Typography>
                Total Fee: R{feeInfo.total_fee_rands} (Base: R{feeInfo.fee_breakdown?.base_fee_rands || 0} + 
                Processing: R{feeInfo.fee_breakdown?.processing_fee_rands || 0} + 
                Delivery: R{feeInfo.fee_breakdown?.delivery_fee_rands || 0})
              </Typography>
            </CardContent>
          </Card>
        )}

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

      <Paper sx={{ p: 3 }}>
        {/* Progress Stepper */}
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 4 }}>
          {tabs.map((tab, index) => (
            <Tab 
              key={tab.section}
              icon={
                isTabComplete(tab.section) ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  tab.icon
                )
              }
              label={tab.label}
              sx={{ 
                color: isTabComplete(tab.section) ? 'success.main' : 'inherit',
                fontWeight: isTabComplete(tab.section) ? 'bold' : 'normal'
              }}
            />
          ))}
        </Tabs>

        <form>
          {/* Transaction Type Selection - Always visible */}
          <Box mb={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="transaction_type"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.transaction_type}>
                      <InputLabel>Transaction Type *</InputLabel>
                      <Select {...field} label="Transaction Type *">
                        {Object.entries(transactionTypeConfig).map(([value, config]) => (
                          <MenuItem key={value} value={value}>
                            {config.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.transaction_type && (
                        <FormHelperText>{errors.transaction_type.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="application_type"
                  control={control}
                  defaultValue="new"
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.application_type}>
                      <InputLabel>Application Type *</InputLabel>
                      <Select {...field} label="Application Type *">
                        <MenuItem value="new">New License</MenuItem>
                        <MenuItem value="renewal">License Renewal</MenuItem>
                        <MenuItem value="replacement">Replacement</MenuItem>
                        <MenuItem value="upgrade">Category Upgrade</MenuItem>
                        <MenuItem value="conversion">Foreign License Conversion</MenuItem>
                      </Select>
                      {errors.application_type && (
                        <FormHelperText>{errors.application_type.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Section A - Applicant Details */}
          {currentTab === 0 && tabs[0] && tabs[0].section === 'A' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Section A: Applicant Details
              </Typography>
              
              <Box mb={3}>
                {!selectedCitizen ? (
                  <Box>
                    <Box display="flex" gap={1} alignItems="flex-end" mb={2}>
                      <TextField
                        fullWidth
                        label="Search for Citizen by ID Number or Name"
                        value={citizenSearchTerm}
                        onChange={(e) => {
                          setCitizenSearchTerm(e.target.value);
                          // Don't trigger search on change anymore
                        }}
                        placeholder="Enter ID number or name to search..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleManualSearch();
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleManualSearch}
                        disabled={!citizenSearchTerm.trim() || searchLoading}
                        sx={{ minWidth: '100px', height: '56px' }}
                      >
                        {searchLoading ? <CircularProgress size={20} /> : 'Search'}
                      </Button>
                      {(showCitizenSearch || citizenSearchTerm) && (
                        <Button
                          variant="outlined"
                          onClick={clearSearch}
                          sx={{ minWidth: '80px', height: '56px' }}
                        >
                          Clear
                        </Button>
                      )}
                    </Box>
                    
                    {showCitizenSearch && citizenSearchTerm && (
                      <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Search Results for "{citizenSearchTerm}":
                        </Typography>
                        
                        {searchResults.length > 0 ? (
                          <TableContainer component={Paper} elevation={1} sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>ID Number</TableCell>
                                  <TableCell>Name</TableCell>
                                  <TableCell>Date of Birth</TableCell>
                                  <TableCell>Gender</TableCell>
                                  <TableCell align="center">Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {searchResults.map((citizen) => (
                                  <TableRow 
                                    key={citizen.id}
                                    hover
                                    sx={{ 
                                      cursor: 'pointer',
                                      '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                    onClick={() => handleCitizenSelect(citizen)}
                                  >
                                    <TableCell>{citizen.id_number}</TableCell>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="medium">
                                        {citizen.first_name} {citizen.last_name}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>{new Date(citizen.date_of_birth).toLocaleDateString()}</TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>
                                      {citizen.gender}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCitizenSelect(citizen);
                                        }}
                                      >
                                        Select
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : searchCompleted ? (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            No citizen found matching "{citizenSearchTerm}". 
                            <Button 
                              onClick={() => setShowNewCitizenForm(true)} 
                              sx={{ ml: 1 }}
                              variant="outlined"
                              size="small"
                            >
                              Create New Citizen
                            </Button>
                          </Alert>
                        ) : searchLoading ? (
                          <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              Searching...
                            </Typography>
                          </Box>
                        ) : null}
                      </Box>
                    )}

                    {/* Inline New Citizen Form */}
                    {showNewCitizenForm && (
                      <Box sx={{ border: '2px solid #1976d2', borderRadius: 1, p: 3, mb: 2, bgcolor: 'background.paper' }}>
                        <Typography variant="h6" gutterBottom color="primary">
                          Create New Citizen
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="ID Number *"
                              value={newCitizenData.id_number}
                              onChange={(e) => setNewCitizenData({...newCitizenData, id_number: e.target.value})}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Gender *</InputLabel>
                              <Select
                                value={newCitizenData.gender}
                                onChange={(e) => setNewCitizenData({...newCitizenData, gender: e.target.value})}
                                label="Gender *"
                              >
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="First Name *"
                              value={newCitizenData.first_name}
                              onChange={(e) => setNewCitizenData({...newCitizenData, first_name: e.target.value})}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Last Name *"
                              value={newCitizenData.last_name}
                              onChange={(e) => setNewCitizenData({...newCitizenData, last_name: e.target.value})}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Date of Birth *"
                              type="date"
                              value={newCitizenData.date_of_birth}
                              onChange={(e) => setNewCitizenData({...newCitizenData, date_of_birth: e.target.value})}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Contact Number"
                              value={newCitizenData.contact_number}
                              onChange={(e) => setNewCitizenData({...newCitizenData, contact_number: e.target.value})}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Email"
                              type="email"
                              value={newCitizenData.email}
                              onChange={(e) => setNewCitizenData({...newCitizenData, email: e.target.value})}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Address"
                              value={newCitizenData.address}
                              onChange={(e) => setNewCitizenData({...newCitizenData, address: e.target.value})}
                            />
                          </Grid>
                        </Grid>

                        <Box mt={3} display="flex" gap={2}>
                          <Button
                            variant="contained"
                            onClick={createNewCitizen}
                            disabled={!newCitizenData.id_number || !newCitizenData.first_name || !newCitizenData.last_name || !newCitizenData.date_of_birth || !newCitizenData.gender}
                          >
                            Create Citizen
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setShowNewCitizenForm(false);
                              setNewCitizenData({
                                id_number: '',
                                first_name: '',
                                last_name: '',
                                date_of_birth: '',
                                gender: '',
                                contact_number: '',
                                email: '',
                                address: ''
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1" gutterBottom>
                            Selected Citizen
                          </Typography>
                          <Button 
                            variant="text" 
                            onClick={() => {
                              setSelectedCitizen(null);
                              setValue('citizen_id', 0);
                              setCitizenSearchTerm('');
                              setSearchResults([]);
                              setShowCitizenSearch(false);
                            }}
                            size="small"
                          >
                            Change Citizen
                          </Button>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Name:</strong> {selectedCitizen.first_name} {selectedCitizen.last_name}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>ID Number:</strong> {selectedCitizen.id_number}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Date of Birth:</strong> {selectedCitizen.date_of_birth}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Gender:</strong> {selectedCitizen.gender}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </Box>

              {/* Photograph Requirements - Now prominently placed */}
              {selectedCitizen && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    📸 Photograph Requirements *
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }} color="textSecondary">
                    Please provide information about photographs attached to this application.
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="photograph_count"
                        control={control}
                        defaultValue={3}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.photograph_count}>
                            <InputLabel>Number of Photographs *</InputLabel>
                            <Select {...field} label="Number of Photographs *">
                              <MenuItem value={3}>Three</MenuItem>
                              <MenuItem value={4}>Four</MenuItem>
                            </Select>
                            {errors.photograph_count && (
                              <FormHelperText>{errors.photograph_count.message}</FormHelperText>
                            )}
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="photograph_attached"
                        control={control}
                        defaultValue={true}
                        render={({ field }) => (
                          <FormControl error={!!errors.photograph_attached}>
                            <FormControlLabel
                              control={<Checkbox {...field} checked={field.value} />}
                              label="Photograph attached with lamination strip *"
                            />
                            {errors.photograph_attached && (
                              <FormHelperText>{errors.photograph_attached.message}</FormHelperText>
                            )}
                          </FormControl>
                        )}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}

          {/* Dynamically render sections based on tabs array */}
          {tabs.map((tab, index) => {
            if (currentTab !== index) return null;
            
            switch (tab.section) {
              case 'B':
                return <SectionB key="sectionB" control={control} errors={errors} watch={watch} />;
              case 'C':
                return <SectionC key="sectionC" control={control} errors={errors} watch={watch} />;
              case 'D':
                return <SectionD key="sectionD" control={control} errors={errors} />;
              default:
                return null;
            }
          })}

          {/* Summary Tab */}
          {currentTab === tabs.length && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Application Summary
              </Typography>
              
              {selectedCitizen && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Applicant</Typography>
                    <Typography>{selectedCitizen.first_name} {selectedCitizen.last_name}</Typography>
                    <Typography>ID: {selectedCitizen.id_number}</Typography>
                  </CardContent>
                </Card>
              )}
              
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Application Details</Typography>
                  <Typography>Transaction Type: {transactionTypeConfig[watchedValues.transaction_type as keyof typeof transactionTypeConfig]?.label}</Typography>
                  <Typography>Application Type: {watchedValues.application_type}</Typography>
                  <Typography>License Category: {watchedValues.applied_category}</Typography>
                </CardContent>
              </Card>

              {feeInfo && (
                <Card sx={{ mb: 2, bgcolor: 'success.light' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Fee Summary</Typography>
                    <Typography variant="h5">Total: R{feeInfo.total_fee_rands}</Typography>
                    <Typography>Base Fee: R{feeInfo.fee_breakdown?.base_fee_rands || 0}</Typography>
                    <Typography>Processing Fee: R{feeInfo.fee_breakdown?.processing_fee_rands || 0}</Typography>
                    <Typography>Delivery Fee: R{feeInfo.fee_breakdown?.delivery_fee_rands || 0}</Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </form>

        {/* Action Buttons */}
        <Box mt={4} display="flex" justifyContent="space-between">
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={() => {
                if (selectedCitizen && isValid) {
                  const data = { ...watchedValues, citizen_id: selectedCitizen.id || 0 } as ApplicationFormData;
                  saveDraft(data);
                }
              }}
              startIcon={<SaveIcon />}
              disabled={loading || !selectedCitizen}
            >
              Save Draft
            </Button>
            
            {/* Previous Button */}
            {currentTab > 0 && (
              <Button
                variant="outlined"
                onClick={() => setCurrentTab(currentTab - 1)}
                disabled={loading}
              >
                Previous
              </Button>
            )}
          </Box>

          <Box display="flex" gap={2}>
            {/* Next Button */}
            {currentTab < tabs.length - 1 ? (
              <Button
                variant="contained"
                onClick={() => {
                  // Validate current section before proceeding
                  const currentSection = tabs[currentTab]?.section;
                  if (currentSection && !isTabComplete(currentSection)) {
                    setError(`Please complete section ${currentSection} before proceeding to the next step.`);
                    return;
                  }
                  setCurrentTab(currentTab + 1);
                }}
                disabled={loading || !selectedCitizen}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit(submitApplication)}
                startIcon={<SendIcon />}
                disabled={loading || !selectedCitizen || !isValid || !watchedValues.information_true_correct}
              >
                Submit Application
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default EnhancedApplicationForm; 