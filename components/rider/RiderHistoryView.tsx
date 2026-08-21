import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  useColorScheme,
  Pressable
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../Card';
import { riderService, RideHistoryItem } from '../../services/riderService';
import { Bike, MapPin, Clock, Star, Landmark } from 'lucide-react-native';

export default function RiderHistoryView() {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const [history, setHistory] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await riderService.getRideHistory(1, 30);
      if (res.success && res.data) {
        setHistory(res.data.items || []);
      }
    } catch (e) {
      console.log('Error loading ride history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  if (loading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Ride Log History</Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
          Completed campus commutes & deliveries
        </Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Card variant="bordered" style={styles.emptyCard} padding="large">
            <Bike size={32} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              No rides completed yet.
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card variant="elevated" style={styles.historyCard} padding="medium">
            <View style={styles.cardHeader}>
              <View style={[styles.rideIconBg, { backgroundColor: themeColors.primaryLight }]}>
                <Bike size={18} color={themeColors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.locationRow}>
                  <MapPin size={12} color={Colors.brand.accent} style={{ marginRight: 6 }} />
                  <Text style={[styles.locationText, { color: themeColors.text }]} numberOfLines={1}>
                    {item.pickupLocation}
                  </Text>
                </View>
                <View style={[styles.locationRow, { marginTop: 4 }]}>
                  <MapPin size={12} color={themeColors.danger} style={{ marginRight: 6 }} />
                  <Text style={[styles.locationText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                    {item.dropoffLocation}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

            <View style={styles.cardFooter}>
              <View style={styles.metaRow}>
                <Clock size={12} color={themeColors.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                  {new Date(item.createdAt).toLocaleDateString()} at{' '}
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              
              <View style={styles.priceCol}>
                <Text style={[styles.priceText, { color: themeColors.text }]}>Rs. {item.fareAmount}</Text>
                {item.rating && (
                  <View style={styles.ratingRow}>
                    <Star size={11} color={themeColors.warning} fill={themeColors.warning} style={{ marginRight: 2 }} />
                    <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>{item.rating}</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 120,
    gap: 12,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  historyCard: {
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
