import axios from 'axios';
import { apiClient } from './api';
import { API_BASE_URL } from '../constants/API_Endpoints';
import { Accommodation, AccommodationItem, AccommodationType } from '../types/accommodation';

// Helper to unwrap responses if they have a { data: ... } structure from .NET
function unwrapResponse<T>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

function toAccommodationType(type: any): AccommodationType {
  const value = String(type ?? '').toLowerCase();
  if (value === 'boarding') return 'Boarding';
  if (value === 'annex') return 'Annex';
  return 'Apartment';
}

function mapAccommodation(raw: any, index: number): Accommodation {
  const amenitiesRaw = raw.amenities;
  const amenities = Array.isArray(amenitiesRaw)
    ? amenitiesRaw.map((item: any) => String(item)).filter((item: string) => item.length > 0)
    : [];

  const imagesRaw = raw.images;
  const imageFromArray = Array.isArray(imagesRaw)
    ? imagesRaw.find((img: any) => typeof img === 'string')
    : undefined;

  const locationParts = [raw.location, raw.address, raw.city]
    .filter((item) => typeof item === 'string')
    .map(String);

  return {
    id: String(raw.id ?? raw.accommodationId ?? raw._id ?? `accommodation-${index}`),
    title: String(raw.title ?? raw.name ?? 'Untitled Accommodation'),
    type: toAccommodationType(raw.type ?? raw.category),
    image: String(
      raw.photoUrl ??
        raw.image ??
        raw.imageUrl ??
        imageFromArray ??
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1400&q=80'
    ),
    location: locationParts.length > 0 ? locationParts.join(', ') : 'Location not specified',
    distanceKm: Number(raw.distanceKm ?? raw.distance ?? 0),
    rating: Number(raw.rating ?? raw.averageRating ?? 0),
    reviews: Number(raw.reviews ?? raw.reviewCount ?? 0),
    description: String(raw.description ?? 'No description available.'),
    amenities,
    monthlyRent: Number(raw.monthlyRent ?? raw.rent ?? raw.price ?? 0),
    availableBeds: Number(raw.availableBeds ?? raw.bedsAvailable ?? 0),
    contactPhone: String(raw.phoneNumber ?? raw.contactPhone ?? raw.phone ?? raw.ownerPhone ?? ''),
    email: String(raw.email ?? raw.ownerEmail ?? ''),
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapAccommodationItem(raw: any, index: number): AccommodationItem {
  return {
    id: String(raw.id ?? raw.itemId ?? raw._id ?? `item-${index}`),
    name: String(raw.name ?? raw.title ?? 'Item'),
    description: String(raw.description ?? ''),
    price: Number(raw.price ?? raw.amount ?? 0),
    isAvailable: Boolean(raw.isAvailable ?? raw.available ?? true),
  };
}

/**
 * Fetch all accommodations
 */
export async function getAllAccommodations(): Promise<Accommodation[]> {
  const response = await axios.get(`${API_BASE_URL}/accommodations`);
  const payload = unwrapResponse<any[]>(response.data);
  const rows = Array.isArray(payload) ? payload : [];
  return rows.map((row, index) => mapAccommodation(row, index));
}

/**
 * Fetch a single accommodation by ID
 */
export async function getAccommodationById(id: string): Promise<Accommodation> {
  const response = await axios.get(`${API_BASE_URL}/accommodations/${encodeURIComponent(id)}`);
  const payload = unwrapResponse<any>(response.data);
  return mapAccommodation(payload, 0);
}

/**
 * Create a new accommodation (Admin/Host only)
 */
export async function createAccommodation(data: {
  title: string;
  type: string;
  location: string;
  distanceKm: number;
  monthlyRent: number;
  availableBeds: number;
  contactPhone: string;
  description: string;
  image?: { uri: string; name: string; type: string } | null;
}): Promise<Accommodation> {
  const formData = new FormData();
  formData.append('Name', data.title);
  formData.append('Address', data.location);
  formData.append('PhoneNumber', data.contactPhone);
  formData.append('Description', data.description || '');
  formData.append('Type', data.type);
  formData.append('DistanceKm', String(data.distanceKm ?? 0));
  formData.append('MonthlyRent', String(data.monthlyRent ?? 0));
  formData.append('AvailableBeds', String(data.availableBeds ?? 0));
  
  if (data.image) {
    formData.append('Photo', {
      uri: data.image.uri,
      name: data.image.name,
      type: data.image.type,
    } as any);
  }

  const response = await apiClient.post<any>('/accommodations', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const payload = unwrapResponse<any>(response.data);
  return mapAccommodation(payload, 0);
}

/**
 * Update an existing accommodation (Admin/Owner only)
 */
export async function updateAccommodation(
  id: string,
  data: {
    title: string;
    type: string;
    location: string;
    distanceKm: number;
    monthlyRent: number;
    availableBeds: number;
    contactPhone: string;
    description: string;
    image?: { uri: string; name: string; type: string } | null;
  }
): Promise<Accommodation> {
  const formData = new FormData();
  formData.append('Name', data.title);
  formData.append('Address', data.location);
  formData.append('PhoneNumber', data.contactPhone);
  formData.append('Description', data.description || '');
  formData.append('Type', data.type);
  formData.append('DistanceKm', String(data.distanceKm ?? 0));
  formData.append('MonthlyRent', String(data.monthlyRent ?? 0));
  formData.append('AvailableBeds', String(data.availableBeds ?? 0));
  
  if (data.image) {
    formData.append('Photo', {
      uri: data.image.uri,
      name: data.image.name,
      type: data.image.type,
    } as any);
  }

  const response = await apiClient.put<any>(`/accommodations/${encodeURIComponent(id)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const payload = unwrapResponse<any>(response.data);
  return mapAccommodation(payload, 0);
}

/**
 * Delete an accommodation (Admin/Owner only)
 */
export async function deleteAccommodation(id: string): Promise<void> {
  await apiClient.delete(`/accommodations/${encodeURIComponent(id)}`);
}

/**
 * Fetch all items (rooms/beds) for an accommodation
 */
export async function getAccommodationItems(accommodationId: string): Promise<AccommodationItem[]> {
  const response = await axios.get(`${API_BASE_URL}/accommodations/${encodeURIComponent(accommodationId)}/items`);
  const payload = unwrapResponse<any[]>(response.data);
  const rows = Array.isArray(payload) ? payload : [];
  return rows.map((row, index) => mapAccommodationItem(row, index));
}

/**
 * Add a new item (room/bed) to an accommodation
 */
export async function createAccommodationItem(
  accommodationId: string,
  data: {
    name: string;
    description: string;
    price: number;
  }
): Promise<AccommodationItem> {
  const formData = new FormData();
  formData.append('Name', data.name);
  formData.append('Description', data.description || '');
  formData.append('Price', String(data.price));

  const response = await apiClient.post<any>(
    `/accommodations/${encodeURIComponent(accommodationId)}/items`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  const payload = unwrapResponse<any>(response.data);
  return mapAccommodationItem(payload, 0);
}

/**
 * Update an existing accommodation item
 */
export async function updateAccommodationItem(
  accommodationId: string,
  itemId: string,
  data: {
    name: string;
    description: string;
    price: number;
  }
): Promise<AccommodationItem> {
  const formData = new FormData();
  formData.append('Name', data.name);
  formData.append('Description', data.description || '');
  formData.append('Price', String(data.price));

  const response = await apiClient.put<any>(
    `/accommodations/${encodeURIComponent(accommodationId)}/items/${encodeURIComponent(itemId)}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  const payload = unwrapResponse<any>(response.data);
  return mapAccommodationItem(payload, 0);
}

/**
 * Delete an accommodation item
 */
export async function deleteAccommodationItem(accommodationId: string, itemId: string): Promise<void> {
  await apiClient.delete(`/accommodations/${encodeURIComponent(accommodationId)}/items/${encodeURIComponent(itemId)}`);
}
