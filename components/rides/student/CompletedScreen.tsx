/**
 * CompletedScreen — Final receipt + star rating after ride is done.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, MapPin, Ruler, Clock, RotateCcw } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { rideService } from '../../../services/riderService';
import { useStudentRideStore } from '../../../store/rideStore';
import StarRating from '../StarRating';

export default function CompletedScreen() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const store = useStudentRideStore();
  const ride = store.activeRide!;

  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Celebration scale-in animation
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmitRating = async () => {
    if (rating === 0 || rated) return;
    setSubmittingRating(true);
    await rideService.rateRide(ride.rideId, rating);
    setSubmittingRating(false);
    setRated(true);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Success animation */}
      <View style={styles.topSection}>
        <Animated.View
          style={[
            styles.successCircle,
            { transform: [{ scale }], opacity },
          ]}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.successGradient}
          >
            <CheckCircle size={48} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
        <Text style={[styles.congratsText, { color: theme.text }]}>Ride Complete!</Text>
        <Text style={[styles.thanksText, { color: theme.textSecondary }]}>
          Thank you for riding with NearU. Hope you had a great experience!
        </Text>
      </View>

      {/* Receipt card */}
      <View style={[styles.receipt, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.receiptTitle, { color: theme.text }]}>Trip Receipt</Text>

        <View style={styles.receiptDetail}>
          <View style={[styles.receiptIcon, { backgroundColor: Colors.brand.accent + '18' }]}>
            <MapPin size={14} color={Colors.brand.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rdLabel, { color: theme.textSecondary }]}>Route</Text>
            <Text style={[styles.rdValue, { color: theme.text }]} numberOfLines={2}>
              {ride.pickupLabel} → {ride.dropoffLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.statsRow, { borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Ruler size={14} color={theme.textSecondary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{ride.distanceKm.toFixed(1)} km</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Distance</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Clock size={14} color={theme.textSecondary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {Math.round(ride.estimatedDurationSeconds / 60)} min
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Duration</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.brand.accent, fontSize: 18 }]}>
              Rs. {ride.estimatedFare.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Fare Paid</Text>
          </View>
        </View>
      </View>

      {/* Star rating */}
      <View style={[styles.ratingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.ratingTitle, { color: theme.text }]}>How was your ride?</Text>
        <Text style={[styles.ratingSubtitle, { color: theme.textSecondary }]}>
          Rate {ride.riderName ?? 'your rider'} to help us improve
        </Text>
        <StarRating
          value={rating}
          onChange={setRating}
          readonly={rated}
          size={36}
        />
        {!rated && (
          <TouchableOpacity
            style={[
              styles.rateBtn,
              { opacity: rating === 0 || submittingRating ? 0.4 : 1 },
            ]}
            onPress={handleSubmitRating}
            disabled={rating === 0 || submittingRating}
            activeOpacity={0.8}
          >
            <Text style={styles.rateBtnText}>
              {submittingRating ? 'Submitting…' : 'Submit Rating'}
            </Text>
          </TouchableOpacity>
        )}
        {rated && (
          <Text style={[styles.ratedText, { color: Colors.brand.accent }]}>
            ✓ Rating submitted — thank you!
          </Text>
        )}
      </View>

      {/* Book again */}
      <TouchableOpacity
        style={styles.bookAgainBtn}
        onPress={store.reset}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.brand.accent, Colors.brand.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bookAgainGradient}
        >
          <RotateCcw size={16} color="#FFFFFF" />
          <Text style={styles.bookAgainText}>Book Another Ride</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: { alignItems: 'center', paddingTop: 48, paddingBottom: 28, gap: 14 },
  successCircle: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden' },
  successGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  congratsText: { fontSize: 26, fontWeight: '800' },
  thanksText: { fontSize: 14, lineHeight: 22, textAlign: 'center', paddingHorizontal: 20 },
  receipt: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  receiptTitle: { fontSize: 15, fontWeight: '700' },
  receiptDetail: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  receiptIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rdLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  rdValue: { fontSize: 14, fontWeight: '600', marginTop: 2, lineHeight: 20 },
  statsRow: {
    flexDirection: 'row', borderTopWidth: 1, paddingTop: 14,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, marginHorizontal: 4 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.4 },
  ratingCard: {
    borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', gap: 12, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  ratingTitle: { fontSize: 17, fontWeight: '700' },
  ratingSubtitle: { fontSize: 13, textAlign: 'center' },
  rateBtn: {
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.brand.accent,
  },
  rateBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  ratedText: { fontSize: 13, fontWeight: '600' },
  bookAgainBtn: { borderRadius: 16, overflow: 'hidden' },
  bookAgainGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  bookAgainText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
