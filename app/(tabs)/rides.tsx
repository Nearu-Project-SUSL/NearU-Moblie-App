import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  useColorScheme, 
  Pressable,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { HapticService } from '../../services/HapticService';
import { Bike, Navigation, Calendar, Search, MapPin, Clock, Star, DollarSign, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import RiderActiveRide from '../../components/rider/RiderActiveRide';
import BusinessMenuManager from '../../components/business/BusinessMenuManager';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function RidesTabScreen() {
  const { user } = useAuth();

  if (user?.role === 'Rider') {
    return <RiderActiveRide />;
  }

  if (user?.role === 'Business') {
    return <BusinessMenuManager />;
  }

  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('Quick Tuk-Tuk');
  const [isSearching, setIsSearching] = useState(false);

  const vehicles = [
    { type: 'Eco Bike', time: '2 mins away', rate: 'Rs. 50/km', icon: Bike, description: 'Commute cleanly & quickly' },
    { type: 'Quick Tuk-Tuk', time: '3 mins away', rate: 'Rs. 120/km', icon: Navigation, description: 'Standard fast campus ride' },
    { type: 'Faculty Shuttle', time: '10 mins away', rate: 'Free (Campus)', icon: Calendar, description: 'Hourly faculty runs' },
  ];

  const handleRequestRide = () => {
    if (!pickup || !destination) {
      HapticService.triggerError();
      alert('Please enter pickup and destination points');
      return;
    }
    HapticService.triggerSuccess();
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      HapticService.triggerSuccess();
      alert('Ride request sent! Nimal Silva (Tuk-Tuk ST-4409) is on his way to ' + pickup);
    }, 2500);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.surface }]}>
        <Text style={[styles.headerTitle, { color: Colors.brand.accent }]}>NearU Rides</Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
          Premium campus commutes at Sabragamuwa
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* Booking Form Card */}
        <View style={[styles.formCard, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.formTitle, { color: themeColors.text }]}>Book a Campus Ride</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Pickup Location</Text>
            <View style={[styles.inputWrapper, { borderColor: themeColors.border }]}>
              <MapPin size={16} color={Colors.brand.accent} style={styles.inputIcon} />
              <TextInput
                value={pickup}
                onChangeText={setPickup}
                placeholder="e.g. SUSL Main Gate or hostel block"
                placeholderTextColor={themeColors.textMuted}
                style={[styles.textInput, { color: themeColors.text }]}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Destination</Text>
            <View style={[styles.inputWrapper, { borderColor: themeColors.border }]}>
              <Navigation size={16} color="#EC4899" style={styles.inputIcon} />
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="e.g. Computing Faculty or Belihuloya"
                placeholderTextColor={themeColors.textMuted}
                style={[styles.textInput, { color: themeColors.text }]}
              />
            </View>
          </View>

          {/* Vehicle Selector Chips */}
          <Text style={[styles.inputLabel, { color: themeColors.textSecondary, marginTop: 8 }]}>Select Ride Style</Text>
          <View style={styles.vehiclesContainer}>
            {vehicles.map((v) => (
              <Pressable
                key={v.type}
                onPress={() => {
                  HapticService.triggerSelection();
                  setSelectedVehicle(v.type);
                }}
                style={[
                  styles.vehicleChip,
                  {
                    borderColor: selectedVehicle === v.type ? Colors.brand.accent : themeColors.border,
                    backgroundColor: selectedVehicle === v.type ? 'rgba(46,158,191,0.08)' : 'transparent',
                  }
                ]}
              >
                <v.icon size={16} color={selectedVehicle === v.type ? Colors.brand.accent : themeColors.textSecondary} />
                <Text style={[styles.vehicleChipText, { color: themeColors.text, fontWeight: selectedVehicle === v.type ? '700' : '500' }]}>
                  {v.type}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable 
            onPress={handleRequestRide}
            style={[styles.requestBtn, { backgroundColor: Colors.brand.accent }]}
          >
            <Text style={styles.requestBtnText}>{isSearching ? 'Connecting Drivers...' : 'Request Commute'}</Text>
            {!isSearching && <Send size={14} color="#000000" />}
          </Pressable>
        </View>

        {/* Map Mockup Area */}
        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 22 }]}>Live Drivers Nearby</Text>
        <View style={[styles.mapMock, { backgroundColor: systemTheme === 'light' ? '#E2E8F0' : '#1E293B', borderColor: themeColors.border }]}>
          <LinearGradient
            colors={['rgba(46,158,191,0.18)', 'rgba(46,158,191,0.03)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.mapPinIndicator, { backgroundColor: Colors.brand.accent }]}>
            <Navigation size={14} color="#000000" />
          </View>
          {/* Mock secondary drivers */}
          <View style={[styles.mapPinIndicatorSecondary, { top: 40, left: 80 }]}>
            <Bike size={12} color="#FFFFFF" />
          </View>
          <View style={[styles.mapPinIndicatorSecondary, { bottom: 30, right: 90 }]}>
            <Navigation size={12} color="#FFFFFF" />
          </View>
          <Text style={[styles.mapText, { color: themeColors.textSecondary }]}>3 Commutes Available on Campus</Text>
        </View>

        {/* Active Drivers List */}
        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 22 }]}>Vetted Drivers</Text>
        {[
          { name: 'Nimal Silva', rating: 4.9, rides: '420 rides', status: 'Available', type: 'Quick Tuk-Tuk (ST-4409)', rate: 'Rs. 120/km' },
          { name: 'Sameera Bandara', rating: 4.8, rides: '180 rides', status: 'Available', type: 'Eco Bike (BK-8832)', rate: 'Rs. 50/km' },
        ].map((driver, index) => (
          <View key={index} style={[styles.driverCard, { backgroundColor: systemTheme === 'light' ? '#FFFFFF' : themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.driverHeader}>
              <View>
                <Text style={[styles.driverName, { color: themeColors.text }]}>{driver.name}</Text>
                <Text style={{ color: themeColors.textSecondary, fontSize: 11, marginTop: 1 }}>{driver.type}</Text>
              </View>
              <Text style={{ color: Colors.brand.accent, fontWeight: '800', fontSize: 13 }}>{driver.rate}</Text>
            </View>
            <View style={styles.driverMeta}>
              <View style={styles.ratingRow}>
                <Star size={13} color="#FBBF24" fill="#FBBF24" />
                <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>{driver.rating}</Text>
                <Text style={{ color: themeColors.textMuted, fontSize: 11 }}>({driver.rides})</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusIndicator} />
                <Text style={{ color: themeColors.success, fontSize: 11, fontWeight: '700' }}>{driver.status}</Text>
              </View>
            </View>
          </View>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  vehiclesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 6,
  },
  vehicleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    height: 38,
  },
  vehicleChipText: {
    fontSize: 10,
  },
  requestBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  requestBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  mapMock: {
    height: 140,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  mapPinIndicatorSecondary: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.75,
  },
  mapText: {
    fontSize: 11,
    fontWeight: '700',
  },
  driverCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
  },
  driverMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.08)',
    paddingTop: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
});
