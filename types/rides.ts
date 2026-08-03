/**
 * NearU Rides — Shared TypeScript types
 * Mirrors the ASP.NET Core backend DTOs exactly.
 */

// ── Enums ─────────────────────────────────────────────────────────────────────

/** Backend: RideServiceType enum (integer mapping) */
export type RideServiceType = 'PersonalRide' | 'FoodDelivery' | 'GroceryPickup';
export const RideServiceTypeValue: Record<RideServiceType, number> = {
  PersonalRide: 0,
  FoodDelivery: 1,
  GroceryPickup: 2,
};

/** Backend: RideRequestStatus enum */
export type RideRequestStatus =
  | 'Pending'
  | 'Accepted'
  | 'Arrived'
  | 'InProgress'
  | 'CompletedByRider'
  | 'Completed'
  | 'Cancelled'
  | 'Interrupted'
  | 'OTPLocked'
  | 'Expired';

// ── Student-side ride state machine ───────────────────────────────────────────

export type StudentRideScreen =
  | 'request'       // Initial booking form
  | 'pending'       // Waiting for a rider to accept
  | 'accepted'      // Rider accepted — shows OTP + rider info
  | 'in_progress'   // Ride underway — live map
  | 'confirm'       // Rider marked complete — student confirms
  | 'completed';    // Final receipt + rating

// ── Rider-side ride state machine ─────────────────────────────────────────────

export type RiderRideStatus =
  | 'OFFLINE'
  | 'ONLINE_IDLE'
  | 'RIDE_REQUESTED'
  | 'EN_ROUTE_PICKUP'
  | 'ARRIVED_WAITING'
  | 'RIDE_IN_PROGRESS'
  | 'COMPLETING';

// ── API response shapes (mirrors backend DTOs) ────────────────────────────────

/** GET /api/rides/estimate */
export interface FareEstimate {
  estimatedFare: number;
  distanceKm: number;
  baseFare: number;
  ratePerKm: number;
  estimatedDurationSeconds: number;
}

/** RideSummaryDto — returned by most ride endpoints */
export interface RideSummary {
  rideId: string;
  status: RideRequestStatus;
  serviceType: RideServiceType;
  studentId: string;
  riderId?: string;
  estimatedFare: number;
  distanceKm: number;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  createdAt: string;
  otpExpiresAt?: string;
  otp?: string;
}

/** GET /api/location/{rideId} */
export interface RiderLiveLocation {
  rideId: string;
  latitude: number;
  longitude: number;
  distanceToPickupKm?: number;
  updatedAtUtc: string;
}

/** GET /api/rides/history items */
export interface RideHistoryItem {
  historyId: string;
  rideId: string;
  studentId: string;
  riderId?: string;
  serviceType: RideServiceType;
  finalFare: number;
  distanceKm: number;
  completedAt: string;
  riderRating?: number;
  studentRating?: number;
}

export interface RideHistoryPage {
  items: RideHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** GET /api/rider/status */
export interface RiderStatus {
  riderId: string;
  isOnline: boolean;
  approvalStatus: 'Approved' | 'Pending' | 'Rejected' | 'Suspended';
  riderTier: string;
}

/** GET /api/rider/stats */
export interface RiderStats {
  totalRides: number;
  todayEarnings: number;
  rating: number;
}

/** Incoming ride request (from nearby poll) */
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
  serviceType?: RideServiceType;
  createdAt: string;
}

/** Student active ride state (held in Zustand) */
export interface StudentActiveRide {
  rideId: string;
  serviceType: RideServiceType;
  estimatedFare: number;
  distanceKm: number;
  estimatedDurationSeconds: number;
  pickupLabel: string;
  dropoffLabel: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  otp?: string;
  otpExpiresAt?: string;
  riderName?: string;
  riderVehicle?: string;
  riderRating?: number;
  riderLatitude?: number;
  riderLongitude?: number;
  distanceToPickupKm?: number;
  completedAt?: string;
}

/** Rider active ride state (held in Zustand) */
export interface RiderActiveRide {
  id: string;
  studentName: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  fareEstimate: number;
  status: RideRequestStatus;
}

/** Coordinates */
export interface LatLng {
  latitude: number;
  longitude: number;
}
