import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  TextInput,
  Dimensions,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  MapPin,
  Clock,
  Star,
  Plus,
  Bike,
  Navigation,
  DollarSign,
  Heart,
  Calendar,
  Briefcase,
  Copy,
  Check,
  Send,
  ShoppingBag,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { HapticService } from '../../services/HapticService';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Service Details Mock Data ──────────────────────────────────────────────

const SERVICE_META: Record<string, { title: string; subtitle: string; themeColor: string; bgImage: any }> = {
  food: {
    title: 'Food Shops',
    subtitle: 'Details about food vendors managed by shop owners',
    themeColor: '#E05638',
    bgImage: require('../../assets/food_service.png'),
  },
  rides: {
    title: 'Uni Rides',
    subtitle: 'Safe, affordable campus commutes',
    themeColor: '#2E9EBF',
    bgImage: require('../../assets/rides_service.png'),
  },
  accommodation: {
    title: 'Accommodations',
    subtitle: 'Vetted student boarding houses & rooms',
    themeColor: '#10B981',
    bgImage: require('../../assets/stays_service.png'),
  },
  jobs: {
    title: 'Jobs & Gigs',
    subtitle: 'Student-friendly part-time opportunities',
    themeColor: '#8B5CF6',
    bgImage: require('../../assets/job_service.png'),
  },
  gifts: {
    title: 'Gift Shops',
    subtitle: 'Send custom surprises & flowers',
    themeColor: '#EC4899',
    bgImage: require('../../assets/gift_service.png'),
  },
  deals: {
    title: 'Deals Vault',
    subtitle: 'Exclusive student saving vaults',
    themeColor: '#F59E0B',
    bgImage: require('../../assets/offer_service.png'),
  },
  transport: {
    title: 'Transport Hub',
    subtitle: 'Public bus schedules & Tuk-Tuk numbers',
    themeColor: '#0F4C81',
    bgImage: require('../../assets/transport_service.png'),
  },
  'bike-rentals': {
    title: 'Bike Rentals',
    subtitle: 'Rent eco-friendly bicycles around university',
    themeColor: '#84CC16',
    bgImage: require('../../assets/bike_service.png'),
  },
};

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams() as { id: string };
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();
  
  const service = SERVICE_META[id] || {
    title: 'NearU Service',
    subtitle: 'Connecting your campus marketplace',
    themeColor: Colors.brand.accent,
    bgImage: require('../../assets/food_service.png'),
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedSubService, setSelectedSubService] = useState<string | null>(null);

  // Scratch card state (for Deals screen)
  const [scratched, setScratched] = useState(false);

  const backScale = useRef(new Animated.Value(1)).current;

  const handleBackPressIn = () => {
    Animated.spring(backScale, {
      toValue: 0.88,
      useNativeDriver: true,
    }).start();
  };

  const handleBackPressOut = () => {
    Animated.spring(backScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const copyToClipboard = () => {
    HapticService.triggerSuccess();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Full-bleed Header Banner */}
      <View style={styles.bannerContainer}>
        <Image source={service.bgImage} style={styles.bannerImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', themeColors.background]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Safe Area back button */}
        <Animated.View style={[styles.backButtonContainer, { paddingTop: insets.top + 8, transform: [{ scale: backScale }] }]}>
          <Pressable
            onPress={() => {
              HapticService.triggerSelection();
              router.back();
            }}
            onPressIn={handleBackPressIn}
            onPressOut={handleBackPressOut}
            style={[styles.backButton, { backgroundColor: systemTheme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)' }]}
          >
            <ArrowLeft size={20} color={themeColors.text} />
          </Pressable>
        </Animated.View>

        {/* Title overlay block */}
        <View style={styles.titleOverlay}>
          <Text style={styles.bannerTitle}>{service.title}</Text>
          <Text style={styles.bannerSubtitle}>{service.subtitle}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}>
          <Search size={18} color={themeColors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${service.title.toLowerCase()}...`}
            placeholderTextColor={themeColors.textMuted}
            style={[styles.searchInput, { color: themeColors.text }]}
          />
        </View>

        {/* ── CONDITIONAL RENDER PER SERVICE ID ── */}

        {/* 1. FOOD SERVICE PAGE */}
        {id === 'food' && (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Popular Campus Vendors</Text>
            
            {[
              { name: 'Sabra Canteen', rating: 4.8, distance: '200m', time: '10-15 mins', description: 'Famous for hot rice and curry, and short eats.', tags: ['Rice', 'Short Eats'] },
              { name: 'Student Hub Cafe', rating: 4.6, distance: '400m', time: '15-20 mins', description: 'Fresh juices, iced coffee, and bubble teas.', tags: ['Drinks', 'Snacks'] },
              { name: 'Faculty Club Diner', rating: 4.9, distance: '150m', time: '8-12 mins', description: 'Premium sandwiches, wraps and fresh salads.', tags: ['Healthy', 'Sandwich'] },
            ].map((vendor, index) => (
              <Pressable 
                key={index}
                onPress={() => {
                  HapticService.triggerTap();
                  setSelectedSubService(vendor.name);
                }}
                style={[styles.vendorCard, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}
              >
                <View style={styles.vendorHeader}>
                  <Text style={[styles.vendorName, { color: themeColors.text }]}>{vendor.name}</Text>
                  <View style={styles.ratingRow}>
                    <Star size={14} color="#FBBF24" fill="#FBBF24" />
                    <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>{vendor.rating}</Text>
                  </View>
                </View>
                <Text style={[styles.vendorDesc, { color: themeColors.textSecondary }]}>{vendor.description}</Text>
                
                <View style={styles.vendorStats}>
                  <View style={styles.statItem}>
                    <MapPin size={12} color={themeColors.textMuted} />
                    <Text style={[styles.statText, { color: themeColors.textMuted }]}>{vendor.distance}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Clock size={12} color={themeColors.textMuted} />
                    <Text style={[styles.statText, { color: themeColors.textMuted }]}>{vendor.time}</Text>
                  </View>
                </View>

                {/* Sub items picker widget for checkout mockup */}
                {selectedSubService === vendor.name && (
                  <View style={styles.orderPickerContainer}>
                    <Text style={[styles.orderPickerTitle, { color: service.themeColor }]}>Fast Checkout Mockup</Text>
                    {[
                      { item: 'Special Chicken Curry Rice', price: 'Rs. 450' },
                      { item: 'Samosa & Roll Plate', price: 'Rs. 180' }
                    ].map((foodItem, fIdx) => (
                      <Pressable 
                        key={fIdx}
                        onPress={() => HapticService.triggerSuccess()}
                        style={styles.foodOrderItem}
                      >
                        <Text style={{ color: themeColors.text, fontWeight: '600' }}>{foodItem.item}</Text>
                        <View style={[styles.addPriceBtn, { backgroundColor: service.themeColor }]}>
                          <Text style={{ color: '#000000', fontWeight: '800', fontSize: 12 }}>{foodItem.price} +</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* 2. RIDES SERVICE PAGE */}
        {id === 'rides' && (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Campus Commutes</Text>
            
            {/* Map Mockup Area */}
            <View style={[styles.mapMock, { backgroundColor: systemTheme === 'light' ? '#E2E8F0' : '#1E293B', borderColor: themeColors.border }]}>
              <LinearGradient
                colors={['rgba(46,158,191,0.15)', 'rgba(46,158,191,0.02)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[styles.mapPinIndicator, { backgroundColor: service.themeColor }]}>
                <Navigation size={14} color="#000000" />
              </View>
              <Text style={[styles.mapText, { color: themeColors.textSecondary }]}>Active Tuk-Tuks / Bikes Nearby</Text>
            </View>

            {[
              { type: 'Eco Bike', time: '2 mins away', rate: 'Rs. 50/km', driver: 'Self Ride', icon: Bike },
              { type: 'Quick Tuk-Tuk', time: '3 mins away', rate: 'Rs. 120/km', driver: 'Nimal Silva', icon: Navigation },
              { type: 'Faculty Shuttle', time: '10 mins away', rate: 'Free (Campus)', driver: 'Uni Transport', icon: Calendar },
            ].map((ride, index) => (
              <Pressable 
                key={index}
                onPress={() => {
                  HapticService.triggerTap();
                  setSelectedSubService(ride.type);
                }}
                style={[styles.vendorCard, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}
              >
                <View style={styles.vendorHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.rideIconBg, { backgroundColor: service.themeColor + '1C' }]}>
                      <ride.icon size={18} color={service.themeColor} />
                    </View>
                    <Text style={[styles.vendorName, { color: themeColors.text }]}>{ride.type}</Text>
                  </View>
                  <Text style={[styles.rideRate, { color: service.themeColor }]}>{ride.rate}</Text>
                </View>
                <View style={styles.vendorStats}>
                  <Text style={{ color: themeColors.textSecondary, fontSize: 12 }}>Driver: {ride.driver}</Text>
                  <Text style={{ color: themeColors.textMuted, fontSize: 12 }}>• {ride.time}</Text>
                </View>

                {selectedSubService === ride.type && (
                  <Pressable 
                    onPress={() => HapticService.triggerSuccess()}
                    style={[styles.bookingConfirmBtn, { backgroundColor: service.themeColor }]}
                  >
                    <Text style={styles.bookingConfirmText}>Request {ride.type} Now</Text>
                  </Pressable>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* 3. ACCOMMODATION SERVICE PAGE */}
        {id === 'accommodation' && (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Verified Boardings & Rooms</Text>
            
            {[
              { title: 'Oak Crest Student boarding', type: 'Single Room', rent: 'Rs. 12,000/mo', location: 'Pambahinna Junction', rating: 4.8, distance: '300m to faculty' },
              { title: 'Green Oasis Hostel', type: 'Shared Room (3 beds)', rent: 'Rs. 6,500/mo', location: 'Belihuloya Town', rating: 4.6, distance: '1.2km to faculty' },
              { title: 'Hillside Manor Annex', type: 'Full Annex (2 rooms)', rent: 'Rs. 25,000/mo', location: 'Kumbalgama Road', rating: 4.9, distance: '800m to faculty' },
            ].map((room, index) => (
              <Pressable
                key={index}
                onPress={() => HapticService.triggerTap()}
                style={[styles.vendorCard, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}
              >
                <View style={styles.vendorHeader}>
                  <Text style={[styles.vendorName, { color: themeColors.text }]}>{room.title}</Text>
                  <View style={styles.ratingRow}>
                    <Star size={14} color="#FBBF24" fill="#FBBF24" />
                    <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>{room.rating}</Text>
                  </View>
                </View>
                <Text style={{ color: service.themeColor, fontWeight: '700', fontSize: 13, marginTop: 2 }}>{room.rent}</Text>
                
                <View style={[styles.vendorStats, { marginTop: 6 }]}>
                  <Text style={{ color: themeColors.textSecondary, fontSize: 12 }}>{room.type} • {room.location}</Text>
                </View>
                <View style={styles.vendorStats}>
                  <MapPin size={12} color={themeColors.textMuted} />
                  <Text style={[styles.statText, { color: themeColors.textMuted }]}>{room.distance}</Text>
                </View>

                <View style={styles.roomActions}>
                  <Pressable 
                    onPress={() => HapticService.triggerSelection()}
                    style={[styles.roomBtn, { borderColor: themeColors.border }]}
                  >
                    <Heart size={14} color="#EF4444" />
                    <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: '600' }}>Save</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => HapticService.triggerSuccess()}
                    style={[styles.roomBtnPrimary, { backgroundColor: service.themeColor }]}
                  >
                    <Text style={{ color: '#000000', fontSize: 12, fontWeight: '800' }}>Call Host</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* 4. JOBS SERVICE PAGE */}
        {id === 'jobs' && (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Active Campus Gigs</Text>
            
            {[
              { role: 'Computer Lab Assistant', dept: 'Faculty of Computing', pay: 'Rs. 500/hr', hours: '12 hrs/week', tag: 'Academic' },
              { role: 'Content Writer Helper', dept: 'Student Union Hub', pay: 'Rs. 4,000/gig', hours: 'Flexible', tag: 'Creative' },
              { role: 'Campus Cafe Barista', dept: 'Central Canteen', pay: 'Rs. 350/hr + Meals', hours: '15 hrs/week', tag: 'Service' },
            ].map((gig, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  HapticService.triggerTap();
                  setSelectedSubService(gig.role);
                }}
                style={[styles.vendorCard, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}
              >
                <View style={styles.vendorHeader}>
                  <Text style={[styles.vendorName, { color: themeColors.text }]}>{gig.role}</Text>
                  <View style={[styles.gigTag, { backgroundColor: service.themeColor + '1F' }]}>
                    <Text style={[styles.gigTagText, { color: service.themeColor }]}>{gig.tag}</Text>
                  </View>
                </View>
                <Text style={{ color: themeColors.textSecondary, fontSize: 12, marginTop: 2 }}>{gig.dept}</Text>
                
                <View style={[styles.vendorStats, { marginTop: 10 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <DollarSign size={13} color={themeColors.textSecondary} />
                    <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: '600' }}>{gig.pay}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} color={themeColors.textMuted} />
                    <Text style={{ color: themeColors.textMuted, fontSize: 12 }}>{gig.hours}</Text>
                  </View>
                </View>

                {selectedSubService === gig.role && (
                  <Pressable 
                    onPress={() => {
                      HapticService.triggerSuccess();
                      alert('Application submitted! Department reviewer will contact you.');
                    }}
                    style={[styles.bookingConfirmBtn, { backgroundColor: service.themeColor }]}
                  >
                    <Text style={styles.bookingConfirmText}>Apply Instantly</Text>
                  </Pressable>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* 5. GIFTS SERVICE PAGE */}
        {id === 'gifts' && (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Send Custom Surprises</Text>
            
            <View style={[styles.giftSelectionBox, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={{ color: themeColors.text, fontWeight: '700', marginBottom: 12 }}>Select surprise template:</Text>
              
              <View style={styles.giftGrid}>
                {[
                  { name: 'Red Rose Bouquet', price: 'Rs. 1,500' },
                  { name: 'Belgian Chocolate Box', price: 'Rs. 2,400' },
                  { name: 'Birthday Cake Slice', price: 'Rs. 600' },
                  { name: 'Handwritten Card Only', price: 'Rs. 250' }
                ].map((giftItem, gIdx) => (
                  <Pressable
                    key={gIdx}
                    onPress={() => {
                      HapticService.triggerSelection();
                      setSelectedSubService(giftItem.name);
                    }}
                    style={[styles.giftGridItem, { 
                      borderColor: selectedSubService === giftItem.name ? service.themeColor : themeColors.border,
                      backgroundColor: selectedSubService === giftItem.name ? service.themeColor + '10' : 'transparent'
                    }]}
                  >
                    <Text style={{ color: themeColors.text, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{giftItem.name}</Text>
                    <Text style={{ color: service.themeColor, fontSize: 11, fontWeight: '700', marginTop: 4 }}>{giftItem.price}</Text>
                  </Pressable>
                ))}
              </View>

              {selectedSubService && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Write your greeting card note:</Text>
                  <TextInput
                    placeholder="Happy Birthday my dear friend! Best wishes..."
                    placeholderTextColor={themeColors.textMuted}
                    multiline
                    numberOfLines={3}
                    style={[styles.giftTextArea, { color: themeColors.text, borderColor: themeColors.border }]}
                  />
                  <Pressable
                    onPress={() => HapticService.triggerSuccess()}
                    style={[styles.bookingConfirmBtn, { backgroundColor: service.themeColor, marginTop: 12 }]}
                  >
                    <Text style={styles.bookingConfirmText}>Send Surprise package</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 6. DEALS SERVICE PAGE */}
        {id === 'deals' && (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Active Savings Code</Text>
            
            <View style={[styles.vendorCard, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}>
              <View style={styles.vendorHeader}>
                <Text style={[styles.vendorName, { color: themeColors.text }]}>Campus Canteen Voucher</Text>
                <View style={[styles.gigTag, { backgroundColor: '#EF44441C' }]}>
                  <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>30% OFF</Text>
                </View>
              </View>
              <Text style={[styles.vendorDesc, { color: themeColors.textSecondary, marginTop: 4 }]}>
                Valid on all meals at primary campus canteens. Limited to 1 checkout per user.
              </Text>

              {/* Elegant code copier */}
              <View style={[styles.codeBox, { backgroundColor: systemTheme === 'light' ? '#F1F5F9' : '#0F172A' }]}>
                <Text style={[styles.codeText, { color: themeColors.text }]}>SAB30OFF</Text>
                <Pressable onPress={copyToClipboard} style={styles.copyBtn}>
                  {copiedCode ? <Check size={16} color="#10B981" /> : <Copy size={16} color={themeColors.textSecondary} />}
                </Pressable>
              </View>
            </View>

            {/* Scratch card interactive widget */}
            <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 16 }]}>Daily Scratch Card Deal</Text>
            <Pressable 
              onPress={() => {
                if (!scratched) {
                  HapticService.triggerSuccess();
                  setScratched(true);
                }
              }}
              style={[styles.scratchCardContainer, { borderColor: themeColors.border }]}
            >
              {!scratched ? (
                <LinearGradient
                  colors={[service.themeColor, '#EC4899']}
                  style={StyleSheet.absoluteFillObject}
                >
                  <View style={styles.scratchCover}>
                    <Text style={styles.scratchCoverText}>Tap to Scratch Card 🎁</Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={[styles.scratchedResult, { backgroundColor: systemTheme === 'light' ? '#FFFBEB' : '#1E1B4B' }]}>
                  <Text style={[styles.scratchedTitle, { color: service.themeColor }]}>Congratulations! 🎉</Text>
                  <Text style={[styles.scratchedDesc, { color: themeColors.text }]}>You unlocked free delivery credit on your next Rides commute!</Text>
                  <Text style={styles.scratchedCode}>FREECOMMUTE</Text>
                </View>
              )}
            </Pressable>
          </View>
        )}

        {/* 7. TRANSPORT SERVICE PAGE */}
        {id === 'transport' && (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Public Bus arrival times</Text>
            
            {[
              { name: 'Pambahinna - Balangoda Shuttle', time: '10:15 AM (In 5 mins)', type: 'SUSL Student Bus', route: 'Via Main Campus Canteen' },
              { name: 'Colombo - Badulla Express', time: '10:30 AM (In 20 mins)', type: 'CTB Long Distance Bus', route: 'Pambahinna Junction Stop' },
              { name: 'Belihuloya Town circular', time: '10:45 AM (In 35 mins)', type: 'Private Shuttle Bus', route: 'Via hostels block A-F' },
            ].map((bus, index) => (
              <View 
                key={index} 
                style={[styles.vendorCard, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}
              >
                <View style={styles.vendorHeader}>
                  <Text style={[styles.vendorName, { color: themeColors.text }]}>{bus.name}</Text>
                  <View style={[styles.gigTag, { backgroundColor: service.themeColor + '1C' }]}>
                    <Text style={{ color: service.themeColor, fontSize: 10, fontWeight: '800' }}>{bus.time}</Text>
                  </View>
                </View>
                <Text style={{ color: themeColors.textSecondary, fontSize: 12, marginTop: 4 }}>{bus.type} • {bus.route}</Text>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 16 }]}>Campus Tuk-Tuks Directory</Text>
            {[
              { name: 'Nimal Silva', number: '0712345678', vehicle: 'Tuk-Tuk ST-4409', rating: 4.9, activeZone: 'Computing Faculty Stop' },
              { name: 'Sameera Bandara', number: '0779876543', vehicle: 'Tuk-Tuk ST-8832', rating: 4.8, activeZone: 'SUSL Main Gate Hub' },
              { name: 'Upul Perera', number: '0754433221', vehicle: 'Tuk-Tuk ST-1102', rating: 4.7, activeZone: 'Library & Hostel Stop' },
            ].map((driver, index) => (
              <Pressable 
                key={index} 
                onPress={() => HapticService.triggerSuccess()}
                style={[styles.vendorCard, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}
              >
                <View style={styles.vendorHeader}>
                  <View>
                    <Text style={[styles.vendorName, { color: themeColors.text }]}>{driver.name}</Text>
                    <Text style={{ color: themeColors.textSecondary, fontSize: 11, marginTop: 1 }}>{driver.vehicle}</Text>
                  </View>
                  <View style={styles.ratingRow}>
                    <Star size={13} color="#FBBF24" fill="#FBBF24" />
                    <Text style={{ color: themeColors.textSecondary, fontSize: 12, fontWeight: '700' }}>{driver.rating}</Text>
                  </View>
                </View>
                <View style={[styles.vendorStats, { justifyContent: 'space-between', marginTop: 10 }]}>
                  <Text style={{ color: themeColors.textMuted, fontSize: 11 }}>Zone: {driver.activeZone}</Text>
                  <Text style={{ color: Colors.brand.accent, fontWeight: '800', fontSize: 12 }}>Call: {driver.number}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* 8. BIKE RENTALS SERVICE PAGE */}
        {id === 'bike-rentals' && (
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Available Rental Stands</Text>
            
            {[
              { stand: 'Computing Faculty Dock', bikes: '6 bikes', rate: 'Rs. 50/hr', active: 'Smart Lock active' },
              { stand: 'SUSL Main Gate Dock', bikes: '3 bikes', rate: 'Rs. 50/hr', active: 'Smart Lock active' },
              { stand: 'Central Library Stand', bikes: '0 bikes (Empty)', rate: 'Rs. 50/hr', active: 'Restocking soon' },
            ].map((stand, index) => (
              <Pressable 
                key={index}
                onPress={() => {
                  if (stand.bikes !== '0 bikes (Empty)') {
                    HapticService.triggerSelection();
                    setSelectedSubService(stand.stand);
                  }
                }}
                style={[styles.vendorCard, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}
              >
                <View style={styles.vendorHeader}>
                  <Text style={[styles.vendorName, { color: themeColors.text }]}>{stand.stand}</Text>
                  <Text style={{ color: service.themeColor, fontWeight: '800', fontSize: 13 }}>{stand.rate}</Text>
                </View>
                <View style={[styles.vendorStats, { justifyContent: 'space-between', marginTop: 8 }]}>
                  <Text style={{ color: stand.bikes.includes('Empty') ? '#EF4444' : themeColors.success, fontSize: 12, fontWeight: '700' }}>{stand.bikes}</Text>
                  <Text style={{ color: themeColors.textMuted, fontSize: 11 }}>{stand.active}</Text>
                </View>

                {selectedSubService === stand.stand && (
                  <View style={styles.orderPickerContainer}>
                    <Text style={{ color: service.themeColor, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>Tap to unlock bike</Text>
                    <Pressable 
                      onPress={() => {
                        HapticService.triggerSuccess();
                        alert('Smart Bike unlocked! Lock Code: 7739. Safe commute!');
                      }}
                      style={[styles.bookingConfirmBtn, { backgroundColor: service.themeColor }]}
                    >
                      <Text style={styles.bookingConfirmText}>Unlock Smart Bike #BK-7739</Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 20,
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
  },
  detailSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  vendorCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  vendorDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  vendorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderPickerContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.12)',
    paddingTop: 12,
    gap: 8,
  },
  orderPickerTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  foodOrderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  addPriceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mapMock: {
    height: 140,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
    overflow: 'hidden',
  },
  mapPinIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rideIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideRate: {
    fontSize: 13,
    fontWeight: '800',
  },
  bookingConfirmBtn: {
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  bookingConfirmText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
  roomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  roomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    flex: 1,
  },
  roomBtnPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    flex: 1.2,
  },
  gigTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gigTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  giftSelectionBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  giftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -4,
  },
  giftGridItem: {
    flexBasis: '47%',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftTextArea: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 60,
  },
  codeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
    marginTop: 12,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  copyBtn: {
    padding: 6,
  },
  scratchCardContainer: {
    height: 150,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  scratchCover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scratchCoverText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  scratchedResult: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scratchedTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  scratchedDesc: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.8,
  },
  scratchedCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
