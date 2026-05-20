import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  Pressable, 
  useColorScheme,
  FlatList,
  Image
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ServiceItem, ServiceCategory } from '../../types';
import { Search, Compass, Star, Clock, MapPin, SlidersHorizontal, Check } from 'lucide-react-native';
import { Modal } from '../../components/Modal';

// High-fidelity mockup student services
const CAMPUS_SERVICES: ServiceItem[] = [
  {
    id: 'srv_1',
    title: 'Express Dorm Printing',
    description: 'Fast, secure laser printing. PDF/Doc review with campus dorm room delivery.',
    price: 0.15,
    rating: 4.9,
    deliveryTimeMinutes: 15,
    category: 'print',
    providerName: 'David S. (CS Senior)',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1563223552-30d01fda3eca?q=80&w=256&auto=format&fit=crop'
  },
  {
    id: 'srv_2',
    title: 'Hot Pizza Delivery (SUSL Gate)',
    description: 'Fresh woodfired local pizza brought directly to campus hostel gates or lecture rooms.',
    price: 8.99,
    rating: 4.8,
    deliveryTimeMinutes: 25,
    category: 'food',
    providerName: 'Main Street Bakers',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=256&auto=format&fit=crop'
  },
  {
    id: 'srv_3',
    title: 'Hostel Laundry Drop & Fold',
    description: 'Weekly laundry wash and premium press. Drop off at student center, pick up next day.',
    price: 12.00,
    rating: 4.7,
    deliveryTimeMinutes: 1440,
    category: 'laundry',
    providerName: 'Dorm Fresh Laundry',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947e8b94b?q=80&w=256&auto=format&fit=crop'
  },
  {
    id: 'srv_4',
    title: 'Quick Library Run / Book Retrieval',
    description: 'Need books retrieved or items returned? Quick peer helper run across central library blocks.',
    price: 3.50,
    rating: 4.9,
    deliveryTimeMinutes: 20,
    category: 'errand',
    providerName: 'Sarah K. (Peer Helper)',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=256&auto=format&fit=crop'
  }
];

