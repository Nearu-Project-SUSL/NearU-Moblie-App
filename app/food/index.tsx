import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAllShops, getCategories, ShopResponse } from '../../services/foodshop';

import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';

export default function FoodShopsScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];

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
      setError('Could not load shops. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchShops(1, selectedCategory, search).finally(() => setLoading(false));
  }, [selectedCategory, search]);

  const onRefresh = async () => {
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

  const handleSearch = () => setSearch(searchInput);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>

      {/* Header */}
      <ImageBackground
        source={require('../../assets/food_service.png')}
        style={styles.header}
        imageStyle={styles.headerImage}
      >
        <View style={styles.headerOverlay} />
        <Text style={styles.headerTitle}>Food Shops</Text>
        <Text style={styles.headerSub}>Discover local food around you</Text>
      </ImageBackground>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: themeColors.surface }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: themeColors.surfaceElevated,
              color: themeColors.text,
            },
          ]}
          placeholder="Search shops..."
          placeholderTextColor={themeColors.textMuted}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearch}
        />

        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: Colors.brand.accent }]}
          onPress={handleSearch}
        >
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Categories*/}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: themeColors.surface }}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(cat => {
          const active = selectedCategory === cat;

          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: active
                    ? Colors.brand.accent
                    : themeColors.surfaceElevated,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: active ? '#fff' : themeColors.textSecondary },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand.accent} />
          <Text style={{ color: themeColors.textSecondary, marginTop: 12 }}>
            Loading shops...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: themeColors.danger }}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: Colors.brand.accent }]}
            onPress={onRefresh}
          >
            <Text style={{ color: '#fff' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: themeColors.surface }]}
              onPress={() => router.push(`/food/${item.id}`)}
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
                <Text style={[styles.cardName, { color: themeColors.text }]}>
                  {item.name}
                </Text>

                <Text style={[styles.cardDesc, { color: themeColors.textSecondary }]}>
                  {item.description}
                </Text>

                <Text style={{ color: themeColors.textMuted, fontSize: 12 }}>
                  📍 {item.address}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}

          ListHeaderComponent = {<View style={{height:16}} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.brand.accent}
            />
          }
          onEndReached={loadMore}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    height: 160,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },

  headerImage: {
    resizeMode: 'cover',
  },

  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },

  headerSub: {
    fontSize: 14,
    marginTop: 2,
    color: 'rgba(255,255,255,0.8)',
  },

  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  searchBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
  },

  searchBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',   
  },

  categoryChip: {
    paddingHorizontal: 14,
    height: 34,            
    borderRadius: 20,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    includeFontPadding: false, 
    textAlignVertical: 'center',
    lineHeight: 16,           
  },

  listContent: {
    padding: 16,
    gap: 14,
    paddingTop: 20, 
  },

  card: {
    borderRadius: 16,
    overflow: 'hidden',
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
    padding: 14,
  },

  cardName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },

  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  retryBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});