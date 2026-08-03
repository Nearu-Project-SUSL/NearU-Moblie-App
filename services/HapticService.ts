import { Platform } from 'react-native';

/**
 * Zero-dependency Mobile Sensory Tactics Engine
 * Completely disabled globally as requested by the user to avoid excessive vibration.
 */
export const HapticService = {
  triggerTap: () => {},
  triggerSelection: () => {},
  triggerError: () => {},
  triggerSuccess: () => {},
  triggerWarning: () => {},
};
