import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, useColorScheme, Alert } from 'react-native';
import { JobResponse } from '../../types';
import { Colors } from '../../constants/Colors';
import { Briefcase, Edit2, Trash2, Eye, Plus } from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';

interface MyJobsViewProps {
  jobs: JobResponse[];
  loading: boolean;
  onJobPress: (job: JobResponse) => void;
  onEditJob: (job: JobResponse) => void;
  onDeleteJob: (jobId: string) => void;
  onPostGigPress: () => void;
}

export const MyJobsView: React.FC<MyJobsViewProps> = ({
  jobs,
  loading,
  onJobPress,
  onEditJob,
  onDeleteJob,
  onPostGigPress,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const handleDeletePress = (job: JobResponse) => {
    HapticService.triggerSelection();
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to permanently delete "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteJob(job.id),
        },
      ]
    );
  };

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

  if (loading && jobs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.brand.accent} />
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <View style={[styles.emptyIconBg, { backgroundColor: systemTheme === 'light' ? 'rgba(46, 158, 191, 0.08)' : 'rgba(46, 158, 191, 0.15)' }]}>
          <Briefcase size={36} color={Colors.brand.accent} />
        </View>
        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Gigs Posted Yet</Text>
        <Text style={[styles.emptyDesc, { color: themeColors.textSecondary }]}>
          You have not published any student opportunities. Post a gig to hire fellow peers for roles around campus!
        </Text>
        <Pressable
          onPress={() => {
            HapticService.triggerTap();
            onPostGigPress();
          }}
          style={[styles.emptyBtn, { backgroundColor: Colors.brand.accent }]}
        >
          <Plus size={16} color="#000000" />
          <Text style={styles.emptyBtnText}>Post a Gig Now</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.title, { color: themeColors.text }]}>{item.title}</Text>
              <Text style={[styles.company, { color: themeColors.textSecondary }]}>{item.company}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: systemTheme === 'light' ? '#EBF5FF' : 'rgba(59, 130, 246, 0.15)' }]}>
              <Text style={[styles.typeBadgeText, { color: systemTheme === 'light' ? '#1E40AF' : '#60A5FA' }]}>
                {item.jobType}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
              Rate: <Text style={{ color: themeColors.text, fontWeight: '700' }}>{item.payRange}</Text>
            </Text>
            <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
              Posted: <Text style={{ color: themeColors.textSecondary }}>{getRelativeTime(item.createdAt)}</Text>
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => {
                HapticService.triggerTap();
                onJobPress(item);
              }}
              style={styles.actionBtn}
            >
              <Eye size={13} color={Colors.brand.accent} />
              <Text style={[styles.actionText, { color: Colors.brand.accent }]}>View Details</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                HapticService.triggerTap();
                onEditJob(item);
              }}
              style={styles.actionBtn}
            >
              <Edit2 size={13} color={themeColors.textSecondary} />
              <Text style={[styles.actionText, { color: themeColors.textSecondary }]}>Edit</Text>
            </Pressable>

            <Pressable
              onPress={() => handleDeletePress(item)}
              style={styles.actionBtn}
            >
              <Trash2 size={13} color={Colors.brand.logoCoral} />
              <Text style={[styles.actionText, { color: Colors.brand.logoCoral }]}>Delete</Text>
            </Pressable>
          </View>

        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 30,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: 10,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  company: {
    fontSize: 11,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
