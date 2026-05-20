import { useState, useEffect } from 'react';
import { GeographicalLocation } from '../types';
import { apiRequest } from '../services/api';
import { API_ENDPOINTS } from '../constants/API_Endpoints';

interface UseLocationResult {
  location: GeographicalLocation | null;
  isLoading: boolean;
  error: string | null;
  isOnCampus: boolean;
  refreshLocation: () => Promise<void>;
}

export const useLocation = (): UseLocationResult => {
  const [location, setLocation] = useState<GeographicalLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnCampus, setIsOnCampus] = useState<boolean>(false);

  const fetchLocation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In real Expo app: 
      // let { status } = await Location.requestForegroundPermissionsAsync();
      // let currentLoc = await Location.getCurrentPositionAsync({});
      
      // Triangulating high-fidelity mock campus coordinate (SUSL campus example)
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockLocation: GeographicalLocation = {
        latitude: 6.7146,
        longitude: 80.7872,
        accuracy: 10,
        campusName: 'Sabaragamuwa University of Sri Lanka',
        timestamp: Date.now(),
      };
      
      setLocation(mockLocation);
      setIsOnCampus(true);
      setIsLoading(false);
      
      // Optional .NET Gateway Check
      // const checkResponse = await apiRequest.post<{ inside: boolean }>(
      //   API_ENDPOINTS.LOCATION.VERIFY_CAMPUS, 
      //   { lat: mockLocation.latitude, lng: mockLocation.longitude }
      // );
      // setIsOnCampus(checkResponse.data?.inside || false);
      
    } catch (err: any) {
      setError(err.message || 'Failed to capture GPS signal');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return {
    location,
    isLoading,
    error,
    isOnCampus,
    refreshLocation: fetchLocation,
  };
};
