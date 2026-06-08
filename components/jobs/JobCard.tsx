import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { JobResponse } from '../../types';
import { Colors } from '../../constants/Colors';
import { MapPin, DollarSign, Clock, CheckCircle2 } from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface JobCardProps {
  job: JobResponse;
  onPress: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
    HapticService.triggerSelection();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  // Format date nicely (e.g. 2 hours ago)
  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const initial = job.company ? job.company.charAt(0).toUpperCase() : 'G';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
        animatedStyle,
      ]}
    >
      {/* Top row: Avatar & Date */}
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: systemTheme === 'light' ? 'rgba(46, 158, 191, 0.12)' : 'rgba(46, 158, 191, 0.25)' }]}>
            <Text style={[styles.avatarText, { color: Colors.brand.accent }]}>{initial}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.companyText, { color: Colors.brand.accent }]}>
              {job.company} <CheckCircle2 size={12} color={Colors.brand.accent} />
            </Text>
            <Text style={[styles.dateText, { color: themeColors.textMuted }]}>
              {getRelativeTime(job.createdAt)}
            </Text>
          </View>
        </View>

        {job.isNew && (
          <View style={[styles.newBadge, { backgroundColor: systemTheme === 'light' ? 'rgba(46, 158, 191, 0.15)' : 'rgba(46, 158, 191, 0.3)' }]}>
            <Text style={[styles.newBadgeText, { color: Colors.brand.accent }]}>NEW</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: themeColors.text }]}>{job.title}</Text>

      {/* Middle row: Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MapPin size={13} color={themeColors.textSecondary} />
          <Text style={[styles.statText, { color: themeColors.textSecondary }]} numberOfLines={1}>
            {job.location}
          </Text>
        </View>
        <View style={styles.statItem}>
          <DollarSign size={13} color={themeColors.success} />
          <Text style={[styles.statText, { color: themeColors.text, fontWeight: '700' }]} numberOfLines={1}>
            {job.payRange}
          </Text>
        </View>
      </View>

      {/* Description excerpt */}
      <Text style={[styles.description, { color: themeColors.textSecondary }]} numberOfLines={2}>
        {job.description}
      </Text>

      {/* Bottom row: Type & Category Pills */}
      <View style={styles.pillsRow}>
        <View style={[styles.pill, { backgroundColor: systemTheme === 'light' ? '#EBF5FF' : 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
          <Text style={[styles.pillText, { color: systemTheme === 'light' ? '#1E40AF' : '#60A5FA' }]}>
            {job.jobType}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: systemTheme === 'light' ? '#FCE7F3' : 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.2)' }]}>
          <Text style={[styles.pillText, { color: systemTheme === 'light' ? '#9D174D' : '#F472B6' }]}>
            {job.category}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerText: {
    gap: 1,
    flex: 1,
  },
  companyText: {
    fontSize: 12,
    fontWeight: '700',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
