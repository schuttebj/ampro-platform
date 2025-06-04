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
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    location_id?: number;
    hardware_type?: string;
    status?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.location_id) queryParams.append('location_id', params.location_id.toString());
    if (params?.hardware_type) queryParams.append('hardware_type', params.hardware_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const response = await api.get(`/hardware/?${queryParams.toString()}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/hardware/', data);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/hardware/${id}`);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/hardware/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, data: { status: string; notes?: string }) => {
    const response = await api.post(`/hardware/${id}/status`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/hardware/${id}`);
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/hardware/statistics');
    return response.data;
  },

  webcam: {
    getAvailable: async (locationId?: number) => {
      const params = locationId ? `?location_id=${locationId}` : '';
      const response = await api.get(`/hardware/webcams/available${params}`);
      return response.data;
    }
  }
}; 