import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Animated,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { HotDeal } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.72;

interface DealCardProps {
  deal: HotDeal;
  onPress?: () => void;
}

/**
 * Horizontal scrollable deal card matching the frontend's DealCard pattern.
 * Features image with gradient overlay, badge, and CTA button.
 */
export const DealCard: React.FC<DealCardProps> = ({ deal, onPress }) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ scale: scaleValue }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface,
            borderColor: themeColors.border,
            shadowColor: systemTheme === 'light' ? '#0F172A' : '#000',
          },
        ]}
      >
        {/* Image Area */}
        <View style={styles.imageContainer}>
          {deal.imageUrl ? (
            <Image
              source={
                typeof deal.imageUrl === 'string' && deal.imageUrl.startsWith('http')
                  ? { uri: deal.imageUrl }
                  : deal.imageUrl as any
              }
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: themeColors.nearuAccentSubtle },
              ]}
            />
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.imageGradient}
          />

          {/* Badge */}
          <View
            style={[
              styles.badge,
              { backgroundColor: deal.badgeColor || Colors.brand.accent },
            ]}
          >
            <Text style={styles.badgeText}>{deal.badge}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[styles.title, { color: themeColors.text }]}
            numberOfLines={1}
          >
            {deal.title}
          </Text>
          <Text
            style={[styles.description, { color: themeColors.textSecondary }]}
            numberOfLines={2}
          >
            {deal.description}
          </Text>

          {/* CTA Row */}
          <View style={styles.ctaRow}>
            <View
              style={[
                styles.ctaButton,
                { backgroundColor: Colors.brand.accent },
              ]}
            >
              <Text style={styles.ctaText}>Get Deal</Text>
              <ArrowRight size={12} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    marginRight: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    // Premium shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginBottom: 14,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
