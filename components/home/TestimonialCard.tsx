import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Testimonial } from '../../types';

const AVATAR_COLORS = [
  '#2E9EBF', '#E05638', '#10B981', '#8B5CF6',
  '#F59E0B', '#EC4899', '#0EA5E9', '#6366F1',
];

interface TestimonialCardProps {
  testimonial: Testimonial;
}

/**
 * Compact testimonial card with avatar, star rating, and quote.
 * Background color-coded by user initial for visual variety.
 */
export const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  // Deterministic color based on user initial
  const avatarColor =
    AVATAR_COLORS[testimonial.userInitial.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface,
          borderColor: themeColors.border,
          shadowColor: systemTheme === 'light' ? '#0F172A' : '#000',
        },
      ]}
    >
      {/* Header — Avatar + Name + Rating */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{testimonial.userInitial}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text
            style={[styles.userName, { color: themeColors.text }]}
            numberOfLines={1}
          >
            {testimonial.userName}
          </Text>
          <View style={styles.starRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                color={i < testimonial.rating ? '#F59E0B' : themeColors.border}
                fill={i < testimonial.rating ? '#F59E0B' : 'transparent'}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Quote */}
      <Text
        style={[styles.message, { color: themeColors.textSecondary }]}
        numberOfLines={4}
      >
        &ldquo;{testimonial.message}&rdquo;
      </Text>

      {/* Timestamp */}
      <Text style={[styles.timestamp, { color: themeColors.textMuted }]}>
        {testimonial.createdAt}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 260,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginRight: 14,
    // Premium shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
});
