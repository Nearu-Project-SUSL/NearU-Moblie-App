import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants/API_Endpoints';
import { ApiResponse } from '../types';

// Standard storage placeholders (in real Expo we would use expo-secure-store)
let cachedAuthToken: string | null = null;
let cachedRefreshToken: string | null = null;

export const setStoredTokens = (token: string | null, refresh: string | null) => {
  cachedAuthToken = token;
  cachedRefreshToken = refresh;
};

export const getStoredToken = () => cachedAuthToken;
export const getStoredRefreshToken = () => cachedRefreshToken;

/**
 * Highly configured Axios client tailored for .NET Backend
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Inject Auth Header dynamically
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (cachedAuthToken) {
      config.headers.Authorization = `Bearer ${cachedAuthToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Seamlessly handle Session expirations & standard .NET errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Auto-refresh token on HTTP 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry && cachedRefreshToken) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: cachedRefreshToken,
        });

        if (refreshResponse.status === 200 && refreshResponse.data?.token) {
          const { token, refreshToken } = refreshResponse.data;
          setStoredTokens(token, refreshToken);
          
          // Re-trigger original request with updated header
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh token failed, clear credentials
        setStoredTokens(null, null);
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Standardized API Wrapper to ensure zero unhandled exceptions
 */
export const apiRequest = {
  get: async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const res = await apiClient.get<T>(url);
      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError<T>(err);
    }
  },
  post: async <T>(url: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const res = await apiClient.post<T>(url, body);
      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError<T>(err);
    }
  },
  put: async <T>(url: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const res = await apiClient.put<T>(url, body);
      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError<T>(err);
    }
  },
  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const res = await apiClient.delete<T>(url);
      return { success: true, data: res.data };
    } catch (err) {
      return handleApiError<T>(err);
    }
  },
};

function handleApiError<T>(error: any): ApiResponse<T> {
  const apiResponse: ApiResponse<T> = { success: false };
  
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data;
    apiResponse.message = errorData?.message || error.message || 'API request failed';
    apiResponse.errors = errorData?.errors || [];
  } else {
    apiResponse.message = error?.message || 'An unexpected networking failure occurred';
  }
  
  return apiResponse;
}
