export type AccommodationType = 'Boarding' | 'Annex' | 'Apartment';

export interface AccommodationItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
}

export interface Accommodation {
  id: string;
  title: string;
  type: AccommodationType;
  image: string;
  location: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  description: string;
  amenities: string[];
  monthlyRent: number;
  availableBeds: number;
  contactPhone: string;
  email?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
