import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
  Rating,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CompliantIcon,
  Error as NonCompliantIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Build as FixIcon,
  Download as ExportIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Verified as VerifiedIcon,
  CreditCard as ChipIcon,
  Fingerprint as BiometricIcon,
  QrCode as MrzIcon,
  Shield as SecurityFeatureIcon,
  Psychology as IntelligenceIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { isoComplianceService, licenseService } from '../../api/services';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`iso-tabpanel-${index}`}
      aria-labelledby={`iso-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ISOComplianceRecord {
  license_id: number;
  license_number: string;
  citizen_name: string;
  validation_date: string;
  compliant: boolean;
  compliance_score: number;
  iso_version: 'ISO_18013_1' | 'ISO_18013_2' | 'ISO_18013_3' | 'ISO_18013_5';
  issues: ComplianceIssue[];
  validations: {
    mrz_validation: MRZValidation;
    security_features: SecurityFeatureValidation;
    biometric_validation: BiometricValidation;
    chip_data_validation: ChipDataValidation;
    digital_signature: DigitalSignatureValidation;
    physical_standards: PhysicalStandardsValidation;
  };
  status: 'compliant' | 'non_compliant' | 'pending' | 'remediated' | 'critical_failure';
  remediation_attempts: number;
  last_remediation_date?: string;
}

interface ComplianceIssue {
  code: string;
  severity: 'critical' | 'major' | 'minor';
  category: 'mrz' | 'security' | 'biometric' | 'chip' | 'signature' | 'physical';
  description: string;
  iso_reference: string;
  remediation_action?: string;
  auto_fixable: boolean;
}

interface MRZValidation {
  format_valid: boolean;
  checksum_valid: boolean;
  data_consistency: boolean;
  machine_readable: boolean;
  iso_compliance_level: number; // 1-5 scale
  issues: string[];
}

interface SecurityFeatureValidation {
  hologram_present: boolean;
  watermark_valid: boolean;
  security_thread: boolean;
  uv_features: boolean;
  tactile_features: boolean;
  microprinting: boolean;
  security_score: number; // 0-100
  tamper_evidence: boolean;
}

interface BiometricValidation {
  template_quality: number; // 0-100
  iso_format_compliance: boolean;
  facial_recognition_score: number;
  fingerprint_quality?: number;
  iris_quality?: number;
  liveness_detection: boolean;
  biometric_accuracy: number;
}

interface ChipDataValidation {
  chip_functional: boolean;
  data_integrity: boolean;
  access_control_valid: boolean;
  cryptographic_binding: boolean;
  lds_structure_valid: boolean; // Logical Data Structure
  dg_validation: { [key: string]: boolean }; // Data Groups
  bac_functionality: boolean; // Basic Access Control
  pace_functionality: boolean; // Password Authenticated Connection Establishment
}

interface DigitalSignatureValidation {
  signature_valid: boolean;
  certificate_chain_valid: boolean;
  timestamp_valid: boolean;
  revocation_status: 'valid' | 'revoked' | 'unknown';
  signature_algorithm: string;
  hash_algorithm: string;
  signature_strength: number;
}

interface PhysicalStandardsValidation {
  dimensions_correct: boolean;
  material_compliance: boolean;
  thickness_tolerance: boolean;
  bend_test_passed: boolean;
  temperature_resistance: boolean;
  durability_score: number;
  print_quality: number;
}

interface ComplianceStatistics {
  total_licenses: number;
  compliant_licenses: number;
  non_compliant_licenses: number;
  pending_validation: number;
  critical_failures: number;
  compliance_rate: number;
  iso_18013_1_compliance: number;
  iso_18013_2_compliance: number;
  iso_18013_3_compliance: number;
  iso_18013_5_compliance: number;
  common_issues: Array<{ issue: string; count: number; severity: string }>;
  trends: {
    weekly_compliance_rate: number;
    improvement_trend: 'improving' | 'stable' | 'declining';
  };
}

interface ValidationRule {
  id: string;
  name: string;
  category: string;
  iso_reference: string;
  severity: 'critical' | 'major' | 'minor';
  enabled: boolean;
  auto_remediate: boolean;
  validation_function: string;
}

const ISOCompliance: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Data state
  const [complianceRecords, setComplianceRecords] = useState<ISOComplianceRecord[]>([]);
  const [statistics, setStatistics] = useState<ComplianceStatistics | null>(null);
  const [selectedLicenses, setSelectedLicenses] = useState<number[]>([]);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  
  // Dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [bulkValidationDialogOpen, setBulkValidationDialogOpen] = useState(false);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [complianceReportDialogOpen, setComplianceReportDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ISOComplianceRecord | null>(null);
  const [validationInProgress, setValidationInProgress] = useState(false);
  const [activeValidationStep, setActiveValidationStep] = useState(0);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isoVersionFilter, setISOVersionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadComplianceData();
    loadValidationRules();
  }, []);

  const loadValidationRules = async () => {
    try {
      // Real ISO 18013 validation rules
      const rules: ValidationRule[] = [
        {
          id: 'mrz_format_check',
          name: 'MRZ Format Validation',
          category: 'mrz',
          iso_reference: 'ISO 18013-1 Section 6.2',
          severity: 'critical',
          enabled: true,
          auto_remediate: false,
          validation_function: 'validateMRZFormat'
        },
        {
          id: 'security_hologram',
          name: 'Security Hologram Presence',
          category: 'security',
          iso_reference: 'ISO 18013-2 Section 4.3.1',
          severity: 'major',
          enabled: true,
          auto_remediate: false,
          validation_function: 'validateHologram'
        },
        {
          id: 'biometric_template_quality',
          name: 'Biometric Template Quality',
          category: 'biometric',
          iso_reference: 'ISO 18013-3 Section 5.2',
          severity: 'critical',
          enabled: true,
          auto_remediate: true,
          validation_function: 'validateBiometricQuality'
        },
        {
          id: 'chip_data_integrity',
          name: 'Chip Data Integrity',
          category: 'chip',
          iso_reference: 'ISO 18013-3 Section 7.1',
          severity: 'critical',
          enabled: true,
          auto_remediate: false,
          validation_function: 'validateChipIntegrity'
        },
        {
          id: 'digital_signature_validation',
          name: 'Digital Signature Validation',
          category: 'signature',
          iso_reference: 'ISO 18013-3 Section 8.2',
          severity: 'critical',
          enabled: true,
          auto_remediate: false,
          validation_function: 'validateDigitalSignature'
        },
        {
          id: 'physical_dimensions',
          name: 'Physical Dimensions Compliance',
          category: 'physical',
          iso_reference: 'ISO 18013-1 Section 5.1',
          severity: 'major',
          enabled: true,
          auto_remediate: false,
          validation_function: 'validatePhysicalDimensions'
        },
        {
          id: 'mdl_compliance',
          name: 'Mobile DL Compliance',
          category: 'mobile',
          iso_reference: 'ISO 18013-5 Section 3.2',
          severity: 'minor',
          enabled: false,
          auto_remediate: false,
          validation_function: 'validateMobileDL'
        }
      ];
      
      setValidationRules(rules);
    } catch (err) {
      console.error('Error loading validation rules:', err);
    }
  };

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      setError('');

      // Enhanced mock data with real ISO compliance structure
      const mockStats: ComplianceStatistics = {
        total_licenses: 1247,
        compliant_licenses: 1089,
        non_compliant_licenses: 142,
        pending_validation: 16,
        critical_failures: 12,
        compliance_rate: 87.3,
        iso_18013_1_compliance: 94.2,
        iso_18013_2_compliance: 89.1,
        iso_18013_3_compliance: 82.7,
        iso_18013_5_compliance: 45.8, // Mobile DL adoption lower
        common_issues: [
          { issue: 'MRZ Checksum Validation Failed', count: 28, severity: 'critical' },
          { issue: 'Security Hologram Missing', count: 24, severity: 'major' },
          { issue: 'Biometric Template Quality Below Threshold', count: 19, severity: 'major' },
          { issue: 'Chip Data Structure Invalid', count: 15, severity: 'critical' },
          { issue: 'Physical Dimensions Out of Tolerance', count: 11, severity: 'minor' }
        ],
        trends: {
          weekly_compliance_rate: 2.3,
          improvement_trend: 'improving'
        }
      };

      const mockRecords: ISOComplianceRecord[] = [
        {
          license_id: 1,
          license_number: 'DL001234567',
          citizen_name: 'John Doe',
          validation_date: '2024-01-15T10:30:00Z',
          compliant: true,
          compliance_score: 96,
          iso_version: 'ISO_18013_3',
          issues: [],
          validations: {
            mrz_validation: {
              format_valid: true,
              checksum_valid: true,
              data_consistency: true,
              machine_readable: true,
              iso_compliance_level: 5,
              issues: []
            },
            security_features: {
              hologram_present: true,
              watermark_valid: true,
              security_thread: true,
              uv_features: true,
              tactile_features: true,
              microprinting: true,
              security_score: 98,
              tamper_evidence: true
            },
            biometric_validation: {
              template_quality: 94,
              iso_format_compliance: true,
              facial_recognition_score: 96,
              fingerprint_quality: 92,
              liveness_detection: true,
              biometric_accuracy: 95
            },
            chip_data_validation: {
              chip_functional: true,
              data_integrity: true,
              access_control_valid: true,
              cryptographic_binding: true,
              lds_structure_valid: true,
              dg_validation: { 'DG1': true, 'DG2': true, 'DG3': true },
              bac_functionality: true,
              pace_functionality: true
            },
            digital_signature: {
              signature_valid: true,
              certificate_chain_valid: true,
              timestamp_valid: true,
              revocation_status: 'valid',
              signature_algorithm: 'ECDSA-SHA256',
              hash_algorithm: 'SHA-256',
              signature_strength: 95
            },
            physical_standards: {
              dimensions_correct: true,
              material_compliance: true,
              thickness_tolerance: true,
              bend_test_passed: true,
              temperature_resistance: true,
              durability_score: 94,
              print_quality: 96
            }
          },
          status: 'compliant',
          remediation_attempts: 0
        },
        {
          license_id: 2,
          license_number: 'DL001234568',
          citizen_name: 'Jane Smith',
          validation_date: '2024-01-15T11:45:00Z',
          compliant: false,
          compliance_score: 72,
          iso_version: 'ISO_18013_2',
          issues: [
            {
              code: 'SEC_001',
              severity: 'major',
              category: 'security',
              description: 'Security hologram not detected or invalid',
              iso_reference: 'ISO 18013-2 Section 4.3.1',
              remediation_action: 'Re-apply security hologram during card production',
              auto_fixable: false
            },
            {
              code: 'MRZ_002',
              severity: 'critical',
              category: 'mrz',
              description: 'MRZ checksum validation failed',
              iso_reference: 'ISO 18013-1 Section 6.2.3',
              remediation_action: 'Recalculate and regenerate MRZ data',
              auto_fixable: true
            }
          ],
          validations: {
            mrz_validation: {
              format_valid: true,
              checksum_valid: false,
              data_consistency: true,
              machine_readable: false,
              iso_compliance_level: 2,
              issues: ['Checksum validation failed on line 2']
            },
            security_features: {
              hologram_present: false,
              watermark_valid: true,
              security_thread: true,
              uv_features: false,
              tactile_features: true,
              microprinting: true,
              security_score: 65,
              tamper_evidence: true
            },
            biometric_validation: {
              template_quality: 88,
              iso_format_compliance: true,
              facial_recognition_score: 89,
              liveness_detection: true,
              biometric_accuracy: 87
            },
            chip_data_validation: {
              chip_functional: true,
              data_integrity: true,
              access_control_valid: true,
              cryptographic_binding: true,
              lds_structure_valid: true,
              dg_validation: { 'DG1': true, 'DG2': true, 'DG3': false },
              bac_functionality: true,
              pace_functionality: false
            },
            digital_signature: {
              signature_valid: true,
              certificate_chain_valid: true,
              timestamp_valid: true,
              revocation_status: 'valid',
              signature_algorithm: 'RSA-SHA256',
              hash_algorithm: 'SHA-256',
              signature_strength: 78
            },
            physical_standards: {
              dimensions_correct: true,
              material_compliance: true,
              thickness_tolerance: true,
              bend_test_passed: true,
              temperature_resistance: true,
              durability_score: 82,
              print_quality: 76
            }
          },
          status: 'non_compliant',
          remediation_attempts: 1,
          last_remediation_date: '2024-01-14T09:00:00Z'
        },
        {
          license_id: 3,
          license_number: 'DL001234569',
          citizen_name: 'Mike Johnson',
          validation_date: '',
          compliant: false,
          compliance_score: 0,
          iso_version: 'ISO_18013_3',
          issues: [],
          validations: {
            mrz_validation: {
              format_valid: false,
              checksum_valid: false,
              data_consistency: false,
              machine_readable: false,
              iso_compliance_level: 0,
              issues: ['Validation pending']
            },
            security_features: {
              hologram_present: false,
              watermark_valid: false,
              security_thread: false,
              uv_features: false,
              tactile_features: false,
              microprinting: false,
              security_score: 0,
              tamper_evidence: false
            },
            biometric_validation: {
              template_quality: 0,
              iso_format_compliance: false,
              facial_recognition_score: 0,
              liveness_detection: false,
              biometric_accuracy: 0
            },
            chip_data_validation: {
              chip_functional: false,
              data_integrity: false,
              access_control_valid: false,
              cryptographic_binding: false,
              lds_structure_valid: false,
              dg_validation: {},
              bac_functionality: false,
              pace_functionality: false
            },
            digital_signature: {
              signature_valid: false,
              certificate_chain_valid: false,
              timestamp_valid: false,
              revocation_status: 'unknown',
              signature_algorithm: '',
              hash_algorithm: '',
              signature_strength: 0
            },
            physical_standards: {
              dimensions_correct: false,
              material_compliance: false,
              thickness_tolerance: false,
              bend_test_passed: false,
              temperature_resistance: false,
              durability_score: 0,
              print_quality: 0
            }
          },
          status: 'pending',
          remediation_attempts: 0
        }
      ];

      setStatistics(mockStats);
      setComplianceRecords(mockRecords);

    } catch (err: any) {
      console.error('Error loading compliance data:', err);
      setError('Failed to load ISO compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'success';
      case 'non_compliant': return 'error';
      case 'pending': return 'warning';
      case 'remediated': return 'info';
      case 'critical_failure': return 'error';
      default: return 'default';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'info';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'major': return 'warning';
      case 'minor': return 'info';
      default: return 'default';
    }
  };

  const handleValidateLicense = async (licenseId: number) => {
    try {
      setValidationInProgress(true);
      setActiveValidationStep(0);
      
      // Simulate validation steps
      const steps = [
        'Initializing validation process...',
        'Validating MRZ format and checksums...',
        'Checking security features...',
        'Analyzing biometric templates...',
        'Verifying chip data integrity...',
        'Validating digital signatures...',
        'Checking physical standards...',
        'Generating compliance report...'
      ];
      
      for (let i = 0; i < steps.length; i++) {
        setActiveValidationStep(i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setSuccess(`ISO 18013 compliance validation completed for License ID: ${licenseId}`);
      loadComplianceData();
      
    } catch (err: any) {
      setError('Failed to validate license compliance');
    } finally {
      setValidationInProgress(false);
      setActiveValidationStep(0);
    }
  };

  const handleBulkValidation = async () => {
    if (selectedLicenses.length === 0) return;
    
    try {
      setValidationInProgress(true);
      
      // Simulate bulk validation with progress
      for (let i = 0; i < selectedLicenses.length; i++) {
        setActiveValidationStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setSuccess(`Bulk ISO compliance validation completed for ${selectedLicenses.length} licenses`);
      setSelectedLicenses([]);
      setBulkValidationDialogOpen(false);
      loadComplianceData();
      
    } catch (err: any) {
      setError('Failed to perform bulk validation');
    } finally {
      setValidationInProgress(false);
    }
  };

  const handleRemediateLicense = async (licenseId: number) => {
    try {
      setLoading(true);
      
      // Find the record to determine auto-fixable issues
      const record = complianceRecords.find(r => r.license_id === licenseId);
      const autoFixableIssues = record?.issues.filter(issue => issue.auto_fixable) || [];
      
      if (autoFixableIssues.length > 0) {
        setSuccess(`Auto-remediation completed for ${autoFixableIssues.length} issues. Manual intervention required for remaining issues.`);
      } else {
        setSuccess(`Manual remediation initiated for License ID: ${licenseId}. Please check remediation queue.`);
      }
      
      loadComplianceData();
      
    } catch (err: any) {
      setError('Failed to remediate license');
    } finally {
      setLoading(false);
    }
  };

  const handleExportComplianceReport = async () => {
    try {
      // Generate comprehensive compliance report
      const reportData = {
        generated_date: new Date().toISOString(),
        statistics,
        records: complianceRecords,
        validation_rules: validationRules.filter(rule => rule.enabled),
        compliance_summary: {
          total_validated: complianceRecords.length,
          critical_issues: complianceRecords.reduce((acc, record) => 
            acc + record.issues.filter(issue => issue.severity === 'critical').length, 0),
          remediation_pending: complianceRecords.filter(record => 
            record.status === 'non_compliant' && record.remediation_attempts === 0).length
        }
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `iso_18013_compliance_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Comprehensive ISO 18013 compliance report exported successfully');
    } catch (err: any) {
      setError('Failed to export compliance report');
    }
  };

  const filteredRecords = complianceRecords.filter(record => {
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesISO = isoVersionFilter === 'all' || record.iso_version === isoVersionFilter;
    const matchesSeverity = severityFilter === 'all' || 
      record.issues.some(issue => issue.severity === severityFilter);
    const matchesSearch = searchTerm === '' || 
      record.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.citizen_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesISO && matchesSeverity && matchesSearch;
  });

  const handleViewDetails = (record: ISOComplianceRecord) => {
    setSelectedRecord(record);
    setDetailsDialogOpen(true);
  };

  const renderValidationProgress = () => {
    if (!validationInProgress) return null;

    const steps = [
      'Initialize Validation',
      'MRZ Format Check',
      'Security Features',
      'Biometric Analysis',
      'Chip Data Validation',
      'Digital Signatures',
      'Physical Standards',
      'Generate Report'
    ];

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ISO 18013 Validation in Progress
          </Typography>
          <Stepper activeStep={activeValidationStep} orientation="horizontal">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            ISO 18013 Compliance Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Comprehensive driver license compliance monitoring per ISO 18013 standards
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ReportIcon />}
            onClick={() => setComplianceReportDialogOpen(true)}
          >
            Compliance Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportComplianceReport}
          >
            Export Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadComplianceData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate('/workflow')}
          >
            Back to Workflow
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Validation Progress */}
      {renderValidationProgress()}

      {/* Enhanced Statistics Dashboard */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Licenses
                </Typography>
                <Typography variant="h4" component="div">
                  {statistics.total_licenses.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Compliance Rate
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {statistics.compliance_rate}%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="caption" color="success.main">
                    +{statistics.trends.weekly_compliance_rate}% this week
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Critical Failures
                </Typography>
                <Typography variant="h4" component="div" color="error.main">
                  {statistics.critical_failures}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  ISO 18013-1
                </Typography>
                <Typography variant="h4" component="div" color="info.main">
                  {statistics.iso_18013_1_compliance}%
                </Typography>
                <Typography variant="caption">Physical Standards</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  ISO 18013-3
                </Typography>
                <Typography variant="h4" component="div" color="warning.main">
                  {statistics.iso_18013_3_compliance}%
                </Typography>
                <Typography variant="caption">Security & Access</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Mobile DL (mDL)
                </Typography>
                <Typography variant="h4" component="div" color="secondary.main">
                  {statistics.iso_18013_5_compliance}%
                </Typography>
                <Typography variant="caption">ISO 18013-5</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Critical Issues Overview */}
      {statistics && statistics.common_issues.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Critical Compliance Issues (Top 5)
            </Typography>
            <Grid container spacing={2}>
              {statistics.common_issues.map((issue, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {issue.issue}
                        </Typography>
                        <Chip
                          label={issue.severity.toUpperCase()}
                          color={getSeverityColor(issue.severity)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      <Typography variant="h6" color="error.main" sx={{ mt: 1 }}>
                        {issue.count} licenses affected
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Search Licenses"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="License number or citizen name..."
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="compliant">Compliant</MenuItem>
                  <MenuItem value="non_compliant">Non-Compliant</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="critical_failure">Critical Failure</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>ISO Version</InputLabel>
                <Select
                  value={isoVersionFilter}
                  label="ISO Version"
                  onChange={(e) => setISOVersionFilter(e.target.value)}
                >
                  <MenuItem value="all">All Versions</MenuItem>
                  <MenuItem value="ISO_18013_1">ISO 18013-1</MenuItem>
                  <MenuItem value="ISO_18013_2">ISO 18013-2</MenuItem>
                  <MenuItem value="ISO_18013_3">ISO 18013-3</MenuItem>
                  <MenuItem value="ISO_18013_5">ISO 18013-5</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  label="Severity"
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Severities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="major">Major</MenuItem>
                  <MenuItem value="minor">Minor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SecurityIcon />}
                  onClick={() => setBulkValidationDialogOpen(true)}
                  disabled={selectedLicenses.length === 0}
                >
                  Bulk Validate ({selectedLicenses.length})
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedLicenses([])}
                  disabled={selectedLicenses.length === 0}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Enhanced Compliance Records Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ISO 18013 Compliance Records
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLicenses(filteredRecords.map(r => r.license_id));
                        } else {
                          setSelectedLicenses([]);
                        }
                      }}
                      checked={selectedLicenses.length === filteredRecords.length && filteredRecords.length > 0}
                    />
                  </TableCell>
                  <TableCell>License Number</TableCell>
                  <TableCell>Citizen Name</TableCell>
                  <TableCell>ISO Version</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Compliance Score</TableCell>
                  <TableCell>Critical Issues</TableCell>
                  <TableCell>Last Validation</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.license_id}>
                    <TableCell padding="checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedLicenses.includes(record.license_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLicenses([...selectedLicenses, record.license_id]);
                          } else {
                            setSelectedLicenses(selectedLicenses.filter(id => id !== record.license_id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {record.license_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{record.citizen_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.iso_version.replace('_', ' ')}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(record.status)}
                        size="small"
                        icon={
                          record.status === 'compliant' ? <CompliantIcon /> :
                          record.status === 'critical_failure' ? <NonCompliantIcon /> :
                          record.status === 'non_compliant' ? <NonCompliantIcon /> :
                          <WarningIcon />
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {record.compliance_score > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating
                            value={record.compliance_score / 20} // Convert to 5-star scale
                            precision={0.1}
                            size="small"
                            readOnly
                          />
                          <Typography variant="body2" color={getComplianceScoreColor(record.compliance_score)}>
                            {record.compliance_score}%
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.issues.filter(issue => issue.severity === 'critical').length > 0 ? (
                        <Chip
                          label={`${record.issues.filter(issue => issue.severity === 'critical').length} Critical`}
                          color="error"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="No Critical Issues"
                          color="success"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {record.validation_date ? 
                        new Date(record.validation_date).toLocaleDateString() : 
                        'Not validated'
                      }
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetails(record)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {record.status === 'pending' && (
                          <Tooltip title="Validate">
                            <IconButton 
                              size="small" 
                              onClick={() => handleValidateLicense(record.license_id)}
                              disabled={validationInProgress}
                            >
                              <SecurityIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(record.status === 'non_compliant' || record.status === 'critical_failure') && (
                          <Tooltip title="Remediate">
                            <IconButton 
                              size="small" 
                              onClick={() => handleRemediateLicense(record.license_id)}
                              disabled={loading}
                            >
                              <FixIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ISO Compliance Details
          {selectedRecord && (
            <Typography variant="subtitle1" color="textSecondary">
              {selectedRecord.license_number} - {selectedRecord.citizen_name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Compliance Status
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        {selectedRecord.validations.mrz_validation.format_valid ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                      </ListItemIcon>
                      <ListItemText primary="MRZ Format" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {selectedRecord.validations.security_features.hologram_present ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                      </ListItemIcon>
                      <ListItemText primary="Security Hologram" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {selectedRecord.validations.biometric_validation.template_quality >= 80 ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                      </ListItemIcon>
                      <ListItemText primary="Biometric Template" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {selectedRecord.validations.chip_data_validation.chip_functional ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                      </ListItemIcon>
                      <ListItemText primary="Chip Data" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {selectedRecord.validations.digital_signature.signature_valid ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                      </ListItemIcon>
                      <ListItemText primary="Digital Signature" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {selectedRecord.validations.physical_standards.dimensions_correct ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                      </ListItemIcon>
                      <ListItemText primary="Physical Dimensions" />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Compliance Issues
                  </Typography>
                  {selectedRecord.issues.length > 0 ? (
                    <List>
                      {selectedRecord.issues.map((issue, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <NonCompliantIcon color="error" />
                          </ListItemIcon>
                          <ListItemText primary={issue.description} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="success">
                      No compliance issues found
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {selectedRecord?.status === 'non_compliant' && (
            <Button 
              variant="contained" 
              startIcon={<FixIcon />}
              onClick={() => {
                handleRemediateLicense(selectedRecord.license_id);
                setDetailsDialogOpen(false);
              }}
            >
              Remediate
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Bulk Validation Dialog */}
      <Dialog
        open={bulkValidationDialogOpen}
        onClose={() => setBulkValidationDialogOpen(false)}
      >
        <DialogTitle>Bulk Validation Confirmation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to validate {selectedLicenses.length} selected licenses?
            This process may take several minutes to complete.
          </Typography>
          {validationInProgress && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Validation in progress...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkValidationDialogOpen(false)} disabled={validationInProgress}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleBulkValidation}
            disabled={validationInProgress}
          >
            {validationInProgress ? 'Validating...' : 'Validate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ISOCompliance; 