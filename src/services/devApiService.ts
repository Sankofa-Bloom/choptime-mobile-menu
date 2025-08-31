// Development API Service
// Provides mock data and development-specific API handling

interface MockDeliveryZone {
  id: string;
  town: string;
  zone_name: string;
  distance_min: number;
  distance_max: number;
  fee: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface MockDish {
  id: string;
  name: string;
  description: string;
  price: number;
  restaurant_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface MockRestaurant {
  id: string;
  name: string;
  description: string;
  town: string;
  active: boolean;
  delivery_time_min: number;
  delivery_time_max: number;
  created_at: string;
  updated_at: string;
}

interface MockRestaurantMenu {
  id: string;
  restaurant_id: string;
  dish_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Mock data for development
const mockDeliveryZones: MockDeliveryZone[] = [
  // Buea zones
  {
    id: '1',
    town: 'Buea',
    zone_name: 'Town Center (0-2km)',
    distance_min: 0,
    distance_max: 2,
    fee: 500,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    town: 'Buea',
    zone_name: 'Suburbs (2-5km)',
    distance_min: 2,
    distance_max: 5,
    fee: 800,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    town: 'Buea',
    zone_name: 'Outskirts (5km+)',
    distance_min: 5,
    distance_max: 20,
    fee: 1200,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Limbe zones (updated with locality-based pricing)
  {
    id: '4',
    town: 'Limbe',
    zone_name: 'Zone A (Ngueme, Isololo, Carata, Mile 4, Saker Junction, Down Beach)',
    distance_min: 0,
    distance_max: 10,
    fee: 1000,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    town: 'Limbe',
    zone_name: 'Zone B (Red Cross, Bundes, Middle Farms, Church Street, Busumbu, Behind GHS)',
    distance_min: 0,
    distance_max: 10,
    fee: 800,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '6',
    town: 'Limbe',
    zone_name: 'Zone C (Mile 2)',
    distance_min: 0,
    distance_max: 10,
    fee: 600,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockDishes: MockDish[] = [
  {
    id: '1',
    name: 'Eru',
    description: 'Traditional Cameroonian vegetable soup with spinach-like leaves',
    price: 2500,
    restaurant_id: '1',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Achu',
    description: 'Yellow soup with cocoyam and various meats',
    price: 3000,
    restaurant_id: '1',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Ndolé',
    description: 'National dish with groundnuts and bitter leaves',
    price: 3500,
    restaurant_id: '2',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockRestaurants: MockRestaurant[] = [
  {
    id: '1',
    name: 'Mama\'s Kitchen',
    description: 'Authentic Cameroonian home cooking',
    town: 'Buea',
    active: true,
    delivery_time_min: 20,
    delivery_time_max: 40,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Traditional Taste',
    description: 'Best traditional dishes in town',
    town: 'Limbe',
    active: true,
    delivery_time_min: 25,
    delivery_time_max: 45,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockRestaurantMenus: MockRestaurantMenu[] = [
  {
    id: '1',
    restaurant_id: '1',
    dish_id: '1',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    restaurant_id: '1',
    dish_id: '2',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    restaurant_id: '2',
    dish_id: '3',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Development API handlers
export const devApiHandlers = {
  'api/delivery-zones': () => mockDeliveryZones,
  'api/dishes': () => mockDishes,
  'api/restaurants': (params?: URLSearchParams) => {
    const town = params?.get('town');
    if (town) {
      return mockRestaurants.filter(r => r.town.toLowerCase() === town.toLowerCase());
    }
    return mockRestaurants;
  },
  'api/restaurant-menus': (params?: URLSearchParams) => {
    const town = params?.get('town');
    if (town) {
      const townRestaurants = mockRestaurants.filter(r => r.town.toLowerCase() === town.toLowerCase());
      const restaurantIds = townRestaurants.map(r => r.id);
      return mockRestaurantMenus.filter(rm => restaurantIds.includes(rm.restaurant_id));
    }
    return mockRestaurantMenus;
  }
};

// Check if we should use mock data
export const shouldUseMockData = (): boolean => {
  // Explicit setting takes precedence
  if (import.meta.env.VITE_USE_MOCK_DATA !== undefined) {
    return import.meta.env.VITE_USE_MOCK_DATA === 'true';
  }
  
  // Default fallback: use mock data only if in development and no Supabase URL
  return import.meta.env.DEV === true && !import.meta.env.VITE_SUPABASE_URL;
};

// Development API interceptor
export const handleDevApiCall = async (endpoint: string): Promise<any> => {
  console.log('🧪 DEV API: Handling', endpoint);
  
  // Parse endpoint and query params
  const [path, queryString] = endpoint.split('?');
  const params = queryString ? new URLSearchParams(queryString) : undefined;
  
  // Find handler
  const handler = devApiHandlers[path as keyof typeof devApiHandlers];
  
  if (handler) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    
    const result = handler(params);
    console.log('✅ DEV API: Response for', endpoint, result);
    return result;
  }
  
  throw new Error(`No dev handler for endpoint: ${endpoint}`);
};
