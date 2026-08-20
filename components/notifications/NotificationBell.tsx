/**
 * NotificationBell.tsx
 *
 * Premium notification bell button with glowing unread badge
 * and pulse animation. Opens the Notification Center modal.
 */

import React, { useEffect, useRef } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Bell } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useNotificationStore } from '../../store/notificationStore';
import { HapticService } from '../../services/HapticService';

interface NotificationBellProps {
  style?: StyleProp<ViewStyle>;
  size?: number;
  iconSize?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  style,
  size = 42,
  iconSize = 19,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const setModalOpen = useNotificationStore((s) => s.setModalOpen);

  // Pulse animation for new unread notifications
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (unreadCount > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [unreadCount, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePress = () => {
    try {
      HapticService.triggerSelection();
    } catch {}
    setModalOpen(true);
  };

  const badgeText = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2.5,
            backgroundColor:
              systemTheme === 'light'
                ? themeColors.surfaceElevated
                : 'rgba(30, 41, 59, 0.85)',
            borderColor:
              unreadCount > 0
                ? Colors.brand.accent
                : themeColors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Notifications, ${unreadCount} unread`}
      >
        <Bell
          size={iconSize}
          color={
            unreadCount > 0
              ? Colors.brand.accent
              : themeColors.textSecondary
          }
        />

        {unreadCount > 0 && (
          <Animated.View
            style={[
              styles.badgeContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
});
