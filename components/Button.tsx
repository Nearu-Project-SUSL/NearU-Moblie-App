import React, { useRef } from 'react';
import { 
  Text, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator, 
  Animated, 
  useColorScheme, 
  ViewStyle, 
  TextStyle,
  StyleProp,
  AccessibilityProps
} from 'react-native';
import { Colors } from '../constants/Colors';

interface ButtonProps extends AccessibilityProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  ...accessibilityProps
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  
  // Tactical micro-animation: scale down on press
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
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
      speed: 40,
      bounciness: 4,
    }).start();
  };

  // Resolve Variant Styles
  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          button: {
            backgroundColor: systemTheme === 'light' ? themeColors.background : '#334155',
            borderWidth: 0,
          },
          text: { color: themeColors.text },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: themeColors.border,
          },
          text: { color: themeColors.text },
        };
      case 'danger':
        return {
          button: {
            backgroundColor: themeColors.danger,
            borderWidth: 0,
          },
          text: { color: '#FFFFFF' },
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: themeColors.primary,
            borderWidth: 0,
          },
          text: { color: '#FFFFFF' },
        };
    }
  };

  // Resolve Size Styles
  const getSizeStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          button: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
          text: { fontSize: 13, fontWeight: '600' },
        };
      case 'large':
        return {
          button: { paddingVertical: 16, paddingHorizontal: 28, borderRadius: 14 },
          text: { fontSize: 16, fontWeight: '700' },
        };
      case 'medium':
      default:
        return {
          button: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12 },
          text: { fontSize: 15, fontWeight: '600' },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const flatStyle = StyleSheet.flatten(style);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }], width: flatStyle?.width || 'auto' }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.baseButton,
          variantStyles.button,
          sizeStyles.button,
          (disabled || loading) && styles.disabled,
          style,
        ]}
        {...accessibilityProps}
      >
        {loading ? (
          <ActivityIndicator 
            color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : themeColors.text} 
            size="small" 
          />
        ) : (
          <Animated.View style={styles.contentContainer}>
            {icon && <Animated.View style={styles.iconWrapper}>{icon}</Animated.View>}
            <Text style={[styles.baseText, variantStyles.text, sizeStyles.text, textStyle]}>
              {title}
            </Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    textAlign: 'center',
  },
  iconWrapper: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
