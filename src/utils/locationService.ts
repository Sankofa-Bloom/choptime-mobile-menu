/**
 * Location Service
 * Handles Mapbox integration, location permissions, and zoning system for delivery fees
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export interface ZoneInfo {
  zone: 'A' | 'B' | 'C';
  name: string;
  localities: string[];
  deliveryFee: number;
  description: string;
}

export interface LocationData {
  coordinates?: Coordinates;
  zone?: ZoneInfo;
  address?: string;
  accuracy?: number;
  timestamp?: number;
}

// Limbe zoning configuration
const LIMBE_ZONES: ZoneInfo[] = [
  {
    zone: 'A',
    name: 'Zone A - Outer Areas',
    localities: [
      'Ngueme', 'Isokolo', 'Carata', 'Mile 4', 'Saker Junction', 'Down Beach'
    ],
    deliveryFee: 1000,
    description: 'Outer areas of Limbe with longer delivery times'
  },
  {
    zone: 'B',
    name: 'Zone B - Mid Areas',
    localities: [
      'Red Cross', 'Bundes', 'Middlefarms', 'Church Street', 'Busumbu', 'Behind GHS'
    ],
    deliveryFee: 800,
    description: 'Mid-town areas with moderate delivery times'
  },
  {
    zone: 'C',
    name: 'Zone C - Central Area',
    localities: [
      'Mile 2'
    ],
    deliveryFee: 600,
    description: 'Central business district with fastest delivery'
  }
];

class LocationService {
  private mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
  private watchId: number | null = null;
  private currentPosition: Coordinates | null = null;

  /**
   * Check if geolocation is supported
   */
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get current location permission status
   */
  getPermissionStatus(): LocationPermission {
    if (!this.isSupported()) {
      return { granted: false, denied: true, prompt: false };
    }

    // Check if we've stored permission status
    const stored = localStorage.getItem('location_permission');
    if (stored) {
      const permission = JSON.parse(stored);
      return permission;
    }

    return { granted: false, denied: false, prompt: true };
  }

  /**
   * Request location permission and get current position
   */
  async requestLocation(): Promise<LocationData | null> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coordinates: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          this.currentPosition = coordinates;

          // Store permission status
          const permission: LocationPermission = { granted: true, denied: false, prompt: false };
          localStorage.setItem('location_permission', JSON.stringify(permission));

          // Get address from coordinates
          const address = await this.reverseGeocode(coordinates);

          // Determine zone for Limbe
          const zone = this.determineZone(coordinates, address);

          const locationData: LocationData = {
            coordinates,
            zone,
            address,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };

          resolve(locationData);
        },
        (error) => {
          console.error('Location error:', error);

          let permission: LocationPermission;
          if (error.code === error.PERMISSION_DENIED) {
            permission = { granted: false, denied: true, prompt: false };
          } else {
            permission = { granted: false, denied: false, prompt: true };
          }

          localStorage.setItem('location_permission', JSON.stringify(permission));
          reject(error);
        },
        options
      );
    });
  }

  /**
   * Watch position changes
   */
  watchPosition(callback: (location: LocationData) => void): void {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported');
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute
    };

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const coordinates: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        this.currentPosition = coordinates;
        const address = await this.reverseGeocode(coordinates);
        const zone = this.determineZone(coordinates, address);

        const locationData: LocationData = {
          coordinates,
          zone,
          address,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };

        callback(locationData);
      },
      (error) => {
        console.error('Watch position error:', error);
      },
      options
    );
  }

  /**
   * Stop watching position
   */
  clearWatch(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Reverse geocode coordinates to address using Mapbox
   */
  private async reverseGeocode(coordinates: Coordinates): Promise<string> {
    if (!this.mapboxToken) {
      // Fallback to simple coordinate display
      return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.longitude},${coordinates.latitude}.json?access_token=${this.mapboxToken}&types=address&limit=1`
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }

      return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  /**
   * Determine zone based on coordinates and address for Limbe
   */
  determineZone(coordinates: Coordinates, address?: string): ZoneInfo | undefined {
    // Check if address contains Limbe
    if (!address || !address.toLowerCase().includes('limbe')) {
      return undefined;
    }

    // Check locality names in address
    for (const zone of LIMBE_ZONES) {
      for (const locality of zone.localities) {
        if (address.toLowerCase().includes(locality.toLowerCase())) {
          return zone;
        }
      }
    }

    // Default to Zone C (central) if in Limbe but locality not identified
    return LIMBE_ZONES.find(z => z.zone === 'C');
  }

  /**
   * Get zone by locality name
   */
  getZoneByLocality(locality: string): ZoneInfo | undefined {
    for (const zone of LIMBE_ZONES) {
      if (zone.localities.some(loc => loc.toLowerCase() === locality.toLowerCase())) {
        return zone;
      }
    }
    return undefined;
  }

  /**
   * Get all zones information
   */
  getAllZones(): ZoneInfo[] {
    return LIMBE_ZONES;
  }

  /**
   * Calculate delivery fee based on distance or zone
   */
  calculateDeliveryFee(locationData: LocationData, restaurantLocation?: Coordinates): number {
    // If we have zone information, use zone-based pricing
    if (locationData.zone) {
      return locationData.zone.deliveryFee;
    }

    // If we have coordinates and restaurant location, calculate distance-based fee
    if (locationData.coordinates && restaurantLocation) {
      const distance = this.calculateDistance(locationData.coordinates, restaurantLocation);

      // Distance-based pricing
      if (distance <= 2) return 600;  // Within 2km
      if (distance <= 5) return 800;  // Within 5km
      return 1000; // Over 5km
    }

    // Default fallback
    return 1000;
  }

  /**
   * Get current position
   */
  getCurrentPosition(): Coordinates | null {
    return this.currentPosition;
  }

  /**
   * Check if location is in Limbe
   */
  isInLimbe(address?: string): boolean {
    return address ? address.toLowerCase().includes('limbe') : false;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton instance
export const locationService = new LocationService();
export { LIMBE_ZONES };
export default locationService;