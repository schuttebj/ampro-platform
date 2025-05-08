import React, { useState, useEffect } from 'react';
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

  // Load all citizens on initial load
  useEffect(() => {
    fetchCitizens();
  }, []);

  // Fetch all citizens or search results
  const fetchCitizens = async (query?: string) => {
    setLoading(true);
    setError('');

    try {
      let response;
      if (query) {
        // Clean the query string
        const cleanQuery = query.trim();
        
        // Determine if the query contains only digits
        const isNumeric = /^\d+$/.test(cleanQuery);
        
        // Set parameters based on what the API expects
        // We'll send the same search term to multiple fields to allow for partial matches
        const params: Record<string, any> = {};
        
        // If query has digits, include ID number search
        if (isNumeric) {
          params.id_number = cleanQuery;
        } else {
          // For text searches, check first/last name
          const nameParts = cleanQuery.split(/\s+/);
          
          if (nameParts.length > 1) {
            // If there are multiple parts, try different combinations
            params.first_name = nameParts[0];
            params.last_name = nameParts[nameParts.length - 1];
          } else {
            // For single word, search in both fields
            params.first_name = cleanQuery;
            params.last_name = cleanQuery;
          }
        }
        
        console.log('Search params:', params);
        
        // First try the main search endpoint
        try {
          response = await api.get('/citizens/search', { params });
          console.log('Search response:', response.data);
          
          // If we get no results and it's not numeric, try a more general search
          if (response.data.length === 0 && !isNumeric) {
            console.log('No results with specific search, trying general search...');
            
            // Try to get all citizens and filter client-side
            const allResponse = await api.get('/citizens');
            const allCitizens = allResponse.data;
            
            // Filter citizens that match the search term in any relevant field
            const filteredCitizens = allCitizens.filter((citizen: any) => {
              const fullName = `${citizen.first_name} ${citizen.last_name}`.toLowerCase();
              const searchTerm = cleanQuery.toLowerCase();
              
              return (
                citizen.id_number?.includes(searchTerm) ||
                citizen.first_name?.toLowerCase().includes(searchTerm) ||
                citizen.last_name?.toLowerCase().includes(searchTerm) ||
                fullName.includes(searchTerm)
              );
            });
            
            console.log('Client-side filtered results:', filteredCitizens);
            response = { data: filteredCitizens };
          }
        } catch (searchError) {
          console.error('Search endpoint error, falling back to general endpoint:', searchError);
          
          // If search endpoint fails, fall back to getting all citizens
          const allResponse = await api.get('/citizens');
          const allCitizens = allResponse.data;
          
          // Filter citizens that match the search term
          const filteredCitizens = allCitizens.filter((citizen: any) => {
            const fullName = `${citizen.first_name} ${citizen.last_name}`.toLowerCase();
            const searchTerm = cleanQuery.toLowerCase();
            
            return (
              citizen.id_number?.includes(searchTerm) ||
              citizen.first_name?.toLowerCase().includes(searchTerm) ||
              citizen.last_name?.toLowerCase().includes(searchTerm) ||
              fullName.includes(searchTerm)
            );
          });
          
          console.log('Fallback filtered results:', filteredCitizens);
          response = { data: filteredCitizens };
        }
      } else {
        // Fetch all citizens if no query is provided
        response = await api.get('/citizens');
      }

      console.log('Final API response:', response.data);
      
      setCitizens(response.data);
      if (response.data.length === 0) {
        setError(query ? 'No citizens found with the given search term.' : 'No citizens found in the system.');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setError(error.response?.data?.detail || 'Failed to retrieve citizen data.');
      setCitizens([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      // If search is empty, fetch all citizens
      fetchCitizens();
      return;
    }

    fetchCitizens(searchTerm);
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
      setLoading(true);
      const response = await api.delete(`/citizens/${id}`);
      
      if (response.status === 204 || response.status === 200) {
        // Successfully deleted - remove from the local state
        setCitizens(citizens.filter(citizen => citizen.id !== id));
      } else {
        throw new Error('Failed to delete citizen');
      }
    } catch (error: any) {
      console.error('Error deleting citizen:', error);
      setError(error.response?.data?.detail || 'Failed to delete citizen.');
    } finally {
      setLoading(false);
    }
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
            disabled={loading}
            sx={{ minWidth: '120px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
          {searchTerm && (
            <Button 
              variant="outlined" 
              sx={{ ml: 2 }}
              onClick={() => {
                setSearchTerm('');
                fetchCitizens();
              }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator when no results yet */}
      {loading && citizens.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
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