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
  Gift,
  ExternalLink,
  MessageCircle,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { HapticService } from '../../services/HapticService';
import {
  getGiftShopById,
  deleteGiftShop,
  deleteGiftProduct,
  GiftShopResponseDto,
  GiftProductResponseDto,
} from '../../services/giftshop';
import { CreateGiftShopModal } from '../../components/gifts/CreateGiftShopModal';
import { CreateGiftProductModal } from '../../components/gifts/CreateGiftProductModal';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THEME_ACCENT = '#EC4899'; // Pink/rose accent for gifts

export default function GiftShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [shop, setShop] = useState<GiftShopResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal States
  const [editShopVisible, setEditShopVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [productToEdit, setProductToEdit] = useState<GiftProductResponseDto | null>(null);

  const loadShopDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGiftShopById(id);
      setShop(data);
    } catch (err: any) {
      setError('Could not load shop details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadShopDetails();
  }, [id]);

  const canManage =
    user &&
    (user.role === 'Admin' || (shop?.email && user.email === shop.email));

  const handlePhoneCall = () => {
    if (!shop?.phone) return;
    HapticService.triggerTap();
    Linking.openURL(`tel:${shop.phone}`);
  };

  const handleSendEmail = () => {
    if (!shop?.email) return;
    HapticService.triggerTap();
    Linking.openURL(`mailto:${shop.email}?subject=Inquiry about Gift Shop products`);
  };

  const handleWhatsAppChat = () => {
    if (!shop?.phone) return;
    HapticService.triggerTap();
    // Normalize phone number (strip leading 0 and prepend country code +94 for Sri Lanka if 9 digits)
    let cleanPhone = shop.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '94' + cleanPhone.substring(1);
    }
    Linking.openURL(`https://wa.me/${cleanPhone}?text=Hi, I am interested in ordering a gift item from your shop on NearU.`);
  };

  const handleNavigateAddress = () => {
    if (!shop?.address) return;
    HapticService.triggerTap();
    const query = encodeURIComponent(`${shop.name}, ${shop.address}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleDeleteShop = () => {
    HapticService.triggerSelection();
    Alert.alert(
      'Delete Gift Shop',
      `Are you sure you want to delete "${shop?.name}"? This will remove all catalog products.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteGiftShop(id);
              HapticService.triggerSuccess();
              router.replace('/gifts');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete gift shop.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddProductPress = () => {
    HapticService.triggerSelection();
    setProductToEdit(null);
    setProductModalVisible(true);
  };

  const handleEditProductPress = (product: GiftProductResponseDto) => {
    HapticService.triggerSelection();
    setProductToEdit(product);
    setProductModalVisible(true);
  };

  const handleDeleteProductPress = (product: GiftProductResponseDto) => {
    HapticService.triggerSelection();
    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${product.name}" from your catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGiftProduct(product.id);
              HapticService.triggerSuccess();
              loadShopDetails();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete product.');
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
          Loading shop details...
        </Text>
      </View>
    );
  }

  if (error || !shop) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.danger }]}>
          {error ?? 'Gift shop not found.'}
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

  const products = shop.products || [];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Banner / Cover Hero with Overlay Gradient */}
      <View style={styles.bannerContainer}>
        {shop.imageUrl ? (
          <Image source={{ uri: shop.imageUrl }} style={styles.bannerImage} />
        ) : (
          <LinearGradient
            colors={systemTheme === 'light' ? ['#FCE7F3', '#FBCFE8'] : ['#1E293B', '#0F172A']}
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

        {/* Title Overlay Block (JobDetailModal visual style) */}
        <View style={styles.logoBadgeContainer}>
          <View style={[styles.logoAvatar, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surfaceElevated }]}>
            {shop.imageUrl ? (
              <Image source={{ uri: shop.imageUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.logoText}>
                {shop.name ? shop.name.charAt(0).toUpperCase() : 'G'}
              </Text>
            )}
          </View>
          <Text style={styles.bannerTitle} numberOfLines={2}>
            {shop.name}
          </Text>
          <Text style={styles.bannerLocation}>
            📍 {shop.locationName}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* 2x2 Details Grid (Replicating Gigs Details Grid) */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.detailsGrid}>
          <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <MapPin size={16} color="#3B82F6" />
            <View>
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Location</Text>
              <Text style={[styles.cellValue, { color: themeColors.text }]} numberOfLines={1}>
                {shop.locationName}
              </Text>
            </View>
          </View>
          <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Gift size={16} color={THEME_ACCENT} />
            <View>
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Catalog</Text>
              <Text style={[styles.cellValue, { color: themeColors.text }]}>
                {products.length} {products.length === 1 ? 'Item' : 'Items'}
              </Text>
            </View>
          </View>
          <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Clock size={16} color={shop.isActive ? '#10B981' : '#EF4444'} />
            <View>
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Status</Text>
              <Text style={[styles.cellValue, { color: shop.isActive ? '#10B981' : '#EF4444' }]}>
                {shop.isActive ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>
          <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Phone size={16} color="#10B981" />
            <View>
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Primary Contact</Text>
              <Text style={[styles.cellValue, { color: themeColors.text }]} numberOfLines={1}>
                {shop.phone}
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
            <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>Call Shop</Text>
          </Pressable>

          <Pressable
            onPress={handleWhatsAppChat}
            style={[styles.contactBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          >
            <MessageCircle size={14} color="#25D366" />
            <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>WhatsApp</Text>
          </Pressable>

          {shop.email && (
            <Pressable
              onPress={handleSendEmail}
              style={[styles.contactBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            >
              <Mail size={14} color={THEME_ACCENT} />
              <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>Email</Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleNavigateAddress}
            style={[styles.contactBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          >
            <ExternalLink size={14} color={themeColors.textSecondary} />
            <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>Directions</Text>
          </Pressable>
        </Animated.View>

        {/* Manager Action Row */}
        {canManage && (
          <Animated.View entering={FadeIn.delay(200)} style={[styles.managerRow, { borderTopColor: themeColors.border }]}>
            <Pressable
              style={[styles.managerBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}
              onPress={() => setEditShopVisible(true)}
            >
              <Edit size={14} color={themeColors.text} />
              <Text style={{ color: themeColors.text, fontSize: 11, fontWeight: '700', marginLeft: 6 }}>Edit Shop Profile</Text>
            </Pressable>

            <Pressable
              style={[styles.managerBtn, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.15)' }]}
              onPress={handleDeleteShop}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Trash2 size={14} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700', marginLeft: 6 }}>Delete Shop</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* About / Description Section */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>About the Shop</Text>
          <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
            📍 Located at {shop.address}. This shop features customized student gifts, handmade bouquets, flowers, and surprise packages. Reach out directly via the call or chat buttons above to inquire about customized orders.
          </Text>
        </Animated.View>

        {/* Catalog Section */}
        <Animated.View entering={FadeIn.delay(250)} style={styles.catalogSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Products Catalog ({products.length})
            </Text>
            {canManage && (
              <Pressable
                style={[styles.addProductBtn, { backgroundColor: THEME_ACCENT }]}
                onPress={handleAddProductPress}
              >
                <Plus size={14} color="#FFFFFF" />
                <Text style={styles.addProductBtnText}>Add Product</Text>
              </Pressable>
            )}
          </View>

          {products.length === 0 ? (
            <View style={[styles.emptyCatalogCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Gift size={28} color={themeColors.textMuted} style={{ opacity: 0.5, marginBottom: 8 }} />
              <Text style={[styles.emptyCatalogText, { color: themeColors.textSecondary }]}>
                No products cataloged yet.
              </Text>
              {canManage && (
                <Text style={{ color: themeColors.textMuted, fontSize: 11, marginTop: 2 }}>
                  Tap 'Add Product' above to build your catalog.
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.productGrid}>
              {products.map(product => (
                <View
                  key={product.id}
                  style={[
                    styles.productCard,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <View style={styles.productImageWrapper}>
                    {product.photoUrl ? (
                      <Image source={{ uri: product.photoUrl }} style={styles.productImage} />
                    ) : (
                      <View style={[styles.productImagePlaceholder, { backgroundColor: themeColors.surfaceElevated }]}>
                        <Gift size={24} color={THEME_ACCENT} />
                      </View>
                    )}
                    {!product.isActive && (
                      <View style={styles.outOfStockOverlay}>
                        <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.productBody}>
                    <Text style={[styles.productName, { color: themeColors.text }]} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={[styles.productPrice, { color: THEME_ACCENT }]}>
                      Rs. {product.price.toLocaleString()}
                    </Text>

                    {/* Quick Order / Contact info */}
                    {!canManage ? (
                      <Pressable
                        style={[styles.quickOrderBtn, { backgroundColor: THEME_ACCENT }]}
                        onPress={handleWhatsAppChat}
                      >
                        <Text style={styles.quickOrderText}>Order Now</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.productEditButtonsRow}>
                        <Pressable
                          style={[styles.productIconBtn, { backgroundColor: themeColors.surfaceElevated }]}
                          onPress={() => handleEditProductPress(product)}
                        >
                          <Edit size={12} color={themeColors.text} />
                        </Pressable>
                        <Pressable
                          style={[styles.productIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
                          onPress={() => handleDeleteProductPress(product)}
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

      {/* Edit Shop Modal */}
      {shop && (
        <CreateGiftShopModal
          visible={editShopVisible}
          onClose={() => setEditShopVisible(false)}
          onSuccess={loadShopDetails}
          shopToEdit={shop}
        />
      )}

      {/* Product Create/Edit Modal */}
      <CreateGiftProductModal
        visible={productModalVisible}
        onClose={() => setProductModalVisible(false)}
        onSuccess={loadShopDetails}
        giftShopId={id}
        productToEdit={productToEdit}
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
    color: '#000000',
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
  bodyText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
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
    width: (SCREEN_WIDTH - 50) / 2, // 2 column bento-grid
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  productImageWrapper: {
    height: 110,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  productBody: {
    padding: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
    height: 30, // limit to 2 lines
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  quickOrderBtn: {
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickOrderText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  productEditButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  productIconBtn: {
    flex: 1,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
