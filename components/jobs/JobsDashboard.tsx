import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Alert,
  Dimensions,
} from 'react-native';
import { JobResponse } from '../../types';
import { Colors } from '../../constants/Colors';
import { jobService } from '../../services/jobService';
import { JobCard } from './JobCard';
import { JobDetailModal } from './JobDetailModal';
import { CreateJobModal } from './CreateJobModal';
import { MyJobsView } from './MyJobsView';
import { useAuth } from '../../hooks/useAuth';
import { HapticService } from '../../services/HapticService';
import { Briefcase, Plus, Sparkles, Filter, RefreshCw } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CATEGORIES = ['All', 'Campus', 'Delivery', 'Marketing', 'Tutoring', 'Tech', 'Food & Bev', 'Other'];
const JOB_TYPES = ['All', 'Part-Time', 'Internship', 'Freelance', 'Full-Time'];

interface JobsDashboardProps {
  searchQuery: string;
}

export const JobsDashboard: React.FC<JobsDashboardProps> = ({ searchQuery }) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [newJobs, setNewJobs] = useState<JobResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeType, setActiveType] = useState('All');

  // Modals
  const [selectedJob, setSelectedJob] = useState<JobResponse | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobResponse | null>(null);

  // Load all jobs
  const fetchJobs = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await jobService.getAllJobs(pageNum, 15);
      if (res.success && res.data) {
        setJobs(res.data.items);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.totalCount);
        setPage(pageNum);
      } else {
        Alert.alert('Error', res.message || 'Failed to retrieve jobs.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected networking failure occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load new jobs carousel
  const fetchNewJobs = useCallback(async () => {
    try {
      const res = await jobService.getNewJobs();
      if (res.success && res.data) {
        setNewJobs(res.data);
      }
    } catch (err) {
      console.warn('Failed to load new jobs:', err);
    }
  }, []);

  useEffect(() => {
    fetchJobs(1);
    fetchNewJobs();
  }, [fetchJobs, fetchNewJobs]);

  const handleRefresh = () => {
    HapticService.triggerTap();
    fetchJobs(1);
    fetchNewJobs();
  };

  const handleJobPress = (job: JobResponse) => {
    setSelectedJob(job);
    setDetailModalVisible(true);
  };

  const handleEditJob = (job: JobResponse) => {
    setJobToEdit(job);
    setCreateModalVisible(true);
  };

  const handleDeleteJob = async (id: string) => {
    setLoading(true);
    try {
      const res = await jobService.deleteJob(id);
      if (res.success) {
        HapticService.triggerSuccess();
        fetchJobs(1);
        fetchNewJobs();
      } else {
        HapticService.triggerError();
        Alert.alert('Error', res.message || 'Failed to delete gig listing.');
      }
    } catch (err: any) {
      HapticService.triggerError();
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchJobs(1);
    fetchNewJobs();
  };

  const handlePostGigPress = () => {
    setJobToEdit(null);
    setCreateModalVisible(true);
  };

  // Filter local/server list based on UI choices
  const getFilteredJobs = () => {
    return jobs.filter((job) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCompany = job.company.toLowerCase().includes(query);
        const matchesDesc = job.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany && !matchesDesc) return false;
      }

      // 2. Category filter
      if (activeCategory !== 'All' && job.category !== activeCategory) {
        return false;
      }

      // 3. Job Type filter
      if (activeType !== 'All' && job.jobType !== activeType) {
        return false;
      }

      return true;
    });
  };

  const myPostedJobs = jobs.filter((job) => job.postedBy.userId === user?.id);
  const filteredJobsList = getFilteredJobs();

  return (
    <View style={styles.container}>
      {/* Tab Segment control */}
      <View style={[styles.tabContainer, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
        <Pressable
          onPress={() => {
            HapticService.triggerTap();
            setActiveTab('all');
          }}
          style={[
            styles.tab,
            activeTab === 'all' && [styles.activeTab, { backgroundColor: themeColors.surface }],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'all' ? Colors.brand.accent : themeColors.textSecondary },
            ]}
          >
            All Gigs
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            HapticService.triggerTap();
            setActiveTab('my');
          }}
          style={[
            styles.tab,
            activeTab === 'my' && [styles.activeTab, { backgroundColor: themeColors.surface }],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'my' ? Colors.brand.accent : themeColors.textSecondary },
            ]}
          >
            My Gigs
          </Text>
        </Pressable>
      </View>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'all' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header row with Post CTA */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.titleWithIcon}>
                <Sparkles size={18} color={Colors.brand.accent} />
                <Text style={[styles.title, { color: themeColors.text }]}>Explore Gigs</Text>
              </View>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                {filteredJobsList.length} opportunities available
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={handleRefresh}
                style={[styles.refreshBtn, { borderColor: themeColors.border }]}
              >
                <RefreshCw size={14} color={themeColors.textSecondary} />
              </Pressable>
              
              <Pressable
                onPress={handlePostGigPress}
                style={[styles.postBtn, { backgroundColor: Colors.brand.accent }]}
              >
                <Plus size={14} color="#000000" />
                <Text style={styles.postBtnText}>Post a Gig</Text>
              </Pressable>
            </View>
          </View>

          {/* New Gigs Carousel */}
          {newJobs.length > 0 && (
            <View style={styles.carouselSection}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>New Postings</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={SCREEN_WIDTH * 0.8 + 12}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselContainer}
              >
                {newJobs.map((item) => (
                  <View key={item.id} style={{ width: SCREEN_WIDTH * 0.8, marginRight: 12 }}>
                    <JobCard job={item} onPress={() => handleJobPress(item)} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Category Filter Pills */}
          <View style={styles.filterSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Filter by Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      HapticService.triggerSelection();
                      setActiveCategory(cat);
                    }}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: active ? Colors.brand.accent : themeColors.surface,
                        borderColor: active ? Colors.brand.accent : themeColors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.filterText, { color: active ? '#000000' : themeColors.textSecondary }]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Gig Type Filter Pills */}
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <View style={[styles.filterIconCell, { borderColor: themeColors.border }]}>
                <Filter size={12} color={themeColors.textMuted} />
                <Text style={[styles.filterIconLabel, { color: themeColors.textMuted }]}>Type:</Text>
              </View>
              {JOB_TYPES.map((type) => {
                const active = activeType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => {
                      HapticService.triggerSelection();
                      setActiveType(type);
                    }}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: active ? '#3B82F6' : themeColors.surface,
                        borderColor: active ? '#3B82F6' : themeColors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.filterText, { color: active ? '#FFFFFF' : themeColors.textSecondary }]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Listings List */}
          <View style={styles.listSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: 4 }]}>
              Active Openings
            </Text>
            {loading && filteredJobsList.length === 0 ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color={Colors.brand.accent} />
              </View>
            ) : filteredJobsList.length > 0 ? (
              filteredJobsList.map((item) => (
                <JobCard key={item.id} job={item} onPress={() => handleJobPress(item)} />
              ))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Briefcase size={28} color={themeColors.textMuted} />
                <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
                  No opportunities match your filter constraints.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.myGigsContainer}>
          <MyJobsView
            jobs={myPostedJobs}
            loading={loading}
            onJobPress={handleJobPress}
            onEditJob={handleEditJob}
            onDeleteJob={handleDeleteJob}
            onPostGigPress={handlePostGigPress}
          />
        </View>
      )}

      {/* DETAIL MODAL */}
      <JobDetailModal
        job={selectedJob}
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
      />

      {/* CREATE / EDIT FORM MODAL */}
      <CreateJobModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
        jobToEdit={jobToEdit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  tab: {
    flex: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleGroup: {
    gap: 2,
    flex: 1,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
  },
  postBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  carouselSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  carouselContainer: {
    paddingBottom: 4,
  },
  filterSection: {
    marginBottom: 14,
  },
  filterScroll: {
    gap: 6,
    paddingBottom: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterIconCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 29,
    marginRight: 2,
  },
  filterIconLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  listSection: {
    marginTop: 8,
  },
  centerLoading: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  emptyStateText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  myGigsContainer: {
    flex: 1,
  },
});
