import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Button,
  Grid,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { licenseService } from '../api/services';
import { LicenseFilesInfo, LicenseGenerationResponse, LicenseFileType } from '../types';

interface LicenseFileManagerProps {
  licenseId: number;
  licenseNumber: string;
}

const LicenseFileManager: React.FC<LicenseFileManagerProps> = ({
  licenseId,
  licenseNumber
}) => {
  const [filesInfo, setFilesInfo] = useState<LicenseFilesInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);

  useEffect(() => {
    loadFilesInfo();
  }, [licenseId]);

  const loadFilesInfo = async () => {
    try {
      setLoading(true);
      setError('');
      const info = await licenseService.getLicenseFiles(licenseId);
      setFilesInfo(info);
    } catch (err: any) {
      console.error('Error loading license files info:', err);
      setError(err.response?.data?.detail || 'Failed to load license files information');
    } finally {
      setLoading(false);
    }
  };

  const generateFiles = async (forceRegenerate = false) => {
    try {
      setGenerating(true);
      setError('');
      
      const result: LicenseGenerationResponse = await licenseService.generateLicenseFiles(
        licenseId, 
        forceRegenerate
      );
      
      // Reload files info after generation
      await loadFilesInfo();
      
      if (result.cached) {
        setError(''); // Clear any previous errors
      }
    } catch (err: any) {
      console.error('Error generating license files:', err);
      setError(err.response?.data?.detail || 'Failed to generate license files');
    } finally {
      setGenerating(false);
      setRegenerateDialogOpen(false);
    }
  };

  const downloadFile = async (fileType: LicenseFileType, fileName: string) => {
    try {
      const blob = await licenseService.downloadLicenseFile(licenseId, fileType);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading file:', err);
      setError(err.response?.data?.detail || 'Failed to download file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="License Files" />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="License Files" 
        action={
          <Box>
            <IconButton onClick={loadFilesInfo} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        }
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Generation Controls */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button
                variant="contained"
                onClick={() => generateFiles(false)}
                disabled={generating}
                startIcon={generating ? <CircularProgress size={20} /> : <ImageIcon />}
              >
                {generating ? 'Generating...' : 'Generate Files'}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                onClick={() => setRegenerateDialogOpen(true)}
                disabled={generating}
                startIcon={<RefreshIcon />}
              >
                Force Regenerate
              </Button>
            </Grid>
          </Grid>
          
          {filesInfo?.last_generated && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last generated: {formatDate(filesInfo.last_generated)} 
              {filesInfo.generation_version && ` (v${filesInfo.generation_version})`}
            </Typography>
          )}
        </Box>

        {/* File Downloads */}
        {filesInfo?.files && Object.keys(filesInfo.files).length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Available Files
            </Typography>
            
            <Grid container spacing={2}>
              {/* Front Image */}
              {filesInfo.files.front_image_path?.exists && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ImageIcon sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Front Image</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        PNG • {formatFileSize(filesInfo.files.front_image_path.size_bytes)}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadFile('front_image', `${licenseNumber}_front.png`)}
                        sx={{ mt: 1 }}
                        fullWidth
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Back Image */}
              {filesInfo.files.back_image_path?.exists && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ImageIcon sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Back Image</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        PNG • {formatFileSize(filesInfo.files.back_image_path.size_bytes)}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadFile('back_image', `${licenseNumber}_back.png`)}
                        sx={{ mt: 1 }}
                        fullWidth
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Front PDF */}
              {filesInfo.files.front_pdf_path?.exists && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PdfIcon sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Front PDF</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        PDF • {formatFileSize(filesInfo.files.front_pdf_path.size_bytes)}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadFile('front_pdf', `${licenseNumber}_front.pdf`)}
                        sx={{ mt: 1 }}
                        fullWidth
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Back PDF */}
              {filesInfo.files.back_pdf_path?.exists && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PdfIcon sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Back PDF</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        PDF • {formatFileSize(filesInfo.files.back_pdf_path.size_bytes)}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadFile('back_pdf', `${licenseNumber}_back.pdf`)}
                        sx={{ mt: 1 }}
                        fullWidth
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Combined PDF */}
              {filesInfo.files.combined_pdf_path?.exists && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PdfIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle2">Combined PDF</Typography>
                        <Chip label="Recommended" size="small" color="primary" sx={{ ml: 1 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        PDF • {formatFileSize(filesInfo.files.combined_pdf_path.size_bytes)}
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadFile('combined_pdf', `${licenseNumber}_complete.pdf`)}
                        sx={{ mt: 1 }}
                        fullWidth
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {(!filesInfo?.files || Object.keys(filesInfo.files).length === 0) && !generating && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1 }} />
              <Typography>
                No license files have been generated yet. Click "Generate Files" to create the license documents.
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Force Regenerate Dialog */}
        <Dialog open={regenerateDialogOpen} onClose={() => setRegenerateDialogOpen(false)}>
          <DialogTitle>Force Regenerate License Files</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will regenerate all license files even if they already exist. 
              This is useful if the citizen photo has been updated or if you want to ensure the latest template is used.
              <br /><br />
              Existing files will be replaced. Are you sure you want to continue?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRegenerateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => generateFiles(true)} 
              color="primary" 
              variant="contained"
              disabled={generating}
            >
              Regenerate Files
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default LicenseFileManager; 