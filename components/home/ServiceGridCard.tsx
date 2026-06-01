import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  useColorScheme,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface ServiceGridCardProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  color: string;
  onPress?: () => void;
}

/**
 * Compact card for the quick-access 2×2 service grid.
 * Features scale spring animation on press and NearU accent gradient accent line.
 */
export const ServiceGridCard: React.FC<ServiceGridCardProps> = ({
  icon,
  label,
  badge,
  color,
  onPress,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
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
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleValue }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface,
            borderColor: systemTheme === 'light' ? themeColors.border : themeColors.border,
            shadowColor: systemTheme === 'light' ? '#0F172A' : '#000000',
          },
        ]}
      >
        {/* Accent top bar */}
        <View style={[styles.accentBar, { backgroundColor: color }]} />

        {/* Icon container */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: color + '18' },
          ]}
        >
          {icon}
        </View>

        {/* Label */}
        <Text
          style={[styles.label, { color: themeColors.text }]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {/* Badge */}
        {badge && (
          <View style={[styles.badge, { backgroundColor: color + '1A' }]}>
            <Text style={[styles.badgeText, { color }]}>{badge}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexBasis: '47%',
    maxWidth: '50%',
    margin: 6,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
    overflow: 'hidden',
    // Premium soft shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 3,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
