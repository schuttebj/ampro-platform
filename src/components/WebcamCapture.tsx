import React, { useState, useEffect, useRef } from 'react';
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
  Chip,
  Paper
} from '@mui/material';
import {
  Camera as CameraIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Videocam as VideocamIcon
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
  const [previewActive, setPreviewActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Refs for video and canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ISO license photo requirements (in mm, converted to pixels at 300 DPI)
  const ISO_REQUIREMENTS = {
    width: 35, // mm
    height: 45, // mm
    headHeight: 32, // mm (head from chin to top)
    eyeLevel: 25, // mm from bottom
    dpi: 300
  };

  // Convert mm to pixels for display
  const mmToPx = (mm: number, displayScale: number = 1) => {
    return (mm * ISO_REQUIREMENTS.dpi / 25.4) * displayScale;
  };

  useEffect(() => {
    if (open) {
      loadAvailableWebcams();
    }
    
    // Cleanup stream when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
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

  const startPreview = async () => {
    const selectedWebcamData = webcams.find((w: Hardware) => w.id === selectedWebcam);
    if (!selectedWebcamData || !selectedWebcamData.device_id) {
      setError('Please select a valid webcam');
      return;
    }

    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedWebcamData.device_id },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to actually start playing
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setPreviewActive(true);
            }).catch((playError) => {
              console.error('Error playing video:', playError);
              setError('Failed to start video preview');
            });
          }
        };
      }
    } catch (error: any) {
      console.error('Error starting preview:', error);
      setError(error.message || 'Failed to start webcam preview');
    }
  };

  const stopPreview = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setPreviewActive(false);
  };

  const handleCapture = async () => {
    if (!selectedWebcam || !videoRef.current || !canvasRef.current) {
      setError('Please start the webcam preview first');
      return;
    }

    try {
      setCapturing(true);
      setError('');
      setSuccess('');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capture frame
      context.drawImage(video, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      if (!blob) {
        throw new Error('Failed to capture photo');
      }

      // Upload to server with correct endpoint URL
      const formData = new FormData();
      formData.append('photo', blob, 'webcam_capture.jpg');
      formData.append('hardware_id', 'browser_webcam');

      const { default: api } = await import('../api/api');
      const response = await api.post(`/citizens/${citizenId}/upload-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess('Photo captured successfully!');
        onPhotoCapture(response.data.photo_url);
        
        stopPreview();
        setTimeout(() => {
          setOpen(false);
          setSuccess('');
        }, 1500);
      } else {
        setError('Failed to upload captured photo');
      }

    } catch (error: any) {
      console.error('Error capturing photo:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const handleClose = () => {
    if (!capturing) {
      stopPreview();
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

  const renderPreviewOverlay = () => {
    const displayScale = 0.5; // Scale down for preview
    const overlayWidth = mmToPx(ISO_REQUIREMENTS.width, displayScale);
    const overlayHeight = mmToPx(ISO_REQUIREMENTS.height, displayScale);
    const headHeight = mmToPx(ISO_REQUIREMENTS.headHeight, displayScale);
    const eyeLevel = mmToPx(ISO_REQUIREMENTS.eyeLevel, displayScale);

    return (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: overlayWidth,
          height: overlayHeight,
          border: '2px solid #00ff00',
          borderRadius: 1,
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        {/* Head guideline */}
        <Box
          sx={{
            position: 'absolute',
            bottom: eyeLevel,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: '#ff9800',
            opacity: 0.8
          }}
        />
        {/* Eye level guideline */}
        <Box
          sx={{
            position: 'absolute',
            bottom: eyeLevel - headHeight,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: '#2196f3',
            opacity: 0.8
          }}
        />
        {/* Dimensions text */}
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: -20,
            left: 0,
            color: '#00ff00',
            backgroundColor: 'rgba(0,0,0,0.7)',
            px: 0.5,
            borderRadius: 0.5,
            fontSize: '10px'
          }}
        >
          {ISO_REQUIREMENTS.width}mm × {ISO_REQUIREMENTS.height}mm
        </Typography>
      </Box>
    );
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

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CameraIcon />
            Capture Citizen Photo - ISO Compliant
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
                    Select a webcam and start preview to capture an ISO-compliant citizen photo.
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

                  {/* Live Preview Area */}
                  {selectedWebcam && (
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Live Preview
                        </Typography>
                        
                        <Box sx={{ position: 'relative', mb: 2 }}>
                          <Paper
                            elevation={3}
                            sx={{
                              position: 'relative',
                              width: '100%',
                              height: 400,
                              backgroundColor: '#000',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden'
                            }}
                          >
                            {previewActive ? (
                              <>
                                <video
                                  ref={videoRef}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  muted
                                  autoPlay
                                  playsInline
                                />
                                {renderPreviewOverlay()}
                              </>
                            ) : (
                              <Box sx={{ textAlign: 'center', color: 'white' }}>
                                <VideocamIcon sx={{ fontSize: 60, mb: 1 }} />
                                <Typography variant="body2">
                                  Click "Start Preview" to begin
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                          
                          {/* Hidden canvas for capture */}
                          <canvas
                            ref={canvasRef}
                            style={{ display: 'none' }}
                          />
                        </Box>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Button
                              fullWidth
                              variant={previewActive ? "outlined" : "contained"}
                              startIcon={<VideocamIcon />}
                              onClick={previewActive ? stopPreview : startPreview}
                              disabled={!selectedWebcam}
                            >
                              {previewActive ? 'Stop Preview' : 'Start Preview'}
                            </Button>
                          </Grid>
                          <Grid item xs={6}>
                            <Button
                              fullWidth
                              variant="contained"
                              color="primary"
                              startIcon={<CameraIcon />}
                              onClick={handleCapture}
                              disabled={!previewActive || capturing}
                            >
                              {capturing ? 'Capturing...' : 'Capture Photo'}
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>ISO License Photo Requirements:</strong>
                    </Typography>
                    <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
                      <li>Photo size: {ISO_REQUIREMENTS.width}mm × {ISO_REQUIREMENTS.height}mm</li>
                      <li>Head height: {ISO_REQUIREMENTS.headHeight}mm (chin to top of head)</li>
                      <li>Eyes at {ISO_REQUIREMENTS.eyeLevel}mm from bottom</li>
                      <li>Neutral expression, looking directly at camera</li>
                      <li>Plain white or light gray background</li>
                      <li>Good lighting, no shadows on face</li>
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
            Refresh Webcams
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WebcamCapture; 