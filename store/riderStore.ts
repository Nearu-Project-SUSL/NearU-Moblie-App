/**
 * Rider Store — Zustand state machine for the rider's side of the ride flow.
 *
 * Status transitions:
 *   OFFLINE → ONLINE_IDLE → RIDE_REQUESTED → EN_ROUTE_PICKUP → ARRIVED_WAITING → RIDE_IN_PROGRESS
 */

import { create } from 'zustand';
import { RiderRideStatus, RideRequest, RiderActiveRide, RiderStats } from '../types/rides';

interface RiderState {
  rideStatus: RiderRideStatus;
  isOnline: boolean;
  approvalStatus: 'Approved' | 'Pending' | 'Rejected' | 'Suspended' | null;
  riderTier: string;
  stats: RiderStats | null;

  // Incoming request awaiting accept/decline
  pendingRequest: RideRequest | null;
  requestCountdown: number;

  // Active ride (after acceptance)
  activeRide: RiderActiveRide | null;

  // OTP verification
  otp: string;
  otpError: string | null;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
}

interface RiderActions {
  setOnlineStatus: (isOnline: boolean) => void;
  setApprovalStatus: (status: 'Approved' | 'Pending' | 'Rejected' | 'Suspended') => void;
  setRiderTier: (tier: string) => void;
  setStats: (stats: RiderStats) => void;

  // Request flow
  setPendingRequest: (req: RideRequest | null) => void;
  setCountdown: (n: number) => void;
  decrementCountdown: () => void;

  // Status transitions
  setStatus: (status: RiderRideStatus) => void;
  setActiveRide: (ride: RiderActiveRide) => void;
  clearActiveRide: () => void;

  // OTP
  setOtp: (otp: string) => void;
  setOtpError: (msg: string | null) => void;

  // Loading
  setLoading: (v: boolean) => void;
  setSubmitting: (v: boolean) => void;

  // Full reset (go offline)
  reset: () => void;
}

const initialState: RiderState = {
  rideStatus: 'OFFLINE',
  isOnline: false,
  approvalStatus: null,
  riderTier: 'Standard',
  stats: null,
  pendingRequest: null,
  requestCountdown: 15,
  activeRide: null,
  otp: '',
  otpError: null,
  isLoading: true,
  isSubmitting: false,
};

export const useRiderStore = create<RiderState & RiderActions>((set) => ({
  ...initialState,

  setOnlineStatus: (isOnline) =>
    set({ isOnline, rideStatus: isOnline ? 'ONLINE_IDLE' : 'OFFLINE' }),

  setApprovalStatus: (status) => set({ approvalStatus: status }),
  setRiderTier: (tier) => set({ riderTier: tier }),
  setStats: (stats) => set({ stats }),

  setPendingRequest: (req) =>
    set({
      pendingRequest: req,
      rideStatus: req ? 'RIDE_REQUESTED' : 'ONLINE_IDLE',
      requestCountdown: 15,
    }),

  setCountdown: (n) => set({ requestCountdown: n }),
  decrementCountdown: () =>
    set((s) => ({ requestCountdown: Math.max(0, s.requestCountdown - 1) })),

  setStatus: (status) => set({ rideStatus: status }),
  setActiveRide: (ride) => set({ activeRide: ride }),
  clearActiveRide: () => set({ activeRide: null, pendingRequest: null, otp: '', otpError: null }),

  setOtp: (otp) => set({ otp }),
  setOtpError: (msg) => set({ otpError: msg }),

  setLoading: (v) => set({ isLoading: v }),
  setSubmitting: (v) => set({ isSubmitting: v }),

  reset: () => set(initialState),
}));
