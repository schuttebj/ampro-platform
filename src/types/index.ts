// User and Authentication Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  role: 'ADMIN' | 'MANAGER' | 'OFFICER' | 'PRINTER' | 'VIEWER';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  location_id?: number;
  location?: Location;
  // New fields for multi-location support
  assigned_locations?: UserLocation[];
  can_print_locations?: UserLocation[];
  primary_location?: Location;
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
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'male' | 'female' | 'Other';
  nationality: string;
  marital_status?: string;
  birth_place?: string;
  phone_number?: string;
  email?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country?: string;
  photo_url?: string;
  processed_photo_path?: string;
  stored_photo_path?: string;
  photo_uploaded_at?: string;
  photo_processed_at?: string;
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

// Enhanced License Types with ISO Compliance
export interface License {
  id: number;
  license_number: string;
  citizen_id: number;
  citizen?: Citizen;
  category: 'A' | 'B' | 'C' | 'D' | 'EB' | 'EC';
  issue_date: string;
  expiry_date: string;
  status: 'PENDING_COLLECTION' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
  restrictions?: string;
  medical_conditions?: string;
  
  // ISO 18013 Compliance Fields
  iso_country_code: string;
  iso_issuing_authority: string;
  iso_document_number?: string;
  iso_version: string;
  biometric_template?: string;
  digital_signature?: string;
  security_features?: string;
  mrz_line1?: string;
  mrz_line2?: string;
  mrz_line3?: string;
  chip_serial_number?: string;
  chip_data_encrypted?: string;
  international_validity: boolean;
  vienna_convention_compliant: boolean;
  
  // File paths
  file_url?: string;
  barcode_data?: string;
  front_image_path?: string;
  back_image_path?: string;
  front_pdf_path?: string;
  back_pdf_path?: string;
  combined_pdf_path?: string;
  watermark_pdf_path?: string;
  original_photo_path?: string;
  processed_photo_path?: string;
  photo_last_updated?: string;
  
  // Generation metadata
  last_generated?: string;
  generation_version: string;
  
  // Collection tracking
  collection_point?: string;
  collected_at?: string;
  collected_by_user_id?: number;
  collected_by?: User;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LicenseCreateRequest {
  citizen_id: number;
  category: string;
  issue_date: string;
  expiry_date: string;
  restrictions?: string;
  medical_conditions?: string;
  collection_point?: string;
}

// Enhanced Application Types with New Statuses
export interface Application {
  id: number;
  citizen_id: number;
  citizen?: Citizen;
  applied_category: 'A' | 'B' | 'C' | 'D' | 'EB' | 'EC';
  application_type: 'new' | 'renewal' | 'replacement' | 'upgrade' | 'conversion';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'PENDING_DOCUMENTS' | 'PENDING_PAYMENT' | 
          'APPROVED' | 'LICENSE_GENERATED' | 'QUEUED_FOR_PRINTING' | 'PRINTING' | 
          'PRINTED' | 'SHIPPED' | 'READY_FOR_COLLECTION' | 'COMPLETED' | 
          'REJECTED' | 'CANCELLED';
  
  // Application details
  application_date: string;
  last_updated: string;
  notes?: string;
  
  // For renewals/replacements, reference the previous license
  previous_license_id?: number;
  
  // Review information
  reviewed_by?: number;
  reviewer?: User;
  review_date?: string;
  review_notes?: string;
  
  // Verification status
  documents_verified: boolean;
  medical_verified: boolean;
  payment_verified: boolean;
  payment_amount?: number;
  payment_reference?: string;
  
  // Location assignment
  location_id?: number;
  
  // Collection details
  collection_point?: string;
  preferred_collection_date?: string;
  
  // Approved license
  approved_license_id?: number;
  license?: License;
  
