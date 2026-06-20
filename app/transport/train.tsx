import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { getTrainRoutes, TrainRouteResponse } from '../../services/transport';

export default function TrainListScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [routes, setRoutes] = useState<TrainRouteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTrainRoutes();
        setRoutes(data);
      } catch (err) {
        console.error('Failed to load train routes:', err);
        setError('Could not load train routes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.nearuAccent} />
          <Text style={[styles.backText, { color: theme.nearuAccent }]}>Transport</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Train Routine</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Inter-city train schedules
        </Text>
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
          <Text style={{ color: theme.textSecondary }}>No train routes available right now.</Text>
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
                {item.startStation} → {item.endStation}
              </Text>
              {item.trainName && (
                <Text style={[styles.trainName, { color: theme.nearuAccent }]}>
                  {item.trainName}
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
    </SafeAreaView>
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
  trainName: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
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
});