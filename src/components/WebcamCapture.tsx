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
      
      // Import the API service
      const { hardwareApi } = await import('../api/api');
      
      // First, try to detect actual physical webcams using browser WebRTC
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          
          if (videoDevices.length > 0) {
            // Convert browser-detected webcams to our Hardware format
            const detectedWebcams: Hardware[] = videoDevices.map((device, index) => ({
              id: 9000 + index, // Use high numeric IDs to avoid conflicts with database IDs
              name: device.label || `Webcam ${index + 1}`,
              code: device.deviceId || `BROWSER_${index}`,
              hardware_type: 'WEBCAM' as const,
              model: 'Browser Detected',
              manufacturer: 'Local Device',
              serial_number: '',
              device_id: device.deviceId,
              status: 'ACTIVE' as const,
              location_id: undefined,
              usage_count: 0,
              error_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_active: true,
              capabilities: {
                max_resolution: "1920x1080",
                formats: ["jpeg", "png"],
                fps: 30
              }
            }));
            
            setWebcams(detectedWebcams);
            
            // Auto-select first detected webcam
            if (detectedWebcams.length > 0) {
              setSelectedWebcam(detectedWebcams[0].id);
            }
            
            console.info(`Detected ${detectedWebcams.length} local webcam(s) using browser API`);
            return; // Successfully loaded browser-detected webcams
          }
        }
      } catch (browserError) {
        console.warn('Browser webcam detection failed:', browserError);
      }
      
      // Fallback: Get configured webcam hardware devices from database
      try {
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
          console.info(`Using ${allHardware.length} configured webcam device(s) from database. For local webcam detection, please allow camera permissions in your browser.`);
        } else {
          console.warn('No webcams detected. Please ensure webcams are connected and camera permissions are granted.');
        }
      } catch (dbError) {
        console.warn('Failed to load configured webcams from database:', dbError);
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

      // Find the selected webcam to get its details
      const selectedWebcamData = webcams.find((w: Hardware) => w.id === selectedWebcam);
      if (!selectedWebcamData) {
        setError('Selected webcam not found');
        return;
      }

      // Handle different types of webcams
      if (selectedWebcam >= 9000) {
        // This is a browser-detected webcam - use browser APIs
        await handleBrowserWebcamCapture(selectedWebcamData);
      } else {
        // Database webcams: Since server has no camera access, inform user to use browser detection
        setError('Database-configured webcams are not supported. Please ensure browser webcam permissions are granted for automatic detection.');
        return;
      }

    } catch (err: any) {
      console.error('Error capturing photo:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const handleBrowserWebcamCapture = async (webcamData: Hardware) => {
    try {
      // Use browser APIs to capture photo
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: webcamData.device_id ? { exact: webcamData.device_id } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      // Create video element and canvas for capture
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.srcObject = stream;
      video.play();

      // Wait for video to load
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capture frame
      context?.drawImage(video, 0, 0);

      // Stop video stream
      stream.getTracks().forEach(track => track.stop());

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      if (!blob) {
        throw new Error('Failed to capture photo');
      }

      // Upload to server (you'll need to implement this endpoint)
      const formData = new FormData();
      formData.append('photo', blob, 'webcam_capture.jpg');
      formData.append('citizen_id', citizenId.toString());
      formData.append('hardware_id', webcamData.code);

      const { default: api } = await import('../api/api');
      const response = await api.post('/citizens/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess('Photo captured successfully!');
        onPhotoCapture(response.data.photo_url);
        
        setTimeout(() => {
          setOpen(false);
          setSuccess('');
        }, 1500);
      } else {
        setError('Failed to upload captured photo');
      }

    } catch (error: any) {
      console.error('Browser webcam capture error:', error);
      setError(error.message || 'Failed to capture photo using browser webcam');
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
                      onChange={(e) => setSelectedWebcam(e.target.value ? Number(e.target.value) : null)}
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