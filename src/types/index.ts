// User and Authentication Types
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'officer' | 'clerk';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

// Citizen Types
export interface Citizen {
  id: number;
  id_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'Other';
  nationality: string;
  phone_number?: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  province: string;
  postal_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CitizenSearchParams {
  id_number?: string;
  name?: string;
  limit?: number;
  offset?: number;
}

// License Types
export interface License {
  id: number;
  license_number: string;
  citizen_id: number;
  citizen?: Citizen;
  license_category: 'A' | 'B' | 'C' | 'EB' | 'EC';
  issue_date: string;
  expiry_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'PENDING';
  restrictions?: string;
  endorsements?: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LicenseCreateRequest {
  citizen_id: number;
  license_category: string;
  issue_date: string;
  expiry_date: string;
  restrictions?: string;
  endorsements?: string;
}

// Application Types
export interface Application {
  id: number;
  citizen_id: number;
  citizen?: Citizen;
  license_category: 'A' | 'B' | 'C' | 'EB' | 'EC';
  application_type: 'NEW' | 'RENEWAL' | 'REPLACEMENT' | 'UPGRADE';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'DOCUMENTS_REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  submitted_date: string;
  reviewed_date?: string;
  approved_date?: string;
  reviewer_id?: number;
  reviewer?: User;
  notes?: string;
  documents?: ApplicationDocument[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplicationDocument {
  id: number;
  application_id: number;
  document_type: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface ApplicationCreateRequest {
  citizen_id: number;
  license_category: string;
  application_type: string;
  notes?: string;
}

export interface ApplicationApprovalRequest {
  notes?: string;
}

// Transaction Types
export interface Transaction {
  id: number;
  transaction_ref: string;
  transaction_type: 'LICENSE_ISSUE' | 'LICENSE_RENEWAL' | 'APPLICATION_FEE' | 'PENALTY';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  citizen_id?: number;
  citizen?: Citizen;
  license_id?: number;
  license?: License;
  application_id?: number;
  application?: Application;
  processed_by?: number;
  processor?: User;
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

// Audit Types
export interface AuditLog {
  id: number;
  user_id: number;
  user?: User;
  action: string;
  resource_type: string;
  resource_id: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// External Data Types
export interface ExternalCitizenData {
  id_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  address: string;
  status: string;
}

export interface ExternalDriverData {
  id_number: string;
  license_history: Array<{
    license_number: string;
    category: string;
    issue_date: string;
    expiry_date: string;
    status: string;
  }>;
  test_results: Array<{
    test_type: string;
    test_date: string;
    result: string;
    score?: number;
  }>;
}

export interface ExternalInfringementData {
  id_number: string;
  infringements: Array<{
    reference: string;
    date: string;
    offense: string;
    fine_amount: number;
    status: string;
    points?: number;
  }>;
  total_points: number;
  license_status: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Form Types
export interface CitizenFormData {
  id_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  phone_number?: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  province: string;
  postal_code: string;
}

export interface LicenseFormData {
  citizen_id: number;
  license_category: string;
  issue_date: string;
  expiry_date: string;
  restrictions?: string;
  endorsements?: string;
}

export interface ApplicationFormData {
  citizen_id: number;
  license_category: string;
  application_type: string;
  notes?: string;
}

// Dashboard Types
export interface DashboardStats {
  citizens_registered: number;
  licenses_issued: number;
  pending_applications: number;
  transactions_today: number;
}

export interface RecentActivity {
  id: number;
  action: string;
  user: string;
  time: string;
  details?: string;
}

export interface PendingTask {
  id: number;
  task: string;
  priority: 'High' | 'Medium' | 'Low';
  due_date?: string;
  assigned_to?: string;
} 