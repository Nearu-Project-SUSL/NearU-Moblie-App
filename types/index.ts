/**
 * NearU Global Interface & Type Definitions
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studentIdCardNumber?: string;
  isStudentVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export type ServiceCategory = 'food' | 'print' | 'laundry' | 'errand' | 'other';

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  deliveryTimeMinutes: number;
  category: ServiceCategory;
  imageUrl?: string;
  providerName: string;
  isAvailable: boolean;
}

export type OrderStatus = 'pending' | 'preparing' | 'in_transit' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  serviceId: string;
  serviceTitle: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  estimatedDeliveryTime: string;
  deliveryLocation: GeographicalLocation;
  createdAt: string;
  updatedAt: string;
}

export interface GeographicalLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  campusName?: string;
  timestamp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}
