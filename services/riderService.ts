import { apiRequest } from './api';
import { ApiResponse } from '../types';

export interface RideRequest {
  id: string;
  studentName: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  fareEstimate?: number;
  distanceKm?: number;
  serviceType?: string;
  createdAt: string;
}

export interface ActiveRide {
  id: string;
  studentName: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  fareEstimate: number;
  status: RideStatus;
}

export type RideStatus =
  | 'OFFLINE'
  | 'ONLINE_IDLE'
  | 'RIDE_REQUESTED'
  | 'EN_ROUTE_PICKUP'
  | 'ARRIVED_WAITING'
  | 'RIDE_IN_PROGRESS'
  | 'COMPLETING';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface RideHistoryItem {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  fareAmount: number;
  status: string;
  createdAt: string;
  rating?: number;
}

export interface RideHistoryResponse {
  items: RideHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface RiderStatsResponse {
  totalRides: number;
  todayEarnings: number;
  rating: number;
}

// Development mock states for offline fallback
let devRiderOnline = false;
let devActiveRide: ActiveRide | null = null;
let devRecentRequests: RideRequest[] = [];

// Populate a mock pending request for testing in Dev
const triggerMockRequest = () => {
  devRecentRequests = [
    {
      id: 'ride_' + Math.floor(Math.random() * 90000 + 10000),
      studentName: 'Kasun Perera',
      pickupLocation: 'SUSL Main Gate',
      pickupLat: 6.7146,
      pickupLng: 80.7872,
      dropoffLocation: 'Computing Faculty',
      dropoffLat: 6.7121,
      dropoffLng: 80.7891,
      fareEstimate: 120,
      distanceKm: 1.2,
      serviceType: 'Tuk-Tuk',
      createdAt: new Date().toISOString()
    }
  ];
};

export const riderService = {
  /**
   * Toggle rider online/offline status
   */
  setStatus: async (isOnline: boolean): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.put<void>('/rider/status', { isOnline });
      if (res.success) {
        devRiderOnline = isOnline;
        return res;
      }
      // Dev mode fallback
      if (__DEV__) {
        devRiderOnline = isOnline;
        if (isOnline) {
          // Trigger a mock request in 5 seconds to simulate incoming broadcast
          setTimeout(triggerMockRequest, 5000);
        } else {
          devRecentRequests = [];
          devActiveRide = null;
        }
        return { success: true };
      }
      return res;
    } catch (err: any) {
      if (__DEV__) {
        devRiderOnline = isOnline;
        return { success: true };
      }
      return { success: false, message: err.message || 'Failed to update rider status.' };
    }
  },

  /**
   * Fetch current rider availability and status info
   */
  getRiderStatus: async (): Promise<ApiResponse<{ riderId: string; isOnline: boolean; approvalStatus: string; riderTier: string }>> => {
    try {
      const res = await apiRequest.get<any>('/rider/status');
      if (res.success && res.data) {
        const payload = res.data.data || res.data;
        return { success: true, data: payload };
      }
      if (__DEV__) {
        return {
          success: true,
          data: {
            riderId: 'rider_123',
            isOnline: devRiderOnline,
            approvalStatus: 'Approved',
            riderTier: 'Standard'
          }
        };
      }
      return { success: false, message: res.message || 'Failed to fetch status.' };
    } catch {
      if (__DEV__) {
        return {
          success: true,
          data: {
            riderId: 'rider_123',
            isOnline: devRiderOnline,
            approvalStatus: 'Approved',
            riderTier: 'Standard'
          }
        };
      }
      return { success: false, message: 'Rider status is unavailable.' };
    }
  },

  /**
   * Fetch nearby ride requests (HTTP fallback query)
   */
  getNearbyRequests: async (latitude: number, longitude: number): Promise<ApiResponse<RideRequest[]>> => {
    try {
      const res = await apiRequest.get<RideRequest[]>(`/requests/nearby?latitude=${latitude}&longitude=${longitude}`);
      if (res.success && res.data) {
        return res;
      }
      if (__DEV__) {
        return { success: true, data: devRecentRequests };
      }
      return { success: false, message: res.message || 'Failed to load requests.' };
    } catch {
      if (__DEV__) {
        return { success: true, data: devRecentRequests };
      }
      return { success: false, message: 'Request pipeline is offline.' };
    }
  },

  /**
   * Accept an incoming ride request
   */
  acceptRide: async (rideId: string): Promise<ApiResponse<ActiveRide>> => {
    try {
      const res = await apiRequest.post<any>('/accept', { rideId });
      if (res.success && res.data) {
        const payload = res.data.data || res.data;
        return { success: true, data: payload };
      }
      if (__DEV__) {
        const req = devRecentRequests.find(r => r.id === rideId) || devRecentRequests[0];
        devActiveRide = {
          id: rideId,
          studentName: req?.studentName || 'Student',
          pickupLocation: req?.pickupLocation || 'SUSL Gate',
          pickupLat: req?.pickupLat || 6.7146,
          pickupLng: req?.pickupLng || 80.7872,
          dropoffLocation: req?.dropoffLocation || 'Computing Faculty',
          dropoffLat: req?.dropoffLat || 6.7121,
          dropoffLng: req?.dropoffLng || 80.7891,
          fareEstimate: req?.fareEstimate || 120,
          status: 'EN_ROUTE_PICKUP'
        };
        devRecentRequests = []; // clear requests
        return { success: true, data: devActiveRide };
      }
      return { success: false, message: res.message || 'Failed to accept ride.' };
    } catch {
      if (__DEV__) {
        const req = devRecentRequests.find(r => r.id === rideId) || devRecentRequests[0];
        devActiveRide = {
          id: rideId,
          studentName: req?.studentName || 'Student',
          pickupLocation: req?.pickupLocation || 'SUSL Gate',
          pickupLat: req?.pickupLat || 6.7146,
          pickupLng: req?.pickupLng || 80.7872,
          dropoffLocation: req?.dropoffLocation || 'Computing Faculty',
          dropoffLat: req?.dropoffLat || 6.7121,
          dropoffLng: req?.dropoffLng || 80.7891,
          fareEstimate: req?.fareEstimate || 120,
          status: 'EN_ROUTE_PICKUP'
        };
        devRecentRequests = [];
        return { success: true, data: devActiveRide };
      }
      return { success: false, message: 'Could not establish connection to accept ride.' };
    }
  },

  /**
   * Mark arrival at pickup location
   */
  markArrived: async (rideId: string): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.post<void>('/arrive', { rideId });
      if (res.success) {
        if (devActiveRide) devActiveRide.status = 'ARRIVED_WAITING';
        return res;
      }
      if (__DEV__) {
        if (devActiveRide) devActiveRide.status = 'ARRIVED_WAITING';
        return { success: true };
      }
      return res;
    } catch {
      if (__DEV__) {
        if (devActiveRide) devActiveRide.status = 'ARRIVED_WAITING';
        return { success: true };
      }
      return { success: false, message: 'Failed to report arrival.' };
    }
  },

  /**
   * Verify Student OTP to start ride
   */
  verifyOtp: async (rideId: string, otp: string): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.post<void>('/verify', { rideId, otp });
      if (res.success) {
        if (devActiveRide) devActiveRide.status = 'RIDE_IN_PROGRESS';
        return res;
      }
      if (__DEV__) {
        if (otp !== '1234') {
          return { success: false, message: 'Incorrect OTP. Try "1234".' };
        }
        if (devActiveRide) devActiveRide.status = 'RIDE_IN_PROGRESS';
        return { success: true };
      }
      return res;
    } catch (err: any) {
      if (__DEV__) {
        if (otp !== '1234') {
          return { success: false, message: 'Incorrect OTP. Try "1234".' };
        }
        if (devActiveRide) devActiveRide.status = 'RIDE_IN_PROGRESS';
        return { success: true };
      }
      return { success: false, message: err.message || 'OTP verification failed.' };
    }
  },

  /**
   * Mark ride completed from rider's side
   */
  completeRide: async (rideId: string): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.post<void>('/rider-complete', { rideId });
      if (res.success) {
        devActiveRide = null;
        return res;
      }
      if (__DEV__) {
        devActiveRide = null;
        return { success: true };
      }
      return res;
    } catch {
      if (__DEV__) {
        devActiveRide = null;
        return { success: true };
      }
      return { success: false, message: 'Failed to complete ride.' };
    }
  },

  /**
   * Retrieve active ride
   */
  getActiveRide: async (): Promise<ApiResponse<ActiveRide | null>> => {
    try {
      const res = await apiRequest.get<any>('/rides/active');
      if (res.success) {
        const payload = res.data?.data ?? res.data ?? null;
        return { success: true, data: payload };
      }
      if (__DEV__) {
        return { success: true, data: devActiveRide };
      }
      return { success: false, data: null, message: res.message };
    } catch {
      if (__DEV__) {
        return { success: true, data: devActiveRide };
      }
      return { success: false, data: null };
    }
  },

  /**
   * Send coordinate heartbeats
   */
  sendHeartbeat: async (rideId: string, coords: LocationCoords): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.post<void>('/location/heartbeat', {
        rideId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date().toISOString()
      });
      return res;
    } catch {
      return { success: true }; // Silent success for local dev
    }
  },

  /**
   * Fetch aggregate rider statistics
   */
  getStats: async (): Promise<ApiResponse<RiderStatsResponse>> => {
    try {
      const res = await apiRequest.get<any>('/rider/stats');
      if (res.success && res.data) {
        const payload = res.data.data || res.data;
        return { success: true, data: payload };
      }
      if (__DEV__) {
        return {
          success: true,
          data: {
            totalRides: 48,
            todayEarnings: 1560,
            rating: 4.8
          }
        };
      }
      return { success: false, message: res.message || 'Stats are currently unavailable.' };
    } catch {
      if (__DEV__) {
        return {
          success: true,
          data: {
            totalRides: 48,
            todayEarnings: 1560,
            rating: 4.8
          }
        };
      }
      return { success: false, message: 'Stats are unavailable.' };
    }
  },

  /**
   * Fetch history of rides
   */
  getRideHistory: async (page = 1, pageSize = 20): Promise<ApiResponse<RideHistoryResponse>> => {
    try {
      const res = await apiRequest.get<any>(`/rides/history?page=${page}&pageSize=${pageSize}`);
      if (res.success && res.data) {
        const payload = res.data.data ?? res.data;
        return { success: true, data: payload };
      }
      if (__DEV__) {
        return {
          success: true,
          data: {
            items: [
              { id: '1', pickupLocation: 'SUSL Main Gate', dropoffLocation: 'Pambahinna', fareAmount: 120, status: 'Completed', createdAt: new Date(Date.now() - 3600000).toISOString(), rating: 5 },
              { id: '2', pickupLocation: 'Hostel Block C', dropoffLocation: 'Samanala Grounds', fareAmount: 100, status: 'Completed', createdAt: new Date(Date.now() - 7200000).toISOString(), rating: 4 },
              { id: '3', pickupLocation: 'Applied Sciences', dropoffLocation: 'Town Center', fareAmount: 250, status: 'Completed', createdAt: new Date(Date.now() - 86400000).toISOString(), rating: 5 }
            ],
            totalCount: 3,
            page,
            pageSize
          }
        };
      }
      return { success: false, message: res.message || 'Failed to fetch history.' };
    } catch {
      if (__DEV__) {
        return {
          success: true,
          data: {
            items: [
              { id: '1', pickupLocation: 'SUSL Main Gate', dropoffLocation: 'Pambahinna', fareAmount: 120, status: 'Completed', createdAt: new Date(Date.now() - 3600000).toISOString(), rating: 5 },
              { id: '2', pickupLocation: 'Hostel Block C', dropoffLocation: 'Samanala Grounds', fareAmount: 100, status: 'Completed', createdAt: new Date(Date.now() - 7200000).toISOString(), rating: 4 },
              { id: '3', pickupLocation: 'Applied Sciences', dropoffLocation: 'Town Center', fareAmount: 250, status: 'Completed', createdAt: new Date(Date.now() - 86400000).toISOString(), rating: 5 }
            ],
            totalCount: 3,
            page,
            pageSize
          }
        };
      }
      return { success: false, message: 'History is offline.' };
    }
  }
};
