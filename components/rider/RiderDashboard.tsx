import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  useColorScheme,
  Switch,
  ActivityIndicator,
  Alert,
  Pressable,
  Platform
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../Card';
import { LinearGradient } from 'expo-linear-gradient';
import { riderService, RiderStatsResponse, RideHistoryItem } from '../../services/riderService';
import { useAuth } from '../../hooks/useAuth';
import { HapticService } from '../../services/HapticService';
import {
  Bike,
  Star,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  Power,
  ChevronRight,
  ShieldAlert
} from 'lucide-react-native';

export default function RiderDashboard() {
  const { user } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState<RiderStatsResponse | null>(null);
  const [history, setHistory] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string>('Pending');

  const fetchDashboardData = async () => {
    try {
      const statusRes = await riderService.getRiderStatus();
      if (statusRes.success && statusRes.data) {
        setIsOnline(statusRes.data.isOnline);
        setApprovalStatus(statusRes.data.approvalStatus);
      }

      const statsRes = await riderService.getStats();
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      const historyRes = await riderService.getRideHistory(1, 4);
      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data.items || []);
      }
    } catch (err) {
      console.log('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleOnline = async (value: boolean) => {
    if (approvalStatus !== 'Approved') {
      Alert.alert(
        'Account Under Review',
        'Your rider application must be approved by the admin before going online.'
      );
      return;
    }

    HapticService.triggerSelection();
    setActionLoading(true);
    const res = await riderService.setStatus(value);
    setActionLoading(false);
    if (res.success) {
      setIsOnline(value);
    } else {
      Alert.alert('Status Error', res.message || 'Unable to update status.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  // Handle case where rider application is pending or rejected
  if (approvalStatus !== 'Approved') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.centerContent}
      >
        <Card variant="elevated" style={styles.alertCard} padding="large">
          <View style={styles.alertHeader}>
            <ShieldAlert size={48} color={approvalStatus === 'Rejected' ? themeColors.danger : themeColors.warning} />
          </View>
          <Text style={[styles.alertTitle, { color: themeColors.text }]}>
            {approvalStatus === 'Rejected' ? 'Application Rejected' : 'Application Under Review'}
          </Text>
          <Text style={[styles.alertDesc, { color: themeColors.textSecondary }]}>
            {approvalStatus === 'Rejected'
              ? 'Your rider registration application was not approved by the admin team. Please contact student services support for more details.'
              : 'Your application is currently being reviewed by campus security and coordinators. You will receive access once the approval is finalized.'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: approvalStatus === 'Rejected' ? themeColors.dangerLight : themeColors.warningLight }]}>
            <Text style={[styles.statusText, { color: approvalStatus === 'Rejected' ? themeColors.danger : themeColors.warning }]}>
              {approvalStatus === 'Rejected' ? 'Status: Rejected' : 'Status: Pending Approval'}
            </Text>
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Welcome back,
          </Text>
          <Text style={[styles.headerSubtitle, { color: Colors.brand.accent }]}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>
        <View style={styles.badgeWrapper}>
          <LinearGradient
            colors={isOnline ? ['#10B981', '#059669'] : ['#64748B', '#475569']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.roleBadge}
          >
            <Text style={styles.roleBadgeText}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </LinearGradient>
        </View>
      </View>

      {/* ── Status Card Toggle ── */}
      <Card variant="elevated" style={styles.statusCard} padding="medium">
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <View style={[styles.powerIconBg, { backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)' }]}>
              <Power size={20} color={isOnline ? '#10B981' : '#94A3B8'} />
            </View>
            <View>
              <Text style={[styles.toggleTitle, { color: themeColors.text }]}>
                Duty Status
              </Text>
              <Text style={[styles.toggleDesc, { color: themeColors.textSecondary }]}>
                {isOnline ? 'Ready for student ride requests' : 'Go online to receive rides'}
              </Text>
            </View>
          </View>
          {actionLoading ? (
            <ActivityIndicator size="small" color={Colors.brand.accent} />
          ) : (
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
            />
          )}
        </View>
      </Card>

      {/* ── Earnings & Statistics ── */}
      <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Today's Performance</Text>
      <View style={styles.statsGrid}>
        {/* Stat: Earnings */}
        <View style={styles.statCol}>
          <LinearGradient
            colors={systemTheme === 'light' ? ['#2E9EBF', '#156175'] : ['#1E293B', '#0F172A']}
            style={styles.gradientStatCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statHeader}>
              <DollarSign size={18} color="#FFFFFF" />
              <TrendingUp size={16} color="rgba(255, 255, 255, 0.7)" />
            </View>
            <Text style={styles.statValue}>
              Rs. {stats?.todayEarnings || '0'}
            </Text>
            <Text style={styles.statLabel}>
              Today's Earnings
            </Text>
          </LinearGradient>
        </View>

        {/* Stat: Rating */}
        <View style={styles.statCol}>
          <Card variant="elevated" style={styles.statCard} padding="medium">
            <View style={styles.statHeader}>
              <Star size={18} color={themeColors.warning} fill={themeColors.warning} />
              <Text style={[styles.statSubText, { color: themeColors.textSecondary }]}>Rating</Text>
            </View>
            <Text style={[styles.statValueDark, { color: themeColors.text }]}>
              {stats?.rating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={[styles.statLabelDark, { color: themeColors.textSecondary }]}>
              {stats?.totalRides || '0'} Total Rides
            </Text>
          </Card>
        </View>
      </View>

      {/* ── Recent Rides ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Recent Rides</Text>
      </View>
      
      {history.length === 0 ? (
        <Card variant="bordered" style={styles.emptyCard} padding="large">
          <Bike size={32} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            No completed rides recorded today.
          </Text>
        </Card>
      ) : (
        <Card variant="elevated" style={styles.historyCard} padding="none">
          {history.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: themeColors.border }]} />}
              <Pressable style={({ pressed }) => [styles.historyItem, pressed && styles.pressedItem]}>
                <View style={styles.historyLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: themeColors.primaryLight }]}>
                    <Bike size={18} color={themeColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.locationRow}>
                      <MapPin size={12} color={Colors.brand.accent} style={{ marginRight: 4 }} />
                      <Text style={[styles.locationText, { color: themeColors.text }]} numberOfLines={1}>
                        {item.pickupLocation}
                      </Text>
                    </View>
                    <View style={[styles.locationRow, { marginTop: 4 }]}>
                      <MapPin size={12} color={themeColors.danger} style={{ marginRight: 4 }} />
                      <Text style={[styles.locationText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                        {item.dropoffLocation}
                      </Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Clock size={11} color={themeColors.textMuted} style={{ marginRight: 4 }} />
                      <Text style={[styles.timeText, { color: themeColors.textMuted }]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={[styles.priceText, { color: themeColors.text }]}>
                    Rs. {item.fareAmount}
                  </Text>
                  {item.rating && (
                    <View style={styles.ratingRow}>
                      <Star size={11} color={themeColors.warning} fill={themeColors.warning} style={{ marginRight: 2 }} />
                      <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>{item.rating}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      {/* Extra Bottom Spacing */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  alertCard: {
    width: '100%',
    alignItems: 'center',
  },
  alertHeader: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  alertDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  badgeWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  roleBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusCard: {
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  powerIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  gradientStatCard: {
    borderRadius: 16,
    padding: 16,
    height: 114,
    justifyContent: 'space-between',
  },
  statCard: {
    height: 114,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statSubText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  statValueDark: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  statLabelDark: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  historyCard: {
    marginBottom: 24,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  pressedItem: {
    opacity: 0.9,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  timeText: {
    fontSize: 11,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
});
