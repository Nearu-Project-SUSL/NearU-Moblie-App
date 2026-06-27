import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Animated,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Tag, 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Sparkles, 
  ArrowLeft, 
  RefreshCw, 
  Gift, 
  Utensils, 
  Home, 
  LayoutGrid 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/Colors';
import { HapticService } from '../../services/HapticService';
import { getApprovedDeals } from '../../services/deal';
import { DealResponseDto } from '../../types';
import { Modal as CustomModal } from '../../components/Modal';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Helper to resolve category icons
const getCategoryIcon = (category: string, color: string, size: number = 13) => {
  switch (category.toLowerCase()) {
    case 'food':
      return <Utensils size={size} color={color} />;
    case 'gift':
      return <Gift size={size} color={color} />;
    case 'accommodation':
      return <Home size={size} color={color} />;
    default:
      return <LayoutGrid size={size} color={color} />;
  }
};

// Spotlight / Featured Exclusives Card Component
const SpotlightCard: React.FC<{
  item: DealResponseDto;
  onPress: () => void;
  themeColors: any;
  systemTheme: 'light' | 'dark';
}> = ({ item, onPress, themeColors, systemTheme }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }], width: SCREEN_WIDTH * 0.82, marginRight: 14 }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.spotlightCard,
          {
            backgroundColor: systemTheme === 'light' ? '#FFFFFF' : 'rgba(30, 41, 59, 0.45)',
            borderColor: systemTheme === 'light' ? '#E2E8F0' : 'rgba(46, 158, 191, 0.25)',
          },
        ]}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.spotlightImage} resizeMode="cover" />
        ) : (
          <View style={[styles.spotlightImagePlaceholder, { backgroundColor: themeColors.nearuAccentLight }]}>
            <Tag size={40} color={Colors.brand.accent} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.85)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Absolute Glowing Badge */}
        <View style={[styles.spotlightBadge, { backgroundColor: item.badgeColor || Colors.brand.accent }]}>
          <Sparkles size={10} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.spotlightBadgeText}>{item.badgeText}</Text>
        </View>

        {/* Content Info */}
        <View style={styles.spotlightContent}>
          <View style={styles.spotlightShopRow}>
            <Text style={styles.spotlightShopName} numberOfLines={1}>
              {item.shopName}
            </Text>
            <View style={styles.spotlightTypeBadge}>
              <Text style={styles.spotlightTypeBadgeText}>{item.shopType}</Text>
            </View>
          </View>
          <Text style={styles.spotlightTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.spotlightDesc} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Animated Deal Card Component
