/**
 * IncomingRequestSheet — slide-up bottom sheet for incoming ride request.
 * Features 15-second countdown ring, pickup/dropoff, fare/distance, accept/decline.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, useColorScheme, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Bike, Check, X, Ruler } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { useRiderStore } from '../../../store/riderStore';
import { HapticService } from '../../../services/HapticService';

interface Props {
  onAccept: () => void;
  onDecline: () => void;
  submitting?: boolean;
}

export default function IncomingRequestSheet({ onAccept, onDecline, submitting }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { pendingRequest, requestCountdown } = useRiderStore();

  // Slide-up entrance
  const slideY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: 0, tension: 50, friction: 8, useNativeDriver: true,
    }).start();
  }, []);

  // Countdown ring — SVG via Animated.View rotation
  const circumference = 2 * Math.PI * 26;
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    progress.setValue(requestCountdown / 15);
  }, [requestCountdown]);

  const req = pendingRequest;
  if (!req) return null;

  const countdown = requestCountdown;
  const isUrgent = countdown <= 5;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
        { transform: [{ translateY: slideY }] },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: '#3B82F6' }]}>
          <Bike size={14} color="#FFFFFF" />
          <Text style={styles.badgeText}>INCOMING RIDE</Text>
        </View>

        {/* Countdown circle */}
        <View style={[styles.countdownCircle, { borderColor: isUrgent ? '#EF4444' : Colors.brand.accent }]}>
          <Text style={[styles.countdownText, { color: isUrgent ? '#EF4444' : Colors.brand.accent }]}>
            {countdown}s
          </Text>
        </View>
      </View>

      {/* Locations */}
      <View style={[styles.locationsCard, { backgroundColor: theme.surfaceElevated }]}>
        <View style={styles.locRow}>
          <View style={[styles.locDot, { backgroundColor: Colors.brand.accent }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.locLabel, { color: theme.textSecondary }]}>Pickup</Text>
            <Text style={[styles.locValue, { color: theme.text }]} numberOfLines={2}>
              {req.pickupLocation}
            </Text>
          </View>
        </View>

        <View style={[styles.locConnector, { backgroundColor: theme.border }]} />

        <View style={styles.locRow}>
          <View style={[styles.locDot, { backgroundColor: '#EF4444' }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.locLabel, { color: theme.textSecondary }]}>Destination</Text>
            <Text style={[styles.locValue, { color: theme.text }]} numberOfLines={2}>
              {req.dropoffLocation}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statItem, { backgroundColor: theme.surfaceElevated }]}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            Rs. {req.fareEstimate?.toFixed(0) ?? '—'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Fare</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.surfaceElevated }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ruler size={13} color={theme.textSecondary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {req.distanceKm?.toFixed(1) ?? '—'} km
            </Text>
          </View>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Distance</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.surfaceElevated }]}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {req.serviceType === 'PersonalRide' ? '🛺 Ride' : req.serviceType === 'FoodDelivery' ? '🍔 Food' : '🛒 Grocery'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Type</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.declineBtn, { borderColor: theme.border }]}
          onPress={() => { HapticService.triggerTap(); onDecline(); }}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <X size={20} color={theme.danger} />
          <Text style={[styles.declineBtnText, { color: theme.danger }]}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptBtn, { opacity: submitting ? 0.7 : 1 }]}
          onPress={() => { HapticService.triggerSuccess(); onAccept(); }}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.acceptGradient}
          >
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.acceptBtnText}>{submitting ? 'Accepting...' : 'Accept Ride'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1,
    padding: 20, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  countdownCircle: {
    width: 50, height: 50, borderRadius: 25, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
  },
  countdownText: { fontSize: 15, fontWeight: '800' },
  locationsCard: { borderRadius: 14, padding: 14, gap: 8 },
  locRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  locDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  locLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  locValue: { fontSize: 14, fontWeight: '600', marginTop: 2, lineHeight: 20 },
  locConnector: { width: 2, height: 16, marginLeft: 4, borderRadius: 1 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statItem: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.4 },
  actions: { flexDirection: 'row', gap: 12 },
  declineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  declineBtnText: { fontSize: 15, fontWeight: '700' },
  acceptBtn: { flex: 2, borderRadius: 14, overflow: 'hidden' },
  acceptGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  acceptBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
