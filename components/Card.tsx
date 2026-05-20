import React from 'react';
import { 
  StyleSheet, 
  View, 
  Pressable, 
  useColorScheme, 
  ViewStyle 
} from 'react-native';
import { Colors } from '../constants/Colors';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'flat' | 'elevated' | 'bordered';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'elevated',
  padding = 'medium',
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const getPaddingStyle = () => {
    switch (padding) {
      case 'none': return { padding: 0 };
      case 'small': return { padding: 12 };
      case 'large': return { padding: 24 };
      case 'medium':
      default: return { padding: 18 };
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'flat':
        return {
          backgroundColor: themeColors.surface,
          borderWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        };
      case 'bordered':
        return {
          backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface,
          borderWidth: 1.5,
          borderColor: themeColors.border,
          shadowOpacity: 0,
          elevation: 0,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface,
          borderWidth: systemTheme === 'light' ? 0 : 1,
          borderColor: themeColors.border,
          // Premium soft shadows
          shadowColor: systemTheme === 'light' ? '#0F172A' : '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: systemTheme === 'light' ? 0.04 : 0.25,
          shadowRadius: 16,
          elevation: 4,
        };
    }
  };

  const cardStyles = [
    styles.baseCard,
    getVariantStyles(),
    getPaddingStyle(),
    style,
  ];

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress} 
        style={({ pressed }) => [
          cardStyles,
          pressed && styles.pressedState
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressedState: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
