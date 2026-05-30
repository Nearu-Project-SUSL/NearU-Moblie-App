/**
 * NearU .NET Backend Core Routing Configurations
 */

export const API_BASE_URL = 'https://api.nearusab.me/api';

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
    GET: `${API_BASE_URL}/profile`,
    UPDATE: `${API_BASE_URL}/profile/update`,
    UPDATE_AVATAR: `${API_BASE_URL}/profile/avatar`,
  },

  // Geolocation & Campus Location check
  LOCATION: {
    VERIFY_CAMPUS: `${API_BASE_URL}/location/verify-campus`,
    NEARBY_PROVIDERS: `${API_BASE_URL}/location/nearby`,
  }
};
