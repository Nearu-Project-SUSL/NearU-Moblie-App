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
  Pressable
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../Card';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { LinearGradient } from 'expo-linear-gradient';
import { businessService, BusinessStatus, FoodShopPayload } from '../../services/businessService';
import { getMyDeals, deleteDeal } from '../../services/deal';
import { getMenuItems, ShopResponse } from '../../services/foodshop';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/api';
import {
  Store,
  UtensilsCrossed,
  Tag,
  Plus,
  Trash2,
  Hourglass,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  FileText,
  Percent
} from 'lucide-react-native';

export default function BusinessDashboard() {
  const { user } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<BusinessStatus | null>(null);
  const [shop, setShop] = useState<ShopResponse | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [menuCount, setMenuCount] = useState(0);

  // Shop Creation Form Fields
  const [shopForm, setShopForm] = useState<FoodShopPayload>({
    name: '',
    description: '',
    address: '',
    phoneNumber: '',
    category: 'Food Vendor'
  });

  // Deal Creation Form Modal
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [dealForm, setDealForm] = useState({
    title: '',
    description: '',
    discountPercent: '',
    expireDays: '30'
  });

  const loadBusinessData = async () => {
    try {
      const statusRes = await businessService.getStatus();
      if (statusRes.success && statusRes.data) {
        setStatus(statusRes.data);
      }

      const shopRes = await businessService.getMyFoodShop();
      if (shopRes.success && shopRes.data) {
        setShop(shopRes.data);
        
        // Fetch menu count & deals if shop exists
        const menuItems = await getMenuItems(shopRes.data.id);
        setMenuCount(menuItems.length);

        const myDeals = await getMyDeals();
        setDeals(myDeals);
      }
    } catch (e) {
      console.log('Error loading business dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinessData();
  }, []);

  const handleCreateShop = async () => {
    if (!shopForm.name.trim()) {
      Alert.alert('Validation Error', 'Shop Name is required.');
      return;
    }
    setActionLoading(true);
    const res = await businessService.createFoodShop(shopForm);
    setActionLoading(false);
    if (res.success && res.data) {
      setShop(res.data);
      Alert.alert('Success', 'Your shop profile has been successfully created!');
      loadBusinessData();
    } else {
      Alert.alert('Error', res.message || 'Failed to create shop profile.');
    }
  };

  const handlePostDeal = async () => {
    if (!dealForm.title.trim() || !dealForm.description.trim() || !dealForm.discountPercent.trim()) {
      Alert.alert('Validation Error', 'All deal fields are required.');
      return;
    }
    
    setActionLoading(true);
    try {
      // API call to post deal: POST /deals
      const payload = {
        foodShopId: shop?.id,
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
        loadBusinessData();
      } else {
        Alert.alert('Error', 'Failed to submit deal.');
      }
    } catch (err: any) {
      // Mock creation in Dev Fallback
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
    Alert.alert('Delete Deal', 'Are you sure you want to remove this promotion?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDeal(id);
            setDeals(prev => prev.filter(d => d.id !== id));
            Alert.alert('Success', 'Promotion deleted successfully.');
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
      <View style={[styles.loadingScreen, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading business account...</Text>
      </View>
    );
  }

  // ─── STATE: NO SHOP PROFILE CREATED YET ───
  if (!shop) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.centerContent}
      >
        {status?.status === 'Pending' && (
          <Card variant="elevated" style={styles.stateCard} padding="large">
            <Hourglass size={48} color={themeColors.warning} style={{ marginBottom: 16 }} />
            <Text style={[styles.stateTitle, { color: themeColors.text }]}>Application Under Review</Text>
            <Text style={[styles.stateDesc, { color: themeColors.textSecondary }]}>
              Your business application for <Text style={{ fontWeight: '700' }}>{status.businessName}</Text> is currently being reviewed by the administration. You will be able to create your shop profile once approved.
            </Text>
            <View style={[styles.badge, { backgroundColor: themeColors.warningLight }]}>
              <Text style={[styles.badgeText, { color: themeColors.warning }]}>Pending Approval</Text>
            </View>
          </Card>
        )}

        {status?.status === 'Rejected' && (
          <Card variant="elevated" style={styles.stateCard} padding="large">
            <XCircle size={48} color={themeColors.danger} style={{ marginBottom: 16 }} />
            <Text style={[styles.stateTitle, { color: themeColors.text }]}>Application Rejected</Text>
            <Text style={[styles.stateDesc, { color: themeColors.textSecondary }]}>
              Unfortunately, your business registration application was rejected by the university coordinators. Please reach out to student service desks for clarification.
            </Text>
            <View style={[styles.badge, { backgroundColor: themeColors.dangerLight }]}>
              <Text style={[styles.badgeText, { color: themeColors.danger }]}>Rejected</Text>
            </View>
          </Card>
        )}

        {/* Approved, needs profile creation */}
        {(!status || status.status === 'Approved') && (
          <Card variant="elevated" style={styles.setupCard} padding="medium">
            <Store size={36} color={Colors.brand.accent} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.setupTitle, { color: themeColors.text }]}>Set Up Your Food Shop Profile</Text>
            <Text style={[styles.setupDesc, { color: themeColors.textSecondary }]}>
              Congratulations! Your merchant registration has been approved. Create your public profile to display your menu and publish deals to students.
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Shop Name</Text>
              <TextInput
                value={shopForm.name}
                onChangeText={(v) => setShopForm({ ...shopForm, name: v })}
                placeholder="e.g. Campus Hut"
                placeholderTextColor={themeColors.textMuted}
                style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Contact Phone</Text>
              <TextInput
                value={shopForm.phoneNumber || ''}
                onChangeText={(v) => setShopForm({ ...shopForm, phoneNumber: v })}
                placeholder="e.g. 0771234567"
                keyboardType="phone-pad"
                placeholderTextColor={themeColors.textMuted}
                style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Shop Address</Text>
              <TextInput
                value={shopForm.address || ''}
                onChangeText={(v) => setShopForm({ ...shopForm, address: v })}
                placeholder="e.g. Pambahinna Junction"
                placeholderTextColor={themeColors.textMuted}
                style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Description</Text>
              <TextInput
                value={shopForm.description || ''}
                onChangeText={(v) => setShopForm({ ...shopForm, description: v })}
                placeholder="Briefly describe your shop specials..."
                multiline
                numberOfLines={3}
                placeholderTextColor={themeColors.textMuted}
                style={[styles.textArea, { color: themeColors.text, borderColor: themeColors.border }]}
              />
            </View>

            <Button
              title="Create Shop Profile"
              onPress={handleCreateShop}
              variant="primary"
              style={{ marginTop: 12, backgroundColor: Colors.brand.accent }}
              loading={actionLoading}
            />
          </Card>
        )}
      </ScrollView>
    );
  }

  // ─── STATE: ACTIVE FOOD SHOP PROFILE ───
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Merchant Dashboard</Text>
          <Text style={[styles.headerSubtitle, { color: Colors.brand.accent }]} numberOfLines={1}>
            {shop.name}
          </Text>
        </View>
        <Button
          title="Post a Deal"
          onPress={() => setDealModalOpen(true)}
          variant="primary"
          size="small"
          icon={<Plus size={14} color="#FFFFFF" />}
          style={{ backgroundColor: Colors.brand.accent, borderRadius: 20 }}
        />
      </View>

      {/* Analytics Stats */}
      <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Shop Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCol}>
          <Card variant="elevated" style={styles.statCard} padding="medium">
            <View style={styles.statHeader}>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Menu Listed</Text>
              <UtensilsCrossed size={16} color={Colors.brand.accent} />
            </View>
            <Text style={[styles.statValue, { color: themeColors.text }]}>{menuCount}</Text>
            <Text style={[styles.statSub, { color: themeColors.textMuted }]}>Items online</Text>
          </Card>
        </View>
        <View style={styles.statCol}>
          <Card variant="elevated" style={styles.statCard} padding="medium">
            <View style={styles.statHeader}>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Active Offers</Text>
              <Tag size={16} color={themeColors.success} />
            </View>
            <Text style={[styles.statValue, { color: themeColors.text }]}>
              {deals.filter(d => d.approvalStatus === 'Approved').length}
            </Text>
            <Text style={[styles.statSub, { color: themeColors.textMuted }]}>
              {deals.filter(d => d.approvalStatus === 'Pending').length} Pending approval
            </Text>
          </Card>
        </View>
      </View>

      {/* Promotions List */}
      <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Student Deals & Promotions</Text>
      {deals.length === 0 ? (
        <Card variant="bordered" style={styles.emptyCard} padding="large">
          <Tag size={32} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            No student offers posted yet. Try clicking 'Post a Deal'.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {deals.map((deal) => (
            <Card key={deal.id} variant="elevated" padding="medium">
              <View style={styles.dealRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <View style={styles.dealTitleRow}>
                    <Text style={[styles.dealTitle, { color: themeColors.text }]}>{deal.title}</Text>
                    <View style={[styles.statusTag, {
                      backgroundColor: deal.approvalStatus === 'Approved' ? themeColors.successLight :
                                      deal.approvalStatus === 'Pending' ? themeColors.warningLight : themeColors.dangerLight
                    }]}>
                      <Text style={[styles.statusTagText, {
                        color: deal.approvalStatus === 'Approved' ? themeColors.success :
                               deal.approvalStatus === 'Pending' ? themeColors.warning : themeColors.danger
                      }]}>
                        {deal.approvalStatus}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.dealDesc, { color: themeColors.textSecondary }]}>{deal.description}</Text>
                  
                  <View style={styles.dealDetails}>
                    <View style={styles.dealMetaItem}>
                      <Percent size={12} color={Colors.brand.accent} style={{ marginRight: 4 }} />
                      <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>{deal.discountPercentage}% OFF</Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={() => handleDeleteDeal(deal.id)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color={themeColors.danger} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}

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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  stateCard: {
    alignItems: 'center',
    textAlign: 'center',
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  setupCard: {
    width: '100%',
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  setupDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  statCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  statCard: {
    justifyContent: 'space-between',
    height: 100,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
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
  dealDetails: {
    flexDirection: 'row',
    marginTop: 10,
  },
  dealMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
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
});
