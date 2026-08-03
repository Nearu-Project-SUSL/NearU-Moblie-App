/**
 * OtpVerifyScreen — Rider enters student's 4-digit PIN to start the ride.
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, useColorScheme, TextInput,
  TouchableOpacity, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyRound, AlertTriangle, User, Play } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { useRiderStore } from '../../../store/riderStore';

interface Props {
  onStartRide: () => void;
  submitting?: boolean;
}

export default function OtpVerifyScreen({ onStartRide, submitting }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const { activeRide, otp, otpError, setOtp, setOtpError } = useRiderStore();

  // Shake animation for error
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!otpError) return;
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [otpError]);

  if (!activeRide) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.card}>
        {/* Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: Colors.brand.accent + '18' }]}>
          <KeyRound size={34} color={Colors.brand.accent} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>Enter Student PIN</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Ask {activeRide.studentName} for the 4-digit verification code shown on their screen.
        </Text>

        {/* Student mini-card */}
        <View style={[styles.studentCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <View style={[styles.studentAvatar, { backgroundColor: Colors.brand.accent + '20' }]}>
            <User size={18} color={Colors.brand.accent} />
          </View>
          <Text style={[styles.studentName, { color: theme.text }]}>{activeRide.studentName}</Text>
          <View style={[styles.farePill, { backgroundColor: '#10B98115' }]}>
            <Text style={styles.farePillText}>Rs. {activeRide.fareEstimate}</Text>
          </View>
        </View>

        {/* OTP input — individual boxes */}
        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeX }] }]}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.otpBox,
                {
                  backgroundColor: scheme === 'dark' ? '#1E293B' : '#F8FAFC',
                  borderColor: otpError
                    ? '#EF4444'
                    : otp.length > i
                    ? Colors.brand.accent
                    : theme.border,
                },
              ]}
            >
              <Text style={[styles.otpDigit, { color: theme.text }]}>
                {otp[i] ?? ''}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Hidden full-width input that handles typing */}
        <TextInput
          style={styles.hiddenInput}
          value={otp}
          onChangeText={(val) => {
            setOtp(val.replace(/[^0-9]/g, '').slice(0, 4));
            setOtpError(null);
          }}
          keyboardType="number-pad"
          maxLength={4}
          caretHidden
          autoFocus
        />

        {/* Error */}
        {otpError && (
          <View style={styles.errorRow}>
            <AlertTriangle size={13} color="#EF4444" />
            <Text style={styles.errorText}>{otpError}</Text>
          </View>
        )}

        {/* Start Ride button */}
        <TouchableOpacity
          style={[styles.startBtn, { opacity: otp.length < 4 || submitting ? 0.45 : 1 }]}
          onPress={onStartRide}
          disabled={otp.length < 4 || submitting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startGradient}
          >
            <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.startText}>{submitting ? 'Verifying...' : 'Start Ride'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  card: { alignItems: 'center', gap: 18 },
  iconWrapper: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 12 },
  studentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    width: '100%', padding: 12, borderRadius: 14, borderWidth: 1,
  },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  studentName: { flex: 1, fontSize: 15, fontWeight: '700' },
  farePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  farePillText: { fontSize: 13, fontWeight: '700', color: '#10B981' },
  otpRow: { flexDirection: 'row', gap: 12 },
  otpBox: {
    width: 64, height: 72, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  otpDigit: { fontSize: 28, fontWeight: '800' },
  hiddenInput: {
    position: 'absolute', opacity: 0, width: 1, height: 1,
  },
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  errorText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  startBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  startGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  startText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
