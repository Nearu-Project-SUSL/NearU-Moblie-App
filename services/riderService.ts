/**
 * NearU Rides Service — covers both student-side and rider-side API calls.
 * All methods include graceful __DEV__ fallbacks for offline development.
 */
import { apiRequest } from './api';
import { ApiResponse } from '../types';
import {
  RideServiceType,
  RideServiceTypeValue,
  FareEstimate,
  RideSummary,
  RiderLiveLocation,
  RideHistoryPage,
  RiderStatus,
  RiderStats,
  RideRequest,
  RiderActiveRide as ActiveRide,
} from '../types/rides';

// Re-export legacy types for backwards compatibility with existing code
export type { RideServiceType, RiderStats };
export type { RiderStatus, RideRequest, ActiveRide };
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

// ── Dev mode state ─────────────────────────────────────────────────────────────

let devRiderOnline = false;
let devActiveRide: ActiveRide | null = null;
let devRecentRequests: RideRequest[] = [];
let devStudentRide: RideSummary | null = null;

const triggerMockRequest = () => {
  devRecentRequests = [
    {
      id: 'ride_' + Math.floor(Math.random() * 90000 + 10000),
      studentName: 'Kasun Perera',
      pickupLocation: 'SUSL Main Gate',
      pickupLat: 6.7146,
      pickupLng: 80.7872,
      dropoffLocation: 'Faculty of Computing',
      dropoffLat: 6.7121,
      dropoffLng: 80.7891,
      fareEstimate: 120,
      distanceKm: 1.2,
      serviceType: 'PersonalRide',
      createdAt: new Date().toISOString(),
    },
  ];
};

// ── Service ────────────────────────────────────────────────────────────────────

