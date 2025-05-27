import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  Typography,
  Collapse,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

export interface FilterField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface SearchFilterProps {
  onSearch: (searchTerm: string) => void;
  onFilter: (filters: Record<string, any>) => void;
  onClear: () => void;
  searchPlaceholder?: string;
  filterFields?: FilterField[];
  initialFilters?: Record<string, any>;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  onFilter,
  onClear,
  searchPlaceholder = "Search...",
  filterFields = [],
  initialFilters = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(searchTerm);
  };

  const handleFilterChange = (name: string, value: any) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    handleFilterChange(name, value);
  };

  const handleClear = () => {
    setSearchTerm('');
    setFilters({});
    onClear();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== null && value !== undefined);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box>
        {/* Search Bar */}
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SearchIcon />}
                  fullWidth
                >
                  Search
                </Button>
                {filterFields.length > 0 && (
                  <IconButton
                    onClick={() => setShowFilters(!showFilters)}
                    color={showFilters ? 'primary' : 'default'}
                  >
                    <FilterIcon />
                  </IconButton>
                )}
                {(searchTerm || hasActiveFilters) && (
                  <IconButton onClick={handleClear} color="error">
                    <ClearIcon />
                  </IconButton>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Advanced Filters */}
        {filterFields.length > 0 && (
          <Collapse in={showFilters}>
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mr: 1 }}>
                  Advanced Filters
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Grid container spacing={2}>
                {filterFields.map((field) => (
                  <Grid item xs={12} sm={6} md={4} key={field.name}>
                    {field.type === 'select' ? (
                      <FormControl fullWidth>
                        <InputLabel>{field.label}</InputLabel>
                        <Select
                          name={field.name}
                          value={filters[field.name] || ''}
                          label={field.label}
                          onChange={handleSelectChange}
                        >
                          <MenuItem value="">
                            <em>All</em>
                          </MenuItem>
                          {field.options?.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        fullWidth
                        label={field.label}
                        type={field.type}
                        value={filters[field.name] || ''}
                        onChange={(e) => handleFilterChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        )}
      </Box>
    </Paper>
  );
};

export default SearchFilter; 