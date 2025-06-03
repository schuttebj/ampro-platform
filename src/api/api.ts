// @ts-ignore - Import axios
import axios from 'axios';
import { Hardware, HardwareCreate, HardwareUpdate, HardwareSearchParams, HardwareStatusUpdate, WebcamCaptureResponse } from '../types';

// Set backend URL to the Render deployment which seems to be the actual backend
const API_URL = 'https://ampro-licence.onrender.com';

console.log('Using API URL:', API_URL); // Add debug log

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Allow cookies to be sent with requests (important for CORS)
});

// Function to directly get the full API URL for any endpoint
export const getFullApiUrl = (endpoint: string): string => {
  return `${API_URL}/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Add authorization header if token exists
const token = localStorage.getItem('accessToken');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Helper function to create form-urlencoded data
export const createFormData = (data: Record<string, any>): URLSearchParams => {
  const formData = new URLSearchParams();
  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  }
  return formData;
};

// Add interceptor for token expiration
api.interceptors.response.use(
  // @ts-ignore - Response parameter
  (response) => response,
  // @ts-ignore - Error parameter
  async (error) => {
    // If the error is a network error or the server doesn't respond, just reject
    if (!error.response) {
      return Promise.reject(error);
    }
    
    // @ts-ignore - Allow _retry property
    const originalRequest = error.config;
    
    // Only handle 401 errors, and don't retry if we've already tried once
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("Token expired or invalid - redirecting to login");
      originalRequest._retry = true;
      
      // Clear all stored tokens immediately
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      
      // Redirect to login page
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle other authentication-related errors
    if (error.response?.status === 403) {
      console.warn("Access forbidden - insufficient permissions");
    }
    
    return Promise.reject(error);
  }
);

// Function to test API connection with multiple possible URLs
export const testApiConnection = async () => {
  // Test both frontend and backend URLs to diagnose the issue
  const urls = [
    // Test backend (Render) endpoints
    `${API_URL}/api/v1/health`,
    `${API_URL}/api/v1`,
    `${API_URL}/api/v1/auth/login`,
    // Test if the frontend is proxying to backend
    `${window.location.origin}/api/v1/health`
  ];
  
  console.log('Testing API connections...');
  
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        console.log(`Testing URL: ${url}`);
        // Use GET for health checks, OPTIONS for login to check if it accepts POST
        const method = url.includes('/auth/login') ? 'OPTIONS' : 'GET';
        
        // Don't include credentials for diagnostic tests to avoid CORS issues
        const response = await fetch(url, { 
          method,
          mode: 'cors',
          // Do not include credentials for diagnostics
          credentials: 'omit' 
        });
        
        return { 
          url, 
          method,
          status: response.status, 
          ok: response.ok,
          statusText: response.statusText
        };
      } catch (error: any) {
        console.error(`Error connecting to ${url}:`, error);
        return { url, error: error.message || 'Unknown error' };
      }
    })
  );
  
  console.log('API connection test results:', results);
  return results;
};

export default api;

// Hardware API Functions
export const hardwareApi = {
  // Get all hardware devices with optional filtering
  getAll: async (params?: HardwareSearchParams): Promise<Hardware[]> => {
    const response = await api.get('/hardware/', { params });
    return response.data;
  },

  // Get hardware device by ID
  getById: async (id: number): Promise<Hardware> => {
    const response = await api.get(`/hardware/${id}`);
    return response.data;
  },

  // Create new hardware device
  create: async (data: HardwareCreate): Promise<Hardware> => {
    const response = await api.post('/hardware/', data);
    return response.data;
  },

  // Update hardware device
  update: async (id: number, data: HardwareUpdate): Promise<Hardware> => {
    const response = await api.put(`/hardware/${id}`, data);
    return response.data;
  },

  // Delete hardware device
  delete: async (id: number): Promise<void> => {
    await api.delete(`/hardware/${id}`);
  },

  // Update hardware status
  updateStatus: async (id: number, data: HardwareStatusUpdate): Promise<Hardware> => {
    const response = await api.put(`/hardware/${id}/status`, data);
    return response.data;
  },

  // Get hardware statistics
  getStatistics: async (): Promise<any> => {
    const response = await api.get('/hardware/statistics');
    return response.data;
  },

  // Test hardware device
  test: async (id: number): Promise<any> => {
    const response = await api.post(`/hardware/${id}/test`);
    return response.data;
  },

  // Get webcam-specific functions
  webcam: {
    // Detect available webcams
    detect: async (): Promise<any[]> => {
      const response = await api.get('/hardware/webcam/detect');
      return response.data;
    },

    // Capture photo using webcam
    capture: async (params: {
      hardware_id: number;
      citizen_id: number;
      quality?: string;
      format?: string;
    }): Promise<WebcamCaptureResponse> => {
      const response = await api.post('/hardware/webcam/capture', params);
      return response.data;
    },

    // Get webcam status
    getStatus: async (hardwareId: number): Promise<any> => {
      const response = await api.get(`/hardware/webcam/${hardwareId}/status`);
      return response.data;
    },

    // Get webcam settings
    getSettings: async (hardwareId: number): Promise<any> => {
      const response = await api.get(`/hardware/webcam/${hardwareId}/settings`);
      return response.data;
    }
  }
}; 