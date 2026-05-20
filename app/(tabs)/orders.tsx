import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  useColorScheme, 
  FlatList 
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { Order, OrderStatus } from '../../types';
import { Package, Truck, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react-native';

const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_7739',
    totalAmount: 18.13,
    status: 'in_transit',
    estimatedDeliveryTime: '10:45 PM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      { id: 'item_1', serviceId: 'srv_2', serviceTitle: 'Hot Pizza Delivery (SUSL Gate)', price: 8.99, quantity: 2 }
    ],
    deliveryLocation: { latitude: 6.7146, longitude: 80.7872, timestamp: Date.now(), campusName: 'SUSL Block C' }
  },
  {
    id: 'ord_6038',
    totalAmount: 1.50,
    status: 'completed',
    estimatedDeliveryTime: 'Completed at 2:30 PM',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    items: [
      { id: 'item_2', serviceId: 'srv_1', serviceTitle: 'Express Dorm Printing', price: 0.15, quantity: 10 }
    ],
    deliveryLocation: { latitude: 6.7146, longitude: 80.7872, timestamp: Date.now(), campusName: 'Central Library' }
  }
];

export default function OrdersScreen() {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'in_transit':
        return {
          label: 'Out for Delivery',
          color: themeColors.primary,
          bgColor: themeColors.primaryLight,
          icon: <Truck size={14} color={themeColors.primary} />,
        };
      case 'completed':
        return {
          label: 'Completed',
          color: themeColors.success,
          bgColor: themeColors.successLight,
          icon: <CheckCircle2 size={14} color={themeColors.success} />,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: themeColors.danger,
          bgColor: themeColors.dangerLight,
          icon: <XCircle size={14} color={themeColors.danger} />,
        };
      case 'pending':
      case 'preparing':
      default:
        return {
          label: 'Preparing',
          color: themeColors.warning,
          bgColor: themeColors.warningLight,
          icon: <Clock size={14} color={themeColors.warning} />,
        };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.surface }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Your Orders</Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
          Track your campus delivery requests
        </Text>
      </View>

      <FlatList
        data={MOCK_ORDERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const statusConfig = getStatusConfig(item.status);
          return (
            <Card variant="elevated" style={styles.orderCard} padding="medium">
              
              {/* Order Card Header */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.orderId, { color: themeColors.text }]}>Order #{item.id.split('_')[1]}</Text>
                  <Text style={[styles.orderTime, { color: themeColors.textMuted }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                  {statusConfig.icon}
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                </View>
              </View>

              {/* Order Items List */}
              <View style={styles.itemsBlock}>
                {item.items.map((orderItem) => (
                  <View key={orderItem.id} style={styles.itemRow}>
                    <Text style={[styles.itemQtyName, { color: themeColors.textSecondary }]} numberOfLines={1}>
                      {orderItem.quantity}x <Text style={[styles.itemName, { color: themeColors.text }]}>{orderItem.serviceTitle}</Text>
                    </Text>
                    <Text style={[styles.itemPrice, { color: themeColors.text }]}>
                      ${(orderItem.price * orderItem.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Delivery Details Panel */}
              <View style={[styles.deliveryPanel, { backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#0F172A' }]}>
                <View style={styles.metaLabelRow}>
                  <Text style={[styles.metaLabel, { color: themeColors.textMuted }]}>CAMPUS DROP POINT</Text>
                  <Text style={[styles.metaVal, { color: themeColors.text }]}>{item.deliveryLocation.campusName}</Text>
                </View>
                {item.status === 'in_transit' && (
                  <View style={[styles.etaBanner, { borderTopColor: themeColors.border }]}>
                    <Clock size={13} color={themeColors.primary} style={styles.etaIcon} />
                    <Text style={[styles.etaText, { color: themeColors.primary }]}>
                      Arriving by: <Text style={{ fontWeight: '700' }}>{item.estimatedDeliveryTime}</Text>
                    </Text>
                  </View>
                )}
              </View>

              {/* Order Card Footer */}
              <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
                <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Total Amount</Text>
                <Text style={[styles.totalPrice, { color: themeColors.text }]}>${item.totalAmount.toFixed(2)}</Text>
              </View>

            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={48} color={themeColors.textMuted} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No orders placed yet</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              Browse student services and place your first campus delivery order!
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
    borderBottomWidth: 1,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
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
    padding: 20,
    paddingBottom: 40,
  },
  orderCard: {
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
  },
  orderTime: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  itemsBlock: {
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemQtyName: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '80%',
  },
  itemName: {
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  deliveryPanel: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  metaLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '600',
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  etaIcon: {
    marginRight: 6,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
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
