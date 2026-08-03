/**
 * StarRating — Interactive 1–5 star rating component for ride completion.
 */
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  label?: string;
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 32,
  label,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  const labels: Record<number, string> = {
    1: 'Terrible',
    2: 'Poor',
    3: 'Okay',
    4: 'Good',
    5: 'Excellent!',
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            activeOpacity={readonly ? 1 : 0.7}
            onPress={() => !readonly && onChange?.(n)}
            onPressIn={() => !readonly && setHovered(n)}
            onPressOut={() => !readonly && setHovered(0)}
            style={{ padding: 4 }}
          >
            <Star
              size={size}
              color={n <= display ? '#F59E0B' : '#D1D5DB'}
              fill={n <= display ? '#F59E0B' : 'none'}
            />
          </TouchableOpacity>
        ))}
      </View>

      {!readonly && display > 0 && (
        <Text style={styles.ratingLabel}>{labels[display]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 4,
  },
});