const DealListItem: React.FC<{
  item: DealResponseDto;
  onPress: () => void;
  themeColors: any;
  systemTheme: 'light' | 'dark';
}> = ({ item, onPress, themeColors, systemTheme }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.dealCard,
          {
            backgroundColor: systemTheme === 'light' ? '#FFFFFF' : 'rgba(30, 41, 59, 0.45)',
            borderColor: systemTheme === 'light' ? '#E2E8F0' : 'rgba(46, 158, 191, 0.22)',
          },
        ]}
      >
        {/* Deal Image Area */}
        <View style={styles.cardImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImagePlaceholder, { backgroundColor: themeColors.nearuAccentLight }]}>
              <Tag size={36} color={Colors.brand.accent} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', systemTheme === 'light' ? 'rgba(255,255,255,0.02)' : 'rgba(30,41,59,0.02)', systemTheme === 'light' ? 'rgba(255,255,255,0.95)' : '#1e293b']}
            style={styles.cardImageGradient}
          />
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
              {getCategoryIcon(item.shopType || '', themeColors.textSecondary, 10)}
              <Text style={[styles.shopTypeBadgeText, { color: themeColors.textSecondary, marginLeft: 4 }]}>
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

          <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={[styles.cardDesc, { color: themeColors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={[styles.cardDivider, { backgroundColor: themeColors.border }]} />
          
          <View style={styles.cardActionRow}>
            <Text style={[styles.cardActionText, { color: Colors.brand.accent }]}>Reveal Coupon Offer</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.brand.accent} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function DealsScreen() {
  const router = useRouter();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [deals, setDeals] = useState<DealResponseDto[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<DealResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Food', 'Gift', 'Accommodation', 'Other'];

  // Detail Modal & Coupon Copy States
  const [selectedDeal, setSelectedDeal] = useState<DealResponseDto | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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

  useEffect(() => {
    let result = deals;

    if (selectedCategory !== 'All') {
      result = result.filter(
        deal => deal.shopType?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

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
    HapticService.triggerTap();
    setRefreshing(true);
    await fetchDeals();
    setRefreshing(false);
  };

  const handleDealPress = (deal: DealResponseDto) => {
    HapticService.triggerSelection();
    setCopiedCode(false);
    setSelectedDeal(deal);
  };

  const handleCopyCode = () => {
    HapticService.triggerSuccess();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getPillIcon = (cat: string, active: boolean, themeColors: any) => {
    const color = active ? '#FFFFFF' : themeColors.textSecondary;
    if (cat === 'All') return <Sparkles size={12} color={color} />;
    return getCategoryIcon(cat, color, 12);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Full-bleed Premium Banner */}
      <View style={styles.bannerContainer}>
        <Image source={require('../../assets/offer_service.png')} style={styles.bannerImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.4)', themeColors.background]}
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
            style={[styles.backButton, { backgroundColor: systemTheme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)' }]}
          >
            <ArrowLeft size={20} color={themeColors.text} />
          </Pressable>
        </View>

        {/* Title overlay block */}
        <View style={styles.titleOverlay}>
          <Text style={styles.bannerTitle}>Deals & Offers</Text>
          <Text style={styles.bannerSubtitle}>Exclusive student savings, campus discounts, and canteens promotions</Text>
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand.accent} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Unlocking exclusive deals...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Tag size={40} color={themeColors.danger} />
          <Text style={[styles.errorText, { color: themeColors.danger }]}>{error}</Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: Colors.brand.accent }]}
            onPress={onRefresh}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredDeals}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.accent} />
          }
          ListHeaderComponent={
            <View>
              {/* Search Box (Floating above banner edge) */}
              <View style={[styles.searchBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Search size={18} color={themeColors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: themeColors.text }]}
                  placeholder="Search deals, canteens, shops..."
                  placeholderTextColor={themeColors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={themeColors.textSecondary} />
                  </Pressable>
                )}
              </View>

              {/* Spotlight Carousel */}
              {deals.length > 0 && searchQuery === '' && selectedCategory === 'All' && (
                <View style={styles.spotlightSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Sparkles size={16} color={Colors.brand.accent} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Spotlight Exclusives</Text>
                  </View>
                  <FlatList
                    data={deals.slice(0, 3)}
                    keyExtractor={item => 'spot-' + item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.spotlightListContent}
                    snapToInterval={SCREEN_WIDTH * 0.82 + 14}
                    decelerationRate="fast"
                    renderItem={({ item }) => (
                      <SpotlightCard
                        item={item}
                        onPress={() => handleDealPress(item)}
                        themeColors={themeColors}
                        systemTheme={systemTheme}
                      />
                    )}
                  />
                </View>
              )}

              {/* Header Row */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                  <View style={styles.titleWithIcon}>
                    <Tag size={16} color={Colors.brand.accent} />
                    <Text style={[styles.title, { color: themeColors.text }]}>Featured Savings</Text>
                  </View>
                  <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                    {filteredDeals.length} offers currently active
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

              {/* Category Filter Scroll */}
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
                        <View style={styles.filterPillContent}>
                          {getPillIcon(cat, active, themeColors)}
                          <Text style={[styles.filterText, { color: active ? '#FFFFFF' : themeColors.textSecondary }]}>
                            {cat}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  }}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Tag size={48} color={themeColors.textMuted} />
              <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No deals or offers found.
              </Text>
              <Text style={[styles.emptySubtext, { color: themeColors.textMuted }]}>
                Try clearing your search query or choosing another category.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <DealListItem
              item={item}
              onPress={() => handleDealPress(item)}
              themeColors={themeColors}
              systemTheme={systemTheme}
            />
          )}
        />
      )}

      {/* Premium Detail Modal */}
      <CustomModal
        visible={selectedDeal !== null}
        onClose={() => setSelectedDeal(null)}
        title="Deal Details"
        height={520}
      >
        {selectedDeal && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            {/* Voucher Card wrapper */}
            <View style={[styles.voucherCard, { backgroundColor: systemTheme === 'light' ? '#F8FAFC' : 'rgba(30, 41, 59, 0.4)', borderColor: themeColors.border }]}>
              {/* Image Hero Section with Gradient */}
              <View style={styles.modalImageContainer}>
                {selectedDeal.imageUrl ? (
                  <Image source={{ uri: selectedDeal.imageUrl }} style={styles.modalImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.modalImagePlaceholder, { backgroundColor: themeColors.nearuAccentSubtle }]}>
                    <Tag size={40} color={Colors.brand.accent} />
                  </View>
                )}
                <LinearGradient colors={['transparent', 'rgba(15, 23, 42, 0.85)']} style={styles.modalImageGradient} />
                <View style={[styles.modalBadge, { backgroundColor: selectedDeal.badgeColor || Colors.brand.accent }]}>
                  <Text style={styles.modalBadgeText}>{selectedDeal.badgeText}</Text>
                </View>
              </View>

              {/* Partner Meta Row */}
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

              {/* Address Row */}
              {selectedDeal.shopAddress && (
                <View style={styles.modalAddressRow}>
                  <MapPin size={14} color={themeColors.textSecondary} />
                  <Text style={[styles.modalAddressText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                    {selectedDeal.shopAddress}
                  </Text>
                </View>
              )}

              {/* Offer Title */}
              <Text style={[styles.modalDealTitle, { color: themeColors.text }]}>
                {selectedDeal.title}
              </Text>

              {/* Ticket Dotted Separator with notches */}
              <View style={styles.ticketSeparatorContainer}>
                <View style={[styles.ticketNotchLeft, { backgroundColor: themeColors.surfaceCard }]} />
                <View style={[styles.ticketDashedLine, { borderColor: themeColors.border }]} />
                <View style={[styles.ticketNotchRight, { backgroundColor: themeColors.surfaceCard }]} />
              </View>

              {/* Promo Code Box */}
              <View style={styles.promoContainer}>
                <Text style={[styles.promoLabel, { color: themeColors.textMuted }]}>Exclusive Promo Code</Text>
                <View style={[styles.promoCodeBox, { borderColor: Colors.brand.accent, backgroundColor: themeColors.surfaceElevated }]}>
                  <Text style={[styles.promoCodeText, { color: themeColors.text }]}>
                    NEARU-{selectedDeal.id.substring(0, 5).toUpperCase()}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCopyCode}
                    activeOpacity={0.7}
                    style={[styles.copyBtn, { backgroundColor: Colors.brand.accent }]}
                  >
                    {copiedCode ? (
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    ) : (
                      <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
                    )}
                    <Text style={styles.copyBtnText}>{copiedCode ? 'Copied' : 'Copy'}</Text>
                  </TouchableOpacity>
                </View>
                {copiedCode && (
                  <Text style={[styles.copiedStatusText, { color: '#10B981' }]}>
                    Promo code copied! Show it to the merchant.
                  </Text>
                )}
              </View>

              {/* Validity Timeline Component */}
              {(selectedDeal.validFrom || selectedDeal.validTo) && (
                <View style={[styles.modalDatesRow, { borderColor: themeColors.border }]}>
                  <View style={styles.dateBlock}>
                    <View style={styles.dateTitleRow}>
                      <Calendar size={12} color={themeColors.textMuted} style={styles.dateIcon} />
                      <Text style={[styles.dateLabel, { color: themeColors.textMuted }]}>Starts</Text>
                    </View>
                    <Text style={[styles.dateValue, { color: themeColors.text }]}>
                      {selectedDeal.validFrom ? new Date(selectedDeal.validFrom).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Immediate'}
                    </Text>
                  </View>
                  <View style={[styles.dateDivider, { backgroundColor: themeColors.border }]} />
                  <View style={styles.dateBlock}>
                    <View style={styles.dateTitleRow}>
                      <Clock size={12} color={themeColors.textMuted} style={styles.dateIcon} />
                      <Text style={[styles.dateLabel, { color: themeColors.textMuted }]}>Expires</Text>
                    </View>
                    <Text style={[styles.dateValue, { color: themeColors.text }]}>
                      {selectedDeal.validTo ? new Date(selectedDeal.validTo).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ongoing'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Description & Terms */}
              <Text style={[styles.modalSectionLabel, { color: themeColors.textMuted }]}>Offer description & terms</Text>
              <Text style={[styles.modalDesc, { color: themeColors.textSecondary }]}>
                {selectedDeal.description}
              </Text>
            </View>

            {/* Claim / Done Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.modalCloseButton, { backgroundColor: Colors.brand.accent, marginTop: 16 }]}
              onPress={() => {
                HapticService.triggerSuccess();
                setSelectedDeal(null);
              }}
            >
              <LinearGradient
                colors={[Colors.brand.accent, '#1a7791']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.modalCloseButtonText}>Done</Text>
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 4,
  },
  filterPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
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
    height: 60,
  },
  cardBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardContent: {
    padding: 16,
    paddingTop: 8,
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  shopTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 8,
  },
  cardAddressText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Spotlight Styles
  spotlightSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  spotlightListContent: {
    paddingRight: 20,
  },
  spotlightCard: {
    height: 175,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  spotlightImage: {
    width: '100%',
    height: '100%',
  },
  spotlightImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  spotlightBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  spotlightContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  spotlightShopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  spotlightShopName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spotlightTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  spotlightTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  spotlightTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spotlightDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  dateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateIcon: {
    marginRight: 4,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '600',
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
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
    zIndex: 1,
  },

  // Voucher details styles
  voucherCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  ticketSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 18,
    position: 'relative',
    height: 16,
  },
  ticketNotchLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    left: -25,
    zIndex: 2,
  },
  ticketNotchRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    right: -25,
    zIndex: 2,
  },
  ticketDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  promoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  promoLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  promoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
  },
  promoCodeText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  copiedStatusText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});
