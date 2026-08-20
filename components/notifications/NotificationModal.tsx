/**
 * NotificationModal.tsx
 *
 * Full-featured luxury In-App Notification Center for NearU Mobile.
 * Includes category filter pills, interactive notification cards,
 * deep-linking navigation, mark as read, delete, clear all, and dev simulations.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  useColorScheme,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bike,
  Package,
  Briefcase,
  Home,
  Tag,
  Gift,
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useNotificationStore } from '../../store/notificationStore';
import {
  AppNotification,
  NotificationType,
  NOTIFICATION_TYPE_META,
  NotificationFilter,
} from '../../types/notification';
import { notificationService } from '../../services/notificationService';
import { HapticService } from '../../services/HapticService';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const FILTER_OPTIONS: { id: NotificationFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ride', label: 'Rides' },
  { id: 'order', label: 'Orders' },
  { id: 'job', label: 'Jobs' },
  { id: 'accommodation', label: 'Stay' },
  { id: 'deal', label: 'Deals' },
  { id: 'gift', label: 'Gifts' },
  { id: 'general', label: 'General' },
];

function formatTimeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function renderCategoryIcon(type: NotificationType, size = 18, color = '#FFFFFF') {
  switch (type) {
    case 'ride':
      return <Bike size={size} color={color} />;
    case 'order':
      return <Package size={size} color={color} />;
    case 'job':
      return <Briefcase size={size} color={color} />;
    case 'accommodation':
      return <Home size={size} color={color} />;
    case 'deal':
      return <Tag size={size} color={color} />;
    case 'gift':
      return <Gift size={size} color={color} />;
    case 'general':
    default:
      return <Bell size={size} color={color} />;
  }
}

export const NotificationModal: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const notifications = useNotificationStore((s) => s.notifications);
  const isModalOpen = useNotificationStore((s) => s.isModalOpen);
  const selectedFilter = useNotificationStore((s) => s.selectedFilter);
  const unreadCount = useNotificationStore((s) => s.unreadCount());

  const setModalOpen = useNotificationStore((s) => s.setModalOpen);
  const setSelectedFilter = useNotificationStore((s) => s.setSelectedFilter);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);

  // Filtered list
  const filteredNotifications = useMemo(() => {
    if (selectedFilter === 'all') return notifications;
    return notifications.filter((n) => n.type === selectedFilter);
  }, [notifications, selectedFilter]);

  // Counts per filter category
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notifications.length };
    notifications.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  const handleClose = () => {
    try {
      HapticService.triggerSelection();
    } catch {}
    setModalOpen(false);
  };

  const handleNavigate = (item: AppNotification) => {
    try {
      HapticService.triggerSelection();
    } catch {}

    markAsRead(item.id);
    setModalOpen(false);

    if (item.route) {
      router.push(item.route as any);
    }
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const meta = NOTIFICATION_TYPE_META[item.type] || NOTIFICATION_TYPE_META.general;

    return (
      <Pressable
        onPress={() => handleNavigate(item)}
        style={[
          styles.itemCard,
          {
            backgroundColor:
              systemTheme === 'light'
                ? item.read
                  ? themeColors.surface
                  : 'rgba(46, 158, 191, 0.05)'
                : item.read
                ? 'rgba(30, 41, 59, 0.7)'
                : 'rgba(15, 23, 42, 0.85)',
            borderColor:
              item.read
                ? themeColors.border
                : systemTheme === 'light'
                ? 'rgba(46, 158, 191, 0.35)'
                : 'rgba(34, 211, 238, 0.3)',
          },
        ]}
      >
        {/* Unread Glowing Left Accent Bar */}
        {!item.read && (
          <View
            style={[
              styles.itemAccentBar,
              { backgroundColor: meta.accentColor },
            ]}
          />
        )}

        <View style={styles.itemMain}>
          {/* Category Icon */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={meta.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.itemIconGradient,
                { shadowColor: meta.accentColor },
              ]}
            >
              {renderCategoryIcon(item.type, 18, '#FFFFFF')}
            </LinearGradient>

            {!item.read && (
              <View
                style={[
                  styles.unreadDot,
                  { backgroundColor: meta.accentColor },
                ]}
              />
            )}
          </View>

          {/* Text Content */}
          <View style={styles.itemTextContent}>
            <View style={styles.itemHeaderRow}>
              <Text
                style={[
                  styles.itemTitle,
                  {
                    color: item.read
                      ? themeColors.textSecondary
                      : themeColors.text,
                    fontWeight: item.read ? '600' : '800',
                  },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.itemTime,
                  { color: themeColors.textMuted },
                ]}
              >
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>

            <Text
              style={[
                styles.itemMessage,
                {
                  color: item.read
                    ? themeColors.textMuted
                    : themeColors.textSecondary,
                },
              ]}
              numberOfLines={2}
            >
              {item.message}
            </Text>

            {/* Action Bar */}
            <View style={styles.itemFooter}>
              {item.route ? (
                <Pressable
                  onPress={() => handleNavigate(item)}
                  style={[
                    styles.routeButton,
                    {
                      backgroundColor: meta.badgeBg,
                      borderColor: `${meta.accentColor}40`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.routeButtonText,
                      { color: meta.accentColor },
                    ]}
                  >
                    View
                  </Text>
                  <ChevronRight size={12} color={meta.accentColor} />
                </Pressable>
              ) : (
                <View />
              )}

              <View style={styles.itemActionsRight}>
                {!item.read && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      markAsRead(item.id);
                    }}
                    hitSlop={8}
                    style={[
                      styles.actionIconButton,
                      { backgroundColor: themeColors.surfaceElevated },
                    ]}
                    accessibilityLabel="Mark as read"
                  >
                    <Check size={14} color={meta.accentColor} />
                  </Pressable>
                )}

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteNotification(item.id);
                  }}
                  hitSlop={8}
                  style={[
                    styles.actionIconButton,
                    { backgroundColor: themeColors.surfaceElevated },
                  ]}
                  accessibilityLabel="Delete notification"
                >
                  <Trash2 size={13} color={themeColors.textMuted} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={
          systemTheme === 'light'
            ? ['rgba(46, 158, 191, 0.12)', 'rgba(37, 99, 235, 0.05)']
            : ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.95)']
        }
        style={styles.emptyIconBg}
      >
        <Bell size={42} color={Colors.brand.accent} />
        <View style={styles.emptySparkle}>
          <Sparkles size={18} color="#F59E0B" />
        </View>
      </LinearGradient>

      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        You're All Caught Up!
      </Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
        {selectedFilter === 'all'
          ? 'No new notifications right now. Campus alerts and updates will show here.'
          : `No notifications in the ${selectedFilter} category.`}
      </Text>

      {/* Dev Simulation Triggers */}
      {__DEV__ && (
        <View style={styles.devSimSection}>
          <Text style={[styles.devSimLabel, { color: themeColors.textMuted }]}>
            ⚡ DEV TOOLS: TEST NOTIFICATIONS
          </Text>
          <View style={styles.devButtonsRow}>
            <Pressable
              style={[styles.devBtn, { borderColor: '#22d3ee' }]}
              onPress={() => notificationService.simulateDemoNotification('ride')}
            >
              <Text style={[styles.devBtnText, { color: '#22d3ee' }]}>+ Ride Alert</Text>
            </Pressable>
            <Pressable
              style={[styles.devBtn, { borderColor: '#f97316' }]}
              onPress={() => notificationService.simulateDemoNotification('order')}
            >
              <Text style={[styles.devBtnText, { color: '#f97316' }]}>+ Order Alert</Text>
            </Pressable>
            <Pressable
              style={[styles.devBtn, { borderColor: '#34d399' }]}
              onPress={() => notificationService.simulateDemoNotification('deal')}
            >
              <Text style={[styles.devBtnText, { color: '#34d399' }]}>+ Hot Deal</Text>
            </Pressable>
            <Pressable
              style={[styles.devBtn, { borderColor: '#8b5cf6' }]}
              onPress={() => notificationService.simulateDemoNotification('job')}
            >
              <Text style={[styles.devBtnText, { color: '#8b5cf6' }]}>+ Campus Gig</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={isModalOpen}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
        />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor:
                systemTheme === 'light'
                  ? themeColors.background
                  : '#0B0F19',
              borderColor:
                systemTheme === 'light'
                  ? 'rgba(226, 232, 240, 0.9)'
                  : 'rgba(46, 158, 191, 0.25)',
              paddingTop: insets.top > 0 ? insets.top : 12,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Top Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleGroup}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Notifications
              </Text>
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.unreadBadgePill,
                    { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                  ]}
                >
                  <Text style={styles.unreadBadgePillText}>
                    {unreadCount} New
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <Pressable
                  onPress={markAllAsRead}
                  style={[
                    styles.markAllButton,
                    { backgroundColor: themeColors.surfaceElevated },
                  ]}
                >
                  <CheckCheck size={14} color={Colors.brand.accent} />
                  <Text
                    style={[
                      styles.markAllText,
                      { color: Colors.brand.accent },
                    ]}
                  >
                    Read all
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleClose}
                style={[
                  styles.closeModalButton,
                  { backgroundColor: themeColors.surfaceElevated },
                ]}
                hitSlop={10}
              >
                <X size={18} color={themeColors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Category Filter Pills */}
          <View style={styles.filtersWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
            >
              {FILTER_OPTIONS.map((f) => {
                const isActive = selectedFilter === f.id;
                const count = filterCounts[f.id] || 0;
                const meta =
                  f.id !== 'all'
                    ? NOTIFICATION_TYPE_META[f.id]
                    : { accentColor: Colors.brand.accent, badgeBg: 'rgba(46, 158, 191, 0.15)' };

                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setSelectedFilter(f.id)}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isActive
                          ? systemTheme === 'light'
                            ? meta.badgeBg
                            : 'rgba(30, 41, 59, 0.9)'
                          : systemTheme === 'light'
                          ? themeColors.surfaceElevated
                          : 'rgba(15, 23, 42, 0.6)',
                        borderColor: isActive
                          ? meta.accentColor
                          : themeColors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        {
                          color: isActive
                            ? meta.accentColor
                            : themeColors.textSecondary,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                    >
                      {f.label}
                    </Text>
                    {count > 0 && (
                      <View
                        style={[
                          styles.filterCountBadge,
                          {
                            backgroundColor: isActive
                              ? meta.accentColor
                              : themeColors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterCountText,
                            {
                              color: isActive
                                ? '#FFFFFF'
                                : themeColors.textSecondary,
                            },
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Notification List */}
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotificationItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />

          {/* Footer */}
          {notifications.length > 0 && (
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: themeColors.border },
              ]}
            >
              <Text
                style={[
                  styles.totalCountText,
                  { color: themeColors.textMuted },
                ]}
              >
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </Text>

              <Pressable
                onPress={clearAll}
                style={styles.clearAllButton}
                hitSlop={10}
              >
                <Trash2 size={13} color="#EF4444" />
                <Text style={styles.clearAllText}>Clear All</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: SCREEN_HEIGHT * 0.90,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 25,
  },
  handleBar: {
    width: 42,
    height: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  unreadBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unreadBadgePillText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeModalButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersWrapper: {
    paddingVertical: 8,
  },
  filtersContent: {
    paddingHorizontal: 18,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterPillText: {
    fontSize: 12,
  },
  filterCountBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    fontSize: 9,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
  },
  itemCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  itemAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginTop: 2,
  },
  itemIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0B0F19',
  },
  itemTextContent: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemMessage: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  routeButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  actionIconButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  emptySparkle: {
    position: 'absolute',
    top: 6,
    right: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
  },
  devSimSection: {
    marginTop: 36,
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 158, 191, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(46, 158, 191, 0.2)',
    alignItems: 'center',
  },
  devSimLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  devButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  devBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  devBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearAllText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
});