  created_at: string;
  updated_at: string;
}

export interface ApplicationCreateRequest {
  citizen_id: number;
  applied_category: string;
  collection_point?: string;
  preferred_collection_date?: string;
}

export interface ApplicationApprovalRequest {
  collection_point: string;
  notes?: string;
}

export interface ApplicationUpdateRequest {
  status?: 'SUBMITTED' | 'UNDER_REVIEW' | 'PENDING_DOCUMENTS' | 'PENDING_PAYMENT' | 
          'APPROVED' | 'LICENSE_GENERATED' | 'QUEUED_FOR_PRINTING' | 'PRINTING' | 
          'PRINTED' | 'SHIPPED' | 'READY_FOR_COLLECTION' | 'COMPLETED' | 
          'REJECTED' | 'CANCELLED';
  review_notes?: string;
  reviewed_by?: number;
  review_date?: string;
  documents_verified?: boolean;
  medical_verified?: boolean;
  payment_verified?: boolean;
  payment_amount?: number;
  payment_reference?: string;
  collection_point?: string;
  preferred_collection_date?: string;
}

// Print Job Types
export interface PrintJob {
  id: number;
  application_id: number;
  license_id: number;
  status: 'QUEUED' | 'ASSIGNED' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: number;
  front_pdf_path: string;
  back_pdf_path: string;
  combined_pdf_path?: string;
  queued_at: string;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
  assigned_to_user_id?: number;
  assigned_to?: User;
  printed_by_user_id?: number;
  printed_by?: User;
  printer_name?: string;
  copies_printed: number;
  print_notes?: string;
  // New assignment tracking fields
  auto_assigned?: boolean;
  assignment_rule?: string;
  source_location_id?: number;
  source_location?: Location;
  target_location_id?: number;
  target_location?: Location;
  printer_id?: number;
  printer?: Printer;
}

export interface PrintJobCreate {
  application_id: number;
  license_id: number;
  front_pdf_path: string;
  back_pdf_path: string;
  combined_pdf_path?: string;
  priority?: number;
}

export interface PrintJobAssignment {
  assigned_to_user_id: number;
  printer_name?: string;
}

export interface PrintJobStart {
  started_at: string;
  printer_name?: string;
}

export interface PrintJobComplete {
  completed_at: string;
  success: boolean;
  copies_printed?: number;
  notes?: string;
}

export interface PrintQueue {
  print_jobs: PrintJob[];
  total_count: number;
  skip: number;
  limit: number;
}

export interface PrintJobStatistics {
  queued: number;
  assigned: number;
  printing: number;
  completed: number;
  failed: number;
  cancelled: number;
  total: number;
}

// Shipping Types
export interface ShippingRecord {
  id: number;
  application_id: number;
  license_id: number;
  print_job_id: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  tracking_number?: string;
  collection_point: string;
  collection_address?: string;
  shipped_at?: string;
  delivered_at?: string;
  shipped_by_user_id?: number;
  shipped_by?: User;
  received_by_user_id?: number;
  received_by?: User;
  shipping_method?: string;
  shipping_notes?: string;
}

export interface ShippingRecordCreate {
  application_id: number;
  license_id: number;
  print_job_id: number;
  collection_point: string;
  collection_address?: string;
}

export interface ShippingAction {
  user_id: number;
  tracking_number?: string;
  shipping_method?: string;
  shipped_at?: string;
  notes?: string;
}

export interface ShippingStatistics {
  pending: number;
  in_transit: number;
  delivered: number;
  failed: number;
  total: number;
}

// Workflow Status Types
export interface WorkflowStatus {
  application_id: number;
  application_status: string;
  last_updated: string;
  collection_point?: string;
  license_id?: number;
  license_status?: string;
  print_job_id?: number;
  print_job_status?: string;
  shipping_id?: number;
  shipping_status?: string;
}

export interface CollectionPointSummary {
  collection_point: string;
  ready_count: number;
  pending_count: number;
}

// Enhanced Printer Management Types
export type PrinterType = 'CARD_PRINTER' | 'DOCUMENT_PRINTER' | 'PHOTO_PRINTER' | 
                          'THERMAL_PRINTER' | 'INKJET_PRINTER' | 'LASER_PRINTER';

export type PrinterStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'OFFLINE' | 'ERROR';

export type PrintingType = 'LOCAL' | 'CENTRALIZED' | 'HYBRID' | 'DISABLED';

export interface Printer {
  id: number;
  name: string;
  code: string;
  printer_type: PrinterType;
  model?: string;
  manufacturer?: string;
  serial_number?: string;
  ip_address?: string;
  status: PrinterStatus;
  capabilities?: Record<string, any>;
  settings?: Record<string, any>;
  location_id?: number;
  location?: Location;
  notes?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PrinterCreate {
  name: string;
  code: string;
  printer_type: PrinterType;
  model?: string;
  manufacturer?: string;
  serial_number?: string;
  ip_address?: string;
  status?: PrinterStatus;
  capabilities?: Record<string, any>;
  settings?: Record<string, any>;
  location_id?: number;
  notes?: string;
  last_maintenance?: string;
  next_maintenance?: string;
}

export interface PrinterUpdate {
  name?: string;
  code?: string;
  printer_type?: PrinterType;
  model?: string;
  manufacturer?: string;
  serial_number?: string;
  ip_address?: string;
  status?: PrinterStatus;
  capabilities?: Record<string, any>;
  settings?: Record<string, any>;
  location_id?: number;
  notes?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  is_active?: boolean;
}

export interface PrinterSearchParams {
  location_id?: number;
  status?: PrinterStatus;
  printer_type?: PrinterType;
  search?: string;
  skip?: number;
  limit?: number;
}

// ISO Compliance Types
export interface ISOComplianceInfo {
  license_id: number;
  license_number: string;
  iso_compliant: boolean;
  iso_version: string;
  iso_country_code: string;
  iso_issuing_authority: string;
  iso_document_number?: string;
  international_validity: boolean;
  vienna_convention_compliant: boolean;
  mrz_data: {
    line1?: string;
    line2?: string;
    line3?: string;
  };
  security_features?: string;
  chip_data: {
    serial_number?: string;
    has_encrypted_data: boolean;
  };
  biometric_data: {
    has_template: boolean;
  };
  digital_signature: {
    has_signature: boolean;
  };
}

export interface ISOValidationResult {
  license_id: number;
  license_number: string;
  validation_result: {
    compliant: boolean;
    issues: string[];
    warnings: string[];
    score: number;
  };
  timestamp: string;
}

// Transaction Types
export interface Transaction {
  id: number;
  transaction_ref: string;
  transaction_type: 'license_issuance' | 'license_renewal' | 'license_replacement' | 'application_submission' | 'application_approval' | 'application_rejection' | 'fee_payment' | 'document_upload';
  amount?: number;
  currency?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  citizen_id?: number;
  citizen?: Citizen;
  license_id?: number;
  license?: License;
  application_id?: number;
  application?: Application;
  user_id?: number;
  user?: User;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  transaction_metadata?: Record<string, any>;
  initiated_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Audit Types
export interface AuditLog {
  id: number;
  user_id?: number;
  user?: User;
  ip_address?: string;
  user_agent?: string;
  action_type: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PRINT' | 'EXPORT' | 'VERIFY' | 'GENERATE';
  resource_type: 'USER' | 'CITIZEN' | 'LICENSE' | 'APPLICATION' | 'LOCATION' | 'FILE' | 'SYSTEM';
  resource_id?: string;
  timestamp: string;
  description?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
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

export interface CitizenFormData {
  id_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  marital_status?: string;
  birth_place?: string;
  phone_number?: string;
  email?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country?: string;
}

export interface LicenseFormData {
  citizen_id: number;
  category: string;
  issue_date: string;
  expiry_date: string;
  restrictions?: string;
  medical_conditions?: string;
  collection_point?: string;
}

export interface ApplicationFormData {
  citizen_id: number;
  applied_category: string;
  collection_point?: string;
  preferred_collection_date?: string;
}

export interface DashboardStats {
  citizens: {
    total: number;
    new_today: number;
    active: number;
  };
  applications: {
    total: number;
    pending_review: number;
    approved_today: number;
    rejected_today: number;
    pending_documents: number;
    pending_payment: number;
  };
  licenses: {
    total_active: number;
    issued_today: number;
    expiring_30_days: number;
    suspended: number;
    pending_collection: number;
  };
  print_jobs: {
    queued: number;
    printing: number;
    completed_today: number;
    failed: number;
  };
  shipping: {
    pending: number;
    in_transit: number;
    delivered_today: number;
    failed: number;
  };
  compliance: {
    compliant_rate: number;
    critical_issues: number;
    pending_validation: number;
  };
  system_performance: {
    avg_processing_time: number;
    uptime_percentage: number;
    queue_health: 'good' | 'warning' | 'critical';
  };
  last_updated: string;
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

export interface LicenseFiles {
  front_image_path?: string;
  back_image_path?: string;
  front_pdf_path?: string;
  back_pdf_path?: string;
  combined_pdf_path?: string;
  watermark_pdf_path?: string;
  front_image_url?: string;
  back_image_url?: string;
  front_pdf_url?: string;
  back_pdf_url?: string;
  combined_pdf_url?: string;
  watermark_pdf_url?: string;
  processed_photo_url?: string;
  generation_timestamp?: string;
  generator_version?: string;
}

export interface FileInfo {
  path: string;
  url: string;
  size_bytes: number;
  exists: boolean;
}

export interface LicenseFilesInfo {
  license_id: number;
  license_number: string;
  last_generated?: string;
  generation_version?: string;
  files: {
    front_image_path?: FileInfo;
    back_image_path?: FileInfo;
    front_pdf_path?: FileInfo;
    back_pdf_path?: FileInfo;
    combined_pdf_path?: FileInfo;
    watermark_pdf_path?: FileInfo;
  };
}

export interface LicenseGenerationResponse {
  message: string;
  license_id: number;
  license_number: string;
  files: LicenseFiles;
  cached: boolean;
  iso_compliant?: boolean;
}

export interface PhotoUpdateRequest {
  photo_url: string;
}

export interface PhotoUpdateResponse {
  message: string;
  license_id: number;
  citizen_id: number;
  original_photo_path: string;
  processed_photo_path: string;
  regeneration_required: boolean;
}

export interface StorageStats {
  total_files: number;
  total_size_bytes: number;
  license_files: number;
  photo_files: number;
  temp_files: number;
  total_size_formatted: string;
  license_size_formatted: string;
  photo_size_formatted: string;
  temp_size_formatted: string;
}

export interface StorageCleanupResponse {
  message: string;
  files_removed: number;
  space_freed_bytes: number;
  space_freed_formatted: string;
}

export type LicenseFileType = 'front_image' | 'back_image' | 'front_pdf' | 'back_pdf' | 'combined_pdf' | 'watermark_pdf';

// New User-Location Management Types
export interface UserLocation {
  user_id: number;
  location_id: number;
  user?: User;
  location?: Location;
  is_primary: boolean;
  can_print: boolean;
  created_at: string;
}

export interface UserLocationCreate {
  user_id: number;
  location_id: number;
  is_primary?: boolean;
  can_print?: boolean;
}

export interface UserLocationUpdate {
  is_primary?: boolean;
  can_print?: boolean;
}

// Enhanced User Management Types
export interface UserCreate {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'ADMIN' | 'MANAGER' | 'OFFICER' | 'PRINTER' | 'VIEWER';
  password: string;
  location_id?: number;
  is_active?: boolean;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'ADMIN' | 'MANAGER' | 'OFFICER' | 'PRINTER' | 'VIEWER';
  password?: string;
  location_id?: number;
  is_active?: boolean;
}

export interface UserSearchParams {
  role?: 'ADMIN' | 'MANAGER' | 'OFFICER' | 'PRINTER' | 'VIEWER';
  location_id?: number;
  search?: string;
  can_print?: boolean;
  skip?: number;
  limit?: number;
}

// Enhanced Location Types
export interface Location {
  id: number;
  name: string;
  code: string;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // New printing configuration fields
  printing_enabled?: boolean;
  printing_type?: 'local' | 'centralized' | 'hybrid' | 'disabled';
  default_print_destination_id?: number;
  default_print_destination?: Location;
  auto_assign_print_jobs?: boolean;
  max_print_jobs_per_user?: number;
  print_job_priority_default?: number;
  // Related data
  printers?: Printer[];
  assigned_users?: UserLocation[];
}

// Hardware Types
export type HardwareType = 'WEBCAM' | 'SECURITY_CAMERA' | 'FINGERPRINT_SCANNER' | 
                          'IRIS_SCANNER' | 'FACE_RECOGNITION' | 'CARD_READER' | 
                          'SIGNATURE_PAD' | 'DOCUMENT_SCANNER' | 'BARCODE_SCANNER' | 
                          'THERMAL_SENSOR' | 'OTHER';

export type HardwareStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'OFFLINE' | 'ERROR' | 'CALIBRATING';

export interface Hardware {
  id: number;
  name: string;
  code: string;
  hardware_type: HardwareType;
  model?: string;
  manufacturer?: string;
  serial_number?: string;
  ip_address?: string;
  usb_port?: string;
  device_id?: string;
  status: HardwareStatus;
  capabilities?: Record<string, any>;
  settings?: Record<string, any>;
  driver_info?: Record<string, any>;
  location_id?: number;
  location?: Location;
  notes?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  last_online?: string;
  last_used?: string;
  usage_count: number;
  error_count: number;
  last_error?: string;
  last_error_time?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface HardwareCreate {
  name: string;
  code: string;
  hardware_type: HardwareType;
  model?: string;
  manufacturer?: string;
  serial_number?: string;
  ip_address?: string;
  usb_port?: string;
  device_id?: string;
  status?: HardwareStatus;
  capabilities?: Record<string, any>;
  settings?: Record<string, any>;
  driver_info?: Record<string, any>;
  location_id?: number;
  notes?: string;
  last_maintenance?: string;
  next_maintenance?: string;
}

export interface HardwareUpdate {
  name?: string;
  code?: string;
  hardware_type?: HardwareType;
  model?: string;
  manufacturer?: string;
  serial_number?: string;
  ip_address?: string;
  usb_port?: string;
  device_id?: string;
  status?: HardwareStatus;
  capabilities?: Record<string, any>;
  settings?: Record<string, any>;
  driver_info?: Record<string, any>;
  location_id?: number;
  notes?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  is_active?: boolean;
}

export interface HardwareSearchParams {
  location_id?: number;
  status?: HardwareStatus;
  hardware_type?: HardwareType;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface HardwareStatusUpdate {
  status: HardwareStatus;
  notes?: string;
}

export interface WebcamCaptureRequest {
  hardware_id: number;
  citizen_id: number;
  quality?: 'high' | 'medium' | 'low';
  format?: 'jpeg' | 'png';
  metadata?: Record<string, any>;
}

export interface WebcamCaptureResponse {
  success: boolean;
  photo_url?: string;
  stored_photo_path?: string;
  processed_photo_path?: string;
  error_message?: string;
  hardware_id: number;
  citizen_id: number;
  captured_at: string;
}

export interface HardwareStatistics {
  total_hardware: number;
  active_hardware: number;
  offline_hardware: number;
  maintenance_hardware: number;
  error_hardware: number;
  by_type: Record<string, number>;
  by_location: Record<string, number>;
  recent_usage: any[];
} 