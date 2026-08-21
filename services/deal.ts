import axios from 'axios';
import { apiClient } from './api';
import { API_BASE_URL } from '../constants/API_Endpoints';
import { DealResponseDto } from '../types';

// Helper to unwrap responses if they have a { data: ... } structure from .NET
function unwrapResponse<T>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

/**
 * Fetch all approved deals from backend
 */
export async function getApprovedDeals(): Promise<DealResponseDto[]> {
  const response = await axios.get(`${API_BASE_URL}/deals`);
  const payload = unwrapResponse<DealResponseDto[]>(response.data);
  return Array.isArray(payload) ? payload : [];
}

/**
 * Fetch all deals submitted by current logged-in user
 */
export async function getMyDeals(): Promise<DealResponseDto[]> {
  const response = await apiClient.get('/deals/my');
  const payload = unwrapResponse<DealResponseDto[]>(response.data);
  return Array.isArray(payload) ? payload : [];
}

/**
 * Delete a deal (by ID)
 */
export async function deleteDeal(id: string): Promise<void> {
  await apiClient.delete(`/deals/${encodeURIComponent(id)}`);
}
