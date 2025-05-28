import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { testApiConnection } from '../api/api';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert,
  CircularProgress,
  Collapse,
  IconButton,
  Link
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [diagnosticMode, setDiagnosticMode] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  
  // Run diagnostic tests on component mount
  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        const results = await testApiConnection();
        setDiagnosticInfo(results);
      } catch (err) {
        console.error('Error running diagnostics:', err);
      }
    };
    
    runDiagnostics();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error details:', err);
      
      // Special handling for 405 Method Not Allowed errors
      if (err.message && err.message.includes('405')) {
        setError('Login failed: The API endpoint does not accept POST requests. This may be a server configuration issue.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials and try again.');
      }
    }
  };
  
  const runManualTest = async () => {
    try {
      const results = await testApiConnection();
      setDiagnosticInfo(results);
      setDiagnosticMode(true);
    } catch (err) {
      console.error('Error running diagnostics:', err);
    }
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" sx={{ mb: 3 }}>
            AMPRO License System
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="outlined" 
                color="info" 
                size="small"
                onClick={runManualTest}
                startIcon={<InfoIcon />}
              >
                Connection Diagnostics
              </Button>
            </Box>
            
            <Collapse in={diagnosticMode}>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Diagnostic Information:</Typography>
                <Typography variant="body2" component="pre" sx={{ overflow: 'auto', maxHeight: 200 }}>
                  {diagnosticInfo ? JSON.stringify(diagnosticInfo, null, 2) : 'No diagnostic data available'}
                </Typography>
                
                {/* Help text for 405 errors */}
                {diagnosticInfo && JSON.stringify(diagnosticInfo).includes('405') && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      405 Method Not Allowed detected: The API endpoint doesn't support the request method.
                      This is likely a server-side configuration issue that needs to be fixed.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Collapse>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 