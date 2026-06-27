import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Animated,
  useColorScheme,
  Dimensions,
  Platform,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  UtensilsCrossed,
  Bike,
  Hotel,
  BriefcaseBusiness,
  Gift,
  Tag,
  MapPin,
  Bell,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Search,
} from 'lucide-react-native';

import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { HapticService } from '../../services/HapticService';
import { NearULogo } from '../../components/NearULogo';
import { SectionHeader } from '../../components/home/SectionHeader';
import { ServiceGridCard } from '../../components/home/ServiceGridCard';
import { DealCard } from '../../components/home/DealCard';
import { HotDeal} from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getTestimonials, Testimonial, submitTestimonial } from '../../services/testimonialsService';
import TestimonialCard from '../../components/home/TestimonialCard';
import { getApprovedDeals } from '../../services/deal';
import { Modal as CustomModal } from '../../components/Modal';
import RiderDashboard from '../../components/rider/RiderDashboard';
import BusinessDashboard from '../../components/business/BusinessDashboard';





const SCREEN_WIDTH = Dimensions.get('window').width;

const SERVICES = [
  {
    id: 'food',
    label: 'Food Shops',
    description: 'Local food vendors & canteens',
    image: require('../../assets/food_service.png'),
  },
  {
    id: 'rides',
    label: 'Uni Rides',
    description: 'Quick campus commutes',
    image: require('../../assets/rides_service.png'),
  },
  {
    id: 'accommodation',
    label: 'Accommodations',
    description: 'Verified student boardings',
    image: require('../../assets/stays_service.png'),
  },
  {
    id: 'jobs',
    label: 'Jobs & Gigs',
    description: 'Flexible student roles',
    image: require('../../assets/job_service.png'),
  },
  {
    id: 'gifts',
    label: 'Gift Shops',
    description: 'Send surprises & bouquets',
    image: require('../../assets/gift_service.png'),
  },
  {
    id: 'photography',
    label: 'Photography',
    description: 'Event photography & packages',
    image: require('../../assets/photography_service.png'),
  },
  {
    id: 'transport',
    label: 'Transport',
    description: 'Bus arrival times & Tuk-Tuks',
    image: require('../../assets/transport_service.png'),
  },
  {
    id: 'bike-rentals',
    label: 'Bike Rentals',
    description: 'Rent bicycles around campus',
    image: require('../../assets/bike_service.png'),
  },
];

const HOT_DEALS: HotDeal[] = [
  {
    id: 'deal_1',
    title: 'Campus Food Fiesta',
    description: 'Get 30% off your first food order from any campus canteen this week.',
    badge: '30% OFF',
    badgeColor: '#EF4444',
    imageUrl: require('../../assets/food_deal.png'),
  },
  {
    id: 'deal_2',
    title: 'Shared Ride Saver',
    description: 'Split fare with 2+ riders and save up to Rs.150 on your next campus ride.',
    badge: 'SAVE RS.150',
    badgeColor: '#2E9EBF',
    imageUrl: require('../../assets/ride_deal.png'),
  },
  {
    id: 'deal_3',
    title: 'Early Bird Boarding',
    description: 'Book verified rooms before semester starts and get priority listing access.',
    badge: 'LIMITED',
    badgeColor: '#10B981',
    imageUrl: require('../../assets/accommodation_deal.png'),
  },
];


// ── Component ──────────────────────────────────────────────────────────────

export default function BrowseTabContainer() {
  const { user } = useAuth();

  if (user?.role === 'Rider') {
    return <RiderDashboard />;
  }

  if (user?.role === 'Business') {
    return <BusinessDashboard />;
  }

  return <HomeScreen />;
}

