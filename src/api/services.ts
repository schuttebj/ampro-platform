import api from './api';
import {
  User,
  Citizen,
  CitizenSearchParams,
  CitizenFormData,
  License,
  LicenseCreateRequest,
  LicenseFormData,
  Application,
  ApplicationCreateRequest,
  ApplicationFormData,
  ApplicationApprovalRequest,
  Transaction,
  AuditLog,
  ExternalCitizenData,
  ExternalDriverData,
  ExternalInfringementData,
  PaginatedResponse,
  DashboardStats
} from '../types';

// Authentication Services
export const authService = {
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const formData = new URLSearchParams();
    formData.append('refresh_token', refreshToken);
    
    const response = await api.post('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// User Services
export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users/');
    return response.data;
  },

  createUser: async (userData: Partial<User>): Promise<User> => {
    const response = await api.post('/users/', userData);
    return response.data;
  },

  getUser: async (userId: number): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: number, userData: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/users/${userId}`);
  }
};

// Citizen Services
export const citizenService = {
  getCitizens: async (params?: CitizenSearchParams): Promise<PaginatedResponse<Citizen>> => {
    const response = await api.get('/citizens/', { params });
    return response.data;
  },

  createCitizen: async (citizenData: CitizenFormData): Promise<Citizen> => {
    const response = await api.post('/citizens/', citizenData);
    return response.data;
  },

  searchCitizens: async (params: CitizenSearchParams): Promise<Citizen[]> => {
    const response = await api.get('/citizens/search', { params });
    return response.data;
  },

  getCitizen: async (citizenId: number): Promise<Citizen> => {
    const response = await api.get(`/citizens/${citizenId}`);
    return response.data;
  },

  updateCitizen: async (citizenId: number, citizenData: Partial<CitizenFormData>): Promise<Citizen> => {
    const response = await api.put(`/citizens/${citizenId}`, citizenData);
    return response.data;
  },

  deleteCitizen: async (citizenId: number): Promise<void> => {
    await api.delete(`/citizens/${citizenId}`);
  },

  getCitizenLicenses: async (citizenId: number): Promise<License[]> => {
    const response = await api.get(`/citizens/${citizenId}/licenses`);
    return response.data;
  }
};

// License Services
export const licenseService = {
  getLicenses: async (): Promise<PaginatedResponse<License>> => {
    const response = await api.get('/licenses/');
    return response.data;
  },

  createLicense: async (licenseData: LicenseCreateRequest): Promise<License> => {
    const response = await api.post('/licenses/', licenseData);
    return response.data;
  },

  getLicense: async (licenseId: number): Promise<License> => {
    const response = await api.get(`/licenses/${licenseId}`);
    return response.data;
  },

  updateLicense: async (licenseId: number, licenseData: Partial<LicenseFormData>): Promise<License> => {
    const response = await api.put(`/licenses/${licenseId}`, licenseData);
    return response.data;
  },

  deleteLicense: async (licenseId: number): Promise<void> => {
    await api.delete(`/licenses/${licenseId}`);
  },

  getLicenseByNumber: async (licenseNumber: string): Promise<License> => {
    const response = await api.get(`/licenses/number/${licenseNumber}`);
    return response.data;
  },

  generateLicenseNumber: async (): Promise<{ license_number: string }> => {
    const response = await api.get('/licenses/generate-number');
    return response.data;
  },

  getLicenseQRCode: async (licenseId: number): Promise<Blob> => {
    const response = await api.get(`/licenses/${licenseId}/qr-code`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getLicensePreview: async (licenseId: number): Promise<Blob> => {
    const response = await api.get(`/licenses/${licenseId}/preview`, {
      responseType: 'blob'
    });
    return response.data;
  },

  printLicense: async (licenseId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/licenses/${licenseId}/print`);
    return response.data;
  }
};

