/**
 * Student Ride Store — Zustand state machine
 *
 * State transitions:
 *   idle → requesting → pending → accepted → in_progress → confirm → completed
 *                                              ↓ (cancel)
 *                                            idle
 */

import { create } from 'zustand';
import {
  StudentRideScreen,
  StudentActiveRide,
  FareEstimate,
  RideServiceType,
} from '../types/rides';

interface FareEstimateInput {
  estimate: FareEstimate;
  pickupLabel: string;
  dropoffLabel: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  serviceType: RideServiceType;
}

interface StudentRideState {
  // Current screen in the ride flow
  screen: StudentRideScreen;

  // Fare estimate shown before booking
  fareEstimate: FareEstimate | null;

  // Location inputs
  pickupLabel: string;
  dropoffLabel: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  dropoffLatitude: number | null;
  dropoffLongitude: number | null;
  serviceType: RideServiceType;

  // Active ride once created
  activeRide: StudentActiveRide | null;

  // Loading flags
  isEstimating: boolean;
  isRequesting: boolean;

  // Error
  error: string | null;
}

interface StudentRideActions {
  // Set location inputs
  setPickup: (label: string, lat: number, lng: number) => void;
  setDropoff: (label: string, lat: number, lng: number) => void;
  setServiceType: (type: RideServiceType) => void;

  // Set fare estimate (after API call)
  setFareEstimate: (input: FareEstimateInput) => void;
  clearFareEstimate: () => void;

  // Loading state setters
  setEstimating: (v: boolean) => void;
  setRequesting: (v: boolean) => void;
  setError: (msg: string | null) => void;

  // Ride lifecycle transitions
  setRideCreated: (rideId: string) => void;
  setRideAccepted: (update: {
    otp?: string;
    otpExpiresAt?: string;
    riderName?: string;
    riderVehicle?: string;
    riderRating?: number;
  }) => void;
  setRideInProgress: () => void;
  setRiderLiveLocation: (lat: number, lng: number, distanceToPickupKm?: number) => void;
  setConfirmComplete: () => void;
  setCompleted: () => void;

  // Reset back to booking form
  reset: () => void;
}

const initialState: StudentRideState = {
  screen: 'request',
  fareEstimate: null,
  pickupLabel: '',
  dropoffLabel: '',
  pickupLatitude: null,
  pickupLongitude: null,
  dropoffLatitude: null,
  dropoffLongitude: null,
  serviceType: 'PersonalRide',
  activeRide: null,
  isEstimating: false,
  isRequesting: false,
  error: null,
};

export const useStudentRideStore = create<StudentRideState & StudentRideActions>((set, get) => ({
  ...initialState,

  setPickup: (label, lat, lng) =>
    set({ pickupLabel: label, pickupLatitude: lat, pickupLongitude: lng, fareEstimate: null }),

  setDropoff: (label, lat, lng) =>
    set({ dropoffLabel: label, dropoffLatitude: lat, dropoffLongitude: lng, fareEstimate: null }),

  setServiceType: (type) => set({ serviceType: type }),

  setFareEstimate: ({
    estimate,
    pickupLabel,
    dropoffLabel,
    pickupLatitude,
    pickupLongitude,
    dropoffLatitude,
    dropoffLongitude,
    serviceType,
  }) =>
    set({
      fareEstimate: estimate,
      pickupLabel,
      dropoffLabel,
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
      serviceType,
    }),

  clearFareEstimate: () => set({ fareEstimate: null }),

  setEstimating: (v) => set({ isEstimating: v }),
  setRequesting: (v) => set({ isRequesting: v }),
  setError: (msg) => set({ error: msg }),

  setRideCreated: (rideId) => {
    const {
      pickupLabel,
      dropoffLabel,
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
      fareEstimate,
      serviceType,
    } = get();

    set({
      screen: 'pending',
      activeRide: {
        rideId,
        serviceType,
        estimatedFare: fareEstimate?.estimatedFare ?? 0,
        distanceKm: fareEstimate?.distanceKm ?? 0,
        estimatedDurationSeconds: fareEstimate?.estimatedDurationSeconds ?? 0,
        pickupLabel,
        dropoffLabel,
        pickupLatitude: pickupLatitude ?? 0,
        pickupLongitude: pickupLongitude ?? 0,
        dropoffLatitude: dropoffLatitude ?? 0,
        dropoffLongitude: dropoffLongitude ?? 0,
      },
      error: null,
    });
  },

  setRideAccepted: (update) =>
    set((state) => ({
      screen: 'accepted',
      activeRide: state.activeRide
        ? {
            ...state.activeRide,
            otp: update.otp,
            otpExpiresAt: update.otpExpiresAt,
            riderName: update.riderName,
            riderVehicle: update.riderVehicle,
            riderRating: update.riderRating,
          }
        : state.activeRide,
    })),

  setRideInProgress: () => set({ screen: 'in_progress' }),

  setRiderLiveLocation: (lat, lng, distanceToPickupKm) =>
    set((state) => ({
      activeRide: state.activeRide
        ? {
            ...state.activeRide,
            riderLatitude: lat,
            riderLongitude: lng,
            distanceToPickupKm,
          }
        : state.activeRide,
    })),

  setConfirmComplete: () => set({ screen: 'confirm' }),

  setCompleted: () =>
    set((state) => ({
      screen: 'completed',
      activeRide: state.activeRide
        ? { ...state.activeRide, completedAt: new Date().toISOString() }
        : state.activeRide,
    })),

  reset: () => set(initialState),
}));
