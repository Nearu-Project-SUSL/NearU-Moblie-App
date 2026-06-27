import axios from 'axios';
import { apiClient } from './api';

const API_BASE = 'https://api.nearusab.me/api';

export interface Testimonial {
  id: number;
  message: string;
  rating: number;
  createdAt: string;
  userName: string;
  userInitial: string;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const response = await axios.get<Testimonial[]>(`${API_BASE}/testimonials`);
  return response.data;
}

export async function submitTestimonial(data: {
  message: string;
  rating: number;
}): Promise<Testimonial> {
  const response = await apiClient.post<Testimonial>('/testimonials', data);
  return response.data;
}