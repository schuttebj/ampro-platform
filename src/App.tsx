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
import WorkflowDashboard from './pages/WorkflowDashboard';
import PrinterDashboard from './pages/PrinterDashboard';
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
import LocationManagement from './pages/admin/LocationManagement';
import UserManagement from './pages/admin/UserManagement';
import PrinterManagement from './pages/admin/PrinterManagement';
import HardwareManagement from './pages/admin/HardwareManagement';
import AuditLogs from './pages/admin/AuditLogs';
import Settings from './pages/Settings';

// New Workflow Pages
import WorkflowMain from './pages/workflow/WorkflowMain';
import ApplicationReview from './pages/workflow/ApplicationReview';
import PrintQueue from './pages/workflow/PrintQueue';
import ShippingDashboard from './pages/workflow/ShippingDashboard';
import CollectionDashboard from './pages/workflow/CollectionDashboard';
import WorkflowAnalytics from './pages/workflow/WorkflowAnalytics';
import ManualPrintJobCreator from './pages/workflow/ManualPrintJobCreator';
import ISOCompliance from './pages/workflow/ISOCompliance';

// New Application Pages
import EnhancedApplicationForm from './pages/applications/EnhancedApplicationForm';
import PaymentInterface from './pages/applications/PaymentInterface';
import FeeManagement from './pages/admin/FeeManagement';

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
                  <Route path="/applications/enhanced/new" element={<EnhancedApplicationForm />} />
                  <Route path="/applications/edit/:id" element={<EnhancedApplicationForm />} />
                  <Route path="/applications/:applicationId/payment" element={<PaymentInterface />} />
                  <Route path="/applications/:id/view" element={<ApplicationView />} />
                  
                  {/* License routes */}
                  <Route path="/licenses" element={<LicenseList />} />
                  <Route path="/licenses/:id" element={<LicenseDetails />} />
                  <Route path="/licenses/:id/edit" element={<LicenseForm />} />
                  <Route path="/licenses/new" element={<LicenseForm />} />
                  
                  {/* Workflow Management - Main Dashboard */}
                  <Route path="/workflow" element={<WorkflowMain />} />
                  
                  {/* New Comprehensive Workflow Routes */}
                  <Route path="/workflow/main" element={<WorkflowMain />} />
                  <Route path="/workflow/applications" element={<ApplicationReview />} />
                  <Route path="/workflow/applications/pending" element={<ApplicationReview />} />
                  <Route path="/workflow/print-queue" element={<PrintQueue />} />
                  <Route path="/workflow/manual-print-jobs" element={<ManualPrintJobCreator />} />
                  <Route path="/workflow/iso-compliance" element={<ISOCompliance />} />
                  <Route path="/workflow/shipping" element={<ShippingDashboard />} />
                  <Route path="/workflow/collection" element={<CollectionDashboard />} />
                  <Route path="/workflow/analytics" element={<WorkflowAnalytics />} />
                  
                  {/* Legacy Workflow Dashboard */}
                  <Route path="/workflow/legacy" element={<WorkflowDashboard />} />
                  
                  {/* Other existing routes */}
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/reports" element={<Reports />} />
                  
                  {/* Settings and profile pages */}
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<div>Profile Page</div>} />
                </Route>
              </Route>
              
              {/* Printer-only routes */}
              <Route element={<ProtectedRoute requiredRole="printer" />}>
                <Route element={<MainLayout />}>
                  <Route path="/printer" element={<PrinterDashboard />} />
                </Route>
              </Route>
              
              {/* Admin-only routes */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route element={<MainLayout />}>
                  <Route path="/admin" element={<FeeManagement />} />
                  <Route path="/location-management" element={<LocationManagement />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/printer-management" element={<PrinterManagement />} />
                  <Route path="/hardware-management" element={<HardwareManagement />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
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