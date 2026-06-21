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
import { Search, Plus, Sparkles, Hotel, ArrowLeft, RefreshCw, Filter } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { getAllAccommodations } from '../../services/accommodation';
import { Accommodation } from '../../types/accommodation';
import { useAuth } from '../../hooks/useAuth';
import { HapticService } from '../../services/HapticService';
import { CreateAccommodationModal } from '../../components/accommodations/CreateAccommodationModal';
import { AccommodationCard } from '../../components/accommodations/AccommodationCard';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THEME_ACCENT = '#10B981'; // Emerald green accent for accommodations

export default function AccommodationsScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [places, setPlaces] = useState<Accommodation[]>([]);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('All');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const canPost = user && (user.role === 'Admin' || user.role === 'Business');

  const fetchPlaces = useCallback(async () => {
    try {
      setError(null);
      const data = await getAllAccommodations();
      setPlaces(data);
    } catch (err: any) {
      setError('Could not load accommodations. Please try again.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPlaces().finally(() => setLoading(false));
  }, [fetchPlaces]);

  const onRefresh = async () => {
    HapticService.triggerTap();
    setRefreshing(true);
    await fetchPlaces();
    setRefreshing(false);
  };

  const handlePlacePress = (id: string) => {
    HapticService.triggerTap();
    router.push(`/accommodations/${id}`);
  };

  const handleAddPlacePress = () => {
    HapticService.triggerSelection();
    setCreateModalVisible(true);
  };

  // Types filter pills
  const types = ['All', 'Boarding', 'Annex', 'Apartment'];

  // Filter list based on UI choices
  const getFilteredPlaces = () => {
    return places.filter((place) => {
      // 1. Search Query filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = place.title.toLowerCase().includes(query);
        const matchesDesc = place.description ? place.description.toLowerCase().includes(query) : false;
        const matchesLoc = place.location.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesLoc) return false;
      }

      // 2. Type filter
      if (activeType !== 'All' && place.type !== activeType) {
        return false;
      }

      return true;
    });
  };

  const filteredPlacesList = getFilteredPlaces();
  const featuredPlaces = filteredPlacesList.filter(place => place.rating >= 4.5).slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Full-bleed Header Banner */}
      <View style={styles.bannerContainer}>
        <Image source={require('../../assets/stays_service.png')} style={styles.bannerImage} />
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
          <Text style={styles.bannerTitle}>Accommodations</Text>
          <Text style={styles.bannerSubtitle}>Verified boarding houses & rooms near campus</Text>
        </View>
      </View>

      {/* Main Content List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME_ACCENT} />
          <Text style={{ color: themeColors.textSecondary, marginTop: 12, fontWeight: '600' }}>
            Loading accommodations...
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
          data={filteredPlacesList}
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
                  placeholder="Search accommodations, area, amenities..."
                  placeholderTextColor={themeColors.textMuted}
                  style={[styles.searchInput, { color: themeColors.text }]}
                />
              </View>



              {/* Explore Stays Header Row */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                  <View style={styles.titleWithIcon}>
                    <Sparkles size={18} color={THEME_ACCENT} />
                    <Text style={[styles.title, { color: themeColors.text }]}>Explore Accommodations</Text>
                  </View>
                  <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                    {filteredPlacesList.length} properties available
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
                      onPress={handleAddPlacePress}
                      style={[styles.postBtn, { backgroundColor: THEME_ACCENT }]}
                    >
                      <Plus size={14} color="#FFFFFF" />
                      <Text style={styles.postBtnText}>Add Place</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Dynamic Type Filter Pills */}
              <View style={styles.filterSection}>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={types}
                  keyExtractor={item => item}
                  contentContainerStyle={styles.filterScroll}
                  ListHeaderComponent={
                    <View style={[styles.filterIconCell, { borderColor: themeColors.border }]}>
                      <Filter size={12} color={themeColors.textMuted} />
                      <Text style={[styles.filterIconLabel, { color: themeColors.textMuted }]}>Type:</Text>
                    </View>
                  }
                  renderItem={({ item: t }) => {
                    const active = activeType === t;
                    return (
                      <Pressable
                        onPress={() => {
                          HapticService.triggerSelection();
                          setActiveType(t);
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
                          {t}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              </View>

              {/* Featured Section */}
              {featuredPlaces.length > 0 && (
                <View style={styles.featuredSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Sparkles size={14} color={THEME_ACCENT} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Featured Stays</Text>
                  </View>
                  <FlatList
                    data={featuredPlaces}
                    keyExtractor={item => 'feat-' + item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.featuredListContent}
                    snapToInterval={SCREEN_WIDTH * 0.8 + 12}
                    decelerationRate="fast"
                    renderItem={({ item }) => (
                      <View style={{ width: SCREEN_WIDTH * 0.8, marginRight: 12 }}>
                        <AccommodationCard item={item} onPress={() => handlePlacePress(item.id)} />
                      </View>
                    )}
                  />
                </View>
              )}
              
              {/* List Heading */}
              <View style={[styles.sectionHeaderRow, { marginTop: 12, marginBottom: 8 }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  All Accommodations
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Hotel size={28} color={themeColors.textMuted} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No properties match your criteria.
              </Text>
              <Text style={{ color: themeColors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }}>
                {search || activeType !== 'All'
                  ? 'Try clearing your search query or type filters.'
                  : 'Register a new accommodation profile to list your student boarding place!'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AccommodationCard item={item} onPress={() => handlePlacePress(item.id)} />
          )}
        />
      )}

      {/* Create Modal */}
      <CreateAccommodationModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={fetchPlaces}
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
  tabContainer: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 20,
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
