/**
 * AcceptedRideScreen — Shown after a rider accepts.
 * Displays OTP code, rider info, live distance, and map with rider dot.
 * Polls GET /api/rides/active (for OTP) + GET /api/location/{rideId} (for position).
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, useColorScheme, Alert, TouchableOpacity, ScrollView, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Star, Car, MapPin, X, Navigation2, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { rideService } from '../../../services/riderService';
import { useStudentRideStore } from '../../../store/rideStore';
import { HapticService } from '../../../services/HapticService';
import OtpDisplay from '../OtpDisplay';
import RideMap from '../RideMap';

export default function AcceptedRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const store = useStudentRideStore();
  const ride = store.activeRide!;

  const [cancelling, setCancelling] = useState(false);

  // ── Poll for OTP if not yet received ────────────────────────────────────────
  useEffect(() => {
    if (ride.otp) return;

    const interval = setInterval(async () => {
      const res = await rideService.getStudentActiveRide();
      if (res.success && res.data?.otp) {
        HapticService.triggerSuccess();
        store.setRideAccepted({
          otp: res.data.otp,
          otpExpiresAt: res.data.otpExpiresAt,
        });
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [ride.otp]);

  // ── Poll ride status (Arrived → InProgress transition) ──────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await rideService.getStudentActiveRide();
      if (!res.success || !res.data) return;

      if (res.data.status === 'InProgress') {
        HapticService.triggerSuccess();
        store.setRideInProgress();
      } else if (res.data.status === 'Cancelled' || res.data.status === 'Expired') {
        HapticService.triggerWarning();
        Alert.alert('Ride Cancelled', 'The rider cancelled this ride.');
        store.reset();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // ── Poll rider live location every 5s ───────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await rideService.getRiderLiveLocation(ride.rideId);
      if (res.success && res.data) {
        store.setRiderLiveLocation(
          res.data.latitude, res.data.longitude, res.data.distanceToPickupKm ?? undefined,
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [ride.rideId]);

  const handleCancel = () => {
    HapticService.triggerWarning();
    Alert.alert(
      'Cancel Ride?',
      'You can still cancel since the rider is on their way. A cancellation fee may apply.',
      [
        { text: 'Keep Ride', style: 'cancel' },
        {
          text: 'Cancel Anyway',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            await rideService.cancelRide(ride.rideId);
            setCancelling(false);
            store.reset();
          },
        },
      ],
    );
  };

  const handleBack = () => {
    HapticService.triggerTap();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/browse');
    }
  };

  const pickup = { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude };
  const dropoff = { latitude: ride.dropoffLatitude, longitude: ride.dropoffLongitude };
  const riderLoc = ride.riderLatitude && ride.riderLongitude
    ? { latitude: ride.riderLatitude, longitude: ride.riderLongitude }
    : undefined;

  return (
    <View style={styles.container}>
      {/* ── Map ──────────────────────────────────────────────── */}
      <RideMap pickup={pickup} dropoff={dropoff} riderLocation={riderLoc} style={styles.map} />

      {/* ── Floating Header Back Button ────────────────────── */}
      <View style={[styles.backButtonContainer, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: scheme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)' }]}
        >
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
      </View>

      {/* ── Bottom Sheet ─────────────────────────────────────── */}
      <ScrollView
        style={[styles.sheet, { backgroundColor: theme.surface }]}
        contentContainerStyle={{ paddingBottom: 36, paddingHorizontal: 24, paddingTop: 20, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status chip */}
        <View style={styles.statusRow}>
          <View style={[styles.statusChip, { backgroundColor: Colors.brand.accent + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: Colors.brand.accent }]} />
            <Text style={[styles.statusText, { color: Colors.brand.accent }]}>Rider Accepted</Text>
          </View>
          {ride.distanceToPickupKm != null && (
            <View style={[styles.distanceChip, { backgroundColor: theme.surfaceElevated }]}>
              <Navigation2 size={12} color={theme.textSecondary} />
              <Text style={[styles.distanceText, { color: theme.textSecondary }]}>
                {ride.distanceToPickupKm < 0.1
                  ? 'Arriving now'
                  : `${ride.distanceToPickupKm.toFixed(1)} km away`}
              </Text>
            </View>
          )}
        </View>

        {/* OTP */}
        {ride.otp ? (
          <OtpDisplay otp={ride.otp} expiresAt={ride.otpExpiresAt} />
        ) : (
          <View style={[styles.otpPlaceholder, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[styles.otpPlaceholderText, { color: theme.textSecondary }]}>
              Retrieving your verification PIN…
            </Text>
          </View>
        )}

        {/* Rider info card */}
        <View style={[styles.riderCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <View style={[styles.riderAvatar, { backgroundColor: Colors.brand.accent + '20' }]}>
            <User size={24} color={Colors.brand.accent} />
          </View>
          <View style={styles.riderInfo}>
            <Text style={[styles.riderName, { color: theme.text }]}>
              {ride.riderName ?? 'Your Rider'}
            </Text>
            {ride.riderVehicle && (
              <View style={styles.vehicleRow}>
                <Car size={12} color={theme.textSecondary} />
                <Text style={[styles.vehicleText, { color: theme.textSecondary }]}>
                  {ride.riderVehicle}
                </Text>
              </View>
            )}
          </View>
          {ride.riderRating != null && (
            <View style={styles.ratingBadge}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{ride.riderRating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Pickup location */}
        <View style={[styles.pickupBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <MapPin size={16} color={Colors.brand.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.pickupLabel, { color: theme.textSecondary }]}>Pickup point</Text>
            <Text style={[styles.pickupValue, { color: theme.text }]}>{ride.pickupLabel}</Text>
          </View>
        </View>

        {/* Cancel */}
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: theme.border }]}
          onPress={handleCancel}
          disabled={cancelling}
        >
          <X size={16} color={theme.danger} />
          <Text style={[styles.cancelText, { color: theme.danger }]}>
            {cancelling ? 'Cancelling...' : 'Cancel Ride'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 0.45 },
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    zIndex: 99,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  sheet: { flex: 0.55, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 12, fontWeight: '700' },
  distanceChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  distanceText: { fontSize: 12, fontWeight: '500' },
  otpPlaceholder: {
    height: 90, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  otpPlaceholderText: { fontSize: 13 },
  riderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  riderAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  riderInfo: { flex: 1 },
  riderName: { fontSize: 16, fontWeight: '700' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  vehicleText: { fontSize: 12 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FEF3C7', borderRadius: 12 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  pickupBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  pickupLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  pickupValue: { fontSize: 14, fontWeight: '600' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
