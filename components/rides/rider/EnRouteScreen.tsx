/**
 * EnRouteScreen — Map view for rider driving to pickup location.
 */

import React from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, MapPin, Navigation2 } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { useRiderStore } from '../../../store/riderStore';
import RideMap from '../RideMap';

interface Props {
  onArrived: () => void;
  submitting?: boolean;
}

export default function EnRouteScreen({ onArrived, submitting }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { activeRide } = useRiderStore();

  if (!activeRide) return null;

  const pickup = { latitude: activeRide.pickupLat, longitude: activeRide.pickupLng };
  const dropoff = { latitude: activeRide.dropoffLat, longitude: activeRide.dropoffLng };

  const handleArrived = () => {
    Alert.alert(
      'Confirm Arrival',
      'Are you at the pickup location?',
      [
        { text: 'Not Yet', style: 'cancel' },
        { text: 'Yes, I Arrived', onPress: onArrived },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <RideMap pickup={pickup} dropoff={dropoff} showRoute style={styles.map} />

      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: '#2E9EBF' }]}>
        <Navigation2 size={14} color="#FFFFFF" />
        <Text style={styles.statusText}>En Route to Pickup</Text>
      </View>

      {/* Bottom card */}
      <View style={[styles.bottomCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Student info */}
        <View style={styles.studentRow}>
          <View style={[styles.avatar, { backgroundColor: Colors.brand.accent + '20' }]}>
            <User size={22} color={Colors.brand.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.studentName, { color: theme.text }]}>{activeRide.studentName}</Text>
            <Text style={[styles.pickupAddr, { color: theme.textSecondary }]} numberOfLines={1}>
              {activeRide.pickupLocation}
            </Text>
          </View>
          <View style={[styles.fareBadge, { backgroundColor: Colors.brand.accent + '15', borderColor: Colors.brand.accent }]}>
            <Text style={[styles.fareText, { color: Colors.brand.accent }]}>
              Rs. {activeRide.fareEstimate}
            </Text>
          </View>
        </View>

        {/* Pickup address */}
        <View style={[styles.pickupBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <MapPin size={15} color={Colors.brand.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.pickupBoxLabel, { color: theme.textSecondary }]}>Navigate to</Text>
            <Text style={[styles.pickupBoxValue, { color: theme.text }]}>{activeRide.pickupLocation}</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.arrivedBtn, { opacity: submitting ? 0.7 : 1 }]}
          onPress={handleArrived}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.brand.accent, Colors.brand.accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.arrivedGradient}
          >
            <Text style={styles.arrivedText}>{submitting ? 'Updating…' : 'I Have Arrived'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  statusBar: {
    position: 'absolute', top: 48, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1,
    padding: 20, gap: 14, paddingBottom: 36,
  },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 16, fontWeight: '700' },
  pickupAddr: { fontSize: 12, marginTop: 2 },
  fareBadge: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1,
  },
  fareText: { fontSize: 14, fontWeight: '800' },
  pickupBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  pickupBoxLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  pickupBoxValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  arrivedBtn: { borderRadius: 14, overflow: 'hidden' },
  arrivedGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  arrivedText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
