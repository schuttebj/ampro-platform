import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://ampro-licence.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get the refresh token from storage
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Get new access token
        const response = await axios.post(
          `${API_URL}/api/v1/auth/token`,
          { refresh_token: refreshToken }
        );
        
        const { access_token } = response.data;
        
        // Update access token in API service
        if (access_token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        }
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 