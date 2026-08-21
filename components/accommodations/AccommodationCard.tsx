import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, useColorScheme } from 'react-native';
import { Accommodation } from '../../types/accommodation';
import { Colors } from '../../constants/Colors';
import { MapPin, Hotel, CheckCircle2, Star, Eye } from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const THEME_ACCENT = '#10B981'; // Emerald Green accent for accommodations

interface AccommodationCardProps {
  item: Accommodation;
  onPress: () => void;
}

export const AccommodationCard: React.FC<AccommodationCardProps> = ({ item, onPress }) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
    HapticService.triggerSelection();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const initial = item.title ? item.title.charAt(0).toUpperCase() : 'A';

  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
        animatedStyle,
      ]}
    >
      {/* Top row: Thumbnail & Type Badge */}
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: systemTheme === 'light' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.25)' }]}>
              <Text style={[styles.avatarText, { color: THEME_ACCENT }]}>{initial}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={[styles.titleText, { color: themeColors.text }]} numberOfLines={1}>
              {item.title} <CheckCircle2 size={12} color={THEME_ACCENT} />
            </Text>
            <Text style={[styles.dateText, { color: themeColors.textMuted }]}>
              Verified Room • {item.distanceKm} km to campus
            </Text>
          </View>
        </View>

        <View style={[styles.typeBadge, { backgroundColor: THEME_ACCENT }]}>
          <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={[styles.mainTitle, { color: themeColors.text }]} numberOfLines={1}>
        {item.title}
      </Text>

      {/* Middle row: Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MapPin size={13} color={themeColors.textSecondary} style={{ marginRight: 2 }} />
          <Text style={[styles.statText, { color: themeColors.textSecondary }]} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        
        <View style={styles.ratingRow}>
          <Star size={13} color="#FBBF24" fill="#FBBF24" style={{ marginRight: 2 }} />
          <Text style={[styles.ratingText, { color: themeColors.text, fontWeight: '700' }]}>
            {item.rating || '4.5'}
          </Text>
          <Text style={[styles.reviewsText, { color: themeColors.textMuted }]}>
            ({item.reviews || '0'} reviews)
          </Text>
        </View>
      </View>

      {/* Description Excerpt */}
      <Text style={[styles.description, { color: themeColors.textSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>

      {/* Bottom row: Price and Beds availability */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={[styles.pricePrefix, { color: themeColors.textMuted }]}>Monthly Rent</Text>
          <Text style={[styles.priceText, { color: THEME_ACCENT }]}>
            LKR {item.monthlyRent?.toLocaleString() || '0'}
          </Text>
        </View>

        <View style={[styles.bedsBadge, { backgroundColor: systemTheme === 'light' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)' }]}>
          <Text style={[styles.bedsText, { color: '#22C55E' }]}>
            {item.availableBeds} beds left
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerText: {
    gap: 1,
    flex: 1,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.55,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.45,
    justifyContent: 'flex-end',
  },
  ratingText: {
    fontSize: 12,
  },
  reviewsText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.08)',
    paddingTop: 12,
  },
  pricePrefix: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  bedsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bedsText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
