import React, { useRef } from 'react';
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
} from 'react-native';
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
} from 'lucide-react-native';

import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { NearULogo } from '../../components/NearULogo';
import { SectionHeader } from '../../components/home/SectionHeader';
import { ServiceGridCard } from '../../components/home/ServiceGridCard';
import { DealCard } from '../../components/home/DealCard';
import { TestimonialCard } from '../../components/home/TestimonialCard';
import { HotDeal, Testimonial } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Mock Data ──────────────────────────────────────────────────────────────

const SERVICES = [
  {
    id: 'food',
    label: 'Food',
    iconName: 'food',
    badge: '12 shops',
    color: '#E05638',
  },
  {
    id: 'rides',
    label: 'Rides',
    iconName: 'rides',
    badge: '8 active',
    color: '#2E9EBF',
  },
  {
    id: 'accommodation',
    label: 'Stays',
    iconName: 'accommodation',
    badge: '24 listed',
    color: '#10B981',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    iconName: 'jobs',
    badge: '6 new',
    color: '#8B5CF6',
  },
  {
    id: 'gifts',
    label: 'Gifts',
    iconName: 'gifts',
    color: '#EC4899',
  },
  {
    id: 'deals',
    label: 'Deals',
    iconName: 'deals',
    badge: 'Hot',
    color: '#F59E0B',
  },
];

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  food: <UtensilsCrossed size={24} color="#E05638" />,
  rides: <Bike size={24} color="#2E9EBF" />,
  accommodation: <Hotel size={24} color="#10B981" />,
  jobs: <BriefcaseBusiness size={24} color="#8B5CF6" />,
  gifts: <Gift size={24} color="#EC4899" />,
  deals: <Tag size={24} color="#F59E0B" />,
};

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
            <NearULogo size={36} />
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

        {/* ── Hero Greeting Card ── */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: systemTheme === 'light'
                ? '#F0F9FC'
                : 'rgba(46, 158, 191, 0.08)',
              borderColor: systemTheme === 'light'
                ? 'rgba(46, 158, 191, 0.15)'
                : 'rgba(46, 158, 191, 0.12)',
            },
          ]}
        >
          {/* Decorative accent gradient line */}
          <View style={styles.heroAccentLine} />
          <View style={styles.heroContent}>
            <View style={styles.heroTextGroup}>
              <Text style={[styles.heroGreeting, { color: themeColors.textSecondary }]}>
                {greeting} 👋
              </Text>
              <Text style={[styles.heroName, { color: themeColors.text }]}>
                {firstName}
              </Text>
              <Text style={[styles.heroSubtitle, { color: themeColors.textMuted }]}>
                What would you like to explore today?
              </Text>
            </View>
            <View
              style={[
                styles.heroAvatarContainer,
                { backgroundColor: Colors.brand.accent },
              ]}
            >
              <Text style={styles.heroAvatarText}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Quick Services Grid ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Explore Services"
            subtitle="Quick access to campus essentials"
            icon={<Sparkles size={20} color={Colors.brand.accent} />}
          />
          <View style={styles.servicesGrid}>
            {SERVICES.map((service) => (
              <ServiceGridCard
                key={service.id}
                icon={SERVICE_ICONS[service.iconName]}
                label={service.label}
                badge={service.badge}
                color={service.color}
                onPress={() => {
                  // Navigation placeholder — will connect to actual screens
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

        {/* Bottom safe area spacing */}
        <View style={{ height: insets.bottom + 20 }} />
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
    marginHorizontal: -6,
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
});
