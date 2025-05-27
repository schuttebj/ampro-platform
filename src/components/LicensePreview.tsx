import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  Divider,
  Chip
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Person as PersonIcon
} from '@mui/icons-material';

interface LicensePreviewProps {
  application: {
    id: number;
    license_type: string;
    license_class?: string;
    status: string;
  };
  citizen: {
    id: number;
    id_number: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    address_line1?: string;
    city?: string;
    state_province?: string;
    photo_url?: string;
  };
  licenseNumber?: string;
}

const LicensePreview: React.FC<LicensePreviewProps> = ({ 
  application, 
  citizen, 
  licenseNumber 
}) => {
  // Generate a preview license number if not provided
  const previewLicenseNumber = licenseNumber || `DL${new Date().getFullYear()}${String(application.id).padStart(6, '0')}`;
  
  // Calculate issue and expiry dates
  const issueDate = new Date();
  const expiryDate = new Date();
  expiryDate.setFullYear(issueDate.getFullYear() + 5); // 5-year validity
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateOfBirth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        maxWidth: 400, 
        mx: 'auto',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: '2px solid #1976d2',
        borderRadius: 2
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          REPUBLIC OF SOUTH AFRICA
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          DRIVER'S LICENSE
        </Typography>
        <Divider sx={{ my: 1 }} />
      </Box>

      <Grid container spacing={2}>
        {/* Photo Section */}
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              src={citizen.photo_url}
              sx={{ 
                width: 80, 
                height: 100, 
                mx: 'auto', 
                mb: 1,
                border: '2px solid #1976d2'
              }}
            >
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Box sx={{ mt: 1, p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
              <QrCodeIcon sx={{ fontSize: 30 }} />
              <Typography variant="caption" display="block">
                QR Code
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Details Section */}
        <Grid item xs={8}>
          <Box sx={{ fontSize: '0.75rem' }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              {citizen.first_name} {citizen.last_name}
            </Typography>
            
            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  License No:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="caption" fontWeight="bold">
                  {previewLicenseNumber}
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  ID Number:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="caption">
                  {citizen.id_number}
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Date of Birth:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="caption">
                  {formatDateOfBirth(citizen.date_of_birth)}
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Gender:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="caption">
                  {citizen.gender}
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Class:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Chip 
                  label={application.license_class || application.license_type} 
                  size="small" 
                  color="primary"
                  sx={{ height: 16, fontSize: '0.6rem' }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Issue Date:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="caption">
                  {formatDate(issueDate)}
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Expiry Date:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="caption" fontWeight="bold" color="error">
                  {formatDate(expiryDate)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>

      {/* Address */}
      <Divider sx={{ my: 2 }} />
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          Address:
        </Typography>
        <Typography variant="caption">
          {citizen.address_line1 && `${citizen.address_line1}, `}
          {citizen.city && `${citizen.city}, `}
          {citizen.state_province || 'South Africa'}
        </Typography>
      </Box>

      {/* Status Badge */}
      {application.status === 'approved' && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Chip 
            label="PREVIEW - License will be generated upon approval" 
            color="info" 
            size="small"
            sx={{ fontSize: '0.6rem' }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default LicensePreview; 