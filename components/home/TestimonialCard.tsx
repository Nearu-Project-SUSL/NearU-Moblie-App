import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Testimonial } from '../../services/testimonialsService';

const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(star => (
      <Text key={star} style={{ fontSize: size, color: star <= rating ? '#FBBF24' : '#D1D5DB' }}>
        ★
      </Text>
    ))}
  </View>
);

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{testimonial.userInitial}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{testimonial.userName}</Text>
          <Text style={styles.date}>
            {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>
      <StarRating rating={testimonial.rating} />
      <Text style={styles.message} numberOfLines={4}>
        "{testimonial.message}"
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#2E9EBF',
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
    color: '#0F172A',
  },
  date: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  message: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginTop: 8,
    fontStyle: 'italic',
  },
});