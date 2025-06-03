import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Camera as CameraIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Hardware, WebcamCaptureRequest, WebcamCaptureResponse } from '../types';

interface WebcamCaptureProps {
  citizenId: number;
  onPhotoCapture: (photoUrl: string) => void;
  disabled?: boolean;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  citizenId,
  onPhotoCapture,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [webcams, setWebcams] = useState<Hardware[]>([]);
  const [selectedWebcam, setSelectedWebcam] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadAvailableWebcams();
    }
  }, [open]);

  const loadAvailableWebcams = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Import the API service and detect actual physical webcams
      const { hardwareApi } = await import('../api/api');
      
      try {
        // First, try to detect actual physical webcams connected to the system
        const detectionResponse = await hardwareApi.webcam.detect();
        
        if (detectionResponse.success && detectionResponse.webcams && detectionResponse.webcams.length > 0) {
          // Convert detected webcams to our Hardware format
          const detectedWebcams: Hardware[] = detectionResponse.webcams.map((webcam: any, index: number) => ({
            id: `detected_${index}`, // Use a special ID for detected webcams
            name: webcam.name || `Detected Webcam ${index + 1}`,
            code: webcam.device_id || `DETECTED_${index}`,
            hardware_type: 'WEBCAM' as const,
            model: webcam.capabilities?.max_resolution || 'Unknown',
            manufacturer: webcam.manufacturer || 'Unknown',
            serial_number: '',
            device_id: webcam.device_id,
            status: 'ACTIVE' as const,
            location_id: undefined,
            usage_count: 0,
            error_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
            capabilities: webcam.capabilities
          }));
          
          setWebcams(detectedWebcams);
          
          // Auto-select first detected webcam
          if (detectedWebcams.length > 0) {
            setSelectedWebcam(detectedWebcams[0].id);
          }
          
          return; // Successfully loaded detected webcams
        }
      } catch (detectionError) {
        console.warn('Physical webcam detection failed, falling back to database webcams:', detectionError);
      }
      
      // Fallback: Get configured webcam hardware devices from database
      const allHardware = await hardwareApi.getAll({
        hardware_type: 'WEBCAM',
        status: 'ACTIVE'
      });
      
      setWebcams(allHardware);
      
      // Auto-select first webcam if available
      if (allHardware.length > 0) {
        setSelectedWebcam(allHardware[0].id);
      }
      
      // Show info message about using configured webcams vs detected ones
      if (allHardware.length > 0) {
        console.info('Using configured webcam devices from database. To use physical webcam detection, ensure webcams are connected and drivers are installed.');
      }
      
    } catch (err: any) {
      console.error('Error loading webcams:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load available webcams');
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    if (!selectedWebcam) {
      setError('Please select a webcam');
      return;
    }

    try {
      setCapturing(true);
      setError('');
      setSuccess('');

      // Import the API service and capture photo
      const { hardwareApi } = await import('../api/api');

      // Find the selected webcam to get its details
      const selectedWebcamData = webcams.find(w => w.id === selectedWebcam);
      if (!selectedWebcamData) {
        setError('Selected webcam not found');
        return;
      }

      // For detected webcams, we need to handle them differently
      let captureParams;
      if (typeof selectedWebcam === 'string' && selectedWebcam.startsWith('detected_')) {
        // This is a detected webcam - use device_id for capture
        captureParams = {
          hardware_id: selectedWebcamData.device_id || '0', // Use device_id from detected webcam
          citizen_id: citizenId,
          quality: 'high' as const,
          format: 'jpeg' as const,
          is_detected_webcam: true // Flag to indicate this is a detected webcam
        };
      } else {
        // This is a configured hardware webcam from database
        captureParams = {
          hardware_id: selectedWebcam as number,
          citizen_id: citizenId,
          quality: 'high' as const,
          format: 'jpeg' as const
        };
      }

      const response = await hardwareApi.webcam.capture(captureParams);

      if (response.success && response.photo_url) {
        setSuccess('Photo captured successfully!');
        onPhotoCapture(response.photo_url);
        
        // Close dialog after a short delay
        setTimeout(() => {
          setOpen(false);
          setSuccess('');
        }, 1500);
      } else {
        setError(response.error_message || 'Photo capture failed');
      }
    } catch (err: any) {
      console.error('Error capturing photo:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const handleClose = () => {
    if (!capturing) {
      setOpen(false);
      setError('');
      setSuccess('');
    }
  };

  const getWebcamDisplayName = (webcam: Hardware) => {
    return `${webcam.name} (${webcam.code})`;
  };

  const getWebcamDetails = (webcam: Hardware) => {
    const details = [];
    if (webcam.manufacturer) details.push(webcam.manufacturer);
    if (webcam.model) details.push(webcam.model);
    if (webcam.location?.name) details.push(`Location: ${webcam.location.name}`);
    return details.join(' • ');
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CameraIcon />}
        onClick={() => setOpen(true)}
        disabled={disabled}
        fullWidth
      >
        Capture with Webcam
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CameraIcon />
            Capture Citizen Photo
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
                  {success}
                </Alert>
              )}

              {webcams.length === 0 ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  No webcams are currently available. Please ensure webcams are connected and configured.
                </Alert>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select a webcam to capture the citizen's photo. The photo will be automatically processed for ISO compliance.
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Select Webcam</InputLabel>
                    <Select
                      value={selectedWebcam || ''}
                      label="Select Webcam"
                      onChange={(e) => setSelectedWebcam(Number(e.target.value))}
                    >
                      {webcams.map((webcam) => (
                        <MenuItem key={webcam.id} value={webcam.id}>
                          <Box>
                            <Typography variant="body2">
                              {getWebcamDisplayName(webcam)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getWebcamDetails(webcam)}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedWebcam && (
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                              Selected Webcam Details
                            </Typography>
                            {(() => {
                              const webcam = webcams.find(w => w.id === selectedWebcam);
                              if (!webcam) return null;
                              
                              return (
                                <Box>
                                  <Typography variant="body2">
                                    <strong>{webcam.name}</strong> ({webcam.code})
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {getWebcamDetails(webcam)}
                                  </Typography>
                                  <Box sx={{ mt: 1 }}>
                                    <Chip
                                      label={webcam.status}
                                      color={webcam.status === 'ACTIVE' ? 'success' : 'default'}
                                      size="small"
                                    />
                                  </Box>
                                </Box>
                              );
                            })()}
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Photo Capture Guidelines:</strong>
                    </Typography>
                    <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                      <li>Ensure the citizen is looking directly at the camera</li>
                      <li>Use good lighting and avoid shadows</li>
                      <li>Keep a neutral background</li>
                      <li>Photo will be automatically cropped and processed</li>
                    </Typography>
                  </Alert>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={capturing}>
            Cancel
          </Button>
          <Button
            onClick={loadAvailableWebcams}
            startIcon={<RefreshIcon />}
            disabled={loading || capturing}
          >
            Refresh
          </Button>
          <Button
            onClick={handleCapture}
            variant="contained"
            startIcon={<CameraIcon />}
            disabled={!selectedWebcam || capturing || webcams.length === 0}
          >
            {capturing ? 'Capturing...' : 'Capture Photo'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WebcamCapture; 