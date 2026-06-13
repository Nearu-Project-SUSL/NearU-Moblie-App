import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Testimonial } from '../../services/testimonialsService';
import { Colors } from '../../constants/Colors';

const StarRating = ({
  rating,
  size = 14,
  colors,
}: {
  rating: number;
  size?: number;
  colors: typeof Colors.light;
}) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(star => (
      <Text
        key={star}
        style={{
          fontSize: size,
          color: star <= rating ? colors.warning : colors.border,
        }}
      >
        ★
      </Text>
    ))}
  </View>
);

export default function TestimonialCard({
  testimonial,
}: {
  testimonial: Testimonial;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.nearuAccent,
            },
          ]}
        >
          <Text style={styles.avatarText}>
            {testimonial.userInitial}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text
            style={[
              styles.userName,
              {
                color: colors.text,
              },
            ]}
          >
            {testimonial.userName}
          </Text>

          <Text
            style={[
              styles.date,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>

      <StarRating rating={testimonial.rating} colors={colors} />

      <Text
        style={[
          styles.message,
          {
            color: colors.textSecondary,
          },
        ]}
        numberOfLines={4}
      >
        "{testimonial.message}"
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 14,
    fontWeight: '700',
  },

  date: {
    fontSize: 11,
    marginTop: 2,
  },

  message: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    fontStyle: 'italic',
  },
});