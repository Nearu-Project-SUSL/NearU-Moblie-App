/**
 * RequestRideScreen — Student's ride booking form with interactive map selection.
 *
 * Flow:
 *  1. Interactive Map + Location inputs (Pickup cyan pin ↔ Dropoff red pin)
 *  2. Select service type (PersonalRide / FoodDelivery / GroceryPickup)
 *  3. "Get Estimate" → OSRM-powered fare card (distance, duration, fare)
 *  4. "Request Ride" → POST /api/requests → transitions to PendingRideScreen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Navigation,
  Car,
  UtensilsCrossed,
  ShoppingBag,
  Zap,
  ChevronRight,
  Clock,
  Ruler,
  ArrowLeft,
  Target,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { rideService } from '../../../services/riderService';
import { useStudentRideStore } from '../../../store/rideStore';
import { RideServiceType, LatLng } from '../../../types/rides';
import { HapticService } from '../../../services/HapticService';
import RideMap, { SUSL_LANDMARKS, CampusLandmark } from '../RideMap';

// ── Known SUSL campus locations ─────────────────────────────────────────────
const CAMPUS_LOCATIONS: Array<{ label: string; lat: number; lng: number }> = SUSL_LANDMARKS;

function resolveLocation(label: string): LatLng | null {
  const trimmed = label.trim().toLowerCase();
  const match = CAMPUS_LOCATIONS.find(
    (l) => l.label.toLowerCase().includes(trimmed) || trimmed.includes(l.label.toLowerCase()),
  );
  return match ? { latitude: match.lat, longitude: match.lng } : null;
}

// ── Service type config ───────────────────────────────────────────────────────

const SERVICE_TYPES: Array<{ type: RideServiceType; label: string; icon: React.ElementType; desc: string }> = [
  { type: 'PersonalRide', label: 'Personal Ride', icon: Car, desc: 'Door-to-door campus ride' },
  { type: 'FoodDelivery', label: 'Food Delivery', icon: UtensilsCrossed, desc: 'Deliver food to you' },
  { type: 'GroceryPickup', label: 'Grocery Pickup', icon: ShoppingBag, desc: 'Pick up your groceries' },
];

export default function RequestRideScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const insets = useSafeAreaInsets();
  const store = useStudentRideStore();

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState<LatLng | undefined>(undefined);
  const [dropoffCoords, setDropoffCoords] = useState<LatLng | undefined>(undefined);
  
  // Selection mode for tapping on map ('pickup' | 'dropoff')
  const [activePinTarget, setActivePinTarget] = useState<'pickup' | 'dropoff'>('pickup');
  
  const [serviceType, setServiceType] = useState<RideServiceType>('PersonalRide');
  const [pickupSuggestions, setPickupSuggestions] = useState<typeof CAMPUS_LOCATIONS>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<typeof CAMPUS_LOCATIONS>([]);
  const [isEstimating, setEstimating] = useState(false);
  const [isRequesting, setRequesting] = useState(false);

  const filterSuggestions = (text: string) =>
    text.length >= 2
      ? CAMPUS_LOCATIONS.filter((l) => l.label.toLowerCase().includes(text.toLowerCase())).slice(0, 4)
      : [];

  const handleSelectLandmark = (lm: CampusLandmark) => {
    HapticService.triggerSelection();
    store.clearFareEstimate();
    if (activePinTarget === 'pickup') {
      setPickup(lm.label);
      setPickupCoords({ latitude: lm.lat, longitude: lm.lng });
      setActivePinTarget('dropoff'); // Auto switch to dropoff pin mode
    } else {
      setDropoff(lm.label);
      setDropoffCoords({ latitude: lm.lat, longitude: lm.lng });
    }
  };

  const handleMapPress = (coord: LatLng) => {
    HapticService.triggerTap();
    store.clearFareEstimate();
    const formattedLabel = `Pin (${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)})`;
    if (activePinTarget === 'pickup') {
      setPickupCoords(coord);
      setPickup(formattedLabel);
      setActivePinTarget('dropoff');
    } else {
      setDropoffCoords(coord);
      setDropoff(formattedLabel);
    }
  };

  const handleGetEstimate = useCallback(async () => {
    HapticService.triggerTap();
    let p = pickupCoords || resolveLocation(pickup);
    let d = dropoffCoords || resolveLocation(dropoff);

    if (!p || !d) {
      Alert.alert(
        'Location Not Found',
        'Please select a pickup and dropoff from campus landmarks, tap the map, or select from suggestions.',
      );
      return;
    }

    setEstimating(true);
    const res = await rideService.getFareEstimate(p.latitude, p.longitude, d.latitude, d.longitude, serviceType);
    setEstimating(false);

    if (res.success && res.data) {
      HapticService.triggerSuccess();
      store.setFareEstimate({
        estimate: res.data,
        pickupLabel: pickup,
        dropoffLabel: dropoff,
        pickupLatitude: p.latitude,
        pickupLongitude: p.longitude,
        dropoffLatitude: d.latitude,
        dropoffLongitude: d.longitude,
        serviceType,
      });
    } else {
      HapticService.triggerError();
      Alert.alert('Estimate Failed', res.message || 'Could not calculate fare. Please try again.');
    }
  }, [pickup, dropoff, pickupCoords, dropoffCoords, serviceType, store]);

  const handleRequestRide = useCallback(async () => {
    if (!store.fareEstimate) {
      Alert.alert('Get Estimate First', 'Please get a fare estimate before requesting a ride.');
      return;
    }
    let p = pickupCoords || resolveLocation(pickup);
    let d = dropoffCoords || resolveLocation(dropoff);
    if (!p || !d) return;

    HapticService.triggerSelection();
    setRequesting(true);
    const res = await rideService.createRideRequest(
      p.latitude, p.longitude, d.latitude, d.longitude, serviceType, pickup, dropoff,
    );
    setRequesting(false);

    if (res.success && res.data) {
      HapticService.triggerSuccess();
      store.setRideCreated(res.data.rideId);
    } else {
      HapticService.triggerError();
      Alert.alert('Request Failed', res.message || 'Could not submit your ride request.');
    }
  }, [store, pickup, dropoff, pickupCoords, dropoffCoords, serviceType]);

  const hasEstimate = !!store.fareEstimate;
  const canEstimate = (pickup.trim().length > 2 || !!pickupCoords) && (dropoff.trim().length > 2 || !!dropoffCoords);

  const handleBack = () => {
    HapticService.triggerTap();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/browse');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header Banner with Floating Back Button ───── */}
        <LinearGradient
          colors={scheme === 'light' ? ['#2E9EBF', '#156175'] : ['#1C2A30', '#0E171B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerBanner, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.headerNavRow}>
            <Pressable
              onPress={handleBack}
              style={[styles.backButton, { backgroundColor: scheme === 'light' ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.6)' }]}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>
            <View style={styles.headerBadge}>
              <Sparkles size={12} color="#2E9EBF" />
              <Text style={styles.headerBadgeText}>NearU Rides</Text>
            </View>
          </View>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Campus Commutes</Text>
            <Text style={styles.headerSub}>Fast, safe & affordable student transport at SUSL</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>

          {/* ── Interactive Map View Card ────────────────────── */}
          <View style={[styles.mapContainerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.mapHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Navigation size={16} color={Colors.brand.accent} />
                <Text style={[styles.mapCardTitle, { color: theme.text }]}>SUSL Campus Map</Text>
              </View>

              {/* Mode Toggle: Pickup vs Dropoff Pin */}
              <View style={styles.pinTargetToggle}>
                <TouchableOpacity
                  style={[
                    styles.pinTargetBtn,
                    activePinTarget === 'pickup' && { backgroundColor: Colors.brand.accent },
                  ]}
                  onPress={() => {
                    HapticService.triggerSelection();
                    setActivePinTarget('pickup');
                  }}
                >
                  <Text style={[styles.pinTargetText, activePinTarget === 'pickup' && { color: '#FFFFFF' }]}>
                    Pickup
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.pinTargetBtn,
                    activePinTarget === 'dropoff' && { backgroundColor: '#EF4444' },
                  ]}
                  onPress={() => {
                    HapticService.triggerSelection();
                    setActivePinTarget('dropoff');
                  }}
                >
                  <Text style={[styles.pinTargetText, activePinTarget === 'dropoff' && { color: '#FFFFFF' }]}>
                    Dropoff
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.mapWrapper}>
              <RideMap
                pickup={pickupCoords}
                dropoff={dropoffCoords}
                showRoute={true}
                showLandmarks={true}
                onMapPress={handleMapPress}
                onSelectLandmark={handleSelectLandmark}
                style={styles.embeddedMap}
              />
              <View style={styles.mapHintBadge}>
                <Target size={12} color="#FFFFFF" />
                <Text style={styles.mapHintText}>
                  Tap map or landmark to set {activePinTarget.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Landmark Quick Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.landmarkScroll}
            >
              {CAMPUS_LOCATIONS.map((lm) => (
                <TouchableOpacity
                  key={lm.label}
                  style={[styles.landmarkChip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                  onPress={() => handleSelectLandmark(lm)}
                >
                  <MapPin size={12} color={Colors.brand.accent} />
                  <Text style={[styles.landmarkChipText, { color: theme.text }]}>{lm.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Location Inputs Form ─────────────────────────── */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.locationIcon}>
              <View style={[styles.locDot, { backgroundColor: Colors.brand.accent }]} />
              <View style={[styles.locLine, { backgroundColor: theme.border }]} />
              <View style={[styles.locDot, { backgroundColor: '#EF4444' }]} />
            </View>

            <View style={styles.inputs}>
              {/* Pickup */}
              <View>
                <TextInput
                  style={[styles.locationInput, { color: theme.text }]}
                  placeholder="Pickup location (or select on map)"
                  placeholderTextColor={theme.textMuted}
                  value={pickup}
                  onChangeText={(t) => {
                    setPickup(t);
                    setPickupCoords(undefined);
                    store.clearFareEstimate();
                    setPickupSuggestions(filterSuggestions(t));
                  }}
                  onFocus={() => {
                    setActivePinTarget('pickup');
                    setPickupSuggestions(filterSuggestions(pickup));
                  }}
                  onBlur={() => setTimeout(() => setPickupSuggestions([]), 200)}
                />
                {pickupSuggestions.length > 0 && (
                  <View style={[styles.suggestionsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {pickupSuggestions.map((s) => (
                      <TouchableOpacity
                        key={s.label}
                        style={[styles.suggestionRow, { borderBottomColor: theme.border }]}
                        onPress={() => {
                          setPickup(s.label);
                          setPickupCoords({ latitude: s.lat, longitude: s.lng });
                          setPickupSuggestions([]);
                          store.clearFareEstimate();
                        }}
                      >
                        <MapPin size={13} color={Colors.brand.accent} />
                        <Text style={[styles.suggestionText, { color: theme.text }]}>{s.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={[styles.inputDivider, { backgroundColor: theme.border }]} />

              {/* Dropoff */}
              <View>
                <TextInput
                  style={[styles.locationInput, { color: theme.text }]}
                  placeholder="Dropoff location (or select on map)"
                  placeholderTextColor={theme.textMuted}
                  value={dropoff}
                  onChangeText={(t) => {
                    setDropoff(t);
                    setDropoffCoords(undefined);
                    store.clearFareEstimate();
                    setDropoffSuggestions(filterSuggestions(t));
                  }}
                  onFocus={() => {
                    setActivePinTarget('dropoff');
                    setDropoffSuggestions(filterSuggestions(dropoff));
                  }}
                  onBlur={() => setTimeout(() => setDropoffSuggestions([]), 200)}
                />
                {dropoffSuggestions.length > 0 && (
                  <View style={[styles.suggestionsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {dropoffSuggestions.map((s) => (
                      <TouchableOpacity
                        key={s.label}
                        style={[styles.suggestionRow, { borderBottomColor: theme.border }]}
                        onPress={() => {
                          setDropoff(s.label);
                          setDropoffCoords({ latitude: s.lat, longitude: s.lng });
                          setDropoffSuggestions([]);
                          store.clearFareEstimate();
                        }}
                      >
                        <MapPin size={13} color="#EF4444" />
                        <Text style={[styles.suggestionText, { color: theme.text }]}>{s.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ── Service Type Selection ───────────────────────── */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Service Type</Text>
          <View style={styles.serviceRow}>
            {SERVICE_TYPES.map(({ type, label, icon: Icon, desc }) => {
              const selected = serviceType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.serviceChip,
                    {
                      backgroundColor: selected ? Colors.brand.accent : theme.surface,
                      borderColor: selected ? Colors.brand.accent : theme.border,
                    },
                  ]}
                  onPress={() => {
                    HapticService.triggerSelection();
                    setServiceType(type);
                    store.clearFareEstimate();
                  }}
                >
                  <Icon size={18} color={selected ? '#FFFFFF' : theme.textSecondary} />
                  <Text style={[styles.serviceLabel, { color: selected ? '#FFFFFF' : theme.text }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Get Estimate Button ──────────────────────────── */}
          {!hasEstimate && (
            <TouchableOpacity
              style={[
                styles.estimateBtn,
                {
                  backgroundColor: canEstimate ? 'rgba(46, 158, 191, 0.12)' : theme.surfaceElevated,
                  borderColor: canEstimate ? Colors.brand.accent : theme.border,
                },
              ]}
              onPress={handleGetEstimate}
              disabled={!canEstimate || isEstimating}
              activeOpacity={0.8}
            >
              <Zap size={16} color={canEstimate ? Colors.brand.accent : theme.textMuted} />
              <Text
                style={[
                  styles.estimateBtnText,
                  { color: canEstimate ? Colors.brand.accent : theme.textMuted },
                ]}
              >
                {isEstimating ? 'Calculating fare...' : 'Get Fare Estimate'}
              </Text>
            </TouchableOpacity>
          )}

          {/* ── Fare Estimate Card ───────────────────────────── */}
          {hasEstimate && store.fareEstimate && (
            <View style={[styles.estimateCard, { backgroundColor: theme.surface, borderColor: Colors.brand.accent }]}>
              <View style={styles.estimateHeader}>
                <Text style={[styles.estimateTitle, { color: theme.text }]}>Fare Estimate</Text>
                <TouchableOpacity onPress={store.clearFareEstimate}>
                  <Text style={{ color: Colors.brand.accent, fontSize: 12, fontWeight: '700' }}>Change</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.estimateGrid}>
                <View style={[styles.estimateStat, { backgroundColor: theme.surfaceElevated }]}>
                  <Text style={[styles.estimateStatValue, { color: theme.text }]}>
                    Rs. {store.fareEstimate.estimatedFare.toFixed(0)}
                  </Text>
                  <Text style={[styles.estimateStatLabel, { color: theme.textSecondary }]}>Estimated Fare</Text>
                </View>
                <View style={[styles.estimateStat, { backgroundColor: theme.surfaceElevated }]}>
                  <View style={styles.estimateStatRow}>
                    <Ruler size={14} color={theme.textSecondary} />
                    <Text style={[styles.estimateStatValue, { color: theme.text }]}>
                      {store.fareEstimate.distanceKm.toFixed(1)} km
                    </Text>
                  </View>
                  <Text style={[styles.estimateStatLabel, { color: theme.textSecondary }]}>Distance</Text>
                </View>
                <View style={[styles.estimateStat, { backgroundColor: theme.surfaceElevated }]}>
                  <View style={styles.estimateStatRow}>
                    <Clock size={14} color={theme.textSecondary} />
                    <Text style={[styles.estimateStatValue, { color: theme.text }]}>
                      {Math.round(store.fareEstimate.estimatedDurationSeconds / 60)} min
                    </Text>
                  </View>
                  <Text style={[styles.estimateStatLabel, { color: theme.textSecondary }]}>ETA</Text>
                </View>
              </View>

              <Text style={[styles.estimateMeta, { color: theme.textMuted }]}>
                Rs. {store.fareEstimate.baseFare.toFixed(0)} base + Rs. {store.fareEstimate.ratePerKm.toFixed(0)}/km
              </Text>
            </View>
          )}

          {/* ── Request Ride Button ──────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.requestBtn,
              { opacity: !hasEstimate || isRequesting ? 0.5 : 1 },
            ]}
            onPress={handleRequestRide}
            disabled={!hasEstimate || isRequesting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.brand.accent, Colors.brand.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.requestBtnGradient}
            >
              <Text style={styles.requestBtnText}>
                {isRequesting ? 'Finding Riders...' : 'Confirm & Request Ride'}
              </Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBanner: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitleBlock: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  mapContainerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mapCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pinTargetToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 14,
    padding: 2,
  },
  pinTargetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pinTargetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  mapWrapper: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  embeddedMap: {
    width: '100%',
    height: '100%',
  },
  mapHintBadge: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapHintText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  landmarkScroll: {
    gap: 8,
    paddingTop: 10,
    paddingHorizontal: 2,
  },
  landmarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  landmarkChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  locationIcon: { alignItems: 'center', paddingTop: 12, gap: 0 },
  locDot: { width: 10, height: 10, borderRadius: 5 },
  locLine: { width: 2, flex: 1, minHeight: 30, marginVertical: 4 },
  inputs: { flex: 1, gap: 0 },
  locationInput: { fontSize: 14, fontWeight: '500', paddingVertical: 10 },
  inputDivider: { height: 1, marginVertical: 4 },
  suggestionsBox: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99,
    borderRadius: 10, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5,
  },
  suggestionText: { fontSize: 13, fontWeight: '500' },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  serviceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
  },
  serviceLabel: { fontSize: 13, fontWeight: '600' },
  estimateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  estimateBtnText: { fontSize: 14, fontWeight: '700' },
  estimateCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 16,
    shadowColor: Colors.brand.accent, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  estimateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  estimateTitle: { fontSize: 15, fontWeight: '700' },
  estimateGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  estimateStat: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', gap: 4 },
  estimateStatRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  estimateStatValue: { fontSize: 16, fontWeight: '800' },
  estimateStatLabel: { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  estimateMeta: { fontSize: 11, textAlign: 'center' },
  requestBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  requestBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  requestBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
