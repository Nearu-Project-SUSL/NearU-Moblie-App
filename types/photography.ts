export interface PhotographyPackage {
  id: string;
  photographerId: string;
  name: string;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Photographer {
  id: string;
  name: string;
  bio?: string;
  baseRatePerHour: number;
  locationName: string;
  phone: string;
  email?: string;
  imageUrl?: string;
  isActive: boolean;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  packages: PhotographyPackage[];
}
