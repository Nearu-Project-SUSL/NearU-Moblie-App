/**
 * NotificationToastBanner.tsx
 *
 * Glassmorphic top-banner toast that slides down smoothly from the top safe area
 * when a new notification arrives in the foreground.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  useColorScheme,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bike,
  Package,
  Briefcase,
  Home,
  Tag,
  Gift,
  Bell,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useNotificationStore } from '../../store/notificationStore';
import { NOTIFICATION_TYPE_META, NotificationType } from '../../types/notification';
import { HapticService } from '../../services/HapticService';

const SCREEN_WIDTH = Dimensions.get('window').width;

function renderCategoryIcon(type: NotificationType, size = 18, color = '#FFFFFF') {
  switch (type) {
    case 'ride':
      return <Bike size={size} color={color} />;
    case 'order':
      return <Package size={size} color={color} />;
    case 'job':
      return <Briefcase size={size} color={color} />;
    case 'accommodation':
      return <Home size={size} color={color} />;
    case 'deal':
      return <Tag size={size} color={color} />;
    case 'gift':
      return <Gift size={size} color={color} />;
    case 'general':
    default:
      return <Bell size={size} color={color} />;
  }
}

export const NotificationToastBanner: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const activeToast = useNotificationStore((s) => s.activeToast);
  const hideToast = useNotificationStore((s) => s.hideToast);
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Swipe up to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy < -5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -20 || gestureState.vy < -0.5) {
          dismissBanner();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const dismissBanner = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideToast();
    });
  };

  useEffect(() => {
    if (activeToast) {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);

      translateY.setValue(-150);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 5.5 seconds
      dismissTimer.current = setTimeout(() => {
        dismissBanner();
      }, 5500);

      return () => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
      };
    }
  }, [activeToast]);

  if (!activeToast) return null;

  const meta = NOTIFICATION_TYPE_META[activeToast.type] || NOTIFICATION_TYPE_META.general;

  const handlePress = () => {
    try {
      HapticService.triggerSelection();
    } catch {}

    if (activeToast.id) {
      markAsRead(activeToast.id);
    }

    const targetRoute = activeToast.route;
    dismissBanner();

    if (targetRoute) {
      router.push(targetRoute as any);
    }
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          top: insets.top + 6,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={[
          styles.bannerCard,
          {
            backgroundColor:
              systemTheme === 'light'
                ? 'rgba(255, 255, 255, 0.96)'
                : 'rgba(15, 23, 42, 0.94)',
            borderColor:
              systemTheme === 'light'
                ? 'rgba(226, 232, 240, 0.9)'
                : 'rgba(46, 158, 191, 0.3)',
          },
        ]}
      >
        {/* Unread Glowing Accent Pill Indicator */}
        <View
          style={[
            styles.accentBar,
            { backgroundColor: meta.accentColor },
          ]}
        />

        {/* Category Gradient Icon */}
        <LinearGradient
          colors={meta.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconContainer, { shadowColor: meta.accentColor }]}
        >
          {renderCategoryIcon(activeToast.type, 18, '#FFFFFF')}
        </LinearGradient>

        {/* Content */}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.title,
                { color: themeColors.text },
              ]}
              numberOfLines={1}
            >
              {activeToast.title}
            </Text>
            <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>
              just now
            </Text>
          </View>

          <Text
            style={[styles.message, { color: themeColors.textSecondary }]}
            numberOfLines={2}
          >
            {activeToast.message}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionGroup}>
          {activeToast.route && (
            <View style={[styles.viewButton, { backgroundColor: meta.badgeBg }]}>
              <Text style={[styles.viewButtonText, { color: meta.accentColor }]}>
                View
              </Text>
              <ChevronRight size={12} color={meta.accentColor} />
            </View>
          )}

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              dismissBanner();
            }}
            hitSlop={12}
            style={styles.closeButton}
          >
            <X size={15} color={themeColors.textMuted} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99999,
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  message: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '400',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  viewButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
});
