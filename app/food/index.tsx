import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  useColorScheme,
  RefreshControl,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ArrowLeft, Sparkles, RefreshCw } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '../../constants/Colors';
import { HapticService } from '../../services/HapticService';
import { getAllShops, getCategories, ShopResponse } from '../../services/foodshop';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function FoodShopsScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];
  const insets = useSafeAreaInsets();

  const [shops, setShops] = useState<ShopResponse[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(['All', ...data]);
    } catch {}
  };

  const fetchShops = useCallback(async (pageNum: number, cat: string, q: string, append = false) => {
    try {
      setError(null);
      const data = await getAllShops({ page: pageNum, pageSize: 10, category: cat, search: q });
      setShops(prev => (append ? [...prev, ...data.items] : data.items));
      setTotalPages(data.totalPages);
    } catch {
      setError('Could not load canteens. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchShops(1, selectedCategory, search).finally(() => setLoading(false));
  }, [selectedCategory, search, fetchShops]);

  const onRefresh = async () => {
    HapticService.triggerTap();
    setRefreshing(true);
    setPage(1);
    await fetchShops(1, selectedCategory, search);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await fetchShops(next, selectedCategory, search, true);
    setLoadingMore(false);
  };

  const handleSearch = () => {
    HapticService.triggerTap();
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    HapticService.triggerTap();
    setSearchInput('');
    setSearch('');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Full-bleed Header Banner */}
      <View style={styles.bannerContainer}>
        <Image source={require('../../assets/food_service.png')} style={styles.bannerImage} />
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
          <Text style={styles.bannerTitle}>Food Shops</Text>
          <Text style={styles.bannerSubtitle}>Discover local canteens & food vendors around campus</Text>
        </View>
      </View>

      {/* Main Content List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand.accent} />
          <Text style={{ color: themeColors.textSecondary, marginTop: 12, fontWeight: '600' }}>
            Loading shops...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: themeColors.danger, textAlign: 'center', marginBottom: 12 }}>{error}</Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: Colors.brand.accent }]}
            onPress={onRefresh}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.brand.accent}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          ListHeaderComponent={
            <View>
              {/* Search Box (Floating above banner edge) */}
              <View style={[styles.searchBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Search size={18} color={themeColors.textMuted} style={styles.searchIcon} />
                <TextInput
                  value={searchInput}
                  onChangeText={setSearchInput}
                  onSubmitEditing={handleSearch}
                  placeholder="Search canteens, items, locations..."
                  placeholderTextColor={themeColors.textMuted}
                  style={[styles.searchInput, { color: themeColors.text }]}
                />
                {searchInput.length > 0 && (
                  <Pressable onPress={handleClearSearch}>
                    <Ionicons name="close-circle" size={16} color={themeColors.textSecondary} />
                  </Pressable>
                )}
              </View>

              {/* Explore Shops Header Row */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                  <View style={styles.titleWithIcon}>
                    <Sparkles size={18} color={Colors.brand.accent} />
                    <Text style={[styles.title, { color: themeColors.text }]}>Explore Shops</Text>
                  </View>
                  <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                    {shops.length} food canteens available
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  <Pressable
                    onPress={onRefresh}
                    style={[styles.refreshBtn, { borderColor: themeColors.border }]}
                  >
                    <RefreshCw size={14} color={themeColors.textSecondary} />
                  </Pressable>
                </View>
              </View>

              {/* Category Filter Pills */}
              <View style={styles.filterSection}>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={categories}
                  keyExtractor={item => item}
                  contentContainerStyle={styles.filterScroll}
                  renderItem={({ item: cat }) => {
                    const active = selectedCategory === cat;
                    return (
                      <Pressable
                        onPress={() => {
                          HapticService.triggerSelection();
                          setSelectedCategory(cat);
                        }}
                        style={[
                          styles.filterPill,
                          {
                            backgroundColor: active ? Colors.brand.accent : themeColors.surface,
                            borderColor: active ? Colors.brand.accent : themeColors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.filterText, { color: active ? '#FFFFFF' : themeColors.textSecondary }]}>
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={[styles.centered, { marginTop: 20 }]}>
              <Text style={{ color: themeColors.textSecondary, fontWeight: '600' }}>No canteens match your query.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.92}
              style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
              onPress={() => {
                HapticService.triggerTap();
                router.push(`/food/${item.id}`);
              }}
            >
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.cardImage} />
              ) : (
                <View
                  style={[
                    styles.cardImagePlaceholder,
                    { backgroundColor: themeColors.surfaceElevated },
                  ]}
                >
                  <Text style={styles.placeholderEmoji}>🍽️</Text>
                </View>
              )}

              <View style={styles.cardBody}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardName, { color: themeColors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={[styles.menuCountBadge, { backgroundColor: themeColors.surfaceElevated }]}>
                    <Text style={[styles.menuCountText, { color: themeColors.textSecondary }]}>
                      {item.menuItemCount} items
                    </Text>
                  </View>
                </View>

                {item.description && (
                  <Text style={[styles.cardDesc, { color: themeColors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}

                {item.address && (
                  <Text style={{ color: themeColors.textMuted, fontSize: 12, fontWeight: '500' }}>
                    📍 {item.address}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
    paddingVertical: 0,
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
  filterSection: {
    marginBottom: 16,
    marginTop: 4,
  },
  filterScroll: {
    gap: 6,
    paddingBottom: 2,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 4,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  cardBody: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  menuCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  menuCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
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
});