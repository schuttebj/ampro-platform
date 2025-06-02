import api from './api';
import {
  User,
  UserLocation,
  UserCreate,
  UserUpdate,
  UserSearchParams,
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
  DashboardStats,
  LicenseFiles,
  LicenseFilesInfo,
  LicenseGenerationResponse,
  PhotoUpdateRequest,
  PhotoUpdateResponse,
  StorageStats,
  StorageCleanupResponse,
  LicenseFileType,
  PrintJob,
  PrintJobAssignment,
  PrintJobStart,
  PrintJobComplete,
  PrintQueue,
  PrintJobStatistics,
  ShippingRecord,
  ShippingAction,
  ShippingStatistics,
  WorkflowStatus,
  Printer,
  PrinterCreate,
  PrinterUpdate,
  PrinterSearchParams,
  PrinterType,
  PrinterStatus,
  ISOComplianceInfo,
  ISOValidationResult,
  ApplicationUpdateRequest
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
  getAll: async (params?: { skip?: number; limit?: number }): Promise<Citizen[]> => {
    const response = await api.get('/citizens/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Citizen> => {
    const response = await api.get(`/citizens/${id}`);
    return response.data;
  },

  create: async (data: Partial<Citizen>): Promise<Citizen> => {
    const response = await api.post('/citizens/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Citizen>): Promise<Citizen> => {
    const response = await api.put(`/citizens/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<Citizen> => {
    const response = await api.delete(`/citizens/${id}`);
    return response.data;
  },

  search: async (params: {
    id_number?: string;
    first_name?: string;
    last_name?: string;
    skip?: number;
    limit?: number;
  }): Promise<Citizen[]> => {
    const response = await api.get('/citizens/search', { params });
    return response.data;
  },

  getLicenses: async (id: number): Promise<{ citizen: Citizen; licenses: License[] }> => {
    const response = await api.get(`/citizens/${id}/licenses`);
    return response.data;
  },

  // Photo management endpoints
  updatePhoto: async (id: number, photoUrl: string): Promise<{ 
    message: string; 
    citizen_id: number; 
    original_photo_path: string; 
    processed_photo_path: string; 
    photo_url: string; 
  }> => {
    const response = await api.post(`/citizens/${id}/photo/update`, null, {
      params: { photo_url: photoUrl }
    });
    return response.data;
  },

  deletePhoto: async (id: number): Promise<{ message: string; citizen_id: string }> => {
    const response = await api.delete(`/citizens/${id}/photo`);
    return response.data;
  },

  getPhotoStatus: async (id: number): Promise<{
    citizen_id: number;
    has_photo_url: boolean;
    photo_url?: string;
    stored_photo_path?: string;
    processed_photo_path?: string;
    original_file_exists: boolean;
    processed_file_exists: boolean;
    photo_uploaded_at?: string;
    photo_processed_at?: string;
    needs_processing: boolean;
  }> => {
    const response = await api.get(`/citizens/${id}/photo/status`);
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

  printLicense: async (licenseId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/licenses/${licenseId}/print`);
    return response.data;
  },

  // New File-based License Generation Methods
  generateLicenseFiles: async (licenseId: number, forceRegenerate = false): Promise<LicenseGenerationResponse> => {
    const response = await api.post(`/licenses/${licenseId}/generate`, {
      force_regenerate: forceRegenerate
    });
    return response.data;
  },

  getLicenseFiles: async (licenseId: number): Promise<LicenseFilesInfo> => {
    const response = await api.get(`/licenses/${licenseId}/files`);
    return response.data;
  },

  downloadLicenseFile: async (licenseId: number, fileType: LicenseFileType): Promise<Blob> => {
    const response = await api.get(`/licenses/${licenseId}/download/${fileType}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  updateLicensePhoto: async (licenseId: number, photoRequest: PhotoUpdateRequest): Promise<PhotoUpdateResponse> => {
    const response = await api.post(`/licenses/${licenseId}/photo/update`, photoRequest);
    return response.data;
  },

  getStorageStats: async (): Promise<StorageStats> => {
    const response = await api.get('/licenses/storage/stats');
    return response.data;
  },

  cleanupStorage: async (olderThanHours = 24): Promise<StorageCleanupResponse> => {
    const response = await api.post(`/licenses/storage/cleanup?older_than_hours=${olderThanHours}`);
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

  updateApplication: async (applicationId: number, applicationData: Partial<ApplicationUpdateRequest>): Promise<Application> => {
    const response = await api.put(`/applications/${applicationId}`, applicationData);
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

// Enhanced Workflow Services
export const workflowService = {
  // Application Workflow
  approveApplication: async (applicationId: number, approvalData: ApplicationApprovalRequest): Promise<any> => {
    // Use the simple approval endpoint which works reliably
    const approvalResponse = await api.post(`/applications/${applicationId}/approve`);
    
    // If successful and we have collection point, update the license
    if (approvalResponse.data.license_id && approvalData.collection_point) {
      try {
        await api.put(`/licenses/${approvalResponse.data.license_id}`, {
          collection_point: approvalData.collection_point
        });
      } catch (err) {
        console.warn('License updated but failed to set collection point:', err);
      }
    }
    
    return approvalResponse.data;
  },

  // Print Job Management
  getPrintQueue: async (skip = 0, limit = 100): Promise<PrintQueue> => {
    const response = await api.get('/workflow/print-queue', {
      params: { skip, limit }
    });
    return response.data;
  },

  assignPrintJob: async (printJobId: number, assignment: PrintJobAssignment): Promise<PrintJob> => {
    const response = await api.post(`/workflow/print-jobs/${printJobId}/assign`, assignment);
    return response.data;
  },

  startPrintJob: async (printJobId: number, startData: PrintJobStart): Promise<PrintJob> => {
    const response = await api.post(`/workflow/print-jobs/${printJobId}/start`, startData);
    return response.data;
  },

  completePrintJob: async (printJobId: number, completeData: PrintJobComplete): Promise<any> => {
    const response = await api.post(`/workflow/print-jobs/${printJobId}/complete`, completeData);
    return response.data;
  },

  printLicenseCard: async (printJobId: number, printerName?: string, copies = 1): Promise<any> => {
    const response = await api.post(`/workflow/print-jobs/${printJobId}/print`, {
      printer_name: printerName,
      copies
    });
    return response.data;
  },

  // Shipping Management
  getPendingShipments: async (skip = 0, limit = 100): Promise<ShippingRecord[]> => {
    const response = await api.get('/workflow/shipping/pending', {
      params: { skip, limit }
    });
    return response.data;
  },

  shipLicense: async (shippingId: number, shipData: ShippingAction): Promise<ShippingRecord> => {
    const response = await api.post(`/workflow/shipping/${shippingId}/ship`, shipData);
    return response.data;
  },

  deliverLicense: async (shippingId: number, deliverData: ShippingAction): Promise<any> => {
    const response = await api.post(`/workflow/shipping/${shippingId}/deliver`, deliverData);
    return response.data;
  },

  // Collection Management
  getReadyForCollection: async (collectionPoint: string, skip = 0, limit = 100): Promise<any[]> => {
    const response = await api.get(`/workflow/collection-points/${collectionPoint}/ready`, {
      params: { skip, limit }
    });
    return response.data;
  },

  collectLicense: async (licenseId: number): Promise<any> => {
    const response = await api.post(`/workflow/licenses/${licenseId}/collect`);
    return response.data;
  },

  // Printer Management
  getAvailablePrinters: async (): Promise<Printer[]> => {
    const response = await api.get('/workflow/printers');
    return response.data;
  },

  getDefaultPrinter: async (): Promise<{ default_printer: string; available: boolean }> => {
    const response = await api.get('/workflow/printers/default');
    return response.data;
  },

  // Statistics
  getPrintJobStatistics: async (): Promise<PrintJobStatistics> => {
    const response = await api.get('/workflow/statistics/print-jobs');
    return response.data;
  },

  getShippingStatistics: async (): Promise<ShippingStatistics> => {
    const response = await api.get('/workflow/statistics/shipping');
    return response.data;
  },

  getWorkflowStatus: async (applicationId: number): Promise<WorkflowStatus> => {
    const response = await api.get(`/workflow/workflow/status/${applicationId}`);
    return response.data;
  },

  // Manual Print Job Management (for testing)
  getApprovedApplicationsWithoutPrintJobs: async (): Promise<any[]> => {
    const response = await api.get('/workflow/applications/approved-without-print-jobs');
    return response.data;
  },

  createPrintJobForApplication: async (applicationId: number): Promise<any> => {
    const response = await api.post(`/workflow/applications/${applicationId}/create-print-job`);
    return response.data;
  },

  createTestPrintJob: async (): Promise<any> => {
    const response = await api.post('/workflow/test/create-test-print-job');
    return response.data;
  },

  // Get printer users for assignment dropdown
  getPrinterUsers: async (locationId?: number): Promise<User[]> => {
    const params = locationId ? { location_id: locationId } : undefined;
    const response = await api.get('/workflow/printer-users', { params });
    return response.data;
  }
};

// Printer Services (for printer operators with PRINTER role)
export const printerService = {
  getDashboard: async (): Promise<any> => {
    const response = await api.get('/printer/dashboard');
    return response.data;
  },

  getPrintQueue: async (skip = 0, limit = 50): Promise<{ print_jobs: any[]; total_count: number; skip: number; limit: number }> => {
    const response = await api.get('/printer/queue', {
      params: { skip, limit }
    });
    return response.data;
  },

  getAssignedJobs: async (): Promise<any[]> => {
    const response = await api.get('/printer/jobs/assigned');
    return response.data;
  },

  startPrintJob: async (printJobId: number, startData: { printer_name: string }): Promise<any> => {
    const response = await api.post(`/printer/jobs/${printJobId}/start`, startData);
    return response.data;
  },

  completePrintJob: async (printJobId: number, completeData: { quality_check_passed: boolean; notes?: string }): Promise<any> => {
    const response = await api.post(`/printer/jobs/${printJobId}/complete`, completeData);
    return response.data;
  },

  getApplicationForPrintJob: async (printJobId: number): Promise<any> => {
    const response = await api.get(`/printer/jobs/${printJobId}/application`);
    return response.data;
  },

  getStatistics: async (): Promise<any> => {
    const response = await api.get('/printer/statistics');
    return response.data;
  },

  getAvailablePrinters: async (): Promise<{ name: string; status: string }[]> => {
    const response = await api.get('/printer/printers');
    return response.data;
  }
};

// ISO Compliance Services
export const isoComplianceService = {
  getLicenseISOCompliance: async (licenseId: number): Promise<ISOComplianceInfo> => {
    const response = await api.get(`/workflow/licenses/${licenseId}/iso-compliance`);
    return response.data;
  },

  validateLicenseISOCompliance: async (licenseId: number): Promise<ISOValidationResult> => {
    const response = await api.post(`/workflow/licenses/${licenseId}/validate-iso`);
    return response.data;
  },

  regenerateISOComplianceData: async (licenseId: number): Promise<any> => {
    const response = await api.post(`/workflow/licenses/${licenseId}/regenerate-iso`);
    return response.data;
  }
};

// Transaction Services
export const transactionService = {
  getTransactions: async (filters?: {
    skip?: number;
    limit?: number;
    transaction_type?: string;
    status?: string;
    citizen_id?: number;
    license_id?: number;
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
  }): Promise<PaginatedResponse<Transaction>> => {
    const response = await api.get('/transactions/', { params: filters });
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

  getCitizenTransactions: async (citizenId: number, filters?: {
    skip?: number;
    limit?: number;
  }): Promise<Transaction[]> => {
    const response = await api.get(`/transactions/citizen/${citizenId}`, { params: filters });
    return response.data;
  },

  getLicenseTransactions: async (licenseId: number, filters?: {
    skip?: number;
    limit?: number;
  }): Promise<Transaction[]> => {
    const response = await api.get(`/transactions/license/${licenseId}`, { params: filters });
    return response.data;
  },

  exportTransactions: async (filters?: {
    transaction_type?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    format?: 'csv' | 'excel';
  }): Promise<Blob> => {
    const response = await api.get('/transactions/export', { 
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }
};

// Audit Services
export const auditService = {
  getAuditLogs: async (filters?: {
    skip?: number;
    limit?: number;
    user_id?: number;
    action_type?: string;
    resource_type?: string;
    resource_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<PaginatedResponse<AuditLog>> => {
    const response = await api.get('/audit/', { params: filters });
    return response.data;
  },

  getAuditLog: async (auditId: number): Promise<AuditLog> => {
    const response = await api.get(`/audit/${auditId}`);
    return response.data;
  },

  getUserAuditLogs: async (userId: number, filters?: {
    skip?: number;
    limit?: number;
    action_type?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<AuditLog[]> => {
    const response = await api.get(`/audit/user/${userId}`, { params: filters });
    return response.data;
  },

  getActionAuditLogs: async (actionType: string, filters?: {
    skip?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<AuditLog[]> => {
    const response = await api.get(`/audit/action/${actionType}`, { params: filters });
    return response.data;
  },

  getResourceAuditLogs: async (resourceType: string, filters?: {
    skip?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<AuditLog[]> => {
    const response = await api.get(`/audit/resource/${resourceType}`, { params: filters });
    return response.data;
  },

  getResourceIdAuditLogs: async (resourceType: string, resourceId: string, filters?: {
    skip?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<AuditLog[]> => {
    const response = await api.get(`/audit/resource/${resourceType}/${resourceId}`, { params: filters });
    return response.data;
  },

  getDateRangeAuditLogs: async (startDate: string, endDate: string, filters?: {
    skip?: number;
    limit?: number;
    user_id?: number;
    action_type?: string;
    resource_type?: string;
  }): Promise<AuditLog[]> => {
    const response = await api.get('/audit/date-range', { 
      params: { 
        start_date: startDate,
        end_date: endDate,
        ...filters
      }
    });
    return response.data;
  },

  exportAuditLogs: async (filters?: {
    user_id?: number;
    action_type?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
    format?: 'csv' | 'excel';
  }): Promise<Blob> => {
    const response = await api.get('/audit/export', { 
      params: filters,
      responseType: 'blob'
    });
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
      citizenService.getAll({ limit: 1 }),
      licenseService.getLicenses(),
      applicationService.getPendingApplications(),
      transactionService.getTransactions()
    ]);

    return {
      citizens_registered: citizens.length || 0,
      licenses_issued: licenses.total || 0,
      pending_applications: applications.length || 0,
      transactions_today: transactions.total || 0 // This would need filtering by date
    };
  }
};

// File Upload Services
export const fileService = {
  uploadImage: async (file: File, type: 'citizen_photo' | 'document' = 'citizen_photo'): Promise<{ file_url: string; file_path: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', type);
    
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteFile: async (filePath: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/files/delete', {
      data: { file_path: filePath }
    });
    return response.data;
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

// Location Services
export const locationService = {
  getLocations: async (): Promise<any[]> => {
    const response = await api.get('/locations/');
    return response.data;
  },

  getActiveLocations: async (): Promise<any[]> => {
    const response = await api.get('/locations/active');
    return response.data;
  },

  getLocationsAcceptingCollections: async (): Promise<any[]> => {
    const response = await api.get('/locations/accepting-collections');
    return response.data;
  },

  getLocation: async (locationId: number): Promise<any> => {
    const response = await api.get(`/locations/${locationId}`);
    return response.data;
  }
};

// Admin Services - User Management
export const adminUserService = {
  getUsers: async (params?: {
    role?: string;
    location_id?: number;
    search?: string;
    can_print?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<User[]> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  createUser: async (userData: {
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    password: string;
    location_id?: number;
    is_active?: boolean;
  }): Promise<User> => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (userId: number, userData: Partial<{
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    password: string;
    location_id: number;
    is_active: boolean;
  }>): Promise<User> => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  getUser: async (userId: number): Promise<User> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  getPrinterUsers: async (locationId?: number): Promise<User[]> => {
    const params = locationId ? { location_id: locationId } : undefined;
    const response = await api.get('/admin/users/printers', { params });
    return response.data;
  }
};

// Admin Services - User-Location Management
export const adminUserLocationService = {
  assignUserToLocation: async (userId: number, locationId: number, options?: {
    is_primary?: boolean;
    can_print?: boolean;
  }): Promise<any> => {
    const response = await api.post(`/admin/users/${userId}/locations/${locationId}`, null, {
      params: options
    });
    return response.data;
  },

  removeUserFromLocation: async (userId: number, locationId: number): Promise<any> => {
    const response = await api.delete(`/admin/users/${userId}/locations/${locationId}`);
    return response.data;
  },

  setPrimaryLocation: async (userId: number, locationId: number): Promise<any> => {
    const response = await api.put(`/admin/users/${userId}/locations/${locationId}/primary`);
    return response.data;
  },

  updatePrintPermission: async (userId: number, locationId: number, canPrint: boolean): Promise<any> => {
    const response = await api.put(`/admin/users/${userId}/locations/${locationId}/print-permission`, null, {
      params: { can_print: canPrint }
    });
    return response.data;
  },

  getUserLocations: async (userId: number): Promise<any[]> => {
    const response = await api.get(`/admin/users/${userId}/locations`);
    return response.data;
  },

  getLocationUsers: async (locationId: number): Promise<any[]> => {
    const response = await api.get(`/admin/locations/${locationId}/users`);
    return response.data;
  }
};

// Admin Services - Printer Management
export const adminPrinterService = {
  getPrinters: async (params?: {
    location_id?: number;
    status?: string;
    printer_type?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<Printer[]> => {
    const response = await api.get('/admin/printers', { params });
    return response.data;
  },

  createPrinter: async (printerData: {
    name: string;
    code: string;
    printer_type: string;
    model?: string;
    manufacturer?: string;
    serial_number?: string;
    ip_address?: string;
    status?: string;
    capabilities?: Record<string, any>;
    settings?: Record<string, any>;
    location_id?: number;
    notes?: string;
    last_maintenance?: string;
    next_maintenance?: string;
  }): Promise<Printer> => {
    const response = await api.post('/admin/printers', printerData);
    return response.data;
  },

  updatePrinter: async (printerId: number, printerData: Partial<{
    name: string;
    code: string;
    printer_type: string;
    model: string;
    manufacturer: string;
    serial_number: string;
    ip_address: string;
    status: string;
    capabilities: Record<string, any>;
    settings: Record<string, any>;
    location_id: number;
    notes: string;
    last_maintenance: string;
    next_maintenance: string;
    is_active: boolean;
  }>): Promise<Printer> => {
    const response = await api.put(`/admin/printers/${printerId}`, printerData);
    return response.data;
  },

  getPrinter: async (printerId: number): Promise<Printer> => {
    const response = await api.get(`/admin/printers/${printerId}`);
    return response.data;
  },

  deletePrinter: async (printerId: number): Promise<void> => {
    await api.delete(`/admin/printers/${printerId}`);
  },

  updatePrinterStatus: async (printerId: number, status: string, notes?: string): Promise<any> => {
    const response = await api.put(`/admin/printers/${printerId}/status`, null, {
      params: { status, notes }
    });
    return response.data;
  },

  assignPrinterToLocation: async (printerId: number, locationId: number): Promise<any> => {
    const response = await api.put(`/admin/printers/${printerId}/location/${locationId}`);
    return response.data;
  }
}; 