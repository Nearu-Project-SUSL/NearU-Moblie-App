import axios from 'axios';
import { apiClient } from './api';
import { API_BASE_URL } from '../constants/API_Endpoints';

export interface GiftProductResponseDto {
  id: string;
  giftShopId: string;
  name: string;
  photoUrl: string | null;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GiftShopResponseDto {
  id: string;
  name: string;
  imageUrl: string | null;
  locationName: string;
  phone: string;
  email: string | null;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products: GiftProductResponseDto[];
}

export interface GiftShopQueryParams {
  keyword?: string;
  location?: string;
  isActive?: boolean;
}

/**
 * Fetch all gift shops based on filters
 */
export async function getAllGiftShops(params: GiftShopQueryParams = {}): Promise<GiftShopResponseDto[]> {
  const queryParams = new URLSearchParams();
  if (params.keyword?.trim()) queryParams.set('keyword', params.keyword.trim());
  if (params.location?.trim()) queryParams.set('location', params.location.trim());
  if (params.isActive !== undefined) queryParams.set('isActive', params.isActive.toString());

  const response = await axios.get<GiftShopResponseDto[]>(
    `${API_BASE_URL}/GiftShops?${queryParams.toString()}`
  );
  return response.data;
}

/**
 * Fetch a single gift shop details by ID
 */
export async function getGiftShopById(id: string): Promise<GiftShopResponseDto> {
  const response = await axios.get<GiftShopResponseDto>(`${API_BASE_URL}/GiftShops/${id}`);
  return response.data;
}

/**
 * Create a new gift shop (Admin/Owner only)
 */
export async function createGiftShop(data: {
  name: string;
  locationName: string;
  phone: string;
  email?: string;
  address: string;
  image?: { uri: string; name: string; type: string } | null;
}): Promise<GiftShopResponseDto> {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('locationName', data.locationName);
  formData.append('phone', data.phone);
  if (data.email) formData.append('email', data.email);
  formData.append('address', data.address);
  formData.append('isActive', 'true');
  
  if (data.image) {
    formData.append('image', {
      uri: data.image.uri,
      name: data.image.name,
      type: data.image.type,
    } as any);
  }

  const response = await apiClient.post<GiftShopResponseDto>('/GiftShops', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Update an existing gift shop (Admin/Owner only)
 */
export async function updateGiftShop(
  id: string,
  data: {
    name?: string;
    locationName?: string;
    phone?: string;
    email?: string;
    address?: string;
    isActive?: boolean;
    image?: { uri: string; name: string; type: string } | null;
  }
): Promise<GiftShopResponseDto> {
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.locationName) formData.append('locationName', data.locationName);
  if (data.phone) formData.append('phone', data.phone);
  if (data.email !== undefined) formData.append('email', data.email);
  if (data.address) formData.append('address', data.address);
  if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
  
  if (data.image) {
    formData.append('image', {
      uri: data.image.uri,
      name: data.image.name,
      type: data.image.type,
    } as any);
  }

  const response = await apiClient.put<GiftShopResponseDto>(`/GiftShops/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Delete a gift shop (Admin/Owner only)
 */
export async function deleteGiftShop(id: string): Promise<void> {
  await apiClient.delete(`/GiftShops/${id}`);
}

/**
 * Add a new product to a gift shop (Admin/Owner only)
 */
export async function addGiftProduct(
  giftShopId: string,
  data: {
    name: string;
    price: number;
    image?: { uri: string; name: string; type: string } | null;
  }
): Promise<GiftProductResponseDto> {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('price', data.price.toString());
  formData.append('isActive', 'true');
  
  if (data.image) {
    formData.append('image', {
      uri: data.image.uri,
      name: data.image.name,
      type: data.image.type,
    } as any);
  }

  const response = await apiClient.post<GiftProductResponseDto>(
    `/GiftShops/${giftShopId}/products`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

/**
 * Update an existing gift product (Admin/Owner only)
 */
export async function updateGiftProduct(
  productId: string,
  data: {
    name?: string;
    price?: number;
    isActive?: boolean;
    image?: { uri: string; name: string; type: string } | null;
  }
): Promise<GiftProductResponseDto> {
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.price !== undefined) formData.append('price', data.price.toString());
  if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
  
  if (data.image) {
    formData.append('image', {
      uri: data.image.uri,
      name: data.image.name,
      type: data.image.type,
    } as any);
  }

  const response = await apiClient.put<GiftProductResponseDto>(
    `/GiftShops/products/${productId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

/**
 * Delete a gift product (Admin/Owner only)
 */
export async function deleteGiftProduct(productId: string): Promise<void> {
  await apiClient.delete(`/GiftShops/products/${productId}`);
}
