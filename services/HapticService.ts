import { Vibration, Platform } from 'react-native';

/**
 * Zero-dependency Mobile Sensory Tactics Engine
 * Replaces expo-haptics with native Vibration patterns for 100% Expo Go compatibility.
 */
export const HapticService = {
  // Ultra-short tactile click for keyboard input triggers and card item selections
  triggerTap: () => {
    if (Platform.OS === 'ios') {
      // Very short tap trigger for iOS
      Vibration.vibrate(1);
    } else {
      // 12ms click trigger for Android
      Vibration.vibrate(12);
    }
  },

  // Medium tactile pulse for navigation steps (e.g. Stepper back/next)
  triggerSelection: () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(15);
    } else {
      Vibration.vibrate(25);
    }
  },

  // Rhythmic double-pulse sequence for validation warnings and authentication rejections
  triggerError: () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 60, 40, 60]);
    } else {
      Vibration.vibrate([0, 80, 50, 80]);
    }
  },

  // Premium ascending double hum for successful login and complete registrations
  triggerSuccess: () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 30, 20, 70]);
    } else {
      Vibration.vibrate([0, 40, 10, 80]);
    }
  }
};
