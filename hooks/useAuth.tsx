import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { apiRequest, setStoredTokens } from '../services/api';
import { API_ENDPOINTS } from '../constants/API_Endpoints';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyStudentId: (studentCardNumber: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate loading session from persistence (e.g. SecureStore / AsyncStorage)
    const loadSession = async () => {
      try {
        // In real app: fetch stored token and validate
        // const token = await SecureStore.getItemAsync('token');
        // If token valid, fetch profile
        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Real API integration
      // const res = await apiRequest.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      
      // Simulated beautiful mock for seamless demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (email.includes('@') && password.length >= 6) {
        const mockUser: User = {
          id: 'user_98371',
          email: email.toLowerCase(),
          firstName: 'Alex',
          lastName: 'Student',
          isStudentVerified: true,
          studentIdCardNumber: 'STU-2026-904',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
          createdAt: new Date().toISOString(),
        };
        setUser(mockUser);
        setStoredTokens('mock_jwt_access_token', 'mock_jwt_refresh_token');
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: 'Invalid email or password' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Network auth error' };
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulated beautiful mock register flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockUser: User = {
        id: `user_${Math.floor(Math.random() * 90000) + 10000}`,
        email: email.toLowerCase(),
        firstName,
        lastName,
        isStudentVerified: false,
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setStoredTokens('mock_jwt_access_token', 'mock_jwt_refresh_token');
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Sign up failed' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    // Simulate API call to invalidate token
    await new Promise(resolve => setTimeout(resolve, 800));
    setUser(null);
    setStoredTokens(null, null);
    setIsLoading(false);
  };

  const verifyStudentId = async (studentCardNumber: string) => {
    if (!user) return { success: false, error: 'No active session' };
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Haptic suspense
      const updatedUser = { 
        ...user, 
        isStudentVerified: true, 
        studentIdCardNumber: studentCardNumber 
      };
      setUser(updatedUser);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: 'Verification failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        verifyStudentId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be executed within an AuthProvider');
  }
  return context;
};
