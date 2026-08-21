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

// ── Homepage Types ──────────────────────────────────────────────────────────

export interface HotDeal {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  imageUrl?: string;
  shopName?: string;
  shopType?: string;
  shopAddress?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}



export interface HomeService {
  id: string;
  label: string;
  description: string;
  iconName: string;
  badge?: string;
  color: string;
}

// ── Job Section Types ────────────────────────────────────────────────────────

export interface PostedByInfo {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  mobileNumber?: string;
}

export interface JobResponse {
  id: string;
  title: string;
  company: string;
  location: string;
  payRange: string;
  jobType: string;
  category: string;
  logo: string | null;
  description: string;
  longDescription: string | null;
  requirements: string[] | null;
  tags: string[] | null;
  isNew: boolean;
  postedBy: PostedByInfo;
  createdAt: string;
  postedAt?: string;
}

export interface PagedJobResponse {
  items: JobResponse[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface CreateJobData {
  title: string;
  company: string;
  location: string;
  payRange: string;
  jobType: string;
  category: string;
  logo?: string;
  description: string;
  longDescription?: string;
  requirements?: string[];
  tags?: string[];
  isNew?: boolean;
}

export interface UpdateJobData {
  title?: string;
  company?: string;
  location?: string;
  payRange?: string;
  jobType?: string;
  category?: string;
  logo?: string;
  description?: string;
  longDescription?: string;
  requirements?: string[];
  tags?: string[];
  isNew?: boolean;
}

export interface DealResponseDto {
  id: string;
  shopName: string;
  shopType: string;
  title: string;
  description: string;
  badgeText: string;
  badgeColor: string;
  imageUrl: string | null;
  validFrom: string | null;
  validTo: string | null;
  submittedByUserId: string;
  submittedByName: string;
  shopAddress: string | null;
  approvalStatus: string;
  rejectionReason: string | null;
  createdAt: string;
}

export * from './notification';
