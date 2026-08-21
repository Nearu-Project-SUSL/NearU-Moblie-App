/**
 * rides.tsx — Master Rides Tab Orchestrator
 *
 * Role routing:
 *   Rider  → RiderDashboard (with inline incoming-request sheet overlay + in-ride screens)
 *   Student → Student state machine (request → pending → accepted → in_progress → confirm → completed)
 *   Business → BusinessMenuManager (unchanged)
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Alert, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

// Student screens
import RequestRideScreen from '../../components/rides/student/RequestRideScreen';
import PendingRideScreen from '../../components/rides/student/PendingRideScreen';
import AcceptedRideScreen from '../../components/rides/student/AcceptedRideScreen';
import InProgressRideScreen from '../../components/rides/student/InProgressRideScreen';
import ConfirmCompleteScreen from '../../components/rides/student/ConfirmCompleteScreen';
import CompletedScreen from '../../components/rides/student/CompletedScreen';

// Rider screens
import RiderDashboard from '../../components/rider/RiderDashboard';
import IncomingRequestSheet from '../../components/rides/rider/IncomingRequestSheet';
import EnRouteScreen from '../../components/rides/rider/EnRouteScreen';
import OtpVerifyScreen from '../../components/rides/rider/OtpVerifyScreen';
import RideInProgressScreen from '../../components/rides/rider/RideInProgressScreen';

// Business (unchanged)
import BusinessMenuManager from '../../components/business/BusinessMenuManager';

// Stores
import { useStudentRideStore } from '../../store/rideStore';
import { useRiderStore } from '../../store/riderStore';

// Services
import { rideService } from '../../services/riderService';
import { HapticService } from '../../services/HapticService';
import { Colors } from '../../constants/Colors';

// ── Root router ────────────────────────────────────────────────────────────────

export default function RidesTabContainer() {
  const { user } = useAuth();

  if (user?.role === 'Rider') {
    return <RiderFlow />;
  }

  if (user?.role === 'Business') {
    return <BusinessMenuManager />;
  }

  // Default → Student
  return <StudentFlow />;
}

// ── Student flow orchestrator ─────────────────────────────────────────────────

function StudentFlow() {
  const { screen } = useStudentRideStore();

  switch (screen) {
    case 'request':    return <RequestRideScreen />;
    case 'pending':    return <PendingRideScreen />;
    case 'accepted':   return <AcceptedRideScreen />;
    case 'in_progress': return <InProgressRideScreen />;
    case 'confirm':    return <ConfirmCompleteScreen />;
    case 'completed':  return <CompletedScreen />;
    default:           return <RequestRideScreen />;
  }
}

// ── Rider flow orchestrator ───────────────────────────────────────────────────

function RiderFlow() {
  const scheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const {
    rideStatus, pendingRequest, activeRide,
    isSubmitting, otp, setStatus, setSubmitting,
    setActiveRide, clearActiveRide, setPendingRequest,
    setCountdown, decrementCountdown, setOtpError,
  } = useRiderStore();

  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Poll for incoming ride requests when online ─────────────────────────────
  useEffect(() => {
    if (rideStatus !== 'ONLINE_IDLE') return;

    const poll = setInterval(async () => {
      const res = await rideService.getPendingRideRequest();
      if (res.success && res.data) {
        HapticService.triggerWarning();
        setPendingRequest(res.data);
      }
    }, 5000);

    return () => clearInterval(poll);
  }, [rideStatus]);

  // ── Countdown for incoming request ──────────────────────────────────────────
  useEffect(() => {
    if (rideStatus !== 'RIDE_REQUESTED' || !pendingRequest) {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      return;
    }

    setCountdown(15);
    countdownTimer.current = setInterval(() => {
      const store = useRiderStore.getState();
      if (store.requestCountdown <= 1) {
        clearInterval(countdownTimer.current!);
        // Timeout — auto-decline
        useRiderStore.getState().setPendingRequest(null);
      } else {
        decrementCountdown();
      }
    }, 1000);

    return () => { if (countdownTimer.current) clearInterval(countdownTimer.current); };
  }, [rideStatus, pendingRequest?.id]);

  // ── Accept ride ─────────────────────────────────────────────────────────────
  const handleAcceptRide = async () => {
    if (!pendingRequest) return;
    setSubmitting(true);

    const res = await rideService.riderAcceptRide(pendingRequest.id);
    setSubmitting(false);

    if (res.success && res.data) {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      setActiveRide(res.data as any);
      setStatus('EN_ROUTE_PICKUP');
      setPendingRequest(null);
    } else {
      Alert.alert('Accept Failed', res.message || 'Could not accept ride. Please try again.');
      setPendingRequest(null);
    }
  };

  // ── Decline ride ────────────────────────────────────────────────────────────
  const handleDeclineRide = async () => {
    if (!pendingRequest) return;
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    await rideService.riderDeclineRide(pendingRequest.id);
    setPendingRequest(null);
  };

  // ── Mark arrived ────────────────────────────────────────────────────────────
  const handleArrived = async () => {
    if (!activeRide) return;
    setSubmitting(true);
    const res = await rideService.riderMarkArrived(activeRide.id);
    setSubmitting(false);

    if (res.success) {
      setStatus('ARRIVED_WAITING');
    } else {
      Alert.alert('Error', 'Could not mark arrival. Please try again.');
    }
  };

  // ── Start ride (verify OTP) ─────────────────────────────────────────────────
  const handleStartRide = async () => {
    if (!activeRide) return;
    setSubmitting(true);

    const res = await rideService.riderStartRide(activeRide.id, otp);
    setSubmitting(false);

    if (res.success) {
      setStatus('RIDE_IN_PROGRESS');
    } else {
      setOtpError(res.message || 'Invalid PIN. Please try again.');
      HapticService.triggerError();
    }
  };

  // ── Complete ride ───────────────────────────────────────────────────────────
  const handleCompleteRide = async () => {
    if (!activeRide) return;
    setSubmitting(true);

    const res = await rideService.riderCompleteRide(activeRide.id);
    setSubmitting(false);

    if (res.success) {
      clearActiveRide();
      setStatus('ONLINE_IDLE');
    } else {
      Alert.alert('Error', 'Could not complete ride. Please try again.');
    }
  };

  // ── Screen switching ────────────────────────────────────────────────────────
  const renderRiderContent = () => {
    switch (rideStatus) {
      case 'EN_ROUTE_PICKUP':
        return <EnRouteScreen onArrived={handleArrived} submitting={isSubmitting} />;

      case 'ARRIVED_WAITING':
        return (
          <OtpVerifyScreen
            onStartRide={handleStartRide}
            submitting={isSubmitting}
          />
        );

      case 'RIDE_IN_PROGRESS':
        return (
          <RideInProgressScreen
            onComplete={handleCompleteRide}
            submitting={isSubmitting}
          />
        );

      default:
        // OFFLINE / ONLINE_IDLE / RIDE_REQUESTED → show dashboard (with sheet overlay)
        return <RiderDashboard />;
    }
  };

  return (
    <View style={styles.riderRoot}>
      {renderRiderContent()}

      {/* Incoming request overlay sheet — always on top when RIDE_REQUESTED */}
      {rideStatus === 'RIDE_REQUESTED' && pendingRequest && (
        <View style={[styles.sheetOverlay, { paddingBottom: insets.bottom }]}>
          <IncomingRequestSheet
            onAccept={handleAcceptRide}
            onDecline={handleDeclineRide}
            submitting={isSubmitting}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  riderRoot: { flex: 1 },
  sheetOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
