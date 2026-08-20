/**
 * notificationStore.ts
 *
 * Global Zustand store for the NearU In-App Notification Center and Top Banner Alerts.
 * Persists up to 50 notifications in SecureStore across app sessions.
 */

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AppNotification, NotificationType } from '../types/notification';
import { HapticService } from '../services/HapticService';

// SecureStore-backed storage adapter for Zustand
const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(name) : null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.setItem(name, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (err) {
      console.warn('[NotificationStore] SecureStore write error:', err);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.removeItem(name);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {}
  },
};

export interface ToastPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  route?: string;
  rideId?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  isModalOpen: boolean;
  activeToast: ToastPayload | null;
  selectedFilter: 'all' | NotificationType;

  // Actions
  addNotification: (
    n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>,
    options?: { showToast?: boolean; haptic?: boolean }
  ) => AppNotification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  setModalOpen: (isOpen: boolean) => void;
  setSelectedFilter: (filter: 'all' | NotificationType) => void;
  showToast: (toast: ToastPayload) => void;
  hideToast: () => void;

  // Computed
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isModalOpen: false,
      activeToast: null,
      selectedFilter: 'all',

      addNotification: (n, options = { showToast: true, haptic: true }) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newNotif: AppNotification = {
          ...n,
          id,
          createdAt: new Date().toISOString(),
          read: false,
        };

        set((state) => {
          // Prepend and cap at 50 items
          const updated = [newNotif, ...state.notifications].slice(0, 50);
          return { notifications: updated };
        });

        if (options.haptic !== false) {
          try {
            HapticService.triggerNotification();
          } catch {}
        }

        if (options.showToast !== false) {
          set({
            activeToast: {
              id: newNotif.id,
              type: newNotif.type,
              title: newNotif.title,
              message: newNotif.message,
              route: newNotif.route,
              rideId: newNotif.rideId,
            },
          });
        }

        return newNotif;
      },

      markAsRead: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllAsRead: () => {
        try {
          HapticService.triggerSelection();
        } catch {}
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      deleteNotification: (id: string) => {
        try {
          HapticService.triggerSelection();
        } catch {}
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll: () => {
        try {
          HapticService.triggerWarning();
        } catch {}
        set({ notifications: [] });
      },

      setModalOpen: (isOpen: boolean) => {
        try {
          HapticService.triggerSelection();
        } catch {}
        set({ isModalOpen: isOpen });
      },

      setSelectedFilter: (filter) => {
        try {
          HapticService.triggerSelection();
        } catch {}
        set({ selectedFilter: filter });
      },

      showToast: (toast) => set({ activeToast: toast }),
      hideToast: () => set({ activeToast: null }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: 'nearu_notifications_storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        // Only persist the notification list array
        notifications: state.notifications,
      }),
    }
  )
);
