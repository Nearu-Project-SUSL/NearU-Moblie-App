/**
 * useNotifications.ts
 *
 * Custom React hook that coordinates the Notification Store,
 * SignalR real-time synchronization, and in-app Notification Center actions.
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useNotificationStore } from '../store/notificationStore';
import { signalRService } from '../services/signalrService';
import { notificationService } from '../services/notificationService';
import { NotificationType } from '../types/notification';
import { getStoredToken } from '../services/api';

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const notifications = useNotificationStore((s) => s.notifications);
  const isModalOpen = useNotificationStore((s) => s.isModalOpen);
  const selectedFilter = useNotificationStore((s) => s.selectedFilter);
  const activeToast = useNotificationStore((s) => s.activeToast);
  const unreadCount = useNotificationStore((s) => s.unreadCount());

  const addNotification = useNotificationStore((s) => s.addNotification);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const setModalOpen = useNotificationStore((s) => s.setModalOpen);
  const setSelectedFilter = useNotificationStore((s) => s.setSelectedFilter);
  const hideToast = useNotificationStore((s) => s.hideToast);

  // Initialize SignalR when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      signalRService.disconnect();
      return;
    }

    const token = getStoredToken();
    signalRService.connect(token ?? undefined);

    return () => {
      // Keep alive during navigation, disconnect on logout
    };
  }, [isAuthenticated]);

  const openNotificationCenter = useCallback(() => {
    setModalOpen(true);
  }, [setModalOpen]);

  const closeNotificationCenter = useCallback(() => {
    setModalOpen(false);
  }, [setModalOpen]);

  const simulateDemo = useCallback((type: NotificationType) => {
    notificationService.simulateDemoNotification(type);
  }, []);

  return {
    notifications,
    unreadCount,
    isModalOpen,
    selectedFilter,
    activeToast,
    openNotificationCenter,
    closeNotificationCenter,
    setSelectedFilter,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    hideToast,
    simulateDemo,
  };
}
