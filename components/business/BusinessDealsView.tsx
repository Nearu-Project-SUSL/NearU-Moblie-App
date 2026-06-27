import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  useColorScheme,
  Pressable,
  Alert,
  TextInput
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../Card';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { getMyDeals, deleteDeal } from '../../services/deal';
import { businessService } from '../../services/businessService';
import { apiClient } from '../../services/api';
import { Tag, Plus, Trash2, Percent, Calendar } from 'lucide-react-native';

export default function BusinessDealsView() {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [deals, setDeals] = useState<any[]>([]);

  // Post Deal Form Modal
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [dealForm, setDealForm] = useState({
    title: '',
    description: '',
    discountPercent: '',
    expireDays: '30'
  });

  const fetchDeals = async () => {
    try {
      const shopRes = await businessService.getMyFoodShop();
      if (shopRes.success && shopRes.data) {
        setShopId(shopRes.data.id);
        const myDeals = await getMyDeals();
        setDeals(myDeals);
      }
    } catch (e) {
      console.log('Error fetching deals:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeals();
  };

  const handlePostDeal = async () => {
    if (!dealForm.title.trim() || !dealForm.description.trim() || !dealForm.discountPercent.trim()) {
      Alert.alert('Validation Error', 'All deal fields are required.');
      return;
    }
    
    setActionLoading(true);
    try {
      const payload = {
        foodShopId: shopId,
        title: dealForm.title,
        description: dealForm.description,
        discountPercentage: parseInt(dealForm.discountPercent, 10),
        expirationDate: new Date(Date.now() + parseInt(dealForm.expireDays, 10) * 86400000).toISOString()
      };
      
      const response = await apiClient.post('/deals', payload);
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Student deal application submitted! Awaiting admin review.');
        setDealModalOpen(false);
        setDealForm({ title: '', description: '', discountPercent: '', expireDays: '30' });
        fetchDeals();
      } else {
        Alert.alert('Error', 'Failed to submit deal.');
      }
    } catch (err: any) {
      if (__DEV__) {
        const mockDeal = {
          id: 'deal_' + Math.floor(Math.random() * 10000),
          title: dealForm.title,
          description: dealForm.description,
          discountPercentage: parseInt(dealForm.discountPercent, 10),
          approvalStatus: 'Pending',
          createdAt: new Date().toISOString()
        };
        setDeals(prev => [mockDeal, ...prev]);
        setDealModalOpen(false);
        setDealForm({ title: '', description: '', discountPercent: '', expireDays: '30' });
        Alert.alert('Mock Success', 'Deal submitted! (Mock active)');
      } else {
        Alert.alert('Error', err.response?.data?.message || err.message || 'Deal submission failed.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDeal = async (id: string) => {
    Alert.alert('Delete Promotion', 'Are you sure you want to remove this student discount?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDeal(id);
            setDeals(prev => prev.filter(d => d.id !== id));
            Alert.alert('Success', 'Promotion deleted.');
          } catch {
            if (__DEV__) {
              setDeals(prev => prev.filter(d => d.id !== id));
            } else {
              Alert.alert('Error', 'Failed to delete deal.');
            }
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand.accent} />
      </View>
    );
  }

  if (!shopId) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: themeColors.background, paddingHorizontal: 30 }]}>
        <Tag size={40} color={themeColors.textMuted} style={{ marginBottom: 16 }} />
        <Text style={[styles.errorTitle, { color: themeColors.text }]}>No Shop Profile Linked</Text>
        <Text style={[styles.errorDesc, { color: themeColors.textSecondary }]}>
          Please register your food shop profile on the Dashboard screen to start posting student deals.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Offers & Promotions</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
            Promote your shop to campus students
          </Text>
        </View>
        <Button
          title="Add Offer"
          onPress={() => setDealModalOpen(true)}
          variant="primary"
          size="small"
          icon={<Plus size={14} color="#FFFFFF" />}
          style={{ backgroundColor: Colors.brand.accent, borderRadius: 20 }}
        />
      </View>

      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Card variant="bordered" style={styles.emptyCard} padding="large">
            <Tag size={32} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              No promotions listed yet. Click 'Add Offer' to post your first student discount.
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card variant="elevated" style={styles.dealCard} padding="medium">
            <View style={styles.dealRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={styles.dealTitleRow}>
                  <Text style={[styles.dealTitle, { color: themeColors.text }]}>{item.title}</Text>
                  <View style={[styles.statusTag, {
                    backgroundColor: item.approvalStatus === 'Approved' ? themeColors.successLight :
                                    item.approvalStatus === 'Pending' ? themeColors.warningLight : themeColors.dangerLight
                  }]}>
                    <Text style={[styles.statusTagText, {
                      color: item.approvalStatus === 'Approved' ? themeColors.success :
                             item.approvalStatus === 'Pending' ? themeColors.warning : themeColors.danger
                    }]}>
                      {item.approvalStatus}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.dealDesc, { color: themeColors.textSecondary }]}>{item.description}</Text>
                
                <View style={styles.dealMeta}>
                  <View style={styles.metaItem}>
                    <Percent size={12} color={Colors.brand.accent} style={{ marginRight: 4 }} />
                    <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>{item.discountPercentage}% OFF</Text>
                  </View>
                  {item.expirationDate && (
                    <View style={[styles.metaItem, { marginLeft: 16 }]}>
                      <Calendar size={12} color={themeColors.textMuted} style={{ marginRight: 4 }} />
                      <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                        Exp: {new Date(item.expirationDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <Pressable
                onPress={() => handleDeleteDeal(item.id)}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} color={themeColors.danger} />
              </Pressable>
            </View>
          </Card>
        )}
      />

      {/* Post Deal Modal Dialog */}
      <Modal
        visible={dealModalOpen}
        onClose={() => setDealModalOpen(false)}
        title="Post New Student Offer"
      >
        <View style={styles.modalForm}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Deal Title / Headline</Text>
            <TextInput
              value={dealForm.title}
              onChangeText={(v) => setDealForm({ ...dealForm, title: v })}
              placeholder="e.g. 20% Off Rice & Curry"
              placeholderTextColor={themeColors.textMuted}
              style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Discount Percentage (%)</Text>
            <TextInput
              value={dealForm.discountPercent}
              onChangeText={(v) => setDealForm({ ...dealForm, discountPercent: v.replace(/[^0-9]/g, '') })}
              placeholder="e.g. 20"
              keyboardType="number-pad"
              placeholderTextColor={themeColors.textMuted}
              style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Promotion Period (Days)</Text>
            <TextInput
              value={dealForm.expireDays}
              onChangeText={(v) => setDealForm({ ...dealForm, expireDays: v.replace(/[^0-9]/g, '') })}
              placeholder="e.g. 30"
              keyboardType="number-pad"
              placeholderTextColor={themeColors.textMuted}
              style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Promotion Rules / Description</Text>
            <TextInput
              value={dealForm.description}
              onChangeText={(v) => setDealForm({ ...dealForm, description: v })}
              placeholder="Specify requirements, e.g. Valid only on student ID card presentation at checkout..."
              multiline
              numberOfLines={3}
              placeholderTextColor={themeColors.textMuted}
              style={[styles.textArea, { color: themeColors.text, borderColor: themeColors.border }]}
            />
          </View>

          <Button
            title="Submit Promotion"
            onPress={handlePostDeal}
            variant="primary"
            style={{ marginTop: 12, backgroundColor: Colors.brand.accent }}
            loading={actionLoading}
          />
        </View>
      </Modal>
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
  dealCard: {
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  dealRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  dealTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusTag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dealDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  dealMeta: {
    flexDirection: 'row',
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
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
