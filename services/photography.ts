import axios from 'axios';
import { apiClient } from './api';
import { API_BASE_URL } from '../constants/API_Endpoints';
import { Photographer, PhotographyPackage } from '../types/photography';

function unwrapResponse<T>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

function mapPhotographer(raw: any, index: number): Photographer {
  return {
    id: String(raw.id ?? raw.photographerId ?? raw._id ?? `photographer-${index}`),
    name: String(raw.name ?? 'Untitled Photographer'),
    bio: raw.bio ? String(raw.bio) : undefined,
    baseRatePerHour: Number(raw.baseRatePerHour ?? raw.rate ?? raw.price ?? 0),
    locationName: String(raw.locationName ?? raw.location ?? 'Campus Area'),
    phone: String(raw.phone ?? raw.phoneNumber ?? ''),
    email: raw.email ? String(raw.email) : undefined,
    imageUrl: raw.imageUrl ? String(raw.imageUrl) : undefined,
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
    ownerId: raw.ownerId ? String(raw.ownerId) : undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    packages: Array.isArray(raw.packages)
      ? raw.packages.map((pkg: any, pIdx: number) => mapPhotographyPackage(pkg, pIdx))
      : [],
  };
}

function mapPhotographyPackage(raw: any, index: number): PhotographyPackage {
  return {
    id: String(raw.id ?? raw.packageId ?? raw._id ?? `pkg-${index}`),
    photographerId: String(raw.photographerId ?? ''),
    name: String(raw.name ?? 'Standard Package'),
    price: Number(raw.price ?? raw.amount ?? 0),
    description: raw.description ? String(raw.description) : undefined,
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/**
 * Fetch all photographers
 */
export async function getAllPhotographers(): Promise<Photographer[]> {
  const response = await axios.get(`${API_BASE_URL}/photographers`);
  const payload = unwrapResponse<any[]>(response.data);
  const rows = Array.isArray(payload) ? payload : [];
  return rows.map((row, index) => mapPhotographer(row, index));
}

/**
 * Fetch a photographer by ID
 */
export async function getPhotographerById(id: string): Promise<Photographer> {
  const response = await axios.get(`${API_BASE_URL}/photographers/${encodeURIComponent(id)}`);
  const payload = unwrapResponse<any>(response.data);
  return mapPhotographer(payload, 0);
}

/**
 * Create a new photographer profile (Business/Admin only)
 */
export async function createPhotographer(data: {
  name: string;
  bio?: string;
  baseRatePerHour: number;
  locationName: string;
  phone: string;
  email?: string;
  image?: { uri: string; name: string; type: string } | null;
}): Promise<Photographer> {
  const formData = new FormData();
  formData.append('Name', data.name);
  if (data.bio) formData.append('Bio', data.bio);
  formData.append('BaseRatePerHour', String(data.baseRatePerHour));
  formData.append('LocationName', data.locationName);
  formData.append('Phone', data.phone);
  if (data.email) formData.append('Email', data.email);

  if (data.image) {
    formData.append('Image', {
      uri: data.image.uri,
      name: data.image.name,
      type: data.image.type,
    } as any);
  }

  const response = await apiClient.post<any>('/photographers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const payload = unwrapResponse<any>(response.data);
  return mapPhotographer(payload, 0);
}

/**
 * Update an existing photographer profile
 */
export async function updatePhotographer(
  id: string,
  data: {
    name: string;
    bio?: string;
    baseRatePerHour: number;
    locationName: string;
    phone: string;
    email?: string;
    isActive: boolean;
    image?: { uri: string; name: string; type: string } | null;
  }
): Promise<Photographer> {
  const formData = new FormData();
  formData.append('Name', data.name);
  if (data.bio) formData.append('Bio', data.bio);
  formData.append('BaseRatePerHour', String(data.baseRatePerHour));
  formData.append('LocationName', data.locationName);
  formData.append('Phone', data.phone);
  if (data.email) formData.append('Email', data.email);
  formData.append('IsActive', String(data.isActive));

  if (data.image) {
    formData.append('Image', {
      uri: data.image.uri,
      name: data.image.name,
      type: data.image.type,
    } as any);
  }

  const response = await apiClient.put<any>(`/photographers/${encodeURIComponent(id)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const payload = unwrapResponse<any>(response.data);
  return mapPhotographer(payload, 0);
}

/**
 * Delete a photographer profile
 */
export async function deletePhotographer(id: string): Promise<void> {
  await apiClient.delete(`/photographers/${encodeURIComponent(id)}`);
}

/**
 * Add a pricing package to a photographer's profile
 */
export async function addPhotographyPackage(
  photographerId: string,
  data: {
    name: string;
    price: number;
    description?: string;
  }
): Promise<PhotographyPackage> {
  const response = await apiClient.post<any>(
    `/photographers/${encodeURIComponent(photographerId)}/packages`,
    {
      name: data.name,
      price: data.price,
      description: data.description,
    }
  );
  const payload = unwrapResponse<any>(response.data);
  return mapPhotographyPackage(payload, 0);
}

/**
 * Update a photography package
 */
export async function updatePhotographyPackage(
  packageId: string,
  data: {
    name: string;
    price: number;
    description?: string;
    isActive: boolean;
  }
): Promise<PhotographyPackage> {
  const response = await apiClient.put<any>(
    `/photographers/packages/${encodeURIComponent(packageId)}`,
    {
      name: data.name,
      price: data.price,
      description: data.description,
      isActive: data.isActive,
    }
  );
  const payload = unwrapResponse<any>(response.data);
  return mapPhotographyPackage(payload, 0);
}

/**
 * Delete a photography package
 */
export async function deletePhotographyPackage(packageId: string): Promise<void> {
  await apiClient.delete(`/photographers/packages/${encodeURIComponent(packageId)}`);
}
