/**
 * OtpDisplay — Large, elegant OTP digit boxes for students to share with their rider.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

interface OtpDisplayProps {
  otp: string;
  expiresAt?: string;
}

export default function OtpDisplay({ otp, expiresAt }: OtpDisplayProps) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const glow = useRef(new Animated.Value(0)).current;

  // Gentle glow pulse to draw attention to the OTP
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ]),
    ).start();
  }, []);

  const digits = otp.split('').slice(0, 4);
  while (digits.length < 4) digits.push('–');

  const glowColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(46, 158, 191, 0.15)', 'rgba(46, 158, 191, 0.35)'],
  });

  // Parse expiry countdown
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const fmtExpiry = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Your ride verification PIN</Text>

      <View style={styles.digitsRow}>
        {digits.map((d, i) => (
          <Animated.View
            key={i}
            style={[
              styles.digitBox,
              {
                backgroundColor: scheme === 'dark' ? '#1E293B' : '#F1F5F9',
                borderColor: Colors.brand.accent,
                shadowColor: glowColor as any,
              },
            ]}
          >
            <Text style={[styles.digitText, { color: theme.text }]}>{d}</Text>
          </Animated.View>
        ))}
      </View>

      {secondsLeft !== null && (
        <Text
          style={[
            styles.expiry,
            { color: secondsLeft < 60 ? '#EF4444' : theme.textSecondary },
          ]}
        >
          {secondsLeft > 0 ? `Expires in ${fmtExpiry(secondsLeft)}` : 'PIN expired — tap to refresh'}
        </Text>
      )}

      <Text style={[styles.hint, { color: theme.textMuted }]}>
        Show this PIN to your rider to start the trip
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  digitsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  digitBox: {
    width: 58,
    height: 68,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 1,
    elevation: 4,
  },
  digitText: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
  },
  expiry: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
});
