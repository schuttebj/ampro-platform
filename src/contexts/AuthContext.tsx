import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api, { createFormData } from '../api/api';

// Define User interface
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
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
  } else {
    delete api.defaults.headers.common['Authorization'];
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
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (storedRefreshToken) {
          await refreshToken();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
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
      // Create form-urlencoded data for login
      const formData = createFormData({ username, password });
      
      // Set the correct content type for this request
      const response = await axios.post(`${api.defaults.baseURL}/auth/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      console.log('Login response:', response.data); // Debug response
      
      const { access_token, refresh_token } = response.data;
      
      // Store tokens
      setAuthToken(access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      // Fetch user data after successful login
      try {
        const userResponse = await api.get('/auth/me');
        console.log('User data:', userResponse.data);
        setUser(userResponse.data);
      } catch (userError) {
        console.error('Failed to get user data:', userError);
        // Create a basic user object if we can't get user data
        setUser({
          id: 1,
          username,
          email: '',
          full_name: username,
          role: 'user',
          is_active: true
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
    
    // Update state
    setUser(null);
  };
  
  // Token refresh function
  const refreshToken = async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) return;
    
    try {
      const formData = createFormData({ refresh_token: storedRefreshToken });
      
      const response = await axios.post(`${api.defaults.baseURL}/auth/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      const { access_token } = response.data;
      
      // Update access token in API service
      setAuthToken(access_token);
      
      // Get user data
      const userResponse = await api.get('/auth/me');
      setUser(userResponse.data);
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
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