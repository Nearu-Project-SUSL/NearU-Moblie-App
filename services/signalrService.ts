/**
 * signalrService.ts
 *
 * Real-time SignalR connection client for the NearU mobile app.
 * Connects to the .NET backend Hub at `/hubs/rides` to handle live ride notifications,
 * state changes, and driver location updates.
 */

import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { API_BASE_URL } from '../constants/API_Endpoints';
import { useNotificationStore } from '../store/notificationStore';
import { getStoredToken } from './api';

export const HUB_EVENTS = {
  RECEIVE_RIDE_REQUEST: 'NewRideAvailable',
  RIDE_STATE_CHANGED: 'RideStateChanged',
  LOCATION_UPDATED: 'LocationUpdated',
} as const;

export interface RideStatePayload {
  rideId: string;
  status: string; // 'Pending'|'Accepted'|'RiderEnRoute'|'RiderArrived'|'InProgress'|'PendingConfirmation'|'Completed'|'Cancelled'
  updatedAtUtc: string;
}

export interface LocationPayload {
  rideId: string;
  latitude: number;
  longitude: number;
  distanceToPickupKm?: number;
  timestamp: string;
}

export interface NewRidePayload {
  rideId: string;
  serviceType?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  estimatedFare?: number;
  distanceKm?: number;
  createdAtUtc?: string;
}

export interface HubCallbacks {
  onRideRequest?: (payload: NewRidePayload) => void;
  onRideStateChanged?: (payload: RideStatePayload) => void;
  onLocationUpdated?: (payload: LocationPayload) => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
  onDisconnected?: (error?: Error) => void;
}

const STATUS_NOTIFICATION_MESSAGES: Record<string, { title: string; message: string }> = {
  Accepted: {
    title: 'Rider Accepted 🛵',
    message: 'Your rider is on the way to pick you up!',
  },
  RiderEnRoute: {
    title: 'Rider En Route 📍',
    message: 'Your rider is approaching your pickup point.',
  },
  RiderArrived: {
    title: 'Rider Arrived 🔔',
    message: 'Your rider is waiting at the pickup location.',
  },
  InProgress: {
    title: 'Trip Started 🚀',
    message: 'Your campus ride is now in progress. Enjoy the ride!',
  },
  PendingConfirmation: {
    title: 'Trip Arrived 🏁',
    message: 'Rider marked trip complete. Please confirm in the app.',
  },
  CompletedByRider: {
    title: 'Trip Complete - Confirm? 🏁',
    message: 'Your rider completed the ride. Tap to confirm & rate!',
  },
  Completed: {
    title: 'Ride Completed 🎉',
    message: 'Thank you for riding with NearU! Have a great day.',
  },
  Cancelled: {
    title: 'Ride Cancelled ⚠️',
    message: 'The ride request was cancelled.',
  },
};

class SignalRService {
  private connection: HubConnection | null = null;
  private callbacks: HubCallbacks = {};
  private hubUrl: string = '';
  private isConnecting: boolean = false;

  get isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  get state(): HubConnectionState | null {
    return this.connection?.state ?? null;
  }

  /**
   * Initialize and start the SignalR connection
   */
  async connect(token?: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
      this.hubUrl = `${baseUrl}/hubs/rides`;

      this.connection = new HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          accessTokenFactory: () => {
            const currentToken = token || getStoredToken() || '';
            return currentToken;
          },
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delays = [0, 2000, 5000, 10000, 20000];
            return delays[retryContext.previousRetryCount] ?? null;
          },
        })
        .configureLogging(__DEV__ ? LogLevel.Information : LogLevel.Error)
        .build();

      this.registerHandlers();

      await this.connection.start();
      console.log('[SignalR] Connected successfully to NearU RidesHub.');
    } catch (err) {
      console.warn('[SignalR] Connection start failed (will retry on next activity):', err);
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {}
      this.connection = null;
      console.log('[SignalR] Disconnected.');
    }
  }

  private registerHandlers(): void {
    if (!this.connection) return;

    // 1. New Ride broadcast
    this.connection.on(HUB_EVENTS.RECEIVE_RIDE_REQUEST, (payload: NewRidePayload) => {
      console.log('[SignalR] NewRideAvailable received:', payload);
      this.callbacks.onRideRequest?.(payload);

      useNotificationStore.getState().addNotification({
        type: 'ride',
        title: '🛵 New Ride Request',
        message: payload.serviceType
          ? `New ${payload.serviceType} request available nearby.`
          : 'A new ride request is available nearby.',
        route: '/(tabs)/rides',
        rideId: payload.rideId,
      });
    });

    // 2. Ride State Change
    this.connection.on(HUB_EVENTS.RIDE_STATE_CHANGED, (payload: RideStatePayload) => {
      console.log('[SignalR] RideStateChanged received:', payload);
      this.callbacks.onRideStateChanged?.(payload);

      const notifInfo = STATUS_NOTIFICATION_MESSAGES[payload.status];
      if (notifInfo) {
        useNotificationStore.getState().addNotification({
          type: 'ride',
          title: notifInfo.title,
          message: notifInfo.message,
          route: '/(tabs)/rides',
          rideId: payload.rideId,
        });
      }
    });

    // 3. Live Driver GPS Location update
    this.connection.on(HUB_EVENTS.LOCATION_UPDATED, (payload: LocationPayload) => {
      this.callbacks.onLocationUpdated?.(payload);
    });

    // Lifecycle handlers
    this.connection.onreconnecting(() => {
      console.log('[SignalR] Reconnecting to hub...');
      this.callbacks.onReconnecting?.();
    });

    this.connection.onreconnected(() => {
      console.log('[SignalR] Reconnected to hub.');
      this.callbacks.onReconnected?.();
    });

    this.connection.onclose((error) => {
      console.log('[SignalR] Connection closed.', error);
      this.callbacks.onDisconnected?.(error);
    });
  }

  setCallbacks(callbacks: HubCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  clearCallbacks(): void {
    this.callbacks = {};
  }

  private async invoke(method: string, ...args: unknown[]): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      console.warn(`[SignalR] Cannot invoke "${method}" - not connected.`);
      return;
    }
    try {
      await this.connection.invoke(method, ...args);
    } catch (err) {
      console.warn(`[SignalR] Error invoking "${method}":`, err);
    }
  }

  async goOnline(): Promise<void> {
    await this.invoke('GoOnline');
  }

  async goOffline(): Promise<void> {
    await this.invoke('GoOffline');
  }

  async joinRideChannel(rideId: string): Promise<void> {
    await this.invoke('JoinRideChannel', rideId);
  }

  async leaveRideChannel(rideId: string): Promise<void> {
    await this.invoke('LeaveRideChannel', rideId);
  }
}

export const signalRService = new SignalRService();
