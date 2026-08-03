/**
 * RequestRideScreen — Student's ride booking form.
 *
 * Flow:
 *  1. Enter pickup + dropoff (text → campus location lookup → GPS coords)
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
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
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
} from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { rideService } from '../../../services/riderService';
import { useStudentRideStore } from '../../../store/rideStore';
import { RideServiceType } from '../../../types/rides';

// ── Known SUSL campus locations → GPS coordinates ─────────────────────────────
// The backend OSRM/PostGIS service needs lat/lng, so we resolve common names.
const CAMPUS_LOCATIONS: Array<{ label: string; lat: number; lng: number }> = [
  { label: 'SUSL Main Gate', lat: 6.7146, lng: 80.7872 },
  { label: 'Faculty of Computing', lat: 6.7121, lng: 80.7891 },
  { label: 'Faculty of Applied Sciences', lat: 6.7130, lng: 80.7865 },
  { label: 'Faculty of Management', lat: 6.7112, lng: 80.7880 },
  { label: 'Student Hostel Block A', lat: 6.7155, lng: 80.7860 },
  { label: 'Student Hostel Block C', lat: 6.7158, lng: 80.7855 },
  { label: 'Samanala Grounds', lat: 6.7100, lng: 80.7900 },
  { label: 'Pambahinna Town', lat: 6.7200, lng: 80.7800 },
  { label: 'Belihuloya Town', lat: 6.7250, lng: 80.7950 },
  { label: 'SUSL Library', lat: 6.7135, lng: 80.7875 },
  { label: 'Medical Centre', lat: 6.7140, lng: 80.7868 },
  { label: 'Administration Block', lat: 6.7125, lng: 80.7878 },
];

function resolveLocation(label: string): { lat: number; lng: number } | null {
  const trimmed = label.trim().toLowerCase();
  const match = CAMPUS_LOCATIONS.find(
    (l) => l.label.toLowerCase().includes(trimmed) || trimmed.includes(l.label.toLowerCase()),
  );
  return match ? { lat: match.lat, lng: match.lng } : null;
}

// ── Service type config ───────────────────────────────────────────────────────

const SERVICE_TYPES: Array<{ type: RideServiceType; label: string; icon: React.ElementType; desc: string }> = [
  { type: 'PersonalRide', label: 'Personal Ride', icon: Car, desc: 'Door-to-door campus ride' },
  { type: 'FoodDelivery', label: 'Food Delivery', icon: UtensilsCrossed, desc: 'Deliver food to you' },
  { type: 'GroceryPickup', label: 'Grocery Pickup', icon: ShoppingBag, desc: 'Pick up your groceries' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function RequestRideScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  const store = useStudentRideStore();

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [serviceType, setServiceType] = useState<RideServiceType>('PersonalRide');
  const [pickupSuggestions, setPickupSuggestions] = useState<typeof CAMPUS_LOCATIONS>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<typeof CAMPUS_LOCATIONS>([]);
  const [isEstimating, setEstimating] = useState(false);
  const [isRequesting, setRequesting] = useState(false);

  const filterSuggestions = (text: string) =>
    text.length >= 2
      ? CAMPUS_LOCATIONS.filter((l) => l.label.toLowerCase().includes(text.toLowerCase())).slice(0, 4)
      : [];

  const handleGetEstimate = useCallback(async () => {
    const p = resolveLocation(pickup);
    const d = resolveLocation(dropoff);

    if (!p || !d) {
      Alert.alert(
        'Location Not Found',
        'Please select a pickup and dropoff from the suggestions, or type a known campus location.',
      );
      return;
    }

    setEstimating(true);
    const res = await rideService.getFareEstimate(p.lat, p.lng, d.lat, d.lng, serviceType);
    setEstimating(false);

    if (res.success && res.data) {
      store.setFareEstimate({
        estimate: res.data,
        pickupLabel: pickup,
        dropoffLabel: dropoff,
        pickupLatitude: p.lat,
        pickupLongitude: p.lng,
        dropoffLatitude: d.lat,
        dropoffLongitude: d.lng,
        serviceType,
      });
    } else {
      Alert.alert('Estimate Failed', res.message || 'Could not calculate fare. Please try again.');
    }
  }, [pickup, dropoff, serviceType, store]);

  const handleRequestRide = useCallback(async () => {
    if (!store.fareEstimate) {
      Alert.alert('Get Estimate First', 'Please get a fare estimate before requesting a ride.');
      return;
    }
    const p = resolveLocation(pickup);
    const d = resolveLocation(dropoff);
    if (!p || !d) return;

    setRequesting(true);
    const res = await rideService.createRideRequest(
      p.lat, p.lng, d.lat, d.lng, serviceType, pickup, dropoff,
    );
    setRequesting(false);

    if (res.success && res.data) {
      store.setRideCreated(res.data.rideId);
    } else {
      Alert.alert('Request Failed', res.message || 'Could not submit your ride request.');
    }
  }, [store, pickup, dropoff, serviceType]);

  const hasEstimate = !!store.fareEstimate;
  const canEstimate = pickup.trim().length > 2 && dropoff.trim().length > 2;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <LinearGradient
          colors={['rgba(46,158,191,0.12)', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: Colors.brand.accent }]}>
              <Car size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Book a Ride</Text>
              <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                Campus rides at your fingertips
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── Location Inputs ─────────────────────────────── */}
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
                  placeholder="Pickup location"
                  placeholderTextColor={theme.textMuted}
                  value={pickup}
                  onChangeText={(t) => {
                    setPickup(t);
                    store.clearFareEstimate();
                    setPickupSuggestions(filterSuggestions(t));
                  }}
                  onFocus={() => setPickupSuggestions(filterSuggestions(pickup))}
                  onBlur={() => setTimeout(() => setPickupSuggestions([]), 200)}
                />
                {pickupSuggestions.length > 0 && (
                  <View style={[styles.suggestionsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {pickupSuggestions.map((s) => (
                      <TouchableOpacity
                        key={s.label}
                        style={[styles.suggestionRow, { borderBottomColor: theme.border }]}
                        onPress={() => { setPickup(s.label); setPickupSuggestions([]); store.clearFareEstimate(); }}
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
                  placeholder="Dropoff location"
                  placeholderTextColor={theme.textMuted}
                  value={dropoff}
                  onChangeText={(t) => {
                    setDropoff(t);
                    store.clearFareEstimate();
                    setDropoffSuggestions(filterSuggestions(t));
                  }}
                  onFocus={() => setDropoffSuggestions(filterSuggestions(dropoff))}
                  onBlur={() => setTimeout(() => setDropoffSuggestions([]), 200)}
                />
                {dropoffSuggestions.length > 0 && (
                  <View style={[styles.suggestionsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {dropoffSuggestions.map((s) => (
                      <TouchableOpacity
                        key={s.label}
                        style={[styles.suggestionRow, { borderBottomColor: theme.border }]}
                        onPress={() => { setDropoff(s.label); setDropoffSuggestions([]); store.clearFareEstimate(); }}
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

          {/* ── Service Type ─────────────────────────────────── */}
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
                  onPress={() => { setServiceType(type); store.clearFareEstimate(); }}
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
                  backgroundColor: canEstimate ? 'rgba(46, 158, 191, 0.1)' : theme.surfaceElevated,
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
                {isEstimating ? 'Calculating...' : 'Get Fare Estimate'}
              </Text>
            </TouchableOpacity>
          )}

          {/* ── Fare Estimate Card ───────────────────────────── */}
          {hasEstimate && store.fareEstimate && (
            <View style={[styles.estimateCard, { backgroundColor: theme.surface, borderColor: Colors.brand.accent }]}>
              <View style={styles.estimateHeader}>
                <Text style={[styles.estimateTitle, { color: theme.text }]}>Fare Estimate</Text>
                <TouchableOpacity onPress={store.clearFareEstimate}>
                  <Text style={{ color: Colors.brand.accent, fontSize: 12, fontWeight: '600' }}>Change</Text>
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
                {isRequesting ? 'Finding Riders...' : 'Request Ride'}
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
  headerGradient: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  body: { paddingHorizontal: 20, gap: 16 },
  card: {
    borderRadius: 16, borderWidth: 1,
    padding: 16, flexDirection: 'row', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  locationIcon: { alignItems: 'center', paddingTop: 12, gap: 0 },
  locDot: { width: 10, height: 10, borderRadius: 5 },
  locLine: { width: 2, flex: 1, minHeight: 30, marginVertical: 4 },
  inputs: { flex: 1, gap: 0 },
  locationInput: { fontSize: 15, fontWeight: '500', paddingVertical: 10 },
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
