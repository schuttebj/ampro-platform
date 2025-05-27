import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  PhotoCamera as CameraIcon
} from '@mui/icons-material';

interface ImageUploadProps {
  value?: string; // Current image URL or base64
  onChange: (imageData: string | null) => void;
  label?: string;
  maxSize?: number; // Max file size in MB
  acceptedFormats?: string[];
  width?: number;
  height?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = "Upload Photo",
  maxSize = 5, // 5MB default
  acceptedFormats = ['image/jpeg', 'image/png', 'image/jpg'],
  width = 150,
  height = 180
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `File size too large. Maximum size: ${maxSize}MB`;
    }

    return null;
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      
      <Box
        sx={{
          width,
          height,
          border: `2px dashed ${dragOver ? '#1976d2' : '#ccc'}`,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backgroundColor: dragOver ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        {uploading ? (
          <CircularProgress size={40} />
        ) : value ? (
          <>
            <Avatar
              src={value}
              sx={{
                width: width - 20,
                height: height - 20,
                borderRadius: 1
              }}
              variant="rounded"
            />
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '50%'
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                sx={{ color: 'white' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Drag & drop an image here
            </Typography>
            <Typography variant="caption" color="text.secondary">
              or click to browse
            </Typography>
          </Box>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        Accepted formats: JPG, PNG • Max size: {maxSize}MB
      </Typography>
    </Box>
  );
};

export default ImageUpload; 