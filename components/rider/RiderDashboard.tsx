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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { riderService, RiderStatsResponse, RideHistoryItem } from '../../services/riderService';
import { useAuth } from '../../hooks/useAuth';
import { HapticService } from '../../services/HapticService';
import { NearULogo } from '../NearULogo';
import {
  Bike,
  Star,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  Power,
  ChevronRight,
  ShieldAlert,
  Bell
} from 'lucide-react-native';

export default function RiderDashboard() {
  const { user } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

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
          Syncing dashboard details...
        </Text>
      </View>
    );
  }

  // Handle case where rider application is pending or rejected
  if (approvalStatus !== 'Approved') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={[styles.centerContent, { paddingTop: insets.top }]}
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
      contentContainerStyle={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Navigation Header ── */}
      <View style={styles.navHeader}>
        <View style={styles.navLeft}>
          <NearULogo size={56} />
          <View style={styles.navTextGroup}>
            <Text style={[styles.navBrand, { color: Colors.brand.accent }]}>
              NearU Partner
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={11} color={themeColors.textMuted} />
              <Text style={[styles.locationText, { color: themeColors.textMuted }]}>
                Sabaragamuwa University
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          style={[
            styles.notifButton,
            {
              backgroundColor: systemTheme === 'light' ? themeColors.surfaceElevated : themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Bell size={18} color={themeColors.textSecondary} />
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      {/* ── Duty Status Card (Glowing tactile design) ── */}
      <Card variant="elevated" style={StyleSheet.flatten([styles.statusCard, isOnline && styles.onlineBorder])} padding="medium">
        <View style={styles.statusHeaderRow}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#64748B' }]} />
          <Text style={[styles.statusLabelTitle, { color: themeColors.textSecondary }]}>
            Duty Status: <Text style={{ fontWeight: '800', color: isOnline ? '#10B981' : themeColors.textSecondary }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          </Text>
        </View>

        <Text style={[styles.statusDescriptionText, { color: themeColors.textSecondary }]}>
          {isOnline 
            ? 'You are active on the campus map and visible to students booking rides.' 
            : 'Go online to start receiving ride requests from students around campus.'}
        </Text>

        {actionLoading ? (
          <View style={styles.buttonLoader}>
            <ActivityIndicator size="small" color={Colors.brand.accent} />
          </View>
        ) : (
          <Pressable
            onPress={() => handleToggleOnline(!isOnline)}
            style={({ pressed }) => [
              styles.dutyButton,
              {
                backgroundColor: isOnline ? '#EF4444' : '#10B981',
                shadowColor: isOnline ? '#EF4444' : '#10B981',
              },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
          >
            <Power size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.dutyButtonText}>
              {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
            </Text>
          </Pressable>
        )}
      </Card>

      {/* ── Earnings & Statistics (Bento style grid) ── */}
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
          <Card variant="elevated" style={styles.statCardInner} padding="medium">
            <View style={styles.statHeader}>
              <Star size={18} color="#F59E0B" fill="#F59E0B" />
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
                    <View style={styles.locationRowItem}>
                      <MapPin size={12} color={Colors.brand.accent} style={{ marginRight: 6 }} />
                      <Text style={[styles.locationItemText, { color: themeColors.text }]} numberOfLines={1}>
                        {item.pickupLocation}
                      </Text>
                    </View>
                    <View style={[styles.locationRowItem, { marginTop: 4 }]}>
                      <MapPin size={12} color={themeColors.danger} style={{ marginRight: 6 }} />
                      <Text style={[styles.locationItemText, { color: themeColors.textSecondary }]} numberOfLines={1}>
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
                      <Star size={11} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 2 }} />
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
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
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
    padding: 24,
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
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 18,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTextGroup: {
    marginLeft: 10,
  },
  navBrand: {
    fontSize: 18,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  statusCard: {
    marginBottom: 20,
  },
  onlineBorder: {
    borderColor: '#10B981',
    borderWidth: 1,
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
    fontSize: 15,
    fontWeight: '800',
  },
  toggleDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionHeaderRow: {
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  statCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  gradientStatCard: {
    borderRadius: 16,
    padding: 16,
    height: 106,
    justifyContent: 'space-between',
  },
  statCardInner: {
    height: 106,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  statSubText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValueDark: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabelDark: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  historyCard: {
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    alignItems: 'center',
  },
  pressedItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
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
  locationRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationItemText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
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
    fontWeight: '700',
  },
  divider: {
    height: 0.5,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusLabelTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusDescriptionText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  dutyButton: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  dutyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  buttonLoader: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