// Application Services
export const applicationService = {
  getApplications: async (): Promise<PaginatedResponse<Application>> => {
    const response = await api.get('/applications/');
    return response.data;
  },

  createApplication: async (applicationData: ApplicationCreateRequest): Promise<Application> => {
    const response = await api.post('/applications/', applicationData);
    return response.data;
  },

  getPendingApplications: async (): Promise<Application[]> => {
    const response = await api.get('/applications/pending');
    return response.data;
  },

  getApplication: async (applicationId: number): Promise<Application> => {
    const response = await api.get(`/applications/${applicationId}`);
    return response.data;
  },

  updateApplication: async (applicationId: number, applicationData: Partial<ApplicationFormData>): Promise<Application> => {
    const response = await api.put(`/applications/${applicationId}`, applicationData);
    return response.data;
  },

  approveApplication: async (applicationId: number, approvalData: ApplicationApprovalRequest): Promise<License> => {
    const response = await api.post(`/applications/${applicationId}/approve`, approvalData);
    return response.data;
  },

  deleteApplication: async (applicationId: number): Promise<void> => {
    await api.delete(`/applications/${applicationId}`);
  },

  getCitizenApplications: async (citizenId: number): Promise<Application[]> => {
    const response = await api.get(`/applications/citizen/${citizenId}`);
    return response.data;
  }
};

// Transaction Services
export const transactionService = {
  getTransactions: async (): Promise<PaginatedResponse<Transaction>> => {
    const response = await api.get('/transactions/');
    return response.data;
  },

  getTransaction: async (transactionId: number): Promise<Transaction> => {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  },

  getTransactionByRef: async (transactionRef: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/ref/${transactionRef}`);
    return response.data;
  },

  getCitizenTransactions: async (citizenId: number): Promise<Transaction[]> => {
    const response = await api.get(`/transactions/citizen/${citizenId}`);
    return response.data;
  },

  getLicenseTransactions: async (licenseId: number): Promise<Transaction[]> => {
    const response = await api.get(`/transactions/license/${licenseId}`);
    return response.data;
  }
};

// Audit Services
export const auditService = {
  getAuditLogs: async (): Promise<PaginatedResponse<AuditLog>> => {
    const response = await api.get('/audit/');
    return response.data;
  },

  getAuditLog: async (auditId: number): Promise<AuditLog> => {
    const response = await api.get(`/audit/${auditId}`);
    return response.data;
  },

  getUserAuditLogs: async (userId: number): Promise<AuditLog[]> => {
    const response = await api.get(`/audit/user/${userId}`);
    return response.data;
  }
};

// External Data Services
export const externalService = {
  getCitizenData: async (idNumber: string): Promise<ExternalCitizenData> => {
    const response = await api.get(`/external/citizen/${idNumber}`);
    return response.data;
  },

  getDriverData: async (idNumber: string): Promise<ExternalDriverData> => {
    const response = await api.get(`/external/driver/${idNumber}`);
    return response.data;
  },

  getInfringementData: async (idNumber: string): Promise<ExternalInfringementData> => {
    const response = await api.get(`/external/infringement/${idNumber}`);
    return response.data;
  }
};

// Dashboard Services
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    // This might need to be implemented as separate calls to different endpoints
    // or as a dedicated dashboard endpoint in the backend
    const [citizens, licenses, applications, transactions] = await Promise.all([
      citizenService.getCitizens({ limit: 1 }),
      licenseService.getLicenses(),
      applicationService.getPendingApplications(),
      transactionService.getTransactions()
    ]);

    return {
      citizens_registered: citizens.total || 0,
      licenses_issued: licenses.total || 0,
      pending_applications: applications.length || 0,
      transactions_today: transactions.total || 0 // This would need filtering by date
    };
  }
};

// Health Check
export const healthService = {
  checkHealth: async (): Promise<{ status: string; message: string }> => {
    const response = await api.get('/health');
    return response.data;
  },

  getApiInfo: async (): Promise<{ name: string; version: string; description: string }> => {
    const response = await api.get('/');
    return response.data;
  }
}; 