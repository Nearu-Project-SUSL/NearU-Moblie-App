import { apiRequest } from './api';
import { ApiResponse } from '../types';
import { ShopResponse } from './foodshop';

export interface BusinessStatus {
  id: string;
  businessName: string;
  businessType: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
}

export interface FoodShopPayload {
  name: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  category: string;
  photo?: { uri: string; name: string; type: string } | null;
}

// Development mock states for offline fallback
let devBusinessStatus: BusinessStatus | null = null;
let devFoodShop: ShopResponse | null = null;

export const businessService = {
  /**
   * Fetch current business registration status
   */
  getStatus: async (): Promise<ApiResponse<BusinessStatus>> => {
    try {
      const res = await apiRequest.get<any>('/business/status');
      if (res.success && res.data) {
        const payload = res.data.data || res.data;
        return { success: true, data: payload };
      }
      if (__DEV__) {
        if (!devBusinessStatus) {
          devBusinessStatus = {
            id: 'biz_status_123',
            businessName: 'Lanka Food Court',
            businessType: 'Food Vendor',
            status: 'Approved', // Start with Approved so they can create/simulate shop profile setup
            submittedAt: new Date(Date.now() - 172800000).toISOString()
          };
        }
        return { success: true, data: devBusinessStatus };
      }
      return { success: false, message: res.message || 'Failed to fetch business status.' };
    } catch {
      if (__DEV__) {
        if (!devBusinessStatus) {
          devBusinessStatus = {
            id: 'biz_status_123',
            businessName: 'Lanka Food Court',
            businessType: 'Food Vendor',
            status: 'Approved',
            submittedAt: new Date(Date.now() - 172800000).toISOString()
          };
        }
        return { success: true, data: devBusinessStatus };
      }
      return { success: false, message: 'Business status endpoint offline.' };
    }
  },

  /**
   * Get owned food shop profile
   */
  getMyFoodShop: async (): Promise<ApiResponse<ShopResponse | null>> => {
    try {
      const res = await apiRequest.get<any>('/business/food/me');
      if (res.success) {
        const payload = res.data?.data ?? res.data ?? null;
        return { success: true, data: payload };
      }
      if (__DEV__) {
        return { success: true, data: devFoodShop };
      }
      return { success: false, data: null, message: res.message };
    } catch {
      if (__DEV__) {
        return { success: true, data: devFoodShop };
      }
      return { success: false, data: null };
    }
  },

  /**
   * Complete business shop profile setup
   */
  createFoodShop: async (payload: FoodShopPayload): Promise<ApiResponse<ShopResponse>> => {
    try {
      const formData = new FormData();
      formData.append('name', payload.name);
      if (payload.description) formData.append('description', payload.description);
      if (payload.address) formData.append('address', payload.address);
      if (payload.phoneNumber) formData.append('phoneNumber', payload.phoneNumber);
      formData.append('category', payload.category);
      if (payload.photo) {
        formData.append('photo', {
          uri: payload.photo.uri,
          name: payload.photo.name,
          type: payload.photo.type,
        } as any);
      }

      const { apiClient } = require('./api');
      const response = await apiClient.post('/business/food', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200 || response.status === 201) {
        const envelope = response.data;
        const data = envelope.data || envelope;
        return { success: true, data };
      }
      return { success: false, message: 'Failed to create shop profile.' };
    } catch (err: any) {
      if (__DEV__) {
        const newShop: ShopResponse = {
          id: 'shop_' + Math.floor(Math.random() * 90000 + 10000),
          ownerId: 'owner_123',
          name: payload.name,
          description: payload.description || 'Welcome to our premium outlet.',
          address: payload.address || 'Pambahinna, Belihuloya',
          phoneNumber: payload.phoneNumber || '0771234567',
          photoUrl: payload.photo?.uri || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop',
          createdAt: new Date().toISOString(),
          category: payload.category,
          menuItemCount: 0
        };
        devFoodShop = newShop;
        return { success: true, data: newShop };
      }
      return { success: false, message: err.message || 'Create shop profile request failed.' };
    }
  }
};
