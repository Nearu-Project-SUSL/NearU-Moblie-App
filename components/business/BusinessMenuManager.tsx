import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  TextInput,
  Pressable,
  Image
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../Card';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { businessService } from '../../services/businessService';
import { getMenuItems, addMenuItem, deleteMenuItem, MenuItemResponse } from '../../services/foodshop';
import { useAuth } from '../../hooks/useAuth';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  DollarSign,
  FileText,
  EyeOff
} from 'lucide-react-native';

export default function BusinessMenuManager() {
  const { user } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);

  // Menu Creation Form Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: ''
  });

  const loadMenu = async () => {
    try {
      const shopRes = await businessService.getMyFoodShop();
      if (shopRes.success && shopRes.data) {
        setShopId(shopRes.data.id);
        const items = await getMenuItems(shopRes.data.id);
        setMenuItems(items);
      }
    } catch (e) {
      console.log('Error loading menu details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleAddMenuItem = async () => {
    if (!itemForm.name.trim() || !itemForm.price.trim()) {
      Alert.alert('Validation Error', 'Item name and price are required.');
      return;
    }

    if (!shopId) return;

    setActionLoading(true);
    try {
      const res = await addMenuItem(shopId, {
        name: itemForm.name,
        description: itemForm.description,
        price: parseFloat(itemForm.price)
      });
      
      setMenuItems(prev => [...prev, res]);
      setAddModalOpen(false);
      setItemForm({ name: '', description: '', price: '' });
      Alert.alert('Success', 'Menu item added successfully.');
    } catch (e: any) {
      if (__DEV__) {
        const mockItem: MenuItemResponse = {
          id: 'item_' + Math.floor(Math.random() * 10000),
          foodShopId: shopId,
          name: itemForm.name,
          description: itemForm.description || 'Tasty campus special.',
          price: parseFloat(itemForm.price),
          photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop',
          createdAt: new Date().toISOString()
        };
        setMenuItems(prev => [...prev, mockItem]);
        setAddModalOpen(false);
        setItemForm({ name: '', description: '', price: '' });
        Alert.alert('Success', 'Menu item created! (Mock Mode)');
      } else {
        Alert.alert('Error', e.message || 'Failed to add menu item.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert('Remove Menu Item', 'Are you sure you want to delete this menu listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!shopId) return;
          try {
            await deleteMenuItem(shopId, itemId);
            setMenuItems(prev => prev.filter(item => item.id !== itemId));
            Alert.alert('Success', 'Menu item deleted.');
          } catch {
            if (__DEV__) {
              setMenuItems(prev => prev.filter(item => item.id !== itemId));
            } else {
              Alert.alert('Error', 'Failed to remove menu item.');
            }
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand.accent} />
      </View>
    );
  }

  if (!shopId) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: themeColors.background, paddingHorizontal: 30 }]}>
        <EyeOff size={40} color={themeColors.textMuted} style={{ marginBottom: 16 }} />
        <Text style={[styles.errorTitle, { color: themeColors.text }]}>No Shop Profile Found</Text>
        <Text style={[styles.errorDesc, { color: themeColors.textSecondary }]}>
          Please configure your food shop profile on the Dashboard screen first to enable listing your menu items.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Store Menu</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
            List items for students to order
          </Text>
        </View>
        <Button
          title="Add Item"
          onPress={() => setAddModalOpen(true)}
          variant="primary"
          size="small"
          icon={<Plus size={14} color="#FFFFFF" />}
          style={{ backgroundColor: Colors.brand.accent, borderRadius: 20 }}
        />
      </View>

      {menuItems.length === 0 ? (
        <Card variant="bordered" style={styles.emptyCard} padding="large">
          <UtensilsCrossed size={32} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            No menu items listed yet. Click 'Add Item' to start.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {menuItems.map((item) => (
            <Card key={item.id} variant="elevated" padding="none">
              <View style={styles.menuItemRow}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.itemPhoto} />
                ) : (
                  <View style={[styles.itemPhotoPlaceholder, { backgroundColor: themeColors.primaryLight }]}>
                    <UtensilsCrossed size={24} color={themeColors.primary} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: themeColors.text }]}>{item.name}</Text>
                  {item.description && (
                    <Text style={[styles.itemDesc, { color: themeColors.textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <Text style={[styles.itemPrice, { color: Colors.brand.accent }]}>Rs. {item.price}</Text>
                </View>
                <Pressable
                  onPress={() => handleDeleteItem(item.id)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color={themeColors.danger} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Add Item Modal */}
      <Modal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Menu Item"
      >
        <View style={styles.modalForm}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Item Name</Text>
            <TextInput
              value={itemForm.name}
              onChangeText={(v) => setItemForm({ ...itemForm, name: v })}
              placeholder="e.g. Chicken Kottu (Regular)"
              placeholderTextColor={themeColors.textMuted}
              style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Price (Rs.)</Text>
            <TextInput
              value={itemForm.price}
              onChangeText={(v) => setItemForm({ ...itemForm, price: v.replace(/[^0-9.]/g, '') })}
              placeholder="e.g. 650"
              keyboardType="numeric"
              placeholderTextColor={themeColors.textMuted}
              style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Description</Text>
            <TextInput
              value={itemForm.description}
              onChangeText={(v) => setItemForm({ ...itemForm, description: v })}
              placeholder="Describe ingredients or portion sizes..."
              multiline
              numberOfLines={3}
              placeholderTextColor={themeColors.textMuted}
              style={[styles.textArea, { color: themeColors.text, borderColor: themeColors.border }]}
            />
          </View>

          <Button
            title="Create Menu Item"
            onPress={handleAddMenuItem}
            variant="primary"
            style={{ marginTop: 12, backgroundColor: Colors.brand.accent }}
            loading={actionLoading}
          />
        </View>
      </Modal>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  menuItemRow: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  itemPhoto: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 12,
  },
  itemPhotoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  modalForm: {
    paddingVertical: 10,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 8,
    fontSize: 14,
    textAlignVertical: 'top',
  },
});
