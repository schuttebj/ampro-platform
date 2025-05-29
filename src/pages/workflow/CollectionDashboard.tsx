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
  Avatar,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Store as CollectionIcon,
  CheckCircle as CollectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { workflowService } from '../../api/services';

interface ReadyLicense {
  application_id: number;
  license_id: number;
  license_number: string;
  citizen_name: string;
  citizen_id_number: string;
  application_date: string;
  category: string;
  collection_point: string;
  iso_compliant: boolean;
}

const CollectionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data state
  const [readyLicenses, setReadyLicenses] = useState<ReadyLicense[]>([]);
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<ReadyLicense | null>(null);
  const [collectionNotes, setCollectionNotes] = useState('');

  // Available collection points
  const collectionPoints = [
    'Main Office - Johannesburg',
    'Cape Town Branch',
    'Durban Branch',
    'Pretoria Branch',
    'Port Elizabeth Branch',
    'Bloemfontein Branch'
  ];

  useEffect(() => {
    if (selectedCollectionPoint) {
      loadReadyLicenses();
    }
  }, [selectedCollectionPoint]);

  const loadReadyLicenses = async () => {
    if (!selectedCollectionPoint) return;

    try {
      setLoading(true);
      setError('');

      const licensesData = await workflowService.getReadyForCollection(
        selectedCollectionPoint
      );

      setReadyLicenses(licensesData);

    } catch (err: any) {
      console.error('Error loading ready licenses:', err);
      setError(err.response?.data?.detail || 'Failed to load ready licenses');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectDialogOpen = (license: ReadyLicense) => {
    setSelectedLicense(license);
    setCollectionNotes('');
    setCollectDialogOpen(true);
  };

  const handleCollectDialogClose = () => {
    setCollectDialogOpen(false);
    setSelectedLicense(null);
    setCollectionNotes('');
  };

  const handleCollectLicense = async () => {
    if (!selectedLicense) return;

    try {
      await workflowService.collectLicense(selectedLicense.license_id);
      
      handleCollectDialogClose();
      loadReadyLicenses();
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to mark license as collected');
    }
  };

  const filteredLicenses = readyLicenses.filter(license => 
    license.citizen_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.citizen_id_number.includes(searchTerm) ||
    license.license_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Collection Points Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Licenses">
            <IconButton onClick={loadReadyLicenses} disabled={loading || !selectedCollectionPoint}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate('/workflow')}
          >
            Back to Workflow
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Collection Point Selection */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Collection Point
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Collection Point</InputLabel>
            <Select
              value={selectedCollectionPoint}
              label="Collection Point"
              onChange={(e) => setSelectedCollectionPoint(e.target.value)}
            >
              {collectionPoints.map((point) => (
                <MenuItem key={point} value={point}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" />
                    {point}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedCollectionPoint && (
            <Alert severity="info">
              Showing licenses ready for collection at: <strong>{selectedCollectionPoint}</strong>
            </Alert>
          )}
        </CardContent>
      </Card>

      {selectedCollectionPoint && (
        <>
          {/* Statistics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    {readyLicenses.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ready for Collection
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {readyLicenses.filter(l => l.iso_compliant).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ISO Compliant
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {filteredLicenses.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filtered Results
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {readyLicenses.filter(l => {
                      const appDate = new Date(l.application_date);
                      const daysSince = (Date.now() - appDate.getTime()) / (1000 * 60 * 60 * 24);
                      return daysSince > 30;
                    }).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Waiting 30+ Days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Search */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <TextField
                fullWidth
                label="Search by citizen name, ID number, or license number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </CardContent>
          </Card>

          {/* Licenses Table */}
          {loading ? (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress />
            </Box>
          ) : filteredLicenses.length === 0 ? (
            <Alert severity="info">
              {readyLicenses.length === 0 
                ? 'No licenses ready for collection at this point'
                : 'No licenses match your search criteria'
              }
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Citizen</TableCell>
                    <TableCell>ID Number</TableCell>
                    <TableCell>License #</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Application Date</TableCell>
                    <TableCell>ISO Compliant</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLicenses.map((license) => (
                    <TableRow key={license.license_id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2">{license.citizen_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{license.citizen_id_number}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {license.license_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={license.category} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {new Date(license.application_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {Math.floor((Date.now() - new Date(license.application_date).getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={license.iso_compliant ? 'Yes' : 'No'} 
                          size="small"
                          color={license.iso_compliant ? 'success' : 'warning'}
                          variant={license.iso_compliant ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Mark as Collected">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleCollectDialogOpen(license)}
                            >
                              <CollectIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Application">
                            <IconButton 
                              size="small"
                              onClick={() => navigate(`/applications/${license.application_id}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Collection Confirmation Dialog */}
      <Dialog open={collectDialogOpen} onClose={handleCollectDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm License Collection</DialogTitle>
        <DialogContent>
          {selectedLicense && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please verify the citizen's identity before marking the license as collected.
              </Alert>
              
              <Typography variant="subtitle1" gutterBottom>
                License: {selectedLicense.license_number}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Citizen: {selectedLicense.citizen_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID Number: {selectedLicense.citizen_id_number}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Category: {selectedLicense.category}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Collection Point: {selectedLicense.collection_point}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ISO Compliant: {selectedLicense.iso_compliant ? 'Yes' : 'No'}
              </Typography>

              <TextField
                fullWidth
                label="Collection Notes (Optional)"
                multiline
                rows={3}
                value={collectionNotes}
                onChange={(e) => setCollectionNotes(e.target.value)}
                placeholder="Add any notes about the collection process..."
                sx={{ mt: 3 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCollectDialogClose}>Cancel</Button>
          <Button 
            onClick={handleCollectLicense} 
            variant="contained" 
            color="success"
            startIcon={<CollectIcon />}
          >
            Mark as Collected
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CollectionDashboard; 