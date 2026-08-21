/**
 * InProgressRideScreen — Full-screen map with live rider tracking while ride is active.
 * Polls ride status for CompletedByRider transition, and polls rider location every 5s.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, useColorScheme, Animated, Easing, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car, MapPin, Clock, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { rideService } from '../../../services/riderService';
import { useStudentRideStore } from '../../../store/rideStore';
import { HapticService } from '../../../services/HapticService';
import RideMap from '../RideMap';

export default function InProgressRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const store = useStudentRideStore();
  const ride = store.activeRide!;

  // Elapsed ride timer
  const [elapsed, setElapsed] = React.useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Subtle pulse on the timer icon to show it's live
  const timerPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerPulse, { toValue: 1.15, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(timerPulse, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    ).start();
  }, []);

  // Poll ride status for CompletedByRider
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await rideService.getStudentActiveRide();
      if (!res.success || !res.data) return;

      if (res.data.status === 'CompletedByRider') {
        HapticService.triggerSuccess();
        store.setConfirmComplete();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Poll rider live location
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await rideService.getRiderLiveLocation(ride.rideId);
      if (res.success && res.data) {
        store.setRiderLiveLocation(res.data.latitude, res.data.longitude);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [ride.rideId]);

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
  const riderLoc = ride.riderLatitude != null && ride.riderLongitude != null
    ? { latitude: ride.riderLatitude, longitude: ride.riderLongitude }
    : undefined;

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <RideMap
        pickup={pickup}
        dropoff={dropoff}
        riderLocation={riderLoc}
        showRoute
        style={styles.map}
      />

      {/* Top status bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: theme.surface + 'F0' }]}>
        <Pressable
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: scheme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)' }]}
        >
          <ArrowLeft size={18} color={theme.text} />
        </Pressable>

        <View style={[styles.liveChip, { backgroundColor: Colors.brand.accent }]}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: timerPulse }] }]} />
          <Text style={styles.liveText}>RIDE IN PROGRESS</Text>
        </View>

        <View style={styles.timerBox}>
          <Clock size={13} color={theme.textSecondary} />
          <Text style={[styles.timerText, { color: theme.text }]}>{fmtTimer(elapsed)}</Text>
        </View>
      </View>

      {/* Bottom info card */}
      <View style={[styles.bottomCard, { backgroundColor: theme.surface, borderColor: theme.border, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.destRow}>
          <View style={[styles.destIcon, { backgroundColor: '#FEE2E2' }]}>
            <MapPin size={18} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.destLabel, { color: theme.textSecondary }]}>Destination</Text>
            <Text style={[styles.destValue, { color: theme.text }]} numberOfLines={1}>
              {ride.dropoffLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.fareRow, { borderTopColor: theme.border }]}>
          <View style={styles.fareItem}>
            <Text style={[styles.fareLabel, { color: theme.textSecondary }]}>Estimated Fare</Text>
            <Text style={[styles.fareValue, { color: theme.text }]}>
              Rs. {ride.estimatedFare.toFixed(0)}
            </Text>
          </View>
          <View style={[styles.fareDivider, { backgroundColor: theme.border }]} />
          <View style={styles.fareItem}>
            <Text style={[styles.fareLabel, { color: theme.textSecondary }]}>Distance</Text>
            <Text style={[styles.fareValue, { color: theme.text }]}>
              {ride.distanceKm.toFixed(1)} km
            </Text>
          </View>
          <View style={[styles.fareDivider, { backgroundColor: theme.border }]} />
          <View style={styles.fareItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Car size={12} color={theme.textSecondary} />
              <Text style={[styles.fareLabel, { color: theme.textSecondary }]}>Rider</Text>
            </View>
            <Text style={[styles.fareValue, { color: theme.text }]}>
              {ride.riderName ?? '—'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, zIndex: 99,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FFFFFF' },
  liveText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  timerBox: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  timerText: { fontSize: 12, fontWeight: '700' },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1,
    paddingHorizontal: 20, paddingTop: 16,
  },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  destIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  destLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  destValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  fareRow: {
    flexDirection: 'row', borderTopWidth: 1, paddingTop: 14,
  },
  fareItem: { flex: 1, alignItems: 'center', gap: 4 },
  fareDivider: { width: 1, marginHorizontal: 4 },
  fareLabel: { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.4 },
  fareValue: { fontSize: 14, fontWeight: '800' },
});
