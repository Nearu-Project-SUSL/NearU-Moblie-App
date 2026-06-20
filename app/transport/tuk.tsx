import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, useColorScheme, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, MapPin } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import axios from 'axios';

interface TukTukDriver {
  id: number;
  name: string;
  phoneNumber: string;
  plateNumber: string;
  operatingArea?: string;
  notes?: string;
}

export default function TukTukListScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [drivers, setDrivers] = useState<TukTukDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/tuktukdrivers');
        setDrivers(res.data);
        setError(null);
      } catch (err) {
        console.error('Failed to load tuk tuk drivers:', err);
        setError('Could not load drivers. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.nearuAccent} />
          <Text style={[styles.backText, { color: theme.nearuAccent }]}>Transport</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Tuk Tuk Riders</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Available drivers around campus
        </Text>
      </View>

      {loading && (
        <View style={styles.centerBox}>
          <Text style={{ color: theme.textSecondary }}>Loading drivers...</Text>
        </View>
      )}

      {error && (
        <View style={styles.centerBox}>
          <Text style={{ color: theme.danger }}>{error}</Text>
        </View>
      )}

      {!loading && !error && drivers.length === 0 && (
        <View style={styles.centerBox}>
          <Text style={{ color: theme.textSecondary }}>No tuk tuk drivers available right now.</Text>
        </View>
      )}

      {!loading && !error && drivers.length > 0 && (
        <FlatList
          data={drivers}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceCard, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.cardName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.cardPlate, { color: theme.nearuAccent }]}>
                {item.plateNumber}
              </Text>

              <Pressable
                onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}
                style={styles.row}
              >
                <Phone size={16} color={theme.nearuAccent} />
                <Text style={[styles.rowText, { color: theme.nearuAccent }]}>
                  {item.phoneNumber}
                </Text>
              </Pressable>

              {item.operatingArea && (
                <View style={styles.row}>
                  <MapPin size={16} color={theme.textSecondary} />
                  <Text style={[styles.rowText, { color: theme.textSecondary }]}>
                    {item.operatingArea}
                  </Text>
                </View>
              )}

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
  cardPlate: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rowText: { fontSize: 14 },
  notes: { fontSize: 13, fontStyle: 'italic', marginTop: 4 },
});