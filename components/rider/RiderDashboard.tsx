/**
 * Rider Dashboard — redesigned with premium dark card aesthetics.
 * Shows: approval status gating, online/offline animated toggle, stats grid.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, useColorScheme, ScrollView, Alert, Animated, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Power, Star, TrendingUp, Award, Clock, ShieldCheck, AlertTriangle, Bike,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { rideService } from '../../services/riderService';
import { useRiderStore } from '../../store/riderStore';
import { HapticService } from '../../services/HapticService';

export default function RiderDashboard() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const store = useRiderStore();

  // Toggle scale animation
  const toggleScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (store.isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.6, duration: 1400, useNativeDriver: false }),
          Animated.timing(glowOpacity, { toValue: 0.2, duration: 1400, useNativeDriver: false }),
        ]),
      ).start();
    } else {
      glowOpacity.stopAnimation();
      glowOpacity.setValue(0);
    }
  }, [store.isOnline]);

  // Load rider data on mount
  useEffect(() => {
    const load = async () => {
      store.setLoading(true);
      const [statusRes, statsRes] = await Promise.all([
        rideService.getRiderStatus(),
        rideService.getRiderStats(),
      ]);
      if (statusRes.success && statusRes.data) {
        store.setOnlineStatus(statusRes.data.isOnline);
        store.setApprovalStatus(statusRes.data.approvalStatus as any);
        store.setRiderTier(statusRes.data.riderTier);
      }
      if (statsRes.success && statsRes.data) {
        store.setStats(statsRes.data);
      }
      store.setLoading(false);
    };
    load();
  }, []);

  const handleToggleOnline = async () => {
    if (store.approvalStatus !== 'Approved') {
      Alert.alert(
        'Not Approved',
        'Your rider application has not been approved yet. Please wait for admin review.',
      );
      return;
    }

    HapticService.triggerTap();

    // Spring animation on press
    Animated.sequence([
      Animated.timing(toggleScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(toggleScale, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }),
    ]).start();

    const newStatus = !store.isOnline;
    store.setOnlineStatus(newStatus);

    const res = await rideService.setRiderOnlineStatus(newStatus);
    if (!res.success) {
      store.setOnlineStatus(!newStatus); // revert on failure
      Alert.alert('Network Error', 'Could not update your status. Please try again.');
    }
  };

  if (store.isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Bike size={40} color={Colors.brand.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading dashboard…</Text>
      </View>
    );
  }

  // ── Approval status gating ────────────────────────────────────────────────
  if (store.approvalStatus === 'Pending') {
    return (
      <View style={[styles.gateContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.gateBadge, { backgroundColor: '#FEF3C7' }]}>
          <Clock size={32} color="#F59E0B" />
        </View>
        <Text style={[styles.gateTitle, { color: theme.text }]}>Application Under Review</Text>
        <Text style={[styles.gateSub, { color: theme.textSecondary }]}>
          Your rider application is being reviewed by the NearU admin team. You'll be notified once approved.
        </Text>
      </View>
    );
  }

  if (store.approvalStatus === 'Rejected' || store.approvalStatus === 'Suspended') {
    return (
      <View style={[styles.gateContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.gateBadge, { backgroundColor: '#FEE2E2' }]}>
          <AlertTriangle size={32} color="#EF4444" />
        </View>
        <Text style={[styles.gateTitle, { color: theme.text }]}>
          Account {store.approvalStatus}
        </Text>
        <Text style={[styles.gateSub, { color: theme.textSecondary }]}>
          Please contact NearU support for more information about your rider account status.
        </Text>
      </View>
    );
  }

  // ── Main Dashboard ────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header gradient */}
      <LinearGradient
        colors={
          store.isOnline
            ? ['rgba(16, 185, 129, 0.15)', 'transparent']
            : ['rgba(100, 116, 139, 0.08)', 'transparent']
        }
        style={styles.headerGrad}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerGreeting, { color: theme.textSecondary }]}>
              {store.isOnline ? '🟢 You are Online' : '⚫ You are Offline'}
            </Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Rider Dashboard</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: Colors.brand.accent + '20' }]}>
            <Award size={12} color={Colors.brand.accent} />
            <Text style={[styles.tierText, { color: Colors.brand.accent }]}>{store.riderTier}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* ── Online/Offline Toggle ─────────────────────────────── */}
        <View style={[styles.toggleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>Duty Status</Text>
            <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
              {store.isOnline
                ? 'You are visible to students and receiving requests'
                : 'Go online to start receiving ride requests'}
            </Text>
          </View>

          <Pressable onPress={handleToggleOnline}>
            <Animated.View style={{ transform: [{ scale: toggleScale }] }}>
              {/* Glow ring when online */}
              <Animated.View
                style={[
                  styles.toggleGlow,
                  {
                    backgroundColor: store.isOnline ? '#10B981' : 'transparent',
                    opacity: glowOpacity,
                  },
                ]}
              />
              <LinearGradient
                colors={store.isOnline ? ['#10B981', '#059669'] : [theme.surfaceElevated, theme.surfaceElevated]}
                style={styles.toggleButton}
              >
                <Power size={26} color={store.isOnline ? '#FFFFFF' : theme.textMuted} />
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </View>

        {/* ── Stats Grid ────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Today's Overview</Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LinearGradient
              colors={['rgba(46, 158, 191, 0.12)', 'transparent']}
              style={styles.statGrad}
            >
              <View style={[styles.statIcon, { backgroundColor: Colors.brand.accent + '20' }]}>
                <TrendingUp size={18} color={Colors.brand.accent} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                Rs. {(store.stats?.todayEarnings ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Today's Earnings</Text>
            </LinearGradient>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.10)', 'transparent']}
              style={styles.statGrad}
            >
              <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
                <Bike size={18} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {store.stats?.totalRides ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Rides</Text>
            </LinearGradient>
          </View>

          <View style={[styles.statCard, styles.statCardFull, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.10)', 'transparent']}
              style={[styles.statGrad, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}
            >
              <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
                <Star size={18} color="#F59E0B" fill="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {(store.stats?.rating ?? 0).toFixed(1)} / 5.0
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Your Rating</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* ── Approved status notice ────────────────────────────── */}
        <View style={[styles.approvedNotice, { backgroundColor: '#D1FAE520', borderColor: '#10B981' }]}>
          <ShieldCheck size={16} color="#10B981" />
          <Text style={[styles.approvedText, { color: '#10B981' }]}>
            Verified & Approved Rider — NearU Campus Network
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 14, fontWeight: '500' },
  gateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  gateBadge: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  gateTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  gateSub: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerGreeting: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  tierText: { fontSize: 11, fontWeight: '700' },
  body: { paddingHorizontal: 20, gap: 16 },
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, borderRadius: 18, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  toggleInfo: { flex: 1, marginRight: 16 },
  toggleLabel: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  toggleSub: { fontSize: 12, lineHeight: 18 },
  toggleGlow: {
    position: 'absolute', width: 68, height: 68, borderRadius: 34,
    top: -6, left: -6,
  },
  toggleButton: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1, minWidth: '44%', borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statCardFull: { flexBasis: '100%', flex: 0 },
  statGrad: { padding: 16, gap: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  approvedNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, borderLeftWidth: 3,
  },
  approvedText: { fontSize: 12, fontWeight: '600', flex: 1 },
});
