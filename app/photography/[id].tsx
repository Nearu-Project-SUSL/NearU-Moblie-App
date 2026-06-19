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
  Camera,
  ExternalLink,
  MessageCircle,
  Clock,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { HapticService } from '../../services/HapticService';
import {
  getPhotographerById,
  deletePhotographer,
  deletePhotographyPackage,
} from '../../services/photography';
import { Photographer, PhotographyPackage } from '../../types/photography';
import { CreatePhotographerModal } from '../../components/photography/CreatePhotographerModal';
import { CreatePhotographyPackageModal } from '../../components/photography/CreatePhotographyPackageModal';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THEME_ACCENT = '#8B5CF6'; // Creative Violet/Purple theme

export default function PhotographerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [photographer, setPhotographer] = useState<Photographer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal States
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState<PhotographyPackage | null>(null);

  const loadPhotographerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPhotographerById(id);
      setPhotographer(data);
    } catch (err: any) {
      setError('Could not load photographer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadPhotographerDetails();
  }, [id]);

  const canManage =
    user &&
    (user.role === 'Admin' || (photographer?.ownerId && user.id === photographer.ownerId) || (photographer?.email && user.email === photographer.email));

  const handlePhoneCall = () => {
    if (!photographer?.phone) return;
    HapticService.triggerTap();
    Linking.openURL(`tel:${photographer.phone}`);
  };

  const handleSendEmail = () => {
    if (!photographer?.email) return;
    HapticService.triggerTap();
    Linking.openURL(`mailto:${photographer.email}?subject=Photography Booking Inquiry via NearU`);
  };

  const handleWhatsAppChat = (packageName?: string) => {
    if (!photographer?.phone) return;
    HapticService.triggerTap();
    // Normalize phone number (strip leading 0 and prepend country code +94 for Sri Lanka if 10 digits)
    let cleanPhone = photographer.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '94' + cleanPhone.substring(1);
    }
    const packageText = packageName ? ` for the package "${packageName}"` : '';
    Linking.openURL(`https://wa.me/${cleanPhone}?text=Hi, I am interested in booking your photography services${packageText} on NearU.`);
  };

  const handleNavigateAddress = () => {
    if (!photographer?.locationName) return;
    HapticService.triggerTap();
    const query = encodeURIComponent(`${photographer.name}, ${photographer.locationName}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleDeleteProfile = () => {
    HapticService.triggerSelection();
    Alert.alert(
      'Delete Photographer Profile',
      `Are you sure you want to delete "${photographer?.name}"? This will remove all listed photography packages.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePhotographer(id);
              HapticService.triggerSuccess();
              router.replace('/photography');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete photographer profile.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddPackagePress = () => {
    HapticService.triggerSelection();
    setPackageToEdit(null);
    setPackageModalVisible(true);
  };

  const handleEditPackagePress = (pkg: PhotographyPackage) => {
    HapticService.triggerSelection();
    setPackageToEdit(pkg);
    setPackageModalVisible(true);
  };

  const handleDeletePackagePress = (pkg: PhotographyPackage) => {
    HapticService.triggerSelection();
    Alert.alert(
      'Remove Package',
      `Are you sure you want to remove the package "${pkg.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhotographyPackage(pkg.id);
              HapticService.triggerSuccess();
              loadPhotographerDetails();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to remove package.');
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

  if (error || !photographer) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.danger }]}>
          {error ?? 'Photographer profile not found.'}
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
        {photographer.imageUrl ? (
          <Image source={{ uri: photographer.imageUrl }} style={styles.bannerImage} />
        ) : (
          <LinearGradient
            colors={systemTheme === 'light' ? ['#F5E8FF', '#D8B4FE'] : ['#1E1B4B', '#311042']}
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
            {photographer.imageUrl ? (
              <Image source={{ uri: photographer.imageUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.logoText}>
                {photographer.name ? photographer.name.charAt(0).toUpperCase() : 'P'}
              </Text>
            )}
          </View>
          <Text style={styles.bannerTitle} numberOfLines={2}>
            {photographer.name}
          </Text>
          <Text style={styles.bannerLocation}>
            📍 {photographer.locationName}
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
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Area</Text>
              <Text style={[styles.cellValue, { color: themeColors.text }]} numberOfLines={1}>
                {photographer.locationName}
              </Text>
            </View>
          </View>
          <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Camera size={16} color="#3B82F6" />
            <View>
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Offers</Text>
              <Text style={[styles.cellValue, { color: themeColors.text }]}>
                {photographer.packages?.length || 0} Pricing Packages
              </Text>
            </View>
          </View>
          <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Clock size={16} color={THEME_ACCENT} />
            <View>
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Base Rate</Text>
              <Text style={[styles.cellValue, { color: THEME_ACCENT }]}>
                LKR {photographer.baseRatePerHour?.toLocaleString()}/hr
              </Text>
            </View>
          </View>
          <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Phone size={16} color="#10B981" />
            <View>
              <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Phone Contact</Text>
              <Text style={[styles.cellValue, { color: themeColors.text }]} numberOfLines={1}>
                {photographer.phone}
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
            <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>Call Now</Text>
          </Pressable>

          <Pressable
            onPress={() => handleWhatsAppChat()}
            style={[styles.contactBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          >
            <MessageCircle size={14} color="#25D366" />
            <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>WhatsApp</Text>
          </Pressable>

          {photographer.email ? (
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
            <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>Location</Text>
          </Pressable>
        </Animated.View>

        {/* Manager Action Row */}
        {canManage && (
          <Animated.View entering={FadeIn.delay(200)} style={[styles.managerRow, { borderTopColor: themeColors.border }]}>
            <Pressable
              style={[styles.managerBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}
              onPress={() => setEditProfileVisible(true)}
            >
              <Edit size={14} color={themeColors.text} />
              <Text style={{ color: themeColors.text, fontSize: 11, fontWeight: '700', marginLeft: 6 }}>Edit Profile</Text>
            </Pressable>

            <Pressable
              style={[styles.managerBtn, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.15)' }]}
              onPress={handleDeleteProfile}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Trash2 size={14} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700', marginLeft: 6 }}>Delete Profile</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* About / Bio Section */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Photographer Biography</Text>
          <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
            {photographer.bio || 'Professional campus photographer. Offering event coverage, society meetings, portraits, and customized graduation packages.'}
          </Text>
        </Animated.View>

        {/* Catalog / Packages Section */}
        <Animated.View entering={FadeIn.delay(250)} style={styles.catalogSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Service Packages ({photographer.packages?.length || 0})
            </Text>
            {canManage && (
              <Pressable
                style={[styles.addProductBtn, { backgroundColor: THEME_ACCENT }]}
                onPress={handleAddPackagePress}
              >
                <Plus size={14} color="#FFFFFF" />
                <Text style={styles.addProductBtnText}>Add Package</Text>
              </Pressable>
            )}
          </View>

          {(!photographer.packages || photographer.packages.length === 0) ? (
            <View style={[styles.emptyCatalogCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Camera size={28} color={themeColors.textMuted} style={{ opacity: 0.5, marginBottom: 8 }} />
              <Text style={[styles.emptyCatalogText, { color: themeColors.textSecondary }]}>
                No service packages cataloged yet.
              </Text>
              {canManage && (
                <Text style={{ color: themeColors.textMuted, fontSize: 11, marginTop: 2 }}>
                  Tap 'Add Package' above to catalog your shooting packages.
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.productGrid}>
              {photographer.packages.map(pkg => (
                <View
                  key={pkg.id}
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
                        {pkg.name}
                      </Text>
                      {pkg.isActive ? (
                        <View style={styles.availableDot} />
                      ) : (
                        <View style={[styles.availableDot, { backgroundColor: '#EF4444' }]} />
                      )}
                    </View>
                    
                    <Text style={[styles.productDesc, { color: themeColors.textSecondary }]} numberOfLines={3}>
                      {pkg.description || 'No package details specified.'}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={[styles.productPrice, { color: THEME_ACCENT }]}>
                        LKR {pkg.price.toLocaleString()}
                      </Text>
                    </View>

                    {/* Quick Booking */}
                    {!canManage ? (
                      <Pressable
                        style={[styles.quickOrderBtn, { backgroundColor: THEME_ACCENT }]}
                        onPress={() => handleWhatsAppChat(pkg.name)}
                      >
                        <Text style={styles.quickOrderText}>Book Package</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.productEditButtonsRow}>
                        <Pressable
                          style={[styles.productIconBtn, { backgroundColor: themeColors.surfaceElevated }]}
                          onPress={() => handleEditPackagePress(pkg)}
                        >
                          <Edit size={12} color={themeColors.text} />
                        </Pressable>
                        <Pressable
                          style={[styles.productIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
                          onPress={() => handleDeletePackagePress(pkg)}
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

      {/* Edit Profile Modal */}
      {photographer && (
        <CreatePhotographerModal
          visible={editProfileVisible}
          onClose={() => setEditProfileVisible(false)}
          onSuccess={loadPhotographerDetails}
          photographerToEdit={photographer}
        />
      )}

      {/* Package Create/Edit Modal */}
      <CreatePhotographyPackageModal
        visible={packageModalVisible}
        onClose={() => setPackageModalVisible(false)}
        onSuccess={loadPhotographerDetails}
        photographerId={id}
        packageToEdit={packageToEdit}
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
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickOrderBtn: {
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  quickOrderText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  productEditButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  productIconBtn: {
    flex: 1,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
});
