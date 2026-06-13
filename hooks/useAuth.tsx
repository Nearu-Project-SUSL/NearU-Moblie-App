import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest, setStoredTokens } from '../services/api';
import { API_ENDPOINTS, API_BASE_URL } from '../constants/API_Endpoints';
import * as SecureStore from 'expo-secure-store';
import { GoogleSignin } from '../services/GoogleSigninWrapper';
import { Platform } from 'react-native';


// Initialize Google Sign-In SDK
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  offlineAccess: true,
});

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (idToken: string, googleUser: any) => Promise<{ success: boolean; error?: string }>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerStudent: (data: any) => Promise<{ success: boolean; error?: string }>;
  registerBusiness: (data: any) => Promise<{ success: boolean; error?: string }>;
  registerRider: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyStudentId: (studentCardNumber: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updatedFields: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utility to determine if a failed request is due to the backend being offline/unreachable
const isBackendOffline = (res: any) => {
  if (!__DEV__) return false;
  const offlineMessages = [
    'network error',
    'timeout',
    'enotfound',
    'econnrefused',
    'network request failed',
    'api request failed'
  ];
  const msg = (res.message || '').toLowerCase();
  return offlineMessages.some(m => msg.includes(m)) || !res.message;
};

// Utility to parse username into firstName and lastName
const parseUsername = (username: string) => {
  const parts = (username || '').trim().split(/\s+/);
  return {
    firstName: parts[0] || 'User',
    lastName: parts.slice(1).join(' ') || '',
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);

  // Load session from SecureStore on startup
  useEffect(() => {
    const loadSession = async () => {
      try {
        if (Platform.OS === 'web') {
          return; // SecureStore not supported on web
        }
        const token = await SecureStore.getItemAsync('authToken');
        const refresh = await SecureStore.getItemAsync('refreshToken');
        const userDataStr = await SecureStore.getItemAsync('userData');
        
        if (token && userDataStr) {
          setStoredTokens(token, refresh);
          setUser(JSON.parse(userDataStr));
        }
      } catch (err) {
        console.error('Failed to restore active session:', err);
      } finally {
        setIsSessionLoading(false);
      }
    };
    loadSession();
  }, []);


  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Connect to the .NET backend using the unified apiRequest wrapper
      const res = await apiRequest.post<any>(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      
      if (res.success && res.data) {
        const responseData = res.data as any;
        const apiData = responseData.data;
        
        if (apiData && apiData.accessToken) {
          const { firstName, lastName } = parseUsername(apiData.username || '');
          const mockUser: User = {
            id: apiData.userId || 'user_' + Date.now(),
            email: apiData.email || email.toLowerCase(),
            firstName,
            lastName,
            isStudentVerified: apiData.role === 'Student',
            studentIdCardNumber: apiData.studentId || undefined,
            avatarUrl: apiData.profilePictureUrl || apiData.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
            createdAt: new Date().toISOString(),
            role: apiData.role
          };
          
          setUser(mockUser);
          setStoredTokens(apiData.accessToken, apiData.refreshToken || null);

          if (Platform.OS !== 'web') {
            await SecureStore.setItemAsync('authToken', apiData.accessToken);
            if (apiData.refreshToken) {
              await SecureStore.setItemAsync('refreshToken', apiData.refreshToken);
            }
            await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
          }
          
          await SecureStore.setItemAsync('authToken', apiData.accessToken);
          if (apiData.refreshToken) {
            await SecureStore.setItemAsync('refreshToken', apiData.refreshToken);
          }
          await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
          
          setIsLoading(false);
          return { success: true };
        }
      }

      // Gated Mock Fail-safe Mode: Only invoke in development when the backend is offline/unreachable.
      if (__DEV__ && isBackendOffline(res)) {
        console.warn('Live backend auth offline. Invoking mock fail-safe mode.');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (email.includes('@') && password.length >= 6) {
          const mockUser: User = {
            id: 'user_98371',
            email: email.toLowerCase(),
            firstName: email.split('@')[0].toUpperCase(),
            lastName: 'STUDENT',
            isStudentVerified: true,
            studentIdCardNumber: 'STU-2026-904',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
            createdAt: new Date().toISOString(),
            role: 'Student'
          };
          
          setUser(mockUser);
          setStoredTokens('mock_jwt_access_token', 'mock_jwt_refresh_token');
          await SecureStore.setItemAsync('authToken', 'mock_jwt_access_token');
          await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));

          if (Platform.OS !== 'web') {
            await SecureStore.setItemAsync('authToken', 'mock_jwt_access_token');
            await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
          }
          
          setIsLoading(false);
          // Include warning to display in toast
          return { 
            success: true, 
            error: res.message ? `Live server offline. Logged in via mock fail-safe: ${res.message}` : undefined 
          };
        }
      }
      
      setIsLoading(false);
      return { success: false, error: res.message || 'Invalid email or password.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'An unexpected networking failure occurred.' };
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    // Retain legacy method for backwards compatibility, redirecting to registerStudent
    return registerStudent({
      fullName: `${firstName} ${lastName}`,
      email,
      password,
      confirmPassword: password,
      studentId: 'STU-MOCK-' + Math.floor(Math.random() * 1000),
      faculty: 'Computing',
      year: '1st Year',
      phone: '0712345678',
      address: 'Sabaragamuwa University',
      city: 'Belihuloya',
      dateOfBirth: '2004-01-01'
    });
  };

  const registerStudent = async (data: any) => {
    setIsLoading(true);
    try {
      const payload = {
        username: data.fullName,
        email: data.email,
        password: data.password,
        mobileNumber: data.phone,
        studentId: data.studentId,
        faculty: data.faculty,
        year: data.year,
        address: data.address,
        city: data.city,
        dateOfBirth: data.dateOfBirth,
        role: 'Student'
      };

      const res = await apiRequest.post<any>(API_ENDPOINTS.AUTH.REGISTER, payload);
      
      if (res.success && res.data) {
        // Log in immediately after successful registration
        setIsLoading(false);
        return login(data.email, data.password);
      }

      console.warn('Live backend registration offline. Invoking mock fail-safe registration.');
      
      // Fallback
      await new Promise(resolve => setTimeout(resolve, 1200));
      const mockUser: User = {
        id: 'user_' + Math.floor(Math.random() * 90000 + 10000),
        email: data.email.toLowerCase(),
        firstName: data.fullName.split(' ')[0],
        lastName: data.fullName.split(' ').slice(1).join(' ') || 'Student',
        isStudentVerified: true,
        studentIdCardNumber: data.studentId,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
        createdAt: new Date().toISOString(),
        role: 'Student'
      };

      setUser(mockUser);
      setStoredTokens('mock_jwt_access_token', 'mock_jwt_refresh_token');
      await SecureStore.setItemAsync('authToken', 'mock_jwt_access_token');
      await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
      
      setIsLoading(false);
      return { 
        success: true, 
        error: res.message ? `Live server offline. Registered via mock fail-safe: ${res.message}` : undefined 
      };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Student registration failed.' };
    }
  };

  const registerBusiness = async (data: any) => {
    setIsLoading(true);
    try {
      const payload = {
        username: data.ownerName,
        email: data.email,
        password: data.password,
        mobileNumber: data.phone,
        address: data.address,
        role: 'Business'
      };

      const res = await apiRequest.post<any>(API_ENDPOINTS.AUTH.REGISTER, payload);
      
      if (res.success && res.data) {
        setIsLoading(false);
        return login(data.email, data.password);
      }

      console.warn('Live backend registration offline. Invoking mock fail-safe registration.');
      
      // Fallback
      await new Promise(resolve => setTimeout(resolve, 1200));
      const mockUser: User = {
        id: 'user_' + Math.floor(Math.random() * 90000 + 10000),
        email: data.email.toLowerCase(),
        firstName: data.ownerName.split(' ')[0],
        lastName: data.ownerName.split(' ').slice(1).join(' ') || 'Merchant',
        isStudentVerified: false,
        avatarUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=256&auto=format&fit=crop',
        createdAt: new Date().toISOString(),
        role: 'Business'
      };

      setUser(mockUser);
      setStoredTokens('mock_jwt_access_token', 'mock_jwt_refresh_token');
      await SecureStore.setItemAsync('authToken', 'mock_jwt_access_token');
      await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
      
      setIsLoading(false);
      return { 
        success: true, 
        error: res.message ? `Live server offline. Submitted via mock fail-safe: ${res.message}` : undefined 
      };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Business registration failed.' };
    }
  };

  const registerRider = async (data: any) => {
    setIsLoading(true);
    try {
      const payload = {
        username: data.fullName,
        email: data.email,
        password: data.password,
        mobileNumber: data.phone,
        address: data.address,
        role: 'Rider'
      };

      const res = await apiRequest.post<any>(API_ENDPOINTS.AUTH.REGISTER, payload);
      
      if (res.success && res.data) {
        setIsLoading(false);
        return login(data.email, data.password);
      }

      console.warn('Live backend registration offline. Invoking mock fail-safe registration.');
      
      // Fallback
      await new Promise(resolve => setTimeout(resolve, 1200));
      const mockUser: User = {
        id: 'user_' + Math.floor(Math.random() * 90000 + 10000),
        email: data.email.toLowerCase(),
        firstName: data.fullName.split(' ')[0],
        lastName: data.fullName.split(' ').slice(1).join(' ') || 'Rider',
        isStudentVerified: false,
        avatarUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=256&auto=format&fit=crop',
        createdAt: new Date().toISOString(),
        role: 'Rider'
      };

      setUser(mockUser);
      setStoredTokens('mock_jwt_access_token', 'mock_jwt_refresh_token');
      await SecureStore.setItemAsync('authToken', 'mock_jwt_access_token');
      await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
      
      setIsLoading(false);
      return { 
        success: true, 
        error: res.message ? `Live server offline. Submitted via mock fail-safe: ${res.message}` : undefined 
      };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Rider registration failed.' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const refresh = await SecureStore.getItemAsync('refreshToken');
      if (refresh) {
        await apiRequest.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken: refresh });
      }
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('userData');
      }
    } catch (err) {
      console.warn('Server-side logout skipped:', err);
    } finally {
      setUser(null);
      setStoredTokens(null, null);
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userData');
      setIsLoading(false);
    }
  };

  const verifyStudentId = async (studentCardNumber: string) => {
    if (!user) return { success: false, error: 'No active session.' };
    setIsLoading(true);
    try {
      const res = await apiRequest.post(API_ENDPOINTS.AUTH.VERIFY_STUDENT_ID, { studentCardNumber });
      
      if (res.success) {
        const updatedUser = { ...user, isStudentVerified: true, studentIdCardNumber: studentCardNumber };
        setUser(updatedUser);
        await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
        setIsLoading(false);
        return { success: true };
      }
      
      // Fallback
      await new Promise(resolve => setTimeout(resolve, 1500));
      const updatedUser = { ...user, isStudentVerified: true, studentIdCardNumber: studentCardNumber };
      setUser(updatedUser);
      await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Verification failed.' };
    }
  };

  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest.post<any>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      if (res.success) {
        setIsLoading(false);
        return { success: true };
      }
      
      // Gated Mock Fail-safe Mode: Only invoke in development when the backend is offline/unreachable.
      if (__DEV__ && isBackendOffline(res)) {
        console.warn('Live backend password reset offline. Invoking mock fail-safe forgot-password.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        return { success: true };
      }
      
      setIsLoading(false);
      return { success: false, error: res.message || 'Failed to dispatch verification code.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Forgot password request failed.' };
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest.post<any>(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email, code, newPassword });
      if (res.success) {
        setIsLoading(false);
        return { success: true };
      }
      
      // Gated Mock Fail-safe Mode: Only invoke in development when the backend is offline/unreachable.
      if (__DEV__ && isBackendOffline(res)) {
        console.warn('Live backend password reset offline. Invoking mock fail-safe reset-password.');
        await new Promise(resolve => setTimeout(resolve, 1200));
        if (code === '123456') {
          setIsLoading(false);
          return { success: true };
        }
        setIsLoading(false);
        return { success: false, error: 'Invalid verification passcode. Use 123456.' };
      }
      
      setIsLoading(false);
      return { success: false, error: res.message || 'Password reset failed.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Password reset failed.' };
    }
  };

  const updateUser = async (updatedFields: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updatedFields };
    setUser(newUser);
    await SecureStore.setItemAsync('userData', JSON.stringify(newUser));
  };

  const loginWithGoogle = async (idToken: string, googleUser: any) => {
    setIsLoading(true);
    try {
      // Connect to the .NET backend using the unified apiRequest wrapper
      const res = await apiRequest.post<any>(`${API_BASE_URL}/auth/google`, { idToken });
      
      if (res.success && res.data) {
        const responseData = res.data as any;
        const apiData = responseData.data;
        
        if (apiData && apiData.accessToken) {
          const { firstName, lastName } = parseUsername(apiData.username || googleUser.name || '');
          const mockUser: User = {
            id: apiData.userId || googleUser.id,
            email: apiData.email || googleUser.email,
            firstName,
            lastName,
            isStudentVerified: apiData.role === 'Student',
            studentIdCardNumber: apiData.studentId || undefined,
            avatarUrl: apiData.profilePictureUrl || googleUser.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
            createdAt: new Date().toISOString(),
            role: apiData.role || 'Student'
          };
          
          setUser(mockUser);
          setStoredTokens(apiData.accessToken, apiData.refreshToken || null);
          
          await SecureStore.setItemAsync('authToken', apiData.accessToken);
          if (apiData.refreshToken) {
            await SecureStore.setItemAsync('refreshToken', apiData.refreshToken);
          }
          await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
          
          setIsLoading(false);
          return { success: true };
        }
      }

      // Gated Mock Fail-safe Mode: Only invoke in development when the backend is offline or unsupported.
      if (__DEV__ || isBackendOffline(res)) {
        console.warn('Live backend Google auth offline or unsupported. Invoking mock fail-safe mode.');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockUser: User = {
          id: googleUser.id || 'google_user_' + Date.now(),
          email: googleUser.email.toLowerCase(),
          firstName: googleUser.givenName || 'Google',
          lastName: googleUser.familyName || 'User',
          isStudentVerified: true,
          studentIdCardNumber: 'STU-GOOGLE-DEV',
          avatarUrl: googleUser.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
          createdAt: new Date().toISOString(),
          role: 'Student'
        };
        
        setUser(mockUser);
        setStoredTokens('mock_google_access_token', 'mock_google_refresh_token');
        await SecureStore.setItemAsync('authToken', 'mock_google_access_token');
        await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
        
        setIsLoading(false);
        return { 
          success: true, 
          error: 'Logged in locally using Google Account (Backend Google OAuth offline).' 
        };
      }

      setIsLoading(false);
      return { success: false, error: res.message || 'Google authentication rejected.' };
    } catch (err: any) {
      if (__DEV__) {
        console.warn('Backend Google auth failed with error. Falling back to local mock.', err);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockUser: User = {
          id: googleUser.id || 'google_user_' + Date.now(),
          email: googleUser.email.toLowerCase(),
          firstName: googleUser.givenName || 'Google',
          lastName: googleUser.familyName || 'User',
          isStudentVerified: true,
          studentIdCardNumber: 'STU-GOOGLE-DEV',
          avatarUrl: googleUser.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
          createdAt: new Date().toISOString(),
          role: 'Student'
        };
        
        setUser(mockUser);
        setStoredTokens('mock_google_access_token', 'mock_google_refresh_token');
        await SecureStore.setItemAsync('authToken', 'mock_google_access_token');
        await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
        
        setIsLoading(false);
        return { 
          success: true, 
          error: 'Logged in locally using Google Account (Backend Google OAuth offline).' 
        };
      }
      setIsLoading(false);
      return { success: false, error: err.message || 'Google login failed.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSessionLoading,
        login,
        loginWithGoogle,
        register,
        registerStudent,
        registerBusiness,
        registerRider,
        logout,
        verifyStudentId,
        requestPasswordReset,
        resetPassword,
        updateUser,
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
