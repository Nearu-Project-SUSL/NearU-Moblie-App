import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { getBusRoutes, BusRouteResponse } from '../../services/transport';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BusListScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [routes, setRoutes] = useState<BusRouteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBusRoutes();
        setRoutes(data);
      } catch (err) {
        console.error('Failed to load bus routes:', err);
        setError('Could not load bus routes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.bannerContainer}>
        <Image
          source={require('../../assets/bus.jpg')}
          style={styles.bannerImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.25)', theme.background]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.backButtonContainer, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, {
              backgroundColor: scheme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)',
            }]}
          >
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
        </View>
        <View style={styles.titleOverlay}>
          <Text style={styles.bannerTitle}>Tuk Tuk Riders</Text>
          <Text style={styles.bannerSubtitle}>Available drivers around campus</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.centerBox}>
          <Text style={{ color: theme.textSecondary }}>Loading routes...</Text>
        </View>
      )}

      {error && (
        <View style={styles.centerBox}>
          <Text style={{ color: theme.danger }}>{error}</Text>
        </View>
      )}

      {!loading && !error && routes.length === 0 && (
        <View style={styles.centerBox}>
          <Text style={{ color: theme.textSecondary }}>No bus routes available right now.</Text>
        </View>
      )}

      {!loading && !error && routes.length > 0 && (
        <FlatList
          data={routes}
          keyExtractor={(item, index) => (item.id ?? index).toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceCard, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.cardName, { color: theme.text }]}>{item.routeName}</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                {item.startPoint} → {item.endPoint}
              </Text>
              {item.busNumber && (
                <Text style={[styles.busNumber, { color: theme.nearuAccent }]}>
                  {item.busNumber}
                </Text>
              )}

              <View style={[styles.timeBox, { backgroundColor: theme.nearuAccentLight }]}>
                <Clock size={15} color={theme.nearuAccent} />
                <Text style={[styles.timeText, { color: theme.text }]}>
                  {item.departureTime}
                  {item.arrivalTime ? `  →  ${item.arrivalTime}` : ''}
                </Text>
              </View>

              {item.notes && (
                <Text style={[styles.notes, { color: theme.textMuted }]}>{item.notes}</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontSize: 15, fontWeight: '500' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },
  card: { borderRadius: 18, borderWidth: 1, padding: 18 },
  cardName: { fontSize: 18, fontWeight: '600', marginBottom: 2 },
  cardSub: { fontSize: 14, marginBottom: 4 },
  busNumber: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  timeText: { fontSize: 14, fontWeight: '500' },
  notes: { fontSize: 13, fontStyle: 'italic', marginTop: 8 },
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
});