import axios from 'axios';

const API_BASE = 'https://api.nearusab.me/api';

export interface TukTukDriverResponse {
  id: number;
  name: string;
  phoneNumber: string;
  plateNumber: string;
  operatingArea: string | null;
  notes: string | null;
}

export interface BusRouteResponse {
  id: number;
  routeName: string;
  startPoint: string;
  endPoint: string;
  departureTime: string;
  arrivalTime: string | null;
  busNumber: string | null;
  notes: string | null;
}

export interface TrainRouteResponse {
  id: number;
  routeName: string;
  startStation: string;
  endStation: string;
  departureTime: string;
  arrivalTime: string | null;
  trainName: string | null;
  notes: string | null;
}

// Public endpoints — view only, no auth required
export async function getTukTukDrivers(): Promise<TukTukDriverResponse[]> {
  const response = await axios.get<TukTukDriverResponse[]>(`${API_BASE}/tuktukdrivers`);
  return response.data;
}

export async function getBusRoutes(): Promise<BusRouteResponse[]> {
  const response = await axios.get<BusRouteResponse[]>(`${API_BASE}/busroutes`);
  return response.data;
}

export async function getTrainRoutes(): Promise<TrainRouteResponse[]> {
  const response = await axios.get<TrainRouteResponse[]>(`${API_BASE}/trainroutes`);
  return response.data;
}