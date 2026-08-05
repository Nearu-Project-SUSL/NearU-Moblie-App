/**
 * ConfirmCompleteScreen — Student confirms the rider's "trip done" mark.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, useColorScheme, TouchableOpacity, Alert, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Flag, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../../constants/Colors';
import { rideService } from '../../../services/riderService';
import { useStudentRideStore } from '../../../store/rideStore';
import { HapticService } from '../../../services/HapticService';

export default function ConfirmCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const store = useStudentRideStore();
  const ride = store.activeRide!;
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    HapticService.triggerSuccess();
    setLoading(true);
    await rideService.studentConfirmCompletion(ride.rideId);
    setLoading(false);
    store.setCompleted();
  };

  const handleDeny = () => {
    HapticService.triggerWarning();
    Alert.alert(
      'Still on the ride?',
      'If the ride is still in progress, please wait. The rider will remain marked as completing.',
      [{ text: 'OK', onPress: () => store.setRideInProgress() }],
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Floating Header Back Button */}
      <View style={[styles.backButtonContainer, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: scheme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)' }]}
        >
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.centerContent}>
        {/* Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
          <Flag size={36} color="#F59E0B" />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Ride Complete?</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your rider has marked this trip as complete. Please confirm to finalise the booking.
        </Text>

        {/* Receipt */}
        <View style={[styles.receipt, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: theme.textSecondary }]}>Ride ID</Text>
            <Text style={[styles.receiptValue, { color: theme.text, fontFamily: 'monospace' }]}>
              {ride.rideId.slice(0, 8)}…
            </Text>
          </View>
          <View style={[styles.receiptDivider, { backgroundColor: theme.border }]} />
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: theme.textSecondary }]}>Route</Text>
            <Text style={[styles.receiptValue, { color: theme.text }]} numberOfLines={1}>
              {ride.pickupLabel} → {ride.dropoffLabel}
            </Text>
          </View>
          <View style={[styles.receiptDivider, { backgroundColor: theme.border }]} />
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: theme.textSecondary }]}>Distance</Text>
            <Text style={[styles.receiptValue, { color: theme.text }]}>
              {ride.distanceKm.toFixed(1)} km
            </Text>
          </View>
          <View style={[styles.receiptDivider, { backgroundColor: theme.border }]} />
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: theme.textSecondary }]}>Total Fare</Text>
            <Text style={[styles.receiptFare, { color: Colors.brand.accent }]}>
              Rs. {ride.estimatedFare.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.denyBtn, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
            onPress={handleDeny}
            disabled={loading}
            activeOpacity={0.8}
          >
            <XCircle size={18} color={theme.danger} />
            <Text style={[styles.denyText, { color: theme.danger }]}>Still Riding</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmGradient}
            >
              <CheckCircle size={18} color="#FFFFFF" />
              <Text style={styles.confirmText}>
                {loading ? 'Confirming...' : 'Yes, Completed!'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  centerContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24, gap: 20,
  },
  iconWrapper: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', paddingHorizontal: 10 },
  receipt: {
    width: '100%', borderRadius: 16, borderWidth: 1,
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  receiptRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  receiptLabel: { fontSize: 13, fontWeight: '500' },
  receiptValue: { fontSize: 13, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  receiptFare: { fontSize: 18, fontWeight: '800' },
  receiptDivider: { height: 1 },
  buttonRow: { flexDirection: 'row', gap: 12, width: '100%' },
  denyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  denyText: { fontSize: 14, fontWeight: '600' },
  confirmBtn: { flex: 1.6, borderRadius: 14, overflow: 'hidden' },
  confirmGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  confirmText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
