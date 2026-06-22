import axios from 'axios';
import { apiClient } from './api';
import { API_BASE_URL } from '../constants/API_Endpoints';

const API_BASE = API_BASE_URL;

export interface ShopResponse {
  id: string;
  ownerId: string | null;
  name: string;
  description: string | null;
  address: string | null;
  phoneNumber: string | null;
  photoUrl: string | null;
  createdAt: string;
  category: string;
  menuItemCount: number;
}

export interface MenuItemResponse {
  id: string;
  foodShopId: string;
  name: string;
  description: string | null;
  price: number;
  photoUrl: string | null;
  createdAt: string;
}

export interface GetShopsParams {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
}

export interface PagedShopResponse {
  items: ShopResponse[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Public endpoints
export async function getAllShops(params: GetShopsParams = {}): Promise<PagedShopResponse> {
  const { page = 1, pageSize = 10, category, search } = params;
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('pageSize', pageSize.toString());
  if (category && category !== 'All') queryParams.set('category', category);
  if (search?.trim()) queryParams.set('search', search.trim());

  const response = await axios.get<PagedShopResponse>(
    `${API_BASE}/foodshops?${queryParams.toString()}`
  );
  return response.data;
}

export async function getShopById(id: string): Promise<ShopResponse> {
  const response = await axios.get<ShopResponse>(`${API_BASE}/foodshops/${id}`);
  return response.data;
}

export async function getMenuItems(shopId: string): Promise<MenuItemResponse[]> {
  const response = await axios.get<MenuItemResponse[]>(
    `${API_BASE}/foodshops/${shopId}/menuitems`
  );
  return response.data;
}

export async function getCategories(): Promise<string[]> {
  const response = await axios.get<string[]>(`${API_BASE}/foodshops/categories`);
  return response.data;
}

// Authenticated endpoints — owner/admin only
export async function updateShop(
  shopId: string,
  data: {
    name?: string;
    description?: string;
    address?: string;
    phoneNumber?: string;
    category?: string;
    photo?: { uri: string; name: string; type: string } | null;
  }
): Promise<ShopResponse> {
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.description !== undefined) formData.append('description', data.description);
  if (data.address !== undefined) formData.append('address', data.address);
  if (data.phoneNumber !== undefined) formData.append('phoneNumber', data.phoneNumber);
  if (data.category) formData.append('category', data.category);
  if (data.photo) {
    formData.append('photo', {
      uri: data.photo.uri,
      name: data.photo.name,
      type: data.photo.type,
    } as any);
  }

  const response = await apiClient.put<ShopResponse>(`/foodshops/${shopId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteShop(shopId: string): Promise<void> {
  await apiClient.delete(`/foodshops/${shopId}`);
}