import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  Pressable,
  useColorScheme
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../Card';
import { Button } from '../Button';
import { LinearGradient } from 'expo-linear-gradient';
import { riderService, RideRequest, ActiveRide, RideStatus } from '../../services/riderService';
import { useAuth } from '../../hooks/useAuth';
import { HapticService } from '../../services/HapticService';
import { useLocation } from '../../hooks/useLocation';
import {
  Bike,
  MapPin,
  Clock,
  Navigation,
  KeyRound,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  User
} from 'lucide-react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function RiderActiveRide() {
  const { user } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const { location } = useLocation();

  // Active status states
  const [rideStatus, setRideStatus] = useState<RideStatus>('OFFLINE');
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [pendingRequest, setPendingRequest] = useState<RideRequest | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Poll for status and active rides on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const statusRes = await riderService.getRiderStatus();
        if (statusRes.success && statusRes.data) {
          if (!statusRes.data.isOnline) {
            setRideStatus('OFFLINE');
          } else {
            // Check for active ride
            const activeRes = await riderService.getActiveRide();
            if (activeRes.success && activeRes.data) {
              setActiveRide(activeRes.data);
              setRideStatus(activeRes.data.status);
            } else {
              setRideStatus('ONLINE_IDLE');
            }
          }
        }
      } catch (err) {
        console.log('Error initializing active ride flow:', err);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  // Poll for nearby requests when ONLINE_IDLE
  useEffect(() => {
    if (rideStatus !== 'ONLINE_IDLE' || !location) return;

    let activeInterval = setInterval(async () => {
      try {
        const res = await riderService.getNearbyRequests(location.latitude, location.longitude);
        if (res.success && res.data && res.data.length > 0) {
          setPendingRequest(res.data[0]);
          setRideStatus('RIDE_REQUESTED');
          setCountdown(15);
          HapticService.triggerSuccess();
        }
      } catch (err) {
        console.log('Error polling for nearby requests:', err);
      }
    }, 4000);

    return () => clearInterval(activeInterval);
  }, [rideStatus, location]);

  // Request countdown timer
  useEffect(() => {
    if (rideStatus !== 'RIDE_REQUESTED' || !pendingRequest) return;

    if (countdown <= 0) {
      // Auto decline
      handleDecline();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, rideStatus, pendingRequest]);

  // Heartbeat sender when ride is active
  useEffect(() => {
    if (
      !activeRide ||
      !location ||
      (rideStatus !== 'EN_ROUTE_PICKUP' && rideStatus !== 'RIDE_IN_PROGRESS')
    ) {
      return;
    }

    const heartbeatInterval = setInterval(() => {
      riderService.sendHeartbeat(activeRide.id, {
        latitude: location.latitude,
        longitude: location.longitude
      });
    }, 10000);

    return () => clearInterval(heartbeatInterval);
  }, [rideStatus, activeRide, location]);

  const handleDecline = () => {
    HapticService.triggerTap();
    setPendingRequest(null);
    setRideStatus('ONLINE_IDLE');
  };

  const handleAccept = async () => {
    if (!pendingRequest) return;
    HapticService.triggerSuccess();
    setSubmitting(true);
    const res = await riderService.acceptRide(pendingRequest.id);
    setSubmitting(false);

    if (res.success && res.data) {
      setActiveRide(res.data);
      setRideStatus('EN_ROUTE_PICKUP');
      setPendingRequest(null);
    } else {
      Alert.alert('Ride Error', res.message || 'Ride was accepted by another driver.');
      handleDecline();
    }
  };

  const handleArrived = async () => {
    if (!activeRide) return;
    HapticService.triggerTap();
    setSubmitting(true);
    const res = await riderService.markArrived(activeRide.id);
    setSubmitting(false);

    if (res.success) {
      setRideStatus('ARRIVED_WAITING');
    } else {
      Alert.alert('Network Error', 'Failed to update pickup status.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!activeRide || !otp) return;
    HapticService.triggerTap();
    setSubmitting(true);
    setOtpError(null);
    const res = await riderService.verifyOtp(activeRide.id, otp);
    setSubmitting(false);

    if (res.success) {
      setRideStatus('RIDE_IN_PROGRESS');
      setOtp('');
    } else {
      HapticService.triggerError();
      setOtpError(res.message || 'Verification failed.');
    }
  };

  const handleComplete = async () => {
    if (!activeRide) return;
    HapticService.triggerSuccess();
    setSubmitting(true);
    const res = await riderService.completeRide(activeRide.id);
    setSubmitting(false);

    if (res.success) {
      Alert.alert('Ride Completed', 'You have successfully completed this ride!');
      setActiveRide(null);
      setRideStatus('ONLINE_IDLE');
    } else {
      Alert.alert('Network Error', 'Failed to upload completion receipt.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Connecting to GPS...</Text>
      </View>
    );
  }

  // State: Rider is offline
  if (rideStatus === 'OFFLINE') {
    return (
      <View style={[styles.centerScreen, { backgroundColor: themeColors.background, paddingHorizontal: 30 }]}>
        <View style={[styles.iconBg, { backgroundColor: 'rgba(100, 116, 139, 0.1)' }]}>
          <Bike size={44} color={themeColors.textMuted} />
        </View>
        <Text style={[styles.mainTitle, { color: themeColors.text }]}>You are Offline</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Please go to the Home dashboard tab and slide your Duty Status to ONLINE to start receiving student ride requests.
        </Text>
      </View>
    );
  }

  // State: Rider is online, searching for rides
  if (rideStatus === 'ONLINE_IDLE') {
    return (
      <View style={[styles.fullScreen, { backgroundColor: themeColors.background }]}>
        {/* Mock Map Background Visual */}
        <LinearGradient
          colors={systemTheme === 'light' ? ['#E0F2FE', '#BAE6FD'] : ['#0F172A', '#1E293B']}
          style={styles.mockMap}
        >
          {/* Subtle Grid / Campus Indicators */}
          <View style={[styles.mapPinIndicator, { top: '35%', left: '45%' }]}>
            <View style={[styles.pulseRing, { backgroundColor: Colors.brand.accent }]} />
            <View style={[styles.pulseCenter, { backgroundColor: Colors.brand.accent }]}>
              <Navigation size={12} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
            </View>
          </View>
          <Text style={[styles.mapLabel, { top: '25%', left: '20%', color: themeColors.textSecondary }]}>Samanala Grounds</Text>
          <Text style={[styles.mapLabel, { top: '65%', left: '55%', color: themeColors.textSecondary }]}>Faculty of Computing</Text>
        </LinearGradient>

        <Card variant="elevated" style={styles.searchingPanel} padding="large">
          <ActivityIndicator size="small" color={Colors.brand.accent} style={{ marginBottom: 12 }} />
          <Text style={[styles.searchingTitle, { color: themeColors.text }]}>Searching for Ride Requests</Text>
          <Text style={[styles.searchingDesc, { color: themeColors.textSecondary }]}>
            Monitoring Sabaragamuwa University campus limits. Keep app active to automatically capture request broadcasts.
          </Text>
        </Card>
      </View>
    );
  }

  // State: Ride request received
  if (rideStatus === 'RIDE_REQUESTED' && pendingRequest) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: 'rgba(15, 23, 42, 0.7)' }]}>
        <View style={styles.requestContainer}>
          <Card variant="elevated" style={styles.requestCard} padding="large">
            
            {/* Header Timer */}
            <View style={styles.requestHeader}>
              <View style={styles.requestBadge}>
                <Bike size={18} color="#FFFFFF" />
                <Text style={styles.requestBadgeText}>INCOMING RIDE</Text>
              </View>
              <View style={[styles.timerCircle, { borderColor: countdown > 5 ? Colors.brand.accent : themeColors.danger }]}>
                <Text style={[styles.timerText, { color: countdown > 5 ? Colors.brand.accent : themeColors.danger }]}>
                  {countdown}s
                </Text>
              </View>
            </View>

            {/* Ride Locations */}
            <View style={styles.locationsBlock}>
              <View style={styles.locRow}>
                <MapPin size={18} color={Colors.brand.accent} style={styles.locIcon} />
                <View>
                  <Text style={[styles.locLabel, { color: themeColors.textSecondary }]}>Pickup Location</Text>
                  <Text style={[styles.locValue, { color: themeColors.text }]}>{pendingRequest.pickupLocation}</Text>
                </View>
              </View>
              
              <View style={[styles.verticalLine, { backgroundColor: themeColors.border }]} />

              <View style={styles.locRow}>
                <MapPin size={18} color={themeColors.danger} style={styles.locIcon} />
                <View>
                  <Text style={[styles.locLabel, { color: themeColors.textSecondary }]}>Destination</Text>
                  <Text style={[styles.locValue, { color: themeColors.text }]}>{pendingRequest.dropoffLocation}</Text>
                </View>
              </View>
            </View>

            {/* Fare & Stats */}
            <View style={[styles.detailsRow, { backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#1E293B' }]}>
              <View style={styles.detailCol}>
                <Text style={[styles.detailTitle, { color: themeColors.textSecondary }]}>Fare Estimate</Text>
                <Text style={[styles.detailValue, { color: themeColors.text }]}>Rs. {pendingRequest.fareEstimate}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailCol}>
                <Text style={[styles.detailTitle, { color: themeColors.textSecondary }]}>Distance</Text>
                <Text style={[styles.detailValue, { color: themeColors.text }]}>{pendingRequest.distanceKm} km</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Button
                title="Decline"
                onPress={handleDecline}
                variant="outline"
                style={{ flex: 1, marginRight: 10, borderRadius: 12 }}
                disabled={submitting}
              />
              <Button
                title="Accept Ride"
                onPress={handleAccept}
                variant="primary"
                style={{ flex: 2, borderRadius: 12, backgroundColor: '#10B981' }}
                loading={submitting}
              />
            </View>

          </Card>
        </View>
      </View>
    );
  }

  // State: Ride accepted, driving to pickup
  if (rideStatus === 'EN_ROUTE_PICKUP' && activeRide) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: themeColors.background }]}>
        <LinearGradient
          colors={systemTheme === 'light' ? ['#E0F2FE', '#BAE6FD'] : ['#0F172A', '#1E293B']}
          style={styles.mockMap}
        >
          {/* Mock path and pins */}
          <View style={[styles.mapPinIndicator, { top: '35%', left: '35%' }]}>
            <View style={[styles.pulseCenter, { backgroundColor: Colors.brand.accent }]}>
              <MapPin size={12} color="#FFFFFF" />
            </View>
          </View>
          <View style={[styles.mapPinIndicator, { top: '65%', left: '55%' }]}>
            <View style={[styles.pulseCenter, { backgroundColor: '#10B981' }]}>
              <Navigation size={12} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
            </View>
          </View>
        </LinearGradient>

        <Card variant="elevated" style={styles.statusPanel} padding="medium">
          <View style={styles.panelHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: '#2E9EBF' }]} />
            <Text style={[styles.panelStatusText, { color: themeColors.text }]}>En Route to Pickup</Text>
          </View>

          <View style={styles.studentInfoRow}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.primaryLight }]}>
              <User size={20} color={themeColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.studentName, { color: themeColors.text }]}>{activeRide.studentName}</Text>
              <Text style={[styles.pickupText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                {activeRide.pickupLocation}
              </Text>
            </View>
            <View style={styles.fareContainer}>
              <Text style={[styles.fareText, { color: themeColors.text }]}>Rs. {activeRide.fareEstimate}</Text>
            </View>
          </View>

          <Button
            title="I Have Arrived"
            onPress={handleArrived}
            variant="primary"
            style={{ borderRadius: 12, backgroundColor: Colors.brand.accent }}
            loading={submitting}
          />
        </Card>
      </View>
    );
  }

  // State: Arrived, waiting for student + OTP verification
  if (rideStatus === 'ARRIVED_WAITING' && activeRide) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: themeColors.background }]}>
        <View style={styles.otpContainer}>
          <Card variant="elevated" style={styles.otpCard} padding="large">
            <View style={styles.otpIconWrapper}>
              <KeyRound size={32} color={Colors.brand.accent} />
            </View>
            <Text style={[styles.otpTitle, { color: themeColors.text }]}>Enter Student Verification PIN</Text>
            <Text style={[styles.otpDesc, { color: themeColors.textSecondary }]}>
              Ask the student for the 4-digit verification code displayed on their screen to start the ride safely.
            </Text>

            <TextInput
              value={otp}
              onChangeText={(val) => {
                setOtp(val.replace(/[^0-9]/g, ''));
                setOtpError(null);
              }}
              placeholder="e.g. 1234"
              placeholderTextColor={themeColors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              style={[styles.otpInput, { color: themeColors.text, borderColor: otpError ? themeColors.danger : themeColors.border }]}
            />

            {otpError && (
              <View style={styles.errorRow}>
                <AlertTriangle size={14} color={themeColors.danger} style={{ marginRight: 6 }} />
                <Text style={[styles.errorText, { color: themeColors.danger }]}>{otpError}</Text>
              </View>
            )}

            <Button
              title="Start Ride"
              onPress={handleVerifyOtp}
              variant="primary"
              disabled={otp.length < 4}
              style={{ borderRadius: 12, marginTop: 12, backgroundColor: '#10B981' }}
              loading={submitting}
            />
          </Card>
        </View>
      </View>
    );
  }

  // State: Ride in progress, driving to destination
  if (rideStatus === 'RIDE_IN_PROGRESS' && activeRide) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: themeColors.background }]}>
        <LinearGradient
          colors={systemTheme === 'light' ? ['#E0F2FE', '#BAE6FD'] : ['#0F172A', '#1E293B']}
          style={styles.mockMap}
        >
          {/* Mock path and pins */}
          <View style={[styles.mapPinIndicator, { top: '35%', left: '35%' }]}>
            <View style={[styles.pulseCenter, { backgroundColor: '#10B981' }]}>
              <Navigation size={12} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
            </View>
          </View>
          <View style={[styles.mapPinIndicator, { top: '65%', left: '55%' }]}>
            <View style={[styles.pulseCenter, { backgroundColor: themeColors.danger }]}>
              <MapPin size={12} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>

        <Card variant="elevated" style={styles.statusPanel} padding="medium">
          <View style={styles.panelHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.panelStatusText, { color: themeColors.text }]}>Ride In Progress</Text>
          </View>

          <View style={styles.studentInfoRow}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.primaryLight }]}>
              <User size={20} color={themeColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.studentName, { color: themeColors.text }]}>{activeRide.studentName}</Text>
              <Text style={[styles.pickupText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                To: {activeRide.dropoffLocation}
              </Text>
            </View>
            <View style={styles.fareContainer}>
              <Text style={[styles.fareText, { color: themeColors.text }]}>Rs. {activeRide.fareEstimate}</Text>
            </View>
          </View>

          <Button
            title="Complete Ride"
            onPress={handleComplete}
            variant="danger"
            style={{ borderRadius: 12 }}
            loading={submitting}
          />
        </Card>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  mockMap: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapPinIndicator: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    opacity: 0.25,
  },
  pulseCenter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  mapLabel: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '700',
  },
  searchingPanel: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  searchingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  searchingDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  requestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  requestCard: {
    width: '100%',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  requestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  requestBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },
  timerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
  },
  locationsBlock: {
    marginBottom: 20,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  locLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  verticalLine: {
    width: 1.5,
    height: 24,
    marginLeft: 8,
    marginVertical: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  detailCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  detailDivider: {
    width: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  actionsRow: {
    flexDirection: 'row',
  },
  statusPanel: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  panelStatusText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
    paddingTop: 16,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
  },
  pickupText: {
    fontSize: 12,
    marginTop: 2,
  },
  fareContainer: {
    paddingLeft: 12,
  },
  fareText: {
    fontSize: 16,
    fontWeight: '800',
  },
  otpContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  otpCard: {
    alignItems: 'center',
  },
  otpIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(46, 158, 191, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  otpDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  otpInput: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8,
    marginBottom: 10,
    paddingLeft: 8, // balance letter spacing centration
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