export const rideService = {
  // ─ Fare Estimation (Student) ────────────────────────────────────────────────

  /**
   * GET /api/rides/estimate
   * Backend calls OSRM for road-network distance via PostGIS,
   * returns fare breakdown + estimated travel duration.
   */
  getFareEstimate: async (
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number,
    serviceType: RideServiceType = 'PersonalRide',
  ): Promise<ApiResponse<FareEstimate>> => {
    try {
      const params = new URLSearchParams({
        pickupLatitude: pickupLat.toString(),
        pickupLongitude: pickupLng.toString(),
        dropoffLatitude: dropoffLat.toString(),
        dropoffLongitude: dropoffLng.toString(),
        serviceType: RideServiceTypeValue[serviceType].toString(),
      });
      const res = await apiRequest.get<any>(`/rides/estimate?${params}`);
      if (res.success && res.data) {
        const payload = res.data.data ?? res.data;
        return {
          success: true,
          data: {
            estimatedFare: payload.estimatedFare,
            distanceKm: payload.distanceKm,
            baseFare: payload.baseFare,
            ratePerKm: payload.ratePerKm,
            estimatedDurationSeconds: payload.estimatedDurationSeconds,
          },
        };
      }
      if (__DEV__) {
        // Compute mock haversine-based estimate for dev
        const dist = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
        return {
          success: true,
          data: {
            estimatedFare: Math.round(50 + dist * 45),
            distanceKm: dist,
            baseFare: 50,
            ratePerKm: 45,
            estimatedDurationSeconds: Math.round((dist / 30) * 3600),
          },
        };
      }
      return { success: false, message: res.message || 'Could not estimate fare.' };
    } catch {
      if (__DEV__) {
        const dist = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
        return {
          success: true,
          data: {
            estimatedFare: Math.round(50 + dist * 45),
            distanceKm: dist,
            baseFare: 50,
            ratePerKm: 45,
            estimatedDurationSeconds: Math.round((dist / 30) * 3600),
          },
        };
      }
      return { success: false, message: 'Fare estimation failed.' };
    }
  },

  // ─ Ride Creation (Student) ──────────────────────────────────────────────────

  /**
   * POST /api/requests
   * Creates a ride request. Backend broadcasts to nearby riders.
   */
  createRideRequest: async (
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number,
    serviceType: RideServiceType,
    pickupLabel: string,
    dropoffLabel: string,
  ): Promise<ApiResponse<{ rideId: string }>> => {
    try {
      const body = {
        serviceType: RideServiceTypeValue[serviceType],
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLng,
        dropoffLatitude: dropoffLat,
        dropoffLongitude: dropoffLng,
        confirmEstimate: true,
        details: {
          pickupLabel,
          dropoffLabel,
        },
      };
      const res = await apiRequest.post<any>('/requests', body);
      if (res.success && res.data) {
        const payload = res.data.data ?? res.data;
        return { success: true, data: { rideId: payload.rideId ?? payload.id } };
      }
      if (__DEV__) {
        const rideId = 'dev_ride_' + Date.now();
        devStudentRide = {
          rideId,
          status: 'Pending',
          serviceType,
          studentId: 'student_dev',
          estimatedFare: 120,
          distanceKm: 1.2,
          pickupLatitude: pickupLat,
          pickupLongitude: pickupLng,
          dropoffLatitude: dropoffLat,
          dropoffLongitude: dropoffLng,
          createdAt: new Date().toISOString(),
        };
        // After 5s simulate acceptance
        setTimeout(() => {
          if (devStudentRide) {
            devStudentRide.status = 'Accepted';
            devStudentRide.otp = '4829';
            devStudentRide.otpExpiresAt = new Date(Date.now() + 300_000).toISOString();
          }
        }, 5000);
        return { success: true, data: { rideId } };
      }
      return { success: false, message: res.message || 'Failed to create ride request.' };
    } catch {
      if (__DEV__) {
        const rideId = 'dev_ride_' + Date.now();
        return { success: true, data: { rideId } };
      }
      return { success: false, message: 'Could not submit your ride request.' };
    }
  },

  // ─ Active Ride (Student + Rider) ────────────────────────────────────────────

  /**
   * GET /api/rides/active
   * Poll to get the current ride state (includes OTP once accepted).
   */
  getStudentActiveRide: async (): Promise<ApiResponse<RideSummary | null>> => {
    try {
      const res = await apiRequest.get<any>('/rides/active');
      if (res.success) {
        const payload = res.data?.data ?? res.data ?? null;
        return { success: true, data: payload };
      }
      if (__DEV__) {
        return { success: true, data: devStudentRide };
      }
      return { success: false, data: null, message: res.message };
    } catch {
      if (__DEV__) {
        return { success: true, data: devStudentRide };
      }
      return { success: false, data: null };
    }
  },

  /**
   * GET /api/location/{rideId}
   * Gets rider's live GPS position (called while ride is accepted/in-progress).
   */
  getRiderLiveLocation: async (rideId: string): Promise<ApiResponse<RiderLiveLocation | null>> => {
    try {
      const res = await apiRequest.get<any>(`/location/${rideId}`);
      if (res.success && res.data) {
        const payload = res.data.data ?? res.data;
        return { success: true, data: payload };
      }
      if (__DEV__) {
        return {
          success: true,
          data: {
            rideId,
            latitude: 6.7146 + (Math.random() - 0.5) * 0.005,
            longitude: 80.7872 + (Math.random() - 0.5) * 0.005,
            distanceToPickupKm: parseFloat((Math.random() * 0.8).toFixed(2)),
            updatedAtUtc: new Date().toISOString(),
          },
        };
      }
      return { success: false, data: null };
    } catch {
      return { success: false, data: null };
    }
  },

  /**
   * POST /api/cancel
   * Student cancels a pending/accepted ride.
   */
  cancelRide: async (rideId: string): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.post<void>('/cancel', { rideId });
      if (res.success) {
        devStudentRide = null;
        return res;
      }
      if (__DEV__) {
        devStudentRide = null;
        return { success: true };
      }
      return res;
    } catch {
      if (__DEV__) {
        devStudentRide = null;
        return { success: true };
      }
      return { success: false, message: 'Failed to cancel ride.' };
    }
  },

  /**
   * POST /api/student-confirm
   * Student confirms the rider's "completed" mark.
   */
  studentConfirmCompletion: async (rideId: string): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.post<void>('/student-confirm', { rideId });
      if (res.success) {
        devStudentRide = null;
        return res;
      }
      if (__DEV__) {
        devStudentRide = null;
        return { success: true };
      }
      return res;
    } catch {
      if (__DEV__) {
        devStudentRide = null;
        return { success: true };
      }
      return { success: false, message: 'Could not confirm completion.' };
    }
  },

  /**
   * POST /api/rides/history/{rideId}/rate
   * Submit a 1–5 star rating for a completed ride.
   */
  rateRide: async (rideId: string, rating: number): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.post<void>(`/rides/history/${rideId}/rate`, { rating });
      if (res.success) return res;
      if (__DEV__) return { success: true };
      return res;
    } catch {
      if (__DEV__) return { success: true };
      return { success: false, message: 'Failed to submit rating.' };
    }
  },

  // ─ Ride History (Both roles) ─────────────────────────────────────────────────

  getRideHistory: async (page = 1, pageSize = 20): Promise<ApiResponse<RideHistoryResponse>> => {
    try {
      const res = await apiRequest.get<any>(`/rides/history?page=${page}&pageSize=${pageSize}`);
      if (res.success && res.data) {
        const payload = res.data.data ?? res.data;
        return { success: true, data: payload };
      }
      if (__DEV__) {
        return { success: true, data: getMockHistory(page, pageSize) };
      }
      return { success: false, message: res.message || 'Failed to fetch history.' };
    } catch {
      if (__DEV__) return { success: true, data: getMockHistory(page, pageSize) };
      return { success: false, message: 'History is offline.' };
    }
  },

  // ─ Rider Status & Stats ───────────────────────────────────────────────────────

  setRiderOnlineStatus: async (isOnline: boolean): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.put<void>('/rider/status', { isOnline });
      if (res.success) {
        devRiderOnline = isOnline;
        return res;
      }
      if (__DEV__) {
        devRiderOnline = isOnline;
        if (isOnline) setTimeout(triggerMockRequest, 5000);
        else devRecentRequests = [];
        return { success: true };
      }
      return res;
    } catch {
      if (__DEV__) {
        devRiderOnline = isOnline;
        return { success: true };
      }
      return { success: false, message: 'Failed to update rider status.' };
    }
  },

  getRiderStatus: async (): Promise<ApiResponse<{ riderId: string; isOnline: boolean; approvalStatus: string; riderTier: string }>> => {
    try {
      const res = await apiRequest.get<any>('/rider/status');
      if (res.success && res.data) {
        return { success: true, data: res.data.data ?? res.data };
      }
      if (__DEV__) {
        return {
          success: true,
          data: { riderId: 'rider_123', isOnline: devRiderOnline, approvalStatus: 'Approved', riderTier: 'Standard' },
        };
      }
      return { success: false, message: 'Failed to fetch rider status.' };
    } catch {
      if (__DEV__) {
        return {
          success: true,
          data: { riderId: 'rider_123', isOnline: devRiderOnline, approvalStatus: 'Approved', riderTier: 'Standard' },
        };
      }
      return { success: false, message: 'Rider status unavailable.' };
    }
  },

  getRiderStats: async (): Promise<ApiResponse<RiderStatsResponse>> => {
    try {
      const res = await apiRequest.get<any>('/rider/stats');
      if (res.success && res.data) {
        return { success: true, data: res.data.data ?? res.data };
      }
      if (__DEV__) return { success: true, data: { totalRides: 48, todayEarnings: 1560, rating: 4.8 } };
      return { success: false, message: 'Stats unavailable.' };
    } catch {
      if (__DEV__) return { success: true, data: { totalRides: 48, todayEarnings: 1560, rating: 4.8 } };
      return { success: false, message: 'Stats unavailable.' };
    }
  },

  // ─ Rider Ride Actions ────────────────────────────────────────────────────────

  getNearbyRequests: async (lat: number, lng: number): Promise<ApiResponse<RideRequest[]>> => {
    try {
      const res = await apiRequest.get<RideRequest[]>(`/requests/nearby?latitude=${lat}&longitude=${lng}`);
      if (res.success && res.data) return res;
      if (__DEV__) return { success: true, data: devRecentRequests };
      return { success: false, message: 'Failed to load nearby requests.' };
    } catch {
      if (__DEV__) return { success: true, data: devRecentRequests };
      return { success: false, message: 'Request pipeline offline.' };
    }
  },

  acceptRide: async (rideId: string): Promise<ApiResponse<ActiveRide>> => {
    try {
      const res = await apiRequest.post<any>('/accept', { rideId });
      if (res.success && res.data) {
        return { success: true, data: res.data.data ?? res.data };
      }
      if (__DEV__) {
        const req = devRecentRequests.find((r) => r.id === rideId) ?? devRecentRequests[0];
        devActiveRide = {
          id: rideId,
          studentName: req?.studentName ?? 'Student',
          pickupLocation: req?.pickupLocation ?? 'SUSL Gate',
          pickupLat: req?.pickupLat ?? 6.7146,
          pickupLng: req?.pickupLng ?? 80.7872,
          dropoffLocation: req?.dropoffLocation ?? 'Faculty of Computing',
          dropoffLat: req?.dropoffLat ?? 6.7121,
          dropoffLng: req?.dropoffLng ?? 80.7891,
          fareEstimate: req?.fareEstimate ?? 120,
          status: 'Accepted',
        };
        devRecentRequests = [];
        return { success: true, data: devActiveRide };
      }
      return { success: false, message: res.message ?? 'Failed to accept ride.' };
    } catch {
      if (__DEV__) {
        const req = devRecentRequests[0];
        devActiveRide = {
          id: rideId,
          studentName: req?.studentName ?? 'Student',
          pickupLocation: req?.pickupLocation ?? 'SUSL Gate',
          pickupLat: req?.pickupLat ?? 6.7146,
          pickupLng: req?.pickupLng ?? 80.7872,
          dropoffLocation: req?.dropoffLocation ?? 'Faculty of Computing',
          dropoffLat: req?.dropoffLat ?? 6.7121,
          dropoffLng: req?.dropoffLng ?? 80.7891,
          fareEstimate: req?.fareEstimate ?? 120,
          status: 'Accepted',
        };
        devRecentRequests = [];
        return { success: true, data: devActiveRide };
      }
      return { success: false, message: 'Connection lost while accepting ride.' };
    }
  },

  getRiderActiveRide: async (): Promise<ApiResponse<ActiveRide | null>> => {
    try {
      const res = await apiRequest.get<any>('/rides/active');
      if (res.success) return { success: true, data: res.data?.data ?? res.data ?? null };
      if (__DEV__) return { success: true, data: devActiveRide };
      return { success: false, data: null };
    } catch {
      if (__DEV__) return { success: true, data: devActiveRide };
      return { success: false, data: null };
    }
  },

  markArrived: async (rideId: string): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.post<void>('/arrive', { rideId });
      if (res.success) { if (devActiveRide) devActiveRide.status = 'Arrived'; return res; }
      if (__DEV__) { if (devActiveRide) devActiveRide.status = 'Arrived'; return { success: true }; }
      return res;
    } catch {
      if (__DEV__) { if (devActiveRide) devActiveRide.status = 'Arrived'; return { success: true }; }
      return { success: false, message: 'Failed to report arrival.' };
    }
  },

  verifyOtp: async (rideId: string, otp: string): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.post<void>('/verify', { rideId, otp });
      if (res.success) { if (devActiveRide) devActiveRide.status = 'InProgress'; return res; }
      if (__DEV__) {
        if (otp !== '4829') return { success: false, message: 'Incorrect OTP. Try "4829" in dev mode.' };
        if (devActiveRide) devActiveRide.status = 'InProgress';
        return { success: true };
      }
      return res;
    } catch {
      if (__DEV__) {
        if (otp !== '4829') return { success: false, message: 'Incorrect OTP. Try "4829".' };
        if (devActiveRide) devActiveRide.status = 'InProgress';
        return { success: true };
      }
      return { success: false, message: 'OTP verification failed.' };
    }
  },

  completeRide: async (rideId: string): Promise<ApiResponse<void>> => {
    try {
      const res = await apiRequest.post<void>('/rider-complete', { rideId });
      if (res.success) { devActiveRide = null; return res; }
      if (__DEV__) { devActiveRide = null; return { success: true }; }
      return res;
    } catch {
      if (__DEV__) { devActiveRide = null; return { success: true }; }
      return { success: false, message: 'Failed to complete ride.' };
    }
  },

  sendHeartbeat: async (rideId: string, coords: LocationCoords): Promise<ApiResponse<void>> => {
    try {
      return await apiRequest.post<void>('/location/heartbeat', {
        rideId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date().toISOString(),
      });
    } catch {
      return { success: true };
    }
  },

  // ─ Convenient Aliases for Rider Orchestration ────────────────────────────────
  getPendingRideRequest: async (): Promise<ApiResponse<RideRequest | null>> => {
    const res = await rideService.getNearbyRequests(6.7146, 80.7872);
    if (res.success && res.data && res.data.length > 0) {
      return { success: true, data: res.data[0] };
    }
    return { success: true, data: null };
  },
  riderAcceptRide: (rideId: string) => rideService.acceptRide(rideId),
  riderDeclineRide: async (_rideId: string): Promise<ApiResponse<void>> => ({ success: true }),
  riderMarkArrived: (rideId: string) => rideService.markArrived(rideId),
  riderStartRide: (rideId: string, otp: string) => rideService.verifyOtp(rideId, otp),
  riderCompleteRide: (rideId: string) => rideService.completeRide(rideId),
  getActiveRide: () => rideService.getRiderActiveRide(),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function getMockHistory(page: number, pageSize: number): RideHistoryResponse {
  return {
    items: [
      { id: '1', pickupLocation: 'SUSL Main Gate', dropoffLocation: 'Pambahinna', fareAmount: 120, status: 'Completed', createdAt: new Date(Date.now() - 3_600_000).toISOString(), rating: 5 },
      { id: '2', pickupLocation: 'Hostel Block C', dropoffLocation: 'Samanala Grounds', fareAmount: 100, status: 'Completed', createdAt: new Date(Date.now() - 7_200_000).toISOString(), rating: 4 },
      { id: '3', pickupLocation: 'Applied Sciences', dropoffLocation: 'Town Center', fareAmount: 250, status: 'Completed', createdAt: new Date(Date.now() - 86_400_000).toISOString(), rating: 5 },
      { id: '4', pickupLocation: 'Computing Faculty', dropoffLocation: 'SUSL Main Gate', fareAmount: 80, status: 'Cancelled', createdAt: new Date(Date.now() - 172_800_000).toISOString() },
    ],
    totalCount: 4,
    page,
    pageSize,
  };
}

// Backwards-compatible alias used by old RiderDashboard / RiderActiveRide
export const riderService = rideService;
