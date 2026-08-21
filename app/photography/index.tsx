import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  useColorScheme,
  Dimensions,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, Sparkles, Camera, ArrowLeft, RefreshCw, Filter } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { getAllPhotographers } from '../../services/photography';
import { Photographer } from '../../types/photography';
import { useAuth } from '../../hooks/useAuth';
import { HapticService } from '../../services/HapticService';
import { CreatePhotographerModal } from '../../components/photography/CreatePhotographerModal';
import { PhotographyCard } from '../../components/photography/PhotographyCard';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THEME_ACCENT = '#8B5CF6'; // Creative Violet/Purple theme

export default function PhotographyScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [search, setSearch] = useState('');
  const [activeLocation, setActiveLocation] = useState('All');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const canPost = user && (user.role === 'Admin' || user.role === 'Business');

  const fetchPhotographers = useCallback(async () => {
    try {
      setError(null);
      const data = await getAllPhotographers();
      setPhotographers(data);
    } catch (err: any) {
      setError('Could not load photographers. Please try again.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPhotographers().finally(() => setLoading(false));
  }, [fetchPhotographers]);

  const onRefresh = async () => {
    HapticService.triggerTap();
    setRefreshing(true);
    await fetchPhotographers();
    setRefreshing(false);
  };

  const handlePhotographerPress = (id: string) => {
    HapticService.triggerTap();
    router.push(`/photography/${id}`);
  };

  const handleAddPhotographerPress = () => {
    HapticService.triggerSelection();
    setCreateModalVisible(true);
  };

  // Get locations dynamically
  const locations = ['All', ...Array.from(new Set(photographers.map(p => p.locationName).filter(Boolean)))];

  // Filter list based on UI choices
  const getFilteredPhotographers = () => {
    return photographers.filter((p) => {
      // 1. Search Query filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesBio = p.bio ? p.bio.toLowerCase().includes(query) : false;
        const matchesLoc = p.locationName.toLowerCase().includes(query);
        if (!matchesName && !matchesBio && !matchesLoc) return false;
      }

      // 2. Location filter
      if (activeLocation !== 'All' && p.locationName !== activeLocation) {
        return false;
      }

      return true;
    });
  };

  const filteredList = getFilteredPhotographers();
  const featuredPhotographers = filteredList.filter(p => p.isActive).slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Full-bleed Header Banner */}
      <View style={styles.bannerContainer}>
        <Image source={require('../../assets/photography_service.png')} style={styles.bannerImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', themeColors.background]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Floating Back button */}
        <View style={[styles.backButtonContainer, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => {
              HapticService.triggerTap();
              router.back();
            }}
            style={[styles.backButton, { backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)' }]}
          >
            <ArrowLeft size={20} color={themeColors.text} />
          </Pressable>
        </View>

        {/* Title overlay block */}
        <View style={styles.titleOverlay}>
          <Text style={styles.bannerTitle}>Photography Hub</Text>
          <Text style={styles.bannerSubtitle}>Book local student photographers & event packages</Text>
        </View>
      </View>

      {/* Main Content List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME_ACCENT} />
          <Text style={{ color: themeColors.textSecondary, marginTop: 12, fontWeight: '600' }}>
            Loading photographers...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: themeColors.danger, textAlign: 'center', marginBottom: 12 }}>{error}</Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: THEME_ACCENT }]}
            onPress={onRefresh}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME_ACCENT}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Search Box (Floating above banner edge) */}
              <View style={[styles.searchBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Search size={18} color={themeColors.textMuted} style={styles.searchIcon} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search photographer name, tags, bio..."
                  placeholderTextColor={themeColors.textMuted}
                  style={[styles.searchInput, { color: themeColors.text }]}
                />
              </View>

              {/* Explore Photographers Header Row */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                  <View style={styles.titleWithIcon}>
                    <Sparkles size={18} color={THEME_ACCENT} />
                    <Text style={[styles.title, { color: themeColors.text }]}>Explore Photographers</Text>
                  </View>
                  <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                    {filteredList.length} creatives available
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  <Pressable
                    onPress={onRefresh}
                    style={[styles.refreshBtn, { borderColor: themeColors.border }]}
                  >
                    <RefreshCw size={14} color={themeColors.textSecondary} />
                  </Pressable>
                  
                  {canPost && (
                    <Pressable
                      onPress={handleAddPhotographerPress}
                      style={[styles.postBtn, { backgroundColor: THEME_ACCENT }]}
                    >
                      <Plus size={14} color="#FFFFFF" />
                      <Text style={styles.postBtnText}>Register Profile</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Dynamic Location Filter Pills */}
              {locations.length > 1 && (
                <View style={styles.filterSection}>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={locations}
                    keyExtractor={item => item}
                    contentContainerStyle={styles.filterScroll}
                    ListHeaderComponent={
                      <View style={[styles.filterIconCell, { borderColor: themeColors.border }]}>
                        <Filter size={12} color={themeColors.textMuted} />
                        <Text style={[styles.filterIconLabel, { color: themeColors.textMuted }]}>Location:</Text>
                      </View>
                    }
                    renderItem={({ item: loc }) => {
                      const active = activeLocation === loc;
                      return (
                        <Pressable
                          onPress={() => {
                            HapticService.triggerSelection();
                            setActiveLocation(loc);
                          }}
                          style={[
                            styles.filterPill,
                            {
                              backgroundColor: active ? THEME_ACCENT : themeColors.surface,
                              borderColor: active ? THEME_ACCENT : themeColors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.filterText, { color: active ? '#FFFFFF' : themeColors.textSecondary }]}>
                            {loc}
                          </Text>
                        </Pressable>
                      );
                    }}
                  />
                </View>
              )}

              {/* Featured Section */}
              {featuredPhotographers.length > 0 && (
                <View style={styles.featuredSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Sparkles size={14} color={THEME_ACCENT} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Featured Artists</Text>
                  </View>
                  <FlatList
                    data={featuredPhotographers}
                    keyExtractor={item => 'feat-' + item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.featuredListContent}
                    snapToInterval={SCREEN_WIDTH * 0.8 + 12}
                    decelerationRate="fast"
                    renderItem={({ item }) => (
                      <View style={{ width: SCREEN_WIDTH * 0.8, marginRight: 12 }}>
                        <PhotographyCard photographer={item} onPress={() => handlePhotographerPress(item.id)} />
                      </View>
                    )}
                  />
                </View>
              )}
              
              {/* List Heading */}
              <View style={[styles.sectionHeaderRow, { marginTop: 12, marginBottom: 8 }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  All Photographers
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Camera size={28} color={themeColors.textMuted} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No photographers match your criteria.
              </Text>
              <Text style={{ color: themeColors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }}>
                {search || activeLocation !== 'All'
                  ? 'Try clearing your search query or location filter.'
                  : 'Register a new photographer profile to begin cataloging services!'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PhotographyCard photographer={item} onPress={() => handlePhotographerPress(item.id)} />
          )}
        />
      )}

      {/* Create Modal */}
      <CreatePhotographerModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={fetchPhotographers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 20,
    top: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  titleOverlay: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 2,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
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
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  filterSection: {
    marginBottom: 16,
    marginTop: 4,
  },
  filterScroll: {
    gap: 6,
    paddingBottom: 2,
  },
  filterIconCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 29,
    marginRight: 6,
  },
  filterIconLabel: {
    fontSize: 10,
    fontWeight: '700',
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
  featuredSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredListContent: {
    paddingBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
