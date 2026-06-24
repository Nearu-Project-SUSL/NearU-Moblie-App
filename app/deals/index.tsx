import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Tag, Search, MapPin, Calendar, Clock, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '../../constants/Colors';
import { HapticService } from '../../services/HapticService';
import { getApprovedDeals } from '../../services/deal';
import { DealResponseDto } from '../../types';
import { Modal as CustomModal } from '../../components/Modal';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DealsScreen() {
  const router = useRouter();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const [deals, setDeals] = useState<DealResponseDto[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<DealResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Food', 'Gift', 'Accommodation', 'Other'];

  // Detail Modal State
  const [selectedDeal, setSelectedDeal] = useState<DealResponseDto | null>(null);

  const fetchDeals = useCallback(async () => {
    try {
      setError(null);
      const data = await getApprovedDeals();
      setDeals(data);
    } catch (err) {
      console.log('Error fetching deals:', err);
      setError('Could not load deals. Please try again.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDeals().finally(() => setLoading(false));
  }, [fetchDeals]);

  // Apply filters whenever selectedCategory or searchQuery changes
  useEffect(() => {
    let result = deals;

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(
        deal => deal.shopType?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        deal =>
          deal.title?.toLowerCase().includes(q) ||
          deal.description?.toLowerCase().includes(q) ||
          deal.shopName?.toLowerCase().includes(q) ||
          deal.shopAddress?.toLowerCase().includes(q)
      );
    }

    setFilteredDeals(result);
  }, [deals, selectedCategory, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeals();
    setRefreshing(false);
  };

  const handleDealPress = (deal: DealResponseDto) => {
    HapticService.triggerSelection();
    setSelectedDeal(deal);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header Area */}
      <LinearGradient
        colors={systemTheme === 'dark' ? ['#1e293b', '#0f172a'] : ['#2E9EBF', '#1e82a0']}
        style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 54 : 32 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Deals & Offers</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          Exclusive student discounts & limited-time canteens, stays, and service savings.
        </Text>
      </LinearGradient>

      {/* Filter and Search Section */}
      <View style={[styles.searchFilterContainer, { backgroundColor: themeColors.surfaceCard, borderBottomColor: themeColors.border }]}>
        {/* Search Row */}
        <View style={[styles.searchRow, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
          <Search size={18} color={themeColors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search deals, shops, or locations..."
            placeholderTextColor={themeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          style={styles.categoriesScrollView}
        >
          {categories.map(cat => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: active ? Colors.brand.accent : themeColors.surfaceElevated,
                    borderColor: active ? Colors.brand.accent : themeColors.border,
                  },
                ]}
                onPress={() => {
                  HapticService.triggerSelection();
                  setSelectedCategory(cat);
                }}
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
      </View>

      {/* Main Deals List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand.accent} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Fetching campus offers...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Tag size={40} color={themeColors.danger} />
          <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: Colors.brand.accent }]}
            onPress={onRefresh}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDeals}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Tag size={48} color={themeColors.textMuted} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No deals or offers match your filters.
              </Text>
              <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                Check back later or search for other terms.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => handleDealPress(item)}
                style={[
                  styles.dealCard,
                  {
                    backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                {/* Deal Image Area */}
                <View style={styles.cardImageContainer}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cardImagePlaceholder, { backgroundColor: themeColors.nearuAccentSubtle }]}>
                      <Tag size={32} color={themeColors.nearuAccent} />
                    </View>
                  )}
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.cardImageGradient} />
                  <View style={[styles.cardBadge, { backgroundColor: item.badgeColor || Colors.brand.accent }]}>
                    <Text style={styles.cardBadgeText}>{item.badgeText}</Text>
                  </View>
                </View>

                {/* Deal Info Area */}
                <View style={styles.cardContent}>
                  <View style={styles.shopMetaRow}>
                    <Text style={[styles.shopName, { color: Colors.brand.accent }]} numberOfLines={1}>
                      {item.shopName}
                    </Text>
                    <View style={[styles.shopTypeBadge, { backgroundColor: themeColors.surfaceElevated }]}>
                      <Text style={[styles.shopTypeBadgeText, { color: themeColors.textSecondary }]}>
                        {item.shopType}
                      </Text>
                    </View>
                  </View>

                  {item.shopAddress && (
                    <View style={styles.cardAddressRow}>
                      <MapPin size={11} color={themeColors.textSecondary} />
                      <Text style={[styles.cardAddressText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                        {item.shopAddress}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <Text style={[styles.cardDesc, { color: themeColors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Deal Details Modal Sheet */}
      <CustomModal
        visible={selectedDeal !== null}
        onClose={() => setSelectedDeal(null)}
        title="Deal Details"
        height={480}
      >
        {selectedDeal && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            {/* Image Section */}
            <View style={styles.modalImageContainer}>
              {selectedDeal.imageUrl ? (
                <Image source={{ uri: selectedDeal.imageUrl }} style={styles.modalImage} resizeMode="cover" />
              ) : (
                <View style={[styles.modalImagePlaceholder, { backgroundColor: themeColors.nearuAccentSubtle }]}>
                  <Tag size={40} color={themeColors.nearuAccent} />
                </View>
              )}
              <LinearGradient colors={['transparent', 'rgba(15, 23, 42, 0.75)']} style={styles.modalImageGradient} />
              <View style={[styles.modalBadge, { backgroundColor: selectedDeal.badgeColor || Colors.brand.accent }]}>
                <Text style={styles.modalBadgeText}>{selectedDeal.badgeText}</Text>
              </View>
            </View>

            {/* Shop Details */}
            <View style={styles.modalShopRow}>
              <Text style={[styles.modalShopName, { color: Colors.brand.accent }]}>
                {selectedDeal.shopName}
              </Text>
              <View style={[styles.modalShopTypeBadge, { backgroundColor: themeColors.surfaceElevated }]}>
                <Text style={[styles.modalShopTypeBadgeText, { color: themeColors.textSecondary }]}>
                  {selectedDeal.shopType}
                </Text>
              </View>
            </View>

            {/* Address */}
            {selectedDeal.shopAddress && (
              <View style={styles.modalAddressRow}>
                <MapPin size={14} color={themeColors.textSecondary} />
                <Text style={[styles.modalAddressText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                  {selectedDeal.shopAddress}
                </Text>
              </View>
            )}

            {/* Title */}
            <Text style={[styles.modalDealTitle, { color: themeColors.text }]}>
              {selectedDeal.title}
            </Text>

            {/* Validity Dates */}
            {(selectedDeal.validFrom || selectedDeal.validTo) && (
              <View style={[styles.modalDatesRow, { borderColor: themeColors.border }]}>
                <View style={styles.dateBlock}>
                  <Text style={[styles.dateLabel, { color: themeColors.textMuted }]}>Valid From</Text>
                  <Text style={[styles.dateValue, { color: themeColors.text }]}>
                    {selectedDeal.validFrom ? new Date(selectedDeal.validFrom).toLocaleDateString() : 'Immediate'}
                  </Text>
                </View>
                <View style={[styles.dateDivider, { backgroundColor: themeColors.border }]} />
                <View style={styles.dateBlock}>
                  <Text style={[styles.dateLabel, { color: themeColors.textMuted }]}>Valid Until</Text>
                  <Text style={[styles.dateValue, { color: themeColors.text }]}>
                    {selectedDeal.validTo ? new Date(selectedDeal.validTo).toLocaleDateString() : 'Open Validation'}
                  </Text>
                </View>
              </View>
            )}

            {/* Offer details / description */}
            <Text style={[styles.modalSectionLabel, { color: themeColors.textMuted }]}>Offer Terms & Description</Text>
            <Text style={[styles.modalDesc, { color: themeColors.textSecondary }]}>
              {selectedDeal.description}
            </Text>

            {/* Claim / Close CTA */}
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: Colors.brand.accent }]}
              onPress={() => setSelectedDeal(null)}
            >
              <Text style={styles.modalCloseButtonText}>Close Window</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
    fontWeight: '500',
  },
  searchFilterContainer: {
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
  },
  categoriesScrollView: {
    maxHeight: 40,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  dealCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardImageContainer: {
    height: 150,
    position: 'relative',
    width: '100%',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  cardBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  cardContent: {
    padding: 16,
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  shopName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  shopTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shopTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  cardAddressText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },

  // Modal Styles
  modalScroll: {
    paddingBottom: 24,
  },
  modalImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  modalBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalShopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalShopName: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalShopTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalShopTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  modalAddressText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  modalDealTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  modalDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  dateBlock: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateDivider: {
    width: 1,
    height: 30,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalCloseButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
