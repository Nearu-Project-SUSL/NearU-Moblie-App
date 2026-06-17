import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  useColorScheme,
  Dimensions,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Plus,
  Hotel,
  ExternalLink,
  MessageCircle,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { HapticService } from '../../services/HapticService';
import {
  getAccommodationById,
  deleteAccommodation,
  getAccommodationItems,
  deleteAccommodationItem,
} from '../../services/accommodation';
import { Accommodation, AccommodationItem } from '../../types/accommodation';
import { CreateAccommodationModal } from '../../components/accommodations/CreateAccommodationModal';
import { CreateAccommodationItemModal } from '../../components/accommodations/CreateAccommodationItemModal';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THEME_ACCENT = '#10B981'; // Emerald Green accent for accommodations

export default function AccommodationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [place, setPlace] = useState<Accommodation | null>(null);
  const [items, setItems] = useState<AccommodationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal States
  const [editPlaceVisible, setEditPlaceVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<AccommodationItem | null>(null);

  const loadPlaceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const accommodationData = await getAccommodationById(id);
      setPlace(accommodationData);
      
      const itemsData = await getAccommodationItems(id);
      setItems(itemsData);
    } catch (err: any) {
      setError('Could not load accommodation details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadPlaceDetails();
  }, [id]);

  const canManage =
    user &&
    (user.role === 'Admin' || (place?.email && user.email === place.email));

  const handlePhoneCall = () => {
    if (!place?.contactPhone) return;
    HapticService.triggerTap();
    Linking.openURL(`tel:${place.contactPhone}`);
  };

  const handleSendEmail = () => {
    if (!place?.email) return;
    HapticService.triggerTap();
    Linking.openURL(`mailto:${place.email}?subject=Inquiry about Accommodation booking`);
  };

  const handleWhatsAppChat = () => {
    if (!place?.contactPhone) return;
    HapticService.triggerTap();
    // Normalize phone number (strip leading 0 and prepend country code +94 for Sri Lanka if 9 digits)
    let cleanPhone = place.contactPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '94' + cleanPhone.substring(1);
    }
    Linking.openURL(`https://wa.me/${cleanPhone}?text=Hi, I am interested in booking/viewing your accommodation: "${place.title}" on NearU.`);
  };

  const handleNavigateAddress = () => {
    if (!place?.location) return;
    HapticService.triggerTap();
    const query = encodeURIComponent(`${place.title}, ${place.location}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleDeletePlace = () => {
    HapticService.triggerSelection();
    Alert.alert(
      'Delete Accommodation',
      `Are you sure you want to delete "${place?.title}"? This will remove all listed rooms or bed options.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccommodation(id);
              HapticService.triggerSuccess();
              router.replace('/accommodations');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete accommodation.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddItemPress = () => {
    HapticService.triggerSelection();
    setItemToEdit(null);
    setItemModalVisible(true);
  };

  const handleEditItemPress = (item: AccommodationItem) => {
    HapticService.triggerSelection();
    setItemToEdit(item);
    setItemModalVisible(true);
  };

  const handleDeleteItemPress = (item: AccommodationItem) => {
    HapticService.triggerSelection();
    Alert.alert(
      'Remove Room / Bed option',
      `Are you sure you want to remove "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccommodationItem(id, item.id);
              HapticService.triggerSuccess();
              loadPlaceDetails();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to remove item.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={THEME_ACCENT} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Loading details...
        </Text>
      </View>
    );
  }

  if (error || !place) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.danger }]}>
          {error ?? 'Accommodation not found.'}
        </Text>
        <Pressable
          style={[styles.backBtn, { backgroundColor: THEME_ACCENT }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Banner / Cover Hero with Overlay Gradient */}
      <View style={styles.bannerContainer}>
        {place.image ? (
          <Image source={{ uri: place.image }} style={styles.bannerImage} />
        ) : (
          <LinearGradient
            colors={systemTheme === 'light' ? ['#E8F4F8', '#C3E2EC'] : ['#1E293B', '#0F172A']}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', themeColors.background]}
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
            style={[styles.backFloating, { backgroundColor: themeColors.surface }]}
          >
            <ArrowLeft size={20} color={themeColors.text} />
          </Pressable>
        </View>

        {/* Title Overlay Block */}
        <View style={styles.logoBadgeContainer}>
          <View style={[styles.logoAvatar, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surfaceElevated }]}>
            {place.image ? (
              <Image source={{ uri: place.image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.logoText}>
                {place.title ? place.title.charAt(0).toUpperCase() : 'A'}
              </Text>
            )}
          </View>
          <Text style={styles.bannerTitle} numberOfLines={2}>
            {place.title}
          </Text>
          <Text style={styles.bannerLocation}>
            📍 {place.location}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* 2x2 Details Grid */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.detailsGrid}>
          <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <MapPin size={16} color={THEME_ACCENT} />
            <View>
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Distance</Text>
              <Text style={[styles.cellValue, { color: themeColors.text }]} numberOfLines={1}>
                {place.distanceKm} km to campus
              </Text>
            </View>
          </View>
          <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Hotel size={16} color="#3B82F6" />
            <View>
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Listed Stays</Text>
              <Text style={[styles.cellValue, { color: themeColors.text }]}>
                {items.length} {items.length === 1 ? 'Option' : 'Options'}
              </Text>
            </View>
          </View>
          <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Clock size={16} color={place.availableBeds > 0 ? '#10B981' : '#EF4444'} />
            <View>
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Availability</Text>
              <Text style={[styles.cellValue, { color: place.availableBeds > 0 ? '#10B981' : '#EF4444' }]}>
                {place.availableBeds > 0 ? `${place.availableBeds} beds free` : 'Fully Booked'}
              </Text>
            </View>
          </View>
          <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Phone size={16} color="#10B981" />
            <View>
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Phone Contact</Text>
              <Text style={[styles.cellValue, { color: themeColors.text }]} numberOfLines={1}>
                {place.contactPhone}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Contact Buttons Row */}
        <Animated.View entering={FadeIn.delay(150)} style={styles.contactButtonsRow}>
          <Pressable
            onPress={handlePhoneCall}
            style={[styles.contactBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          >
            <Phone size={14} color={THEME_ACCENT} />
            <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>Call Host</Text>
          </Pressable>

          <Pressable
            onPress={handleWhatsAppChat}
            style={[styles.contactBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          >
            <MessageCircle size={14} color="#25D366" />
            <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>WhatsApp</Text>
          </Pressable>

          {place.email ? (
            <Pressable
              onPress={handleSendEmail}
              style={[styles.contactBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            >
              <Mail size={14} color={THEME_ACCENT} />
              <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>Email</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={handleNavigateAddress}
            style={[styles.contactBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          >
            <ExternalLink size={14} color={themeColors.textSecondary} />
            <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>Map Location</Text>
          </Pressable>
        </Animated.View>

        {/* Manager Action Row */}
        {canManage && (
          <Animated.View entering={FadeIn.delay(200)} style={[styles.managerRow, { borderTopColor: themeColors.border }]}>
            <Pressable
              style={[styles.managerBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}
              onPress={() => setEditPlaceVisible(true)}
            >
              <Edit size={14} color={themeColors.text} />
              <Text style={{ color: themeColors.text, fontSize: 11, fontWeight: '700', marginLeft: 6 }}>Edit Property</Text>
            </Pressable>

            <Pressable
              style={[styles.managerBtn, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.15)' }]}
              onPress={handleDeletePlace}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Trash2 size={14} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700', marginLeft: 6 }}>Delete Listing</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* About / Description Section */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Accommodation Overview</Text>
          <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
            {place.description || 'No detailed description provided yet.'}
          </Text>
          {place.amenities && place.amenities.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.subSectionTitle, { color: themeColors.textSecondary }]}>Amenities Included:</Text>
              <View style={styles.amenitiesContainer}>
                {place.amenities.map((amenity: string, idx: number) => (
                  <View key={idx} style={[styles.amenityChip, { backgroundColor: themeColors.surfaceElevated }]}>
                    <Text style={[styles.amenityText, { color: themeColors.textSecondary }]}>
                      ✓ {amenity}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Catalog / Options Section */}
        <Animated.View entering={FadeIn.delay(250)} style={styles.catalogSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Available Rooms / Bed Spaces ({items.length})
            </Text>
            {canManage && (
              <Pressable
                style={[styles.addProductBtn, { backgroundColor: THEME_ACCENT }]}
                onPress={handleAddItemPress}
              >
                <Plus size={14} color="#FFFFFF" />
                <Text style={styles.addProductBtnText}>Add Item</Text>
              </Pressable>
            )}
          </View>

          {items.length === 0 ? (
            <View style={[styles.emptyCatalogCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Hotel size={28} color={themeColors.textMuted} style={{ opacity: 0.5, marginBottom: 8 }} />
              <Text style={[styles.emptyCatalogText, { color: themeColors.textSecondary }]}>
                No room or bed spaces cataloged yet.
              </Text>
              {canManage && (
                <Text style={{ color: themeColors.textMuted, fontSize: 11, marginTop: 2 }}>
                  Tap 'Add Item' above to list available rooms.
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.productGrid}>
              {items.map(item => (
                <View
                  key={item.id}
                  style={[
                    styles.productCard,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <View style={styles.productBody}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.productName, { color: themeColors.text }]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {item.isAvailable ? (
                        <View style={styles.availableDot} />
                      ) : (
                        <View style={[styles.availableDot, { backgroundColor: '#EF4444' }]} />
                      )}
                    </View>
                    
                    <Text style={[styles.productDesc, { color: themeColors.textSecondary }]} numberOfLines={2}>
                      {item.description || 'No room details specified.'}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={[styles.productPrice, { color: THEME_ACCENT }]}>
                        LKR {item.price.toLocaleString()}
                      </Text>
                      <Text style={[styles.priceDuration, { color: themeColors.textMuted }]}>/ month</Text>
                    </View>

                    {/* Quick Booking / Contact Host */}
                    {!canManage ? (
                      <Pressable
                        style={[styles.quickOrderBtn, { backgroundColor: THEME_ACCENT }]}
                        onPress={handleWhatsAppChat}
                      >
                        <Text style={styles.quickOrderText}>Inquire Now</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.productEditButtonsRow}>
                        <Pressable
                          style={[styles.productIconBtn, { backgroundColor: themeColors.surfaceElevated }]}
                          onPress={() => handleEditItemPress(item)}
                        >
                          <Edit size={12} color={themeColors.text} />
                        </Pressable>
                        <Pressable
                          style={[styles.productIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
                          onPress={() => handleDeleteItemPress(item)}
                        >
                          <Trash2 size={12} color="#EF4444" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Edit Place Modal */}
      {place && (
        <CreateAccommodationModal
          visible={editPlaceVisible}
          onClose={() => setEditPlaceVisible(false)}
          onSuccess={loadPlaceDetails}
          accommodationToEdit={place}
        />
      )}

      {/* Item Create/Edit Modal */}
      <CreateAccommodationItemModal
        visible={itemModalVisible}
        onClose={() => setItemModalVisible(false)}
        onSuccess={loadPlaceDetails}
        accommodationId={id}
        itemToEdit={itemToEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontWeight: '600',
  },
  errorText: {
    marginBottom: 12,
    fontWeight: '600',
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    left: 16,
    top: 0,
    zIndex: 10,
  },
  backFloating: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  logoBadgeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 2,
    gap: 4,
  },
  logoAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME_ACCENT,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bannerLocation: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gridCell: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  contactBtn: {
    flex: 1,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  managerRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  managerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  catalogSection: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    gap: 4,
  },
  addProductBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  emptyCatalogCard: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCatalogText: {
    fontSize: 12,
    fontWeight: '700',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productCard: {
    width: (SCREEN_WIDTH - 50) / 2, // 2 column grid
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  productBody: {
    padding: 12,
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginTop: 4,
  },
  productDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  priceDuration: {
    fontSize: 10,
    marginLeft: 2,
  },
  quickOrderBtn: {
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  quickOrderText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  productEditButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  productIconBtn: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
