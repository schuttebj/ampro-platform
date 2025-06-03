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
import api from '../api/api';

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
      
      const response = await api.get('/hardware/webcams/available');
      setWebcams(response.data);
      
      // Auto-select first webcam if available
      if (response.data.length > 0) {
        setSelectedWebcam(response.data[0].id);
      }
    } catch (err: any) {
      console.error('Error loading webcams:', err);
      setError(err.response?.data?.detail || 'Failed to load available webcams');
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

      const captureRequest: WebcamCaptureRequest = {
        hardware_id: selectedWebcam,
        citizen_id: citizenId,
        quality: 'high',
        format: 'jpeg'
      };

      const response = await api.post<WebcamCaptureResponse>(
        '/hardware/webcams/capture',
        captureRequest
      );

      if (response.data.success && response.data.photo_url) {
        setSuccess('Photo captured successfully!');
        onPhotoCapture(response.data.photo_url);
        
        // Close dialog after a short delay
        setTimeout(() => {
          setOpen(false);
          setSuccess('');
        }, 1500);
      } else {
        setError(response.data.error_message || 'Photo capture failed');
      }
    } catch (err: any) {
      console.error('Error capturing photo:', err);
      setError(err.response?.data?.detail || 'Failed to capture photo');
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