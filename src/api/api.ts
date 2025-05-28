// @ts-ignore - Import axios
import axios from 'axios';

// Get the current origin as a fallback
const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

// @ts-ignore - Process env variable
const API_URL = process.env.REACT_APP_API_URL || currentOrigin || 'https://ampro-licence.onrender.com';

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
      console.log("Handling 401 error with token refresh");
      originalRequest._retry = true;
      
      try {
        // Get the access token - we may not need to refresh as the API may not support this
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          console.log("No access token found, redirecting to login");
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Set the token in the header and retry the request
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Error during auth handling:", refreshError);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Function to test API connection with multiple possible URLs
export const testApiConnection = async () => {
  const urls = [
    `${window.location.origin}/api/v1/health`,
    `${window.location.origin}/api/v1`,
    `${window.location.protocol}//${window.location.hostname}/api/v1/health`,
    'https://ampro-licence.onrender.com/api/v1/health',
    `${API_URL}/api/v1/health`
  ];
  
  console.log('Testing API connections...');
  
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        console.log(`Testing URL: ${url}`);
        const response = await fetch(url, { 
          method: 'GET',
          mode: 'cors',
          credentials: 'include'
        });
        return { 
          url, 
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