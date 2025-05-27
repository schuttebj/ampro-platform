import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import './index.css';

// Contexts
import { AuthProvider } from './contexts/AuthContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CitizenSearch from './pages/citizens/CitizenSearch';
import CitizenDetails from './pages/citizens/CitizenDetails';
import CitizenForm from './pages/citizens/CitizenForm';
import ApplicationList from './pages/applications/ApplicationList';
import ApplicationDetails from './pages/applications/ApplicationDetails';
import ApplicationForm from './pages/applications/ApplicationForm';
import LicenseList from './pages/licenses/LicenseList';
import LicenseDetails from './pages/licenses/LicenseDetails';
import LicenseForm from './pages/licenses/LicenseForm';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';

// Create the query client
const queryClient = new QueryClient();

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Citizen routes */}
                  <Route path="/citizens" element={<CitizenSearch />} />
                  <Route path="/citizens/:id" element={<CitizenDetails />} />
                  <Route path="/citizens/:id/edit" element={<CitizenForm />} />
                  <Route path="/citizens/new" element={<CitizenForm />} />
                  
                  {/* Application routes */}
                  <Route path="/applications" element={<ApplicationList />} />
                  <Route path="/applications/:id" element={<ApplicationDetails />} />
                  <Route path="/applications/:id/edit" element={<ApplicationForm />} />
                  <Route path="/applications/new" element={<ApplicationForm />} />
                  
                  {/* License routes */}
                  <Route path="/licenses" element={<LicenseList />} />
                  <Route path="/licenses/:id" element={<LicenseDetails />} />
                  <Route path="/licenses/:id/edit" element={<LicenseForm />} />
                  <Route path="/licenses/new" element={<LicenseForm />} />
                  
                  {/* New implemented pages */}
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/reports" element={<Reports />} />
                  
                  {/* Placeholder pages - to be implemented */}
                  <Route path="/settings" element={<div>Settings Page</div>} />
                  <Route path="/profile" element={<div>Profile Page</div>} />
                </Route>
              </Route>
              
              {/* Admin-only routes */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route element={<MainLayout />}>
                  <Route path="/admin" element={<div>Admin Panel</div>} />
                </Route>
              </Route>
              
              {/* Fallback routes */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App; 