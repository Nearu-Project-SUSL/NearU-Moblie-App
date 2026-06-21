import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, useColorScheme } from 'react-native';
import { Photographer } from '../../types/photography';
import { Colors } from '../../constants/Colors';
import { MapPin, CheckCircle2, Star, Camera } from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const THEME_ACCENT = '#8B5CF6'; // Creative Violet/Purple for photography

interface PhotographyCardProps {
  photographer: Photographer;
  onPress: () => void;
}

export const PhotographyCard: React.FC<PhotographyCardProps> = ({ photographer, onPress }) => {
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

  const initial = photographer.name ? photographer.name.charAt(0).toUpperCase() : 'P';

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
      {/* Top row: Thumbnail & Pro Badge */}
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {photographer.imageUrl ? (
            <Image source={{ uri: photographer.imageUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: systemTheme === 'light' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.25)' }]}>
              <Text style={[styles.avatarText, { color: THEME_ACCENT }]}>{initial}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={[styles.titleText, { color: themeColors.text }]} numberOfLines={1}>
              {photographer.name} <CheckCircle2 size={12} color={THEME_ACCENT} />
            </Text>
            <Text style={[styles.dateText, { color: themeColors.textMuted }]}>
              Verified Campus Photographer
            </Text>
          </View>
        </View>

        <View style={[styles.typeBadge, { backgroundColor: THEME_ACCENT }]}>
          <Text style={styles.typeBadgeText}>CREATIVE</Text>
        </View>
      </View>

      {/* Description Excerpt (Bio) */}
      <Text style={[styles.description, { color: themeColors.textSecondary }]} numberOfLines={2}>
        {photographer.bio ?? 'Professional campus photography services. Book now for custom shoots and events.'}
      </Text>

      {/* Middle row: Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MapPin size={13} color={themeColors.textSecondary} style={{ marginRight: 2 }} />
          <Text style={[styles.statText, { color: themeColors.textSecondary }]} numberOfLines={1}>
            {photographer.locationName}
          </Text>
        </View>
        
        <View style={styles.ratingRow}>
          <Star size={13} color="#FBBF24" fill="#FBBF24" style={{ marginRight: 2 }} />
          <Text style={[styles.ratingText, { color: themeColors.text, fontWeight: '700' }]}>
            4.9
          </Text>
          <Text style={[styles.reviewsText, { color: themeColors.textMuted }]}>
            Verified
          </Text>
        </View>
      </View>

      {/* Bottom row: Rate & Packages Count */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={[styles.pricePrefix, { color: themeColors.textMuted }]}>Base Hourly Rate</Text>
          <Text style={[styles.priceText, { color: THEME_ACCENT }]}>
            LKR {photographer.baseRatePerHour?.toLocaleString() || '0'}/hr
          </Text>
        </View>

        <View style={[styles.packagesBadge, { backgroundColor: systemTheme === 'light' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.2)' }]}>
          <Camera size={11} color={THEME_ACCENT} style={{ marginRight: 3 }} />
          <Text style={[styles.packagesText, { color: THEME_ACCENT }]}>
            {photographer.packages?.length || 0} packages
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    fontWeight: '600',
    marginLeft: 2,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
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
  packagesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  packagesText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
