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
import { TestimonialCard } from '../../components/home/TestimonialCard';
import { HotDeal, Testimonial } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';

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
    id: 'deals',
    label: 'Deals Vault',
    description: 'Exclusive student savings',
    image: require('../../assets/offer_service.png'),
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

const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test_1',
    userName: 'Kasun Perera',
    userInitial: 'K',
    message: 'NearU completely changed how I find food on campus. No more walking to the canteen in the rain — the riders bring it right to my faculty!',
    rating: 5,
    createdAt: '2 days ago',
  },
  {
    id: 'test_2',
    userName: 'Nimali Fernando',
    userInitial: 'N',
    message: 'Found my boarding room through NearU within a day. The verified reviews from fellow students really helped me feel confident about my choice.',
    rating: 5,
    createdAt: '1 week ago',
  },
  {
    id: 'test_3',
    userName: 'Malith Jayasuriya',
    userInitial: 'M',
    message: 'The ride-sharing feature is genius. We split the taxi cost three ways and it works out cheaper than the bus. Love this app!',
    rating: 4,
    createdAt: '3 days ago',
  },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const firstName = user?.firstName || 'Student';
  const greeting = getGreeting();

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
                  HapticService.triggerSelection();
                  router.push(`/service/${service.id}`);
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
              <Pressable style={styles.viewAllButton}>
                <Text style={[styles.viewAllText, { color: Colors.brand.accent }]}>
                  View All
                </Text>
                <ChevronRight size={14} color={Colors.brand.accent} />
              </Pressable>
            }
          />
          <FlatList
            data={HOT_DEALS}
            renderItem={({ item }) => <DealCard deal={item} />}
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
          <FlatList
            data={TESTIMONIALS}
            renderItem={({ item }) => <TestimonialCard testimonial={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          />
        </View>

        {/* ── Share CTA Footer ── */}
        <View style={[styles.section, styles.footerSection]}>
          <View
            style={[
              styles.footerCard,
              {
                backgroundColor: systemTheme === 'light'
                  ? Colors.brand.accent
                  : 'rgba(46, 158, 191, 0.15)',
                borderColor: systemTheme === 'light'
                  ? 'transparent'
                  : 'rgba(46, 158, 191, 0.2)',
              },
            ]}
          >
            <View style={styles.footerTextGroup}>
              <Text
                style={[
                  styles.footerTitle,
                  {
                    color: systemTheme === 'light' ? '#FFFFFF' : Colors.brand.accent,
                  },
                ]}
              >
                Enjoying NearU? ✨
              </Text>
              <Text
                style={[
                  styles.footerSubtitle,
                  {
                    color: systemTheme === 'light'
                      ? 'rgba(255,255,255,0.85)'
                      : themeColors.textSecondary,
                  },
                ]}
              >
                Share your experience and help fellow students discover campus services.
              </Text>
            </View>
            <Pressable
              style={[
                styles.footerButton,
                {
                  backgroundColor: systemTheme === 'light'
                    ? 'rgba(255,255,255,0.2)'
                    : Colors.brand.accent,
                },
              ]}
            >
              <Text
                style={[
                  styles.footerButtonText,
                  { color: '#FFFFFF' },
                ]}
              >
                Share
              </Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

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
});
