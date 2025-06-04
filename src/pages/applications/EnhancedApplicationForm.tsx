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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip
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
  
  // Section A
  photograph_attached: yup.boolean().default(false),
  photograph_count: yup.number().default(0),
  
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
  const [currentTab, setCurrentTab] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [citizenDialogOpen, setCitizenDialogOpen] = useState(false);
  const [citizenSearchTerm, setCitizenSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CitizenData[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenData | null>(null);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [feeInfo, setFeeInfo] = useState<any>(null);
  const [requiredSections, setRequiredSections] = useState<string[]>(['A', 'B', 'C', 'D']);

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
      photograph_attached: false,
      photograph_count: 0,
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
      const response = await api.get('/citizens/search', {
        params: { q: searchTerm, limit: 10 }
      });
      setSearchResults(response.data);
    } catch (error: any) {
      setError('Failed to search citizens');
    }
  };

  const handleCitizenSelect = (citizen: CitizenData) => {
    setSelectedCitizen(citizen);
    setValue('citizen_id', citizen.id || 0);
    setCitizenDialogOpen(false);
    setSearchResults([]);
    setCitizenSearchTerm('');
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
      
      const payload = {
        ...data,
        is_draft: true,
        status: 'applied'
      };

      if (isEditMode) {
        await api.put(`/applications/${id}`, payload);
        setSuccess('Draft saved successfully');
      } else {
        const response = await api.post('/applications/', payload);
        setApplicationData(response.data);
        navigate(`/applications/edit/${response.data.id}`);
        setSuccess('Draft created successfully');
      }
    } catch (error: any) {
      setError('Failed to save draft: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const submitApplication = async (data: ApplicationFormData) => {
    try {
      setLoading(true);
      
      // Validate required sections are complete
      if (!data.information_true_correct) {
        setError('Please complete the declaration section before submitting');
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
      setError('Failed to submit application: ' + (error.response?.data?.detail || error.message));
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
        return !!selectedCitizen;
      case 'B':
        return !!watchedValues.applied_category;
      case 'C':
        return requiredSections.includes('C') ? !!watchedValues.card_notice_status : true;
      case 'D':
        return watchedValues.information_true_correct || false;
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
          {currentTab === 0 && requiredSections.includes('A') && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Section A: Applicant Details
              </Typography>
              
              <Box mb={3}>
                <Button
                  variant="outlined"
                  onClick={() => setCitizenDialogOpen(true)}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {selectedCitizen ? 
                    `Selected: ${selectedCitizen.first_name} ${selectedCitizen.last_name} (${selectedCitizen.id_number})` :
                    'Search and Select Citizen'
                  }
                </Button>
                
                {selectedCitizen && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Citizen Information
                      </Typography>
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
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="photograph_count"
                    control={control}
                    defaultValue={0}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Number of Photographs</InputLabel>
                        <Select {...field} label="Number of Photographs">
                          <MenuItem value={0}>None</MenuItem>
                          <MenuItem value={3}>Three</MenuItem>
                          <MenuItem value={4}>Four</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="photograph_attached"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Photograph attached with lamination strip"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Section B - Motor Vehicle Class */}
          {currentTab === 1 && requiredSections.includes('B') && (
            <SectionB control={control} errors={errors} watch={watch} />
          )}

          {/* Section C - Card Status */}
          {currentTab === 2 && requiredSections.includes('C') && (
            <SectionC control={control} errors={errors} watch={watch} />
          )}

          {/* Section D - Declaration */}
          {currentTab === 3 && requiredSections.includes('D') && (
            <SectionD control={control} errors={errors} />
          )}

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
          
          <Button
            variant="contained"
            onClick={handleSubmit(submitApplication)}
            startIcon={<SendIcon />}
            disabled={loading || !selectedCitizen || !isValid}
          >
            Submit Application
          </Button>
        </Box>
      </Paper>

      {/* Citizen Search Dialog */}
      <Dialog open={citizenDialogOpen} onClose={() => setCitizenDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Search Citizen</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Search by ID Number or Name"
            value={citizenSearchTerm}
            onChange={(e) => {
              setCitizenSearchTerm(e.target.value);
              searchCitizens(e.target.value);
            }}
            sx={{ mb: 2 }}
          />
          
          {searchResults.map((citizen) => (
            <Card key={citizen.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => handleCitizenSelect(citizen)}>
              <CardContent>
                <Typography variant="h6">
                  {citizen.first_name} {citizen.last_name}
                </Typography>
                <Typography color="textSecondary">
                  ID: {citizen.id_number} | DOB: {citizen.date_of_birth}
                </Typography>
              </CardContent>
            </Card>
          ))}
          
          {citizenSearchTerm && searchResults.length === 0 && (
            <Alert severity="info">
              No citizen found. Would you like to create a new citizen record?
              <Button onClick={() => navigate('/citizens/new')} sx={{ ml: 1 }}>
                Create New Citizen
              </Button>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCitizenDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedApplicationForm; 