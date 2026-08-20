/**
 * NearU Notification Type Definitions
 * Matches the design tokens, classification schema, and SignalR contracts
 * established in NearU-Frontend and NearU-Backend.
 */

export type NotificationType =
  | 'ride'
  | 'order'
  | 'job'
  | 'accommodation'
  | 'deal'
  | 'gift'
  | 'general';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** ISO-8601 timestamp string */
  createdAt: string;
  read: boolean;
  /** Optional in-app deep-link route (e.g. '/(tabs)/rides', '/deals', '/food') */
  route?: string;
  /** Optional ride identifier */
  rideId?: string;
  /** Optional metadata payload */
  metadata?: Record<string, any>;
}

export type NotificationFilter = 'all' | NotificationType;

export interface NotificationTypeMeta {
  label: string;
  gradientColors: [string, string, ...string[]];
  glowColor: string;
  accentColor: string;
  badgeBg: string;
  iconName: string;
}

export const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  ride: {
    label: 'Rides',
    gradientColors: ['#22d3ee', '#0ea5e9', '#2563eb'],
    glowColor: 'rgba(34, 211, 238, 0.4)',
    accentColor: '#22d3ee',
    badgeBg: 'rgba(34, 211, 238, 0.14)',
    iconName: 'Bike',
  },
  order: {
    label: 'Orders',
    gradientColors: ['#fb923c', '#f97316', '#ef4444'],
    glowColor: 'rgba(249, 115, 22, 0.4)',
    accentColor: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.14)',
    iconName: 'Package',
  },
  job: {
    label: 'Jobs',
    gradientColors: ['#a855f7', '#8b5cf6', '#6366f1'],
    glowColor: 'rgba(139, 92, 246, 0.4)',
    accentColor: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.14)',
    iconName: 'Briefcase',
  },
  accommodation: {
    label: 'Stay',
    gradientColors: ['#f472b6', '#ec4899', '#e11d48'],
    glowColor: 'rgba(236, 72, 153, 0.4)',
    accentColor: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.14)',
    iconName: 'Home',
  },
  deal: {
    label: 'Deals',
    gradientColors: ['#34d399', '#10b981', '#0d9488'],
    glowColor: 'rgba(52, 211, 153, 0.4)',
    accentColor: '#34d399',
    badgeBg: 'rgba(52, 211, 153, 0.14)',
    iconName: 'Tag',
  },
  gift: {
    label: 'Gifts',
    gradientColors: ['#fde047', '#f59e0b', '#ea580c'],
    glowColor: 'rgba(245, 158, 11, 0.4)',
    accentColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.14)',
    iconName: 'Gift',
  },
  general: {
    label: 'General',
    gradientColors: ['#94a3b8', '#64748b', '#475569'],
    glowColor: 'rgba(148, 163, 184, 0.4)',
    accentColor: '#94a3b8',
    badgeBg: 'rgba(148, 163, 184, 0.14)',
    iconName: 'Bell',
  },
};
