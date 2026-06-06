import { apiRequest } from './api';
import { API_ENDPOINTS } from '../constants/API_Endpoints';
import { ApiResponse } from '../types';

export interface UserProfileResponse {
  userId: string;
  username: string;
  email: string;
  role: string;
  createdDate: string;
  lastLoginDate?: string;
  isActive: number;
  mobileNumber?: string;
  studentId?: string;
  faculty?: string;
  year?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  profilePictureUrl?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  mobileNumber?: string;
  faculty?: string;
  year?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
}

// Utility to check if backend is offline in DEV mode
const isBackendOffline = (res: ApiResponse<any>) => {
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

// In-memory mock profile storage for offline DEV fallback
let devMockProfile: UserProfileResponse | null = null;

const getInitialMockProfile = (userId: string, email: string = 'student@nearu.com'): UserProfileResponse => {
  if (!devMockProfile) {
    devMockProfile = {
      userId,
      username: 'Saman Kumara',
      email,
      role: 'Student',
      studentId: 'STU-2026-904',
      faculty: 'Computing',
      year: '3rd Year',
      mobileNumber: '0712345678',
      dateOfBirth: '2003-05-15',
      city: 'Belihuloya',
      address: 'Pambahinna, Sabaragamuwa University',
      isActive: 1,
      createdDate: new Date().toISOString(),
      profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
    };
  }
  return devMockProfile;
};

export const profileService = {
  getUserProfile: async (userId: string, email?: string): Promise<ApiResponse<UserProfileResponse>> => {
    // If guest user
    if (userId === 'guest') {
      return {
        success: true,
        data: {
          userId: 'guest',
          username: 'Guest User',
          email: 'guest@nearu.com',
          role: 'Guest',
          studentId: 'N/A',
          faculty: 'N/A',
          year: 'N/A',
          mobileNumber: 'N/A',
          dateOfBirth: 'N/A',
          city: 'N/A',
          address: 'N/A',
          isActive: 1,
          createdDate: new Date().toISOString(),
        }
      };
    }

    try {
      const res = await apiRequest.get<any>(API_ENDPOINTS.PROFILE.GET(userId));
      if (res.success && res.data) {
        // Extract from .NET Envelope: { success: true, message: null, data: { ... } }
        const envelope = res.data as any;
        const profileData = envelope.data || envelope;
        return { success: true, data: profileData };
      }

      if (__DEV__ && isBackendOffline(res)) {
        console.warn('Backend offline. Loading mock profile.');
        await new Promise(resolve => setTimeout(resolve, 800));
        return { success: true, data: getInitialMockProfile(userId, email) };
      }

      return { success: false, message: res.message || 'Failed to fetch user profile.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An unexpected networking failure occurred.' };
    }
  },

  updateUserProfile: async (userId: string, data: UpdateProfileRequest): Promise<ApiResponse<UserProfileResponse>> => {
    if (userId === 'guest') {
      return { success: false, message: 'Guests cannot modify profile configurations.' };
    }

    try {
      const res = await apiRequest.put<any>(API_ENDPOINTS.PROFILE.UPDATE(userId), data);
      if (res.success && res.data) {
        const envelope = res.data as any;
        const profileData = envelope.data || envelope;
        return { success: true, data: profileData };
      }

      if (__DEV__ && isBackendOffline(res)) {
        console.warn('Backend offline. Saving changes locally in mock storage.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (devMockProfile) {
          devMockProfile = {
            ...devMockProfile,
            ...data,
          };
        } else {
          devMockProfile = getInitialMockProfile(userId);
        }
        return { success: true, data: devMockProfile };
      }

      return { success: false, message: res.message || 'Failed to update profile details.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An unexpected networking failure occurred.' };
    }
  },

  uploadProfilePicture: async (userId: string, imageUri: string): Promise<ApiResponse<{ profilePictureUrl: string }>> => {
    if (userId === 'guest') {
      return { success: false, message: 'Guests cannot upload avatars.' };
    }

    try {
      // Create multipart/form-data payload for React Native
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // React Native requires this format for FormData file upload
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      // We need to use Axios directly to set 'multipart/form-data' header since apiRequest wraps JSON defaults
      // Wait, let's use the apiClient directly but wrap it in a try/catch
      const { apiClient } = require('./api');
      const response = await apiClient.post(API_ENDPOINTS.PROFILE.UPDATE_AVATAR(userId), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 || response.status === 201) {
        const envelope = response.data;
        const data = envelope.data || envelope;
        return { success: true, data: { profilePictureUrl: data.profilePictureUrl || data.profilePicture } };
      }

      return { success: false, message: 'Failed to upload image.' };
    } catch (err: any) {
      // Check for development offline state
      const mockRes = { success: false, message: err.message || 'Upload error' };
      if (__DEV__ && isBackendOffline(mockRes)) {
        console.warn('Backend offline. Mocking successful image upload locally.');
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (devMockProfile) {
          devMockProfile.profilePictureUrl = imageUri;
        }
        return { success: true, data: { profilePictureUrl: imageUri } };
      }

      return { success: false, message: err.response?.data?.message || err.message || 'Image upload failed.' };
    }
  },

  deleteUserAccount: async (userId: string, password: string): Promise<ApiResponse<void>> => {
    if (userId === 'guest') {
      return { success: false, message: 'Guests cannot delete accounts.' };
    }

    try {
      // For DELETE requests with body, axios requires config.data
      const { apiClient } = require('./api');
      const response = await apiClient.delete(API_ENDPOINTS.PROFILE.DELETE(userId), {
        data: { password }
      });

      if (response.status === 200 || response.status === 204) {
        return { success: true };
      }
      return { success: false, message: 'Failed to delete account.' };
    } catch (err: any) {
      const mockRes = { success: false, message: err.message || 'Delete error' };
      if (__DEV__ && isBackendOffline(mockRes)) {
        console.warn('Backend offline. Simulating account deletion.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true };
      }
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to delete account. Incorrect password?' };
    }
  }
};
