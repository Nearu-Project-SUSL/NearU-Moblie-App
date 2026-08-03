/**
 * PendingRideScreen — "Searching for a rider…" state.
 * Polls GET /api/rides/active every 4s until status changes to Accepted.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, useColorScheme,
  Animated, Alert, TouchableOpacity, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, MapPin, Navigation } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { rideService } from '../../../services/riderService';
import { useStudentRideStore } from '../../../store/rideStore';
import RideMap from '../RideMap';

export default function PendingRideScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const store = useStudentRideStore();
  const activeRide = store.activeRide!;

  // ── Pulsing ring animation ───────────────────────────────────────────────────
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ).start();

    makeLoop(pulse1, 0);
    makeLoop(pulse2, 600);
    makeLoop(pulse3, 1200);
  }, []);

  const pulseStyle = (anim: Animated.Value) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.2] }) }],
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }),
  });

  // ── Poll for ride acceptance every 4s ───────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      const res = await rideService.getStudentActiveRide();
      if (!res.success || !res.data) return;

      const { status, otp, otpExpiresAt } = res.data;
      if (status === 'Accepted') {
        store.setRideAccepted({ otp, otpExpiresAt });
      } else if (status === 'Cancelled' || status === 'Expired') {
        Alert.alert('Ride Cancelled', 'Your ride request was cancelled or expired.');
        store.reset();
      }
    };

    const interval = setInterval(poll, 4000);
    poll(); // immediate first check
    return () => clearInterval(interval);
  }, []);

  const handleCancel = () => {
    Alert.alert('Cancel Ride?', 'Are you sure you want to cancel this request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await rideService.cancelRide(activeRide.rideId);
          store.reset();
        },
      },
    ]);
  };

  const pickup = { latitude: activeRide.pickupLatitude, longitude: activeRide.pickupLongitude };
  const dropoff = { latitude: activeRide.dropoffLatitude, longitude: activeRide.dropoffLongitude };

  return (
    <View style={styles.container}>
      {/* ── Map background ─────────────────────────────────── */}
      <RideMap pickup={pickup} dropoff={dropoff} style={styles.map} />

      {/* ── Bottom sheet ───────────────────────────────────── */}
      <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Pulse animation */}
        <View style={styles.pulseArea}>
          <Animated.View style={[styles.pulseRing, pulseStyle(pulse1), { borderColor: Colors.brand.accent }]} />
          <Animated.View style={[styles.pulseRing, pulseStyle(pulse2), { borderColor: Colors.brand.accent }]} />
          <Animated.View style={[styles.pulseRing, pulseStyle(pulse3), { borderColor: Colors.brand.accent }]} />
          <View style={[styles.pulseCore, { backgroundColor: Colors.brand.accent }]}>
            <Navigation size={22} color="#FFFFFF" />
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Finding Your Rider</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Broadcasting your request to nearby riders on campus. This usually takes under a minute.
        </Text>

        {/* Route summary */}
        <View style={[styles.routeCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.brand.accent }]} />
            <Text style={[styles.routeText, { color: theme.text }]} numberOfLines={1}>
              {activeRide.pickupLabel}
            </Text>
          </View>
          <View style={[styles.routeLine, { backgroundColor: theme.border }]} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.routeText, { color: theme.text }]} numberOfLines={1}>
              {activeRide.dropoffLabel}
            </Text>
          </View>
        </View>

        {/* Fare + distance chips */}
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[styles.chipLabel, { color: theme.textSecondary }]}>Estimated Fare</Text>
            <Text style={[styles.chipValue, { color: theme.text }]}>
              Rs. {activeRide.estimatedFare.toFixed(0)}
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[styles.chipLabel, { color: theme.textSecondary }]}>Distance</Text>
            <Text style={[styles.chipValue, { color: theme.text }]}>
              {activeRide.distanceKm.toFixed(1)} km
            </Text>
          </View>
        </View>

        {/* Cancel button */}
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: theme.border }]}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <X size={16} color={theme.danger} />
          <Text style={[styles.cancelText, { color: theme.danger }]}>Cancel Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  sheet: {
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 36,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1,
    alignItems: 'center', gap: 16,
  },
  pulseArea: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  pulseRing: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 2,
  },
  pulseCore: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brand.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 10 },
  routeCard: {
    width: '100%', borderRadius: 14, borderWidth: 1, padding: 14, gap: 8,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { height: 1, width: '90%', marginLeft: 18 },
  routeText: { fontSize: 14, fontWeight: '600', flex: 1 },
  chipRow: { flexDirection: 'row', gap: 10, width: '100%' },
  chip: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  chipLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  chipValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1, marginTop: 4,
  },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
