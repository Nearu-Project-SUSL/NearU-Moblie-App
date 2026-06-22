import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../../constants/Colors';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentTitle?: boolean;
  rightElement?: React.ReactNode;
  /**
   * Use when the header sits on top of a photo/dark background
   * (e.g. an ImageBackground hero). Forces light text colors
   * instead of pulling from the theme.
   */
  light?: boolean;
  /** Override/extend the outer container style (e.g. remove marginBottom). */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Reusable section header matching the NearU frontend pattern.
 * Renders icon + title + optional subtitle with NearU accent styling.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  accentTitle = false,
  rightElement,
  light = false,
  containerStyle,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const titleColor = light
    ? '#fff'
    : accentTitle
    ? themeColors.nearuAccent
    : themeColors.text;

  const subtitleColor = light ? 'rgba(255,255,255,0.85)' : themeColors.textSecondary;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.leftGroup}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <View style={styles.textGroup}>
          <Text style={[styles.title, light && styles.titleLight, { color: titleColor }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    marginRight: 10,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  titleLight: {
    fontSize: 26,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
});