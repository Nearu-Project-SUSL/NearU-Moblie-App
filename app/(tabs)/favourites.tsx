import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  useColorScheme, 
  Pressable 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { HapticService } from '../../services/HapticService';
import { Card } from '../../components/Card';
import { Heart, Star, MapPin, DollarSign, Trash2, ArrowRight } from 'lucide-react-native';

interface FavItem {
  id: string;
  category: 'food' | 'accommodation' | 'jobs' | 'rides';
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  rating?: number;
  location?: string;
}

export default function FavouritesScreen() {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [favourites, setFavourites] = useState<FavItem[]>([
    {
      id: 'fav_1',
      category: 'food',
      title: 'Sabra Canteen',
      subtitle: 'Shop Owner: M. Perera',
      metric: 'Rs. 450',
      metricLabel: 'Rice & Curry Special',
      rating: 4.8,
      location: 'Near SUSL Main Gate'
    },
    {
      id: 'fav_2',
      category: 'accommodation',
      title: 'Oak Crest Student Boarding',
      subtitle: 'Annex Landlord: K. Fernando',
      metric: 'Rs. 12,000/mo',
      metricLabel: 'Single Room Private',
      rating: 4.9,
      location: 'Pambahinna Junction'
    },
    {
      id: 'fav_3',
      category: 'jobs',
      title: 'Computer Lab Assistant',
      subtitle: 'Faculty of Computing',
      metric: 'Rs. 500/hr',
      metricLabel: '12 hrs/week shift',
      location: 'Main Lab Block'
    }
  ]);

  const handleRemove = (id: string, name: string) => {
    HapticService.triggerSuccess();
    setFavourites(prev => prev.filter(item => item.id !== id));
    alert(`${name} removed from your saved favourites.`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return '#E05638';
      case 'accommodation': return '#10B981';
      case 'jobs': return '#8B5CF6';
      case 'rides': return '#2E9EBF';
      default: return Colors.brand.accent;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.surface }]}>
        <Text style={[styles.headerTitle, { color: '#EC4899' }]}>Your Favourites</Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
          Access your saved canteens, boardings, and gigs
        </Text>
      </View>

      <FlatList
        data={favourites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const accentColor = getCategoryColor(item.category);
          return (
            <Card variant="elevated" style={styles.favCard} padding="medium">
              {/* Category indicator line */}
              <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
              
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.favTitle, { color: themeColors.text }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.favSubtitle, { color: themeColors.textSecondary }]}>{item.subtitle}</Text>
                </View>
                <Pressable
                  onPress={() => handleRemove(item.id, item.title)}
                  style={[styles.removeBtn, { backgroundColor: systemTheme === 'light' ? '#FFF1F2' : '#4C0519' }]}
                >
                  <Trash2 size={14} color="#EF4444" />
                </Pressable>
              </View>

              {/* Metric panel */}
              <View style={[styles.metricPanel, { backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#0F172A' }]}>
                <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>{item.metricLabel.toUpperCase()}</Text>
                <Text style={[styles.metricValue, { color: accentColor }]}>{item.metric}</Text>
              </View>

              {/* Bottom location/rating meta */}
              <View style={styles.cardMeta}>
                {item.location && (
                  <View style={styles.metaItem}>
                    <MapPin size={12} color={themeColors.textMuted} />
                    <Text style={[styles.metaText, { color: themeColors.textMuted }]} numberOfLines={1}>{item.location}</Text>
                  </View>
                )}
                {item.rating && (
                  <View style={styles.ratingRow}>
                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                    <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>{item.rating}</Text>
                  </View>
                )}
              </View>

            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Heart size={48} color={themeColors.textMuted} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Your vault is empty</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              Bookmark food vendors, accommodations, or gigs around campus to access them instantly!
            </Text>
          </View>
        }
      />
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
  listContent: {
    padding: 20,
  },
  favCard: {
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  favTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  favSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricPanel: {
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.08)',
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '75%',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
