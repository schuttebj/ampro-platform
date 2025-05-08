import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import api from '../../api/api';

// Define the Citizen interface
interface Citizen {
  id: number;
  id_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  email: string;
  address: string;
}

const CitizenSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.get('/citizens/search', {
        params: { query: searchTerm }
      });
      setCitizens(response.data);
      if (response.data.length === 0) {
        setError('No citizens found with the given search term.');
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to search citizens.');
      setCitizens([]);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to citizen details
  const viewCitizen = (id: number) => {
    navigate(`/citizens/${id}`);
  };

  // Navigate to edit citizen
  const editCitizen = (id: number) => {
    navigate(`/citizens/${id}/edit`);
  };

  // Handle delete citizen
  const deleteCitizen = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this citizen?')) return;

    try {
      await api.delete(`/citizens/${id}`);
      setCitizens(citizens.filter(citizen => citizen.id !== id));
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to delete citizen.');
    }
  };

  // Mock data for demo purposes
  const mockSearch = () => {
    setLoading(true);
    setError('');
    
    // Simulate API delay
    setTimeout(() => {
      const mockData: Citizen[] = [
        {
          id: 1,
          id_number: '9001011234567',
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          gender: 'Male',
          contact_number: '0721234567',
          email: 'john.doe@example.com',
          address: '123 Main St, City'
        },
        {
          id: 2,
          id_number: '8502025678901',
          first_name: 'Jane',
          last_name: 'Smith',
          date_of_birth: '1985-02-02',
          gender: 'Female',
          contact_number: '0825678901',
          email: 'jane.smith@example.com',
          address: '456 Oak Ave, Town'
        },
        {
          id: 3,
          id_number: '7803036789012',
          first_name: 'Robert',
          last_name: 'Johnson',
          date_of_birth: '1978-03-03',
          gender: 'Male',
          contact_number: '0836789012',
          email: 'robert.j@example.com',
          address: '789 Pine St, Village'
        }
      ];
      
      setCitizens(mockData);
      setLoading(false);
    }, 1000);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Citizen Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/citizens/new')}
        >
          New Citizen
        </Button>
      </Box>

      {/* Search Form */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Search Citizens
        </Typography>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by ID number or name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mr: 2 }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !searchTerm.trim()}
            sx={{ minWidth: '120px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
          <Button 
            variant="outlined" 
            sx={{ ml: 2 }}
            onClick={mockSearch}
          >
            Demo Search
          </Button>
        </Box>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Table */}
      {citizens.length > 0 && (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>ID Number</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {citizens.map((citizen) => (
                <TableRow key={citizen.id}>
                  <TableCell>{citizen.id_number}</TableCell>
                  <TableCell>{`${citizen.first_name} ${citizen.last_name}`}</TableCell>
                  <TableCell>{new Date(citizen.date_of_birth).toLocaleDateString()}</TableCell>
                  <TableCell>{citizen.gender}</TableCell>
                  <TableCell>{citizen.contact_number}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="primary" 
                      onClick={() => viewCitizen(citizen.id)}
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      color="secondary" 
                      onClick={() => editCitizen(citizen.id)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => deleteCitizen(citizen.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CitizenSearch; 