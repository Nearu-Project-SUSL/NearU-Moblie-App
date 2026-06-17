import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, useColorScheme } from 'react-native';
import { GiftShopResponseDto } from '../../services/giftshop';
import { Colors } from '../../constants/Colors';
import { MapPin, Gift, CheckCircle2, Clock } from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const THEME_ACCENT = '#EC4899'; // Pink/Rose theme for gifts

interface GiftShopCardProps {
  shop: GiftShopResponseDto;
  onPress: () => void;
}

export const GiftShopCard: React.FC<GiftShopCardProps> = ({ shop, onPress }) => {
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

  const initial = shop.name ? shop.name.charAt(0).toUpperCase() : 'G';
  const productCount = shop.products ? shop.products.length : 0;

  // Format date / relative time (if available, e.g. from updatedAt)
  const getRelativeTime = (dateStr: string) => {
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
      {/* Top row: Avatar & Status Badge */}
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {shop.imageUrl ? (
            <Image source={{ uri: shop.imageUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: systemTheme === 'light' ? 'rgba(236, 72, 153, 0.12)' : 'rgba(236, 72, 153, 0.25)' }]}>
              <Text style={[styles.avatarText, { color: THEME_ACCENT }]}>{initial}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={[styles.shopNameText, { color: themeColors.text }]} numberOfLines={1}>
              {shop.name} <CheckCircle2 size={12} color={THEME_ACCENT} />
            </Text>
            <Text style={[styles.dateText, { color: themeColors.textMuted }]}>
              Active Shop • {getRelativeTime(shop.updatedAt || shop.createdAt)}
            </Text>
          </View>
        </View>

        {shop.isActive ? (
          <View style={[styles.statusBadge, { backgroundColor: systemTheme === 'light' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.25)' }]}>
            <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>OPEN</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: systemTheme === 'light' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.25)' }]}>
            <Text style={[styles.statusBadgeText, { color: '#EF4444' }]}>CLOSED</Text>
          </View>
        )}
      </View>

      {/* Description / Info */}
      <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
        {shop.name}
      </Text>

      {/* Middle row: Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MapPin size={13} color={themeColors.textSecondary} />
          <Text style={[styles.statText, { color: themeColors.textSecondary }]} numberOfLines={1}>
            {shop.locationName}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Gift size={13} color={THEME_ACCENT} />
          <Text style={[styles.statText, { color: themeColors.text, fontWeight: '700' }]} numberOfLines={1}>
            {productCount} {productCount === 1 ? 'Gift' : 'Gifts'} listed
          </Text>
        </View>
      </View>

      {/* Address / Excerpt */}
      <Text style={[styles.address, { color: themeColors.textSecondary }]} numberOfLines={2}>
        📍 Address: {shop.address}
      </Text>

      {/* Bottom row: Type & Tag Pills */}
      <View style={styles.pillsRow}>
        <View style={[styles.pill, { backgroundColor: systemTheme === 'light' ? '#FCE7F3' : 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.2)' }]}>
          <Text style={[styles.pillText, { color: systemTheme === 'light' ? '#9D174D' : '#F472B6' }]}>
            Gifts & Souvenirs
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: systemTheme === 'light' ? '#F3F4F6' : 'rgba(156, 163, 175, 0.15)', borderColor: 'rgba(156, 163, 175, 0.2)' }]}>
          <Text style={[styles.pillText, { color: themeColors.textSecondary }]}>
            {shop.locationName} Campus
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
    marginBottom: 10,
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
  shopNameText: {
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  address: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
