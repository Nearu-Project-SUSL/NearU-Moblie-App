import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getShopById,
  getMenuItems,
  deleteShop,
  ShopResponse,
  MenuItemResponse,
} from '../../services/foodshop';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';

export default function FoodShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];

  const [shop, setShop] = useState<ShopResponse | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage =
    user &&
    (user.role === 'Admin' || (shop?.ownerId && user.id === shop.ownerId));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [shopData, items] = await Promise.all([
          getShopById(id),
          getMenuItems(id),
        ]);

        setShop(shopData);
        setMenuItems(items);
      } catch {
        setError('Could not load shop details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Shop',
      `Are you sure you want to delete "${shop?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteShop(id);
              router.replace('/food');
            } catch {
              Alert.alert('Error', 'Failed to delete shop.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Loading shop...
        </Text>
      </View>
    );
  }

  if (error || !shop) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.danger }]}>
          {error ?? 'Shop not found.'}
        </Text>

        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: Colors.brand.accent }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: themeColors.background }}>
      {/* HERO */}
      {shop.photoUrl ? (
        <Image source={{ uri: shop.photoUrl }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroPlaceholder, { backgroundColor: themeColors.surfaceElevated }]}>
          <Text style={styles.heroEmoji}>🍽️</Text>
        </View>
      )}

      {/* BACK */}
      <TouchableOpacity
        style={[styles.backFloating, { backgroundColor: themeColors.surface }]}
        onPress={() => router.back()}
      >
        <Text style={[styles.backFloatingText, { color: themeColors.text }]}>←</Text>
      </TouchableOpacity>

      {/* INFO CARD */}
      <View style={[styles.infoCard, { backgroundColor: themeColors.surface }]}>
        <Text style={[styles.shopName, { color: themeColors.text }]}>
          {shop.name}
        </Text>

        <Text style={[styles.shopDesc, { color: themeColors.textSecondary }]}>
          {shop.description}
        </Text>

        <Text style={{ color: themeColors.textMuted }}>
          📍 {shop.address}
        </Text>
        <Text style={{ color: themeColors.textMuted }}>
          📞 {shop.phoneNumber}
        </Text>

        {/* ACTIONS */}
        {canManage && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: themeColors.surfaceElevated }]}
              onPress={() => router.push(`/food/edit/${id}`)}
            >
              <Text style={{ color: themeColors.text }}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: Colors.brand.accent }]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff' }}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* MENU */}
      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Menu ({menuItems.length})
        </Text>

        {menuItems.map(item => (
          <View
            key={item.id}
            style={[styles.menuCard, { backgroundColor: themeColors.surface }]}
          >
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.menuImage} />
            ) : (
              <View style={[styles.menuImagePlaceholder, { backgroundColor: themeColors.surfaceElevated }]}>
                <Text>🍴</Text>
              </View>
            )}

            <View style={styles.menuBody}>
              <Text style={[styles.menuName, { color: themeColors.text }]}>
                {item.name}
              </Text>

              <Text style={{ color: themeColors.textSecondary }}>
                LKR {item.price}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    height: 240,
  },
  heroPlaceholder: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 60,
  },

  backFloating: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  backFloatingText: {
    fontSize: 20,
  },

  infoCard: {
    margin: 16,
    marginTop: -20,
    padding: 16,
    borderRadius: 16,
  },

  shopName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  shopDesc: {
    marginBottom: 10,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  editBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  deleteBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  menuSection: {
    padding: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  menuCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },

  menuImage: {
    width: 80,
    height: 80,
  },

  menuImagePlaceholder: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuBody: {
    padding: 10,
    justifyContent: 'center',
  },

  menuName: {
    fontSize: 15,
    fontWeight: '600',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
  },

  errorText: {
    marginBottom: 12,
  },

  backBtn: {
    padding: 12,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});