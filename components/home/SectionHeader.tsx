import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentTitle?: boolean;
  rightElement?: React.ReactNode;
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
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <View style={styles.textGroup}>
          <Text
            style={[
              styles.title,
              { color: accentTitle ? themeColors.nearuAccent : themeColors.text },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
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
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
});