export default function BrowseScreen() {
  const { user } = useAuth();
  const { location, isOnCampus } = useLocation();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const categories: { label: string; value: ServiceCategory | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Printouts', value: 'print' },
    { label: 'Campus Eats', value: 'food' },
    { label: 'Laundry', value: 'laundry' },
    { label: 'Errands', value: 'errand' },
  ];

  const filteredServices = CAMPUS_SERVICES.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenDetails = (service: ServiceItem) => {
    setSelectedService(service);
    setOrderPlaced(false);
    setDetailsModalVisible(true);
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    setTimeout(() => {
      setDetailsModalVisible(false);
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Top Interactive Brand Navigation Bar */}
      <View style={[styles.navBar, { borderBottomColor: themeColors.border, backgroundColor: themeColors.surface }]}>
        <View style={styles.navMain}>
          <View>
            <Text style={[styles.greeting, { color: themeColors.textSecondary }]}>
              Hello, {user?.firstName || 'Student'} 👋
            </Text>
            <View style={styles.locationContainer}>
              <MapPin size={14} color={themeColors.primary} style={styles.locationIcon} />
              <Text style={[styles.locationName, { color: themeColors.text }]} numberOfLines={1}>
                {isOnCampus ? location?.campusName : 'Searching for campus GPS...'}
              </Text>
            </View>
          </View>
          <View style={[styles.indicatorBadge, { backgroundColor: themeColors.successLight }]}>
            <View style={[styles.dot, { backgroundColor: themeColors.success }]} />
            <Text style={[styles.badgeText, { color: themeColors.success }]}>Online</Text>
          </View>
        </View>

        {/* Premium Search Bar */}
        <View style={styles.searchBlock}>
          <View style={[styles.searchWrapper, { borderColor: themeColors.border, backgroundColor: systemTheme === 'light' ? '#F1F5F9' : '#0F172A' }]}>
            <Search size={18} color={themeColors.textMuted} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search food, printing, errands..."
              placeholderTextColor={themeColors.textMuted}
              style={[styles.searchInput, { color: themeColors.text }]}
            />
          </View>
          <Pressable style={[styles.filterBtn, { borderColor: themeColors.border, backgroundColor: themeColors.surface }]}>
            <SlidersHorizontal size={18} color={themeColors.text} />
          </Pressable>
        </View>

        {/* Scrollable Categories List */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat, idx) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <Pressable
                key={idx}
                onPress={() => setSelectedCategory(cat.value)}
                style={[
                  styles.categoryChip,
                  { 
                    backgroundColor: isSelected ? themeColors.primary : (systemTheme === 'light' ? '#F1F5F9' : '#1E293B'),
                    borderColor: isSelected ? themeColors.primary : themeColors.border,
                  }
                ]}
              >
                <Text 
                  style={[
                    styles.categoryChipLabel, 
                    { 
                      color: isSelected ? '#FFFFFF' : themeColors.textSecondary,
                      fontWeight: isSelected ? '700' : '600'
                    }
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Services List */}
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card 
            variant="elevated" 
            style={styles.serviceCard} 
            onPress={() => handleOpenDetails(item)}
            padding="none"
          >
            <View style={styles.cardLayout}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              
              <View style={styles.cardDetails}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.categoryBadge, { color: themeColors.primary, backgroundColor: themeColors.primaryLight }]}>
                    {item.category.toUpperCase()}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={[styles.ratingVal, { color: themeColors.text }]}>{item.rating}</Text>
                  </View>
                </View>

                <Text style={[styles.serviceTitle, { color: themeColors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                
                <Text style={[styles.serviceDesc, { color: themeColors.textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={[styles.priceTag, { color: themeColors.text }]}>
                    ${item.price.toFixed(2)}
                  </Text>
                  <View style={styles.metaRow}>
                    <Clock size={12} color={themeColors.textMuted} style={styles.metaIcon} />
                    <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                      {item.deliveryTimeMinutes >= 60 
                        ? `${Math.round(item.deliveryTimeMinutes / 60)} hrs` 
                        : `${item.deliveryTimeMinutes} mins`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Compass size={48} color={themeColors.textMuted} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No services found</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              Try searching for something else or adjusting your category filter.
            </Text>
          </View>
        }
      />

      {/* Details Sheet Modal */}
      {selectedService && (
        <Modal
          visible={detailsModalVisible}
          onClose={() => setDetailsModalVisible(false)}
          title="Service Details"
          height={480}
        >
          {orderPlaced ? (
            <View style={styles.successWrapper}>
              <View style={[styles.successCircle, { backgroundColor: themeColors.successLight }]}>
                <Check size={36} color={themeColors.success} />
              </View>
              <Text style={[styles.successTitle, { color: themeColors.text }]}>Order Placed!</Text>
              <Text style={[styles.successSubtitle, { color: themeColors.textSecondary }]}>
                Your request has been sent to {selectedService.providerName}.
              </Text>
            </View>
          ) : (
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedService.imageUrl }} style={styles.modalImage} />
              <View style={styles.modalMeta}>
                <Text style={[styles.categoryBadge, { color: themeColors.primary, backgroundColor: themeColors.primaryLight }]}>
                  {selectedService.category.toUpperCase()}
                </Text>
                <View style={styles.ratingRow}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={[styles.ratingVal, { color: themeColors.text, fontSize: 14 }]}>{selectedService.rating}</Text>
                </View>
              </View>
              
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>{selectedService.title}</Text>
              <Text style={[styles.modalProvider, { color: themeColors.textSecondary }]}>
                Offered by: <Text style={{ fontWeight: '600' }}>{selectedService.providerName}</Text>
              </Text>
              <Text style={[styles.modalDesc, { color: themeColors.textSecondary }]}>
                {selectedService.description}
              </Text>

              <View style={styles.modalDivider} />

              <View style={styles.modalFooterRow}>
                <View>
                  <Text style={[styles.priceLabel, { color: themeColors.textMuted }]}>Total Price</Text>
                  <Text style={[styles.modalPrice, { color: themeColors.text }]}>${selectedService.price.toFixed(2)}</Text>
                </View>
                <Button 
                  title="Confirm & Request" 
                  onPress={handlePlaceOrder} 
                  variant="primary" 
                  style={styles.modalOrderBtn} 
                />
              </View>
            </View>
          )}
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    paddingTop: 54,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  navMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    maxWidth: 220,
  },
  locationIcon: {
    marginRight: 4,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '700',
  },
  indicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesScroll: {
    paddingBottom: 16,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipLabel: {
    fontSize: 12,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  serviceCard: {
    marginBottom: 16,
  },
  cardLayout: {
    flexDirection: 'row',
  },
  cardImage: {
    width: 100,
    height: '100%',
    minHeight: 110,
    backgroundColor: '#E2E8F0',
  },
  cardDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  serviceDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  priceTag: {
    fontSize: 16,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
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
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalProvider: {
    fontSize: 13,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    marginVertical: 14,
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalPrice: {
    fontSize: 22,
    fontWeight: '800',
  },
  modalOrderBtn: {
    width: 170,
  },
  successWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
