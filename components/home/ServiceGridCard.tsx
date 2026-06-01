import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  useColorScheme,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { HapticService } from '../../services/HapticService';

interface ServiceGridCardProps {
  label: string;
  description?: string;
  imageSource: any;
  onPress?: () => void;
}

/**
 * Premium image-backed card for explore services.
 * Features full bleed generated 3D illustration, elegant linear gradient overlay, 
 * micro-animations on press, and haptic feedback.
 */
export const ServiceGridCard: React.FC<ServiceGridCardProps> = ({
  label,
  description,
  imageSource,
  onPress,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    HapticService.triggerSelection();
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleValue }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.cardContainer,
          {
            borderColor: systemTheme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
          }
        ]}
      >
        <ImageBackground
          source={imageSource}
          style={styles.imageBg}
          imageStyle={styles.imageStyle}
        >
          {/* Elegant Dark Gradient overlay from bottom to top */}
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.92)', 'rgba(15, 23, 42, 0.45)', 'rgba(15, 23, 42, 0.05)']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
            {description && (
              <Text style={styles.description} numberOfLines={2}>
                {description}
              </Text>
            )}
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '48.2%',
    marginBottom: 12,
  },
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    height: 155,
    overflow: 'hidden',
    // Premium soft shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  imageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  textContainer: {
    padding: 12,
    gap: 3,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
});
