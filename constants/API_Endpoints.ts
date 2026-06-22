/**
 * NearU .NET Backend Core Routing Configurations
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.nearusab.me/api';

export const API_ENDPOINTS = {
  // Authentication Gateway
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh`,
    VERIFY_STUDENT_ID: `${API_BASE_URL}/auth/verify-student`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  },
  
  // Student Dashboards & Service Listings
  SERVICES: {
    LIST: `${API_BASE_URL}/services`,
    DETAILS: (id: string) => `${API_BASE_URL}/services/${id}`,
    CATEGORIES: `${API_BASE_URL}/services/categories`,
    FEATURED: `${API_BASE_URL}/services/featured`,
    SEARCH: `${API_BASE_URL}/services/search`,
  },
  
  // Orders & Transaction Tracking
  ORDERS: {
    CREATE: `${API_BASE_URL}/orders`,
    LIST: `${API_BASE_URL}/orders/student`,
    DETAILS: (id: string) => `${API_BASE_URL}/orders/${id}`,
    CANCEL: (id: string) => `${API_BASE_URL}/orders/${id}/cancel`,
    TRACK: (id: string) => `${API_BASE_URL}/orders/${id}/tracking`,
  },
  
  // Student Profile Settings
  PROFILE: {
    GET: (userId: string) => `${API_BASE_URL}/User/${userId}`,
    UPDATE: (userId: string) => `${API_BASE_URL}/User/${userId}/profile`,
    UPDATE_AVATAR: (userId: string) => `${API_BASE_URL}/User/${userId}/profile-picture`,
    DELETE: (userId: string) => `${API_BASE_URL}/User/${userId}`,
  },

  // Geolocation & Campus Location check
  LOCATION: {
    VERIFY_CAMPUS: `${API_BASE_URL}/location/verify-campus`,
    NEARBY_PROVIDERS: `${API_BASE_URL}/location/nearby`,
  },

  // Career Hub & Gigs Gateway
  JOBS: {
    LIST: `${API_BASE_URL}/job`,
    NEW: `${API_BASE_URL}/job/new`,
    CATEGORY: (category: string) => `${API_BASE_URL}/job/category/${category}`,
    TYPE: (jobType: string) => `${API_BASE_URL}/job/type/${jobType}`,
    SEARCH: `${API_BASE_URL}/job/search`,
    DETAILS: (id: string) => `${API_BASE_URL}/job/${id}`,
    CREATE: `${API_BASE_URL}/job`,
    UPDATE: (id: string) => `${API_BASE_URL}/job/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/job/${id}`,
  }
};

