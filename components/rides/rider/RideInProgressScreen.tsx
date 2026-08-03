/**
 * RideInProgressScreen — Rider's view while driving student to destination.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, useColorScheme, TouchableOpacity, Alert, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, User, CheckCircle2, Clock } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { useRiderStore } from '../../../store/riderStore';
import { useLocation } from '../../../hooks/useLocation';
import { rideService } from '../../../services/riderService';
import RideMap from '../RideMap';

interface Props {
  onComplete: () => void;
  submitting?: boolean;
}

export default function RideInProgressScreen({ onComplete, submitting }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { activeRide } = useRiderStore();
  const { location } = useLocation();

  // Elapsed timer
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

  // Heartbeat sender every 10s
  useEffect(() => {
    if (!activeRide || !location) return;
    const id = setInterval(() => {
      rideService.sendHeartbeat(activeRide.id, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }, 10000);
    return () => clearInterval(id);
  }, [activeRide?.id, location]);

  // Live dot pulse
  const livePulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1.3, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(livePulse, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    ).start();
  }, []);

  const handleComplete = () => {
    Alert.alert(
      'Complete Ride?',
      'Please confirm you have dropped off the student at their destination.',
      [
        { text: 'Not Yet', style: 'cancel' },
        { text: 'Yes, Complete', onPress: onComplete },
      ],
    );
  };

  if (!activeRide) return null;

  const currentLoc = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : undefined;
  const dropoff = { latitude: activeRide.dropoffLat, longitude: activeRide.dropoffLng };

  return (
    <View style={styles.container}>
      {/* Map with rider current location → dropoff */}
      <RideMap
        pickup={currentLoc}
        dropoff={dropoff}
        showRoute={!!currentLoc}
        style={styles.map}
      />

      {/* Live status top bar */}
      <View style={[styles.topBar, { backgroundColor: theme.surface + 'F2' }]}>
        <View style={[styles.liveChip, { backgroundColor: '#10B981' }]}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: livePulse }] }]} />
          <Text style={styles.liveText}>RIDE IN PROGRESS</Text>
        </View>
        <View style={[styles.timerChip, { backgroundColor: theme.surfaceElevated }]}>
          <Clock size={12} color={theme.textSecondary} />
          <Text style={[styles.timerText, { color: theme.text }]}>{fmtTimer(elapsed)}</Text>
        </View>
      </View>

      {/* Bottom card */}
      <View style={[styles.bottomCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Student row */}
        <View style={styles.studentRow}>
          <View style={[styles.avatar, { backgroundColor: Colors.brand.accent + '20' }]}>
            <User size={20} color={Colors.brand.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.studentName, { color: theme.text }]}>{activeRide.studentName}</Text>
            <View style={styles.destRow}>
              <MapPin size={11} color="#EF4444" />
              <Text style={[styles.destText, { color: theme.textSecondary }]} numberOfLines={1}>
                {activeRide.dropoffLocation}
              </Text>
            </View>
          </View>
          <View style={[styles.fareBadge, { backgroundColor: Colors.brand.accent + '15' }]}>
            <Text style={[styles.fareText, { color: Colors.brand.accent }]}>
              Rs. {activeRide.fareEstimate}
            </Text>
          </View>
        </View>

        {/* Complete Ride CTA */}
        <TouchableOpacity
          style={[styles.completeBtn, { opacity: submitting ? 0.7 : 1 }]}
          onPress={handleComplete}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.completeGradient}
          >
            <CheckCircle2 size={20} color="#FFFFFF" />
            <Text style={styles.completeText}>
              {submitting ? 'Completing...' : 'Complete Ride'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
    paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12,
  },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FFFFFF' },
  liveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  timerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  timerText: { fontSize: 13, fontWeight: '700' },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1,
    padding: 20, gap: 16, paddingBottom: 36,
  },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 16, fontWeight: '700' },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  destText: { fontSize: 12, flex: 1 },
  fareBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  fareText: { fontSize: 14, fontWeight: '800' },
  completeBtn: { borderRadius: 14, overflow: 'hidden' },
  completeGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  completeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