function HomeScreen() {
  const { user, isAuthenticated } = useAuth();

  const router = useRouter();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();


  const firstName = user?.firstName || 'Student';
  const greeting = getGreeting();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [deals, setDeals] = useState<HotDeal[]>(HOT_DEALS);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<HotDeal | null>(null);
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const CARD_WIDTH = SCREEN_WIDTH - 48;
  const [currentPage, setCurrentPage] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const autoRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const fetchDeals = useCallback(async () => {
    try {
      const data = await getApprovedDeals();
      if (data && data.length > 0) {
        const mapped = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          badge: item.badgeText,
          badgeColor: item.badgeColor || '#EF4444',
          imageUrl: item.imageUrl || undefined,
          shopName: item.shopName,
          shopType: item.shopType,
          shopAddress: item.shopAddress,
          validFrom: item.validFrom,
          validTo: item.validTo,
        }));
        setDeals(mapped);
      }
    } catch (err) {
      console.log('Error fetching deals:', err);
    } finally {
      setLoadingDeals(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect (() => {
    getTestimonials()
      .then(setTestimonials)
      .catch(() => {})
      .finally(() => setLoadingTestimonials(false))
  }, []);


  const StarRating = ({
    rating,
    onRate,
    size = 24,
  }: {
    rating: number;
    onRate?: (r: number) => void;
    size?: number;
  }) => (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity
          key={star}
          onPress={() => onRate?.(star)}
          disabled={!onRate}
          activeOpacity={onRate ? 0.7 : 1}
        >
          <Text style={{ fontSize: size, color: star <= rating ? '#FBBF24' : '#D1D5DB' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const fetchTestimonials = useCallback(async () => {
    try {
      const data = await getTestimonials();
      setTestimonials(data);
    } catch{
      //silently fail
    } finally{
      setLoadingTestimonials(false);
    }
  }, []);

  useEffect (() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  //Auto rotate every 5 sec
  useEffect(() => {
    if(testimonials.length <= 1) return;
    autoRotateRef.current = setInterval(() => {
     setCurrentPage(prev => {
      const next = (prev + 1) % testimonials.length;
      flatListRef.current?.scrollToIndex({ index: next , animated: true });
      return next;
     });    
    }, 5000);
    return () => {
      if(autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, [testimonials.length])

  const goToPage = (page: number) => {
    if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    setCurrentPage(page);
    flatListRef.current?.scrollToIndex({ index: page, animated: true });
    autoRotateRef.current = setInterval(() => {
      setCurrentPage(prev => {
        const next = (prev + 1) % testimonials.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5000);
  };

  const handleSharePress = () => {
    console.log('share pressed, isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in to share your experience.');
      return;
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Validation', 'Please write a message.');
      return;
    }
    setSubmitting(true);
    try {
      await submitTestimonial({ message: message.trim(), rating });
      setModalVisible(false);
      setMessage('');
      setRating(5);
      Alert.alert('Thank you!', 'Your experience has been shared.');
      fetchTestimonials();
      setCurrentPage(0);
    } catch (err: any) {
      console.log('Testimonial error details:', err?.response?.data || err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to submit. Please try again.';
      Alert.alert('Error', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top },
        ]}
      >
        {/* ── Navigation Header ── */}
        <View style={styles.navHeader}>
          <View style={styles.navLeft}>
            <NearULogo size={56} />
            <View style={styles.navTextGroup}>
              <Text style={[styles.navBrand, { color: Colors.brand.accent }]}>
                NearU
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={11} color={themeColors.textMuted} />
                <Text style={[styles.locationText, { color: themeColors.textMuted }]}>
                  Sabaragamuwa University
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            style={[
              styles.notifButton,
              {
                backgroundColor: systemTheme === 'light'
                  ? themeColors.surfaceElevated
                  : themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Bell size={18} color={themeColors.textSecondary} />
            {/* Notification dot */}
            <View style={styles.notifDot} />
          </Pressable>
        </View>

        {/* ── Improved Hero Greeting Card (Vibrant LinearGradient) ── */}
        <LinearGradient
          colors={systemTheme === 'light' ? ['#2E9EBF', '#156175'] : ['#1C2A30', '#0E171B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroTextGroup}>
              <Text style={[styles.heroGreeting, { color: '#FFFFFF', opacity: 0.88 }]}>
                {greeting}
              </Text>
              <Text style={[styles.heroName, { color: '#FFFFFF' }]}>
                {firstName}
              </Text>
              <Text style={[styles.heroSubtitle, { color: '#FFFFFF', opacity: 0.75 }]}>
                What would you like to explore today?
              </Text>
            </View>
            <View
              style={[
                styles.heroAvatarContainer,
                { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              ]}
            >
              <Text style={styles.heroAvatarText}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Quick Services Grid ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Explore Services"
            subtitle="Premium campus essentials at Sabragamuwa"
            icon={<Sparkles size={20} color={Colors.brand.accent} />}
          />
          <View style={styles.servicesGrid}>
            {SERVICES.map((service) => (
              <ServiceGridCard
                key={service.id}
                imageSource={service.image}
                label={service.label}
                description={service.description}
                onPress={() => {
                  if (service.id === 'food') {
                    router.push('/food');
                  } else if (service.id === 'gifts') {
                    router.push('/gifts');
                  } else if (service.id === 'accommodation') {
                    router.push('/accommodations');
                  } else if (service.id === 'photography') {
                    router.push('/photography');
                  } else {
                    HapticService.triggerSelection();
                    router.push(`/service/${service.id}`);
                  }
                }}
              />
            ))}
          </View>
        </View>

        {/* ── Hot Deals Carousel ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Hot Deals & Offers"
            subtitle="Limited time campus exclusives"
            icon={<Tag size={20} color="#F59E0B" />}
            rightElement={
              <Pressable
                style={styles.viewAllButton}
                onPress={() => {
                  HapticService.triggerSelection();
                  router.push('/deals');
                }}
              >
                <Text style={[styles.viewAllText, { color: Colors.brand.accent }]}>
                  View All
                </Text>
                <ChevronRight size={14} color={Colors.brand.accent} />
              </Pressable>
            }
          />
          <FlatList
            data={deals}
            renderItem={({ item }) => (
              <DealCard
                deal={item}
                onPress={() => {
                  HapticService.triggerSelection();
                  setSelectedDeal(item);
                }}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            snapToInterval={SCREEN_WIDTH * 0.72 + 16}
            decelerationRate="fast"
          />
        </View>

        {/* ── Testimonials Section ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Student Reviews"
            subtitle="What your peers say about NearU"
            icon={<Sparkles size={20} color="#EC4899" />}
          />

          {loadingTestimonials ? (
            <ActivityIndicator size="small" color="#2E9EBF" style={{ marginVertical: 20 }} />
          ) : testimonials.length === 0 ? (
            <Text style={{ color: themeColors.textMuted, paddingHorizontal: 16 }}>No reviews yet</Text>
          ) : (
            <>
              <FlatList
                ref={flatListRef}
                data={testimonials}
                renderItem={({ item }) => (
                  <View style={{ width: CARD_WIDTH, paddingHorizontal: 8 }}>
                    <TestimonialCard testimonial={item} />
                  </View>
                )}
                keyExtractor={item => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselContainer}
                onMomentumScrollEnd={e => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
                  setCurrentPage(index);
                }}
                getItemLayout={(_, index) => ({
                  length: CARD_WIDTH,
                  offset: CARD_WIDTH * index,
                  index,
                })}
              />

              {/* Dot indicators */}
              <View style={styles.dots}>
                {testimonials.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => goToPage(i)}>
                    <View 
                    style={[styles.dot,
                    {
                      backgroundColor:
                        i === currentPage
                          ? themeColors.nearuAccent
                          : themeColors.border,
                    },
                      i === currentPage && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Share button */}
          <TouchableOpacity 
          style={[
            styles.shareBtn,
            {backgroundColor: themeColors.nearuAccent}, 
          ]}
          onPress={handleSharePress}>
            
            <Text style={styles.shareBtnText}>
              ⭐  Share Your Experience
              </Text>
          
          </TouchableOpacity>
        </View>

        {/* Submit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View 
            style={[
              styles.modalCard,
              {backgroundColor: themeColors.surfaceCard}  
            ]}>
              
              <View style={styles.modalHeader}>
                
                <Text 
                style={[
                  styles.modalTitle,
                  {color: themeColors.text}
                ]}>
                  
                  Share Your Experience
                </Text>

                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text 
                  style={[
                    styles.modalClose,
                    {color: themeColors.text}  
                  ]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              
              </View>

              <Text
                style={[
                  styles.modalGreeting,
                  { color: themeColors.text },
                ]}
              >
                Hi {user?.firstName ?? 'Student'} 👋
              </Text>

              <Text
                style={[
                  styles.modalLabel,
                  { color: themeColors.text },
                ]}
              >
                Your Rating
              </Text>              
              
              <StarRating rating={rating} onRate={setRating} size={32} />

              <Text
                style={[
                  styles.modalLabel,
                  {
                    color: themeColors.text,
                    marginTop: 16,
                  },
                ]}
              >
                Your Message
              </Text>    
              
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: themeColors.surfaceElevated,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  },
                ]}
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us about your experience with NearU..."
                placeholderTextColor={themeColors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />

              <Text
                style={[
                  styles.charCount,
                  { color: themeColors.textMuted },
                ]}
              >
                {message.length}/500
              </Text>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: themeColors.nearuAccent },
                  submitting && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    Submit Review
                  </Text>
                )}

              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Deal Details Modal */}
        <CustomModal
          visible={selectedDeal !== null}
          onClose={() => setSelectedDeal(null)}
          title="Deal Details"
          height={480}
        >
          {selectedDeal && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Deal Image with Badge */}
              <View style={styles.modalImageContainer}>
                {selectedDeal.imageUrl ? (
                  <Image
                    source={
                      typeof selectedDeal.imageUrl === 'string' && selectedDeal.imageUrl.startsWith('http')
                        ? { uri: selectedDeal.imageUrl }
                        : selectedDeal.imageUrl as any
                    }
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.modalImagePlaceholder, { backgroundColor: themeColors.nearuAccentSubtle }]} />
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(15, 23, 42, 0.75)']}
                  style={styles.modalImageGradient}
                />
                <View style={[styles.modalBadge, { backgroundColor: selectedDeal.badgeColor || Colors.brand.accent }]}>
                  <Text style={styles.modalBadgeText}>{selectedDeal.badge}</Text>
                </View>
              </View>

              {/* Shop Name & Type */}
              <View style={styles.modalShopRow}>
                <Text style={[styles.modalShopName, { color: Colors.brand.accent }]}>
                  {selectedDeal.shopName || 'NearU Partner'}
                </Text>
                {selectedDeal.shopType && (
                  <View style={[styles.shopTypeBadge, { backgroundColor: themeColors.surfaceElevated }]}>
                    <Text style={[styles.shopTypeBadgeText, { color: themeColors.textSecondary }]}>
                      {selectedDeal.shopType}
                    </Text>
                  </View>
                )}
              </View>

              {/* Address if available */}
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

              {/* Valid Dates */}
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

              {/* Description */}
              <Text style={[styles.modalSectionLabel, { color: themeColors.textMuted }]}>Offer Terms & Description</Text>
              <Text style={[styles.modalDesc, { color: themeColors.textSecondary }]}>
                {selectedDeal.description}
              </Text>

              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: Colors.brand.accent }]}
                onPress={() => setSelectedDeal(null)}
              >
                <Text style={styles.modalCloseButtonText}>Close Window</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </CustomModal>

        {/* Bottom safe area spacing adjusted for floating bottom navigation tab bar */}
        <View style={{ height: insets.bottom + 90 }} />
      </ScrollView>
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // ── Navigation Header ──
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navTextGroup: {
    gap: 1,
  },
  navBrand: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // ── Hero Card ──
  heroCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    overflow: 'hidden',
  },
  heroAccentLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 3,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: Colors.brand.accent,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextGroup: {
    flex: 1,
    marginRight: 16,
  },
  heroGreeting: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  heroAvatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  // ── Sections ──
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },

  // ── Carousels ──
  carouselContainer: {
    paddingLeft: 0,
    paddingRight: 20,
  },

  // ── View All Button ──
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Footer CTA ──
  footerSection: {
    marginTop: 32,
  },
  footerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerTextGroup: {
    flex: 1,
    marginRight: 14,
  },
  footerTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  footerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  footerButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },


  //Testimonial
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    backgroundColor: '#2E9EBF',
    width: 20,
  },
  shareBtn: {
    backgroundColor: '#2E9EBF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 16,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalClose: {
    fontSize: 18,
    color: '#94A3B8',
    padding: 4,
  },
  modalGreeting: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 100,
    marginTop: 4,
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#2E9EBF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Deal Modal Styles
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
  shopTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shopTypeBadgeText: {
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
