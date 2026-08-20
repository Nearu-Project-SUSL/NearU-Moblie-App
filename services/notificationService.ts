/**
 * notificationService.ts
 *
 * Provides device push token registration with the .NET backend
 * and testing/simulation utilities for the NearU Mobile Notification System.
 */

import { apiRequest } from './api';
import { ApiResponse } from '../types';
import { useNotificationStore } from '../store/notificationStore';
import { NotificationType } from '../types/notification';

export interface DeviceTokenPayload {
  token: string;
}

export const notificationService = {
  /**
   * Registers the device FCM push token with the backend.
   * POST /api/rides/device-token
   */
  registerDeviceToken: async (token: string): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.post<void>('/rides/device-token', { token });
      if (res.success) {
        console.log('[NotificationService] Device token registered successfully.');
      }
      return res;
    } catch (err: any) {
      console.warn('[NotificationService] Failed to register device token:', err);
      return { success: false, message: err?.message || 'Failed to register device token' };
    }
  },

  /**
   * Removes the device token on logout.
   * DELETE /api/rides/device-token
   */
  removeDeviceToken: async (token: string): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.delete<void>('/rides/device-token');
      if (res.success) {
        console.log('[NotificationService] Device token unregistered.');
      }
      return res;
    } catch (err: any) {
      console.warn('[NotificationService] Failed to remove device token:', err);
      return { success: false, message: err?.message || 'Failed to remove device token' };
    }
  },

  /**
   * Dispatches a realistic demo notification across any of the NearU categories.
   * Great for immediate testing and verification.
   */
  simulateDemoNotification: (type: NotificationType) => {
    const store = useNotificationStore.getState();

    switch (type) {
      case 'ride':
        store.addNotification({
          type: 'ride',
          title: '🛵 Driver Arrived at Gate',
          message: 'Your rider is waiting at SUSL Main Gate. OTP: 4829',
          route: '/(tabs)/rides',
          rideId: 'ride_demo_101',
        });
        break;

      case 'order':
        store.addNotification({
          type: 'order',
          title: '🍔 Order Preparing',
          message: 'Campus Kitchen has accepted your Rice & Curry combo. Est. 15 mins.',
          route: '/food',
        });
        break;

      case 'deal':
        store.addNotification({
          type: 'deal',
          title: '🔥 30% Off Food Fiesta',
          message: 'Exclusive 30% flash discount on all canteen pre-orders this evening!',
          route: '/deals',
        });
        break;

      case 'job':
        store.addNotification({
          type: 'job',
          title: '💼 New Campus Gig Available',
          message: 'Computing Faculty is hiring a Student Lab Assistant (Rs. 1,200/hr).',
          route: '/service/jobs',
        });
        break;

      case 'accommodation':
        store.addNotification({
          type: 'accommodation',
          title: '🏡 Verified Boarding Listed',
          message: 'New single room available near Pambahinna junction. All bills included.',
          route: '/accommodations',
        });
        break;

      case 'gift':
        store.addNotification({
          type: 'gift',
          title: '🎁 Special Occasion Offer',
          message: 'Send custom flowers & chocolates across campus with free delivery.',
          route: '/gifts',
        });
        break;

      case 'general':
      default:
        store.addNotification({
          type: 'general',
          title: '✨ Welcome to NearU Mobile',
          message: 'Explore university rides, delicious food, verified stays, and student gigs!',
          route: '/(tabs)/browse',
        });
        break;
    }
  },
};
