import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api, { createFormData, getFullApiUrl } from '../api/api';

// Define User interface
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_superuser: boolean;
}

// Define Auth Context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Helper function to set the auth token in the API
const setAuthToken = (token: string | null) => {
  if (!api.defaults) return;
  
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('accessToken', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('accessToken');
  }
};

// Create the context with undefined as default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is already logged in on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for access token first
        const storedAccessToken = localStorage.getItem('accessToken');
        if (storedAccessToken) {
          setAuthToken(storedAccessToken);
          
          // Try to fetch the actual user data from the backend
          try {
            console.log('Fetching user data on init...');
            const userResponse = await api.get('/users/me');
            console.log('User data received on init:', userResponse.data);
            setUser(userResponse.data);
          } catch (userError) {
            console.error('Failed to fetch user data on init:', userError);
            // If user data fetch fails, try refresh token or create basic user
            const storedRefreshToken = localStorage.getItem('refreshToken');
            if (storedRefreshToken) {
              await refreshToken();
            } else {
              // Create a basic user if we can't fetch from API
              setUser({
                id: 1,
                username: 'user',
                email: 'user@example.com',
                full_name: 'Authorized User',
                role: 'user',
                is_active: true,
                is_superuser: false
              });
            }
          }
        } else {
          const storedRefreshToken = localStorage.getItem('refreshToken');
          if (storedRefreshToken) {
            await refreshToken();
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Don't clear credentials on init error - just proceed as guest
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting login for user:', username);
      
      // Create a simple form data object manually
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      // Use the actual backend URL from api.ts
      const apiUrl = getFullApiUrl('/auth/login');
      
      console.log('Using login URL:', apiUrl);
      
      // First check if we can connect with OPTIONS (preflight) request
      try {
        console.log('Testing OPTIONS request to:', apiUrl);
        const optionsResponse = await fetch(apiUrl, {
          method: 'OPTIONS',
          mode: 'cors',
          credentials: 'omit', // Don't include credentials for OPTIONS
        });
        
        if (!optionsResponse.ok) {
          console.warn('OPTIONS request failed with status:', optionsResponse.status);
        } else {
          console.log('OPTIONS request succeeded');
        }
      } catch (optionsError) {
        console.warn('OPTIONS request failed:', optionsError);
        // Continue anyway - the actual POST request might still work
      }
      
      // Make the POST request for login
      // Don't use credentials: 'include' if we're having CORS issues
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        credentials: 'omit', // Try without credentials to avoid CORS issues
      });
      
      // Check if the response is successful
      if (!response.ok) {
        console.error('Login failed with status:', response.status);
        throw new Error(`Login failed with status: ${response.status}`);
      }
      
      // Parse the response
      const data = await response.json();
      console.log('Login response:', data);
      
      // Extract token
      const access_token = data.access_token || data.token;
      
      if (!access_token) {
        throw new Error('No access token received from server');
      }
      
      // Store token
      localStorage.setItem('accessToken', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Fetch the actual user data from the backend
      try {
        console.log('Fetching user data from backend...');
        const userResponse = await api.get('/users/me');
        console.log('User data received:', userResponse.data);
        setUser(userResponse.data);
      } catch (userError) {
        console.error('Failed to fetch user data:', userError);
        // Fallback to basic user object if user endpoint fails
        setUser({
          id: 1,
          username,
          email: '',
          full_name: username,
          role: 'user',
          is_active: true,
          is_superuser: false
        });
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    // Clear tokens
    setAuthToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken');
    
    // Update state
    setUser(null);
  };
  
  // Token refresh function
  const refreshToken = async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) return;
    
    try {
      const formData = createFormData({ refresh_token: storedRefreshToken });
      
      // Use the function from api.ts to get the token URL
      const tokenUrl = getFullApiUrl('/auth/token');
      console.log('Using token refresh URL:', tokenUrl);
      
      const response = await axios.post(tokenUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: false, // Don't use credentials for token refresh
      });
      
      // Extract token regardless of format
      const access_token = response.data.access_token || response.data.token;
      
      if (!access_token) {
        throw new Error('No access token received from server');
      }
      
      // Update access token in API service
      setAuthToken(access_token);
      
      // Try to get user data if endpoint exists
      try {
        const userResponse = await api.get('/users/me');
        setUser(userResponse.data);
      } catch (userError) {
        // Create basic user if endpoint doesn't exist
        setUser({
          id: 1,
          username: 'user',
          email: 'user@example.com',
          full_name: 'Authorized User',
          role: 'user',
          is_active: true,
          is_superuser: false
        });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Don't logout on refresh failure - use the access token if available
      const storedAccessToken = localStorage.getItem('accessToken');
      if (!storedAccessToken) {
        logout();
      }
      throw error;
    }
  };
  
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 