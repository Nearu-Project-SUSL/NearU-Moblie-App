import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bus, Train, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

type TransportOption = {
  id: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  ButtonIcon: typeof Bus;
  route: '/transport/tuk' | '/transport/bus' | '/transport/train';
  gradientColors: [string, string];
};

export default function TransportSelectionScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const [pressedCard, setPressedCard] = useState<string | null>(null);

  

  const transportOptions: TransportOption[] = [
    {
      id: 'tuk',
      title: 'Tuk Rides',
      description: 'Instant ride-hailing for short distances. Perfect for quick trips between faculties or local hangouts.',
      image: 'https://images.unsplash.com/photo-1607607495455-cae135756707?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      buttonText: 'View Tuk Riders',
      ButtonIcon: ArrowRight,
      route: '/transport/tuk',
      gradientColors: ['rgba(224,86,56,0.18)', 'rgba(46,158,191,0.10)'],
    },
    {
      id: 'bus',
      title: 'Bus Routine',
      description: 'Accurate times on public bus services. Track arrival times and plan ahead.',
      image: 'https://images.unsplash.com/photo-1642443055969-282b3416a333?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      buttonText: 'View Routine',
      ButtonIcon: Bus,
      route: '/transport/bus',
      gradientColors: ['rgba(37,99,235,0.18)', 'rgba(46,158,191,0.10)'],
    },
    {
      id: 'train',
      title: 'Train Routine',
      description: 'Inter-city connections and railway timings. Find the best train to get you home for the weekend.',
      image: 'https://images.unsplash.com/photo-1640687735167-b71c4734e05c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      buttonText: 'Check Times',
      ButtonIcon: Train,
      route: '/transport/train',
      gradientColors: ['rgba(16,185,129,0.18)', 'rgba(46,158,191,0.10)'],
    },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>

      {/* ── Full-bleed Banner Header ── */}
      <View style={styles.bannerContainer}>
        <Image
          source={require('../../assets/transport_service.png')}
          style={styles.bannerImage}
        />
        {/* Dark fade for readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.25)', theme.background]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Floating back button */}
        <View style={[styles.backButtonContainer, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor:
                  scheme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)',
              },
            ]}
          >
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Title block at banner bottom */}
        <View style={styles.titleOverlay}>
          <Text style={styles.bannerTitle}>Transport</Text>
          <Text style={styles.bannerSubtitle}>
            Tuk rides, bus & train schedules — all in one place
          </Text>
        </View>
      </View>

      {/* ── Scrollable card content ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {transportOptions.map((option) => {
            const ButtonIcon = option.ButtonIcon;
            const isPressed = pressedCard === option.id;

            return (
              <Pressable
                key={option.id}
                onPress={() => router.push(option.route)}
                onPressIn={() => setPressedCard(option.id)}
                onPressOut={() => setPressedCard(null)}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.surfaceCard,
                    borderColor: isPressed ? theme.nearuAccent : theme.border,
                  },
                ]}
              >
                <View style={styles.cardImageWrap}>
                  <Image source={{ uri: option.image }} style={styles.cardImage} resizeMode="cover" />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.85)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <LinearGradient colors={option.gradientColors} style={StyleSheet.absoluteFillObject} />
                </View>

                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{option.title}</Text>
                  <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                    {option.description}
                  </Text>

                  <View style={[styles.cardButton, { backgroundColor: theme.nearuAccent }]}>
                    <Text style={styles.cardButtonText}>{option.buttonText}</Text>
                    <ButtonIcon size={20} color="#FFFFFF" />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // ── Banner ──
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
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },

  // ── Scroll content 
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },
  cardsContainer: { gap: 20 },

  // ── Cards 
  card: { borderRadius: 24, borderWidth: 1.5, overflow: 'hidden' },
  cardImageWrap: { height: 180, width: '100%' },
  cardImage: { width: '100%', height: '100%' },
  cardContent: { padding: 20 },
  cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  cardDescription: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  cardButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});