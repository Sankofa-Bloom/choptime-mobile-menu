// Smart API configuration that automatically switches between local server and Netlify functions
export interface ApiConfig {
  baseUrl: string;
  isLocal: boolean;
  isProduction: boolean;
  endpoints: {
    dishes: string;
    restaurants: string;
    restaurantMenus: string;
    deliveryZones: string;
    ping: string;
    [key: string]: string;
  };
}

// Detect environment and API configuration
const detectApiConfig = (): ApiConfig => {
  const isLocal = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  // Check if we're running locally (localhost or 127.0.0.1)
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost'));

  // Determine base URL
  let baseUrl: string;
  
  if (isLocal && isLocalhost) {
    // Local development with local server
    baseUrl = 'http://localhost:3001';
  } else if (import.meta.env.VITE_API_BASE_URL) {
    // Custom API base URL from environment
    baseUrl = import.meta.env.VITE_API_BASE_URL;
  } else {
    // Production: use current origin (Netlify functions)
    baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  // Create endpoint URLs
  const endpoints = {
    dishes: `${baseUrl}/api/dishes`,
    restaurants: `${baseUrl}/api/restaurants`,
    restaurantMenus: `${baseUrl}/api/restaurant-menus`,
    deliveryZones: `${baseUrl}/api/delivery-zones`,
    ping: `${baseUrl}/api/ping`,
    // Add other endpoints as needed
    campay: `${baseUrl}/api/campay`,
    email: `${baseUrl}/api/email`,
    payment: `${baseUrl}/api/payment`,
    fapshi: `${baseUrl}/api/fapshi`,
    calculateDeliveryFee: `${baseUrl}/api/calculate-delivery-fee`,
  };

  return {
    baseUrl,
    isLocal: isLocal && isLocalhost,
    isProduction,
    endpoints
  };
};

// Export the detected configuration
export const apiConfig = detectApiConfig();

// Debug logging
console.log('🔧 API Configuration Detected:', {
  environment: import.meta.env.MODE,
  isLocal: apiConfig.isLocal,
  isProduction: apiConfig.isProduction,
  baseUrl: apiConfig.baseUrl,
  endpoints: apiConfig.endpoints
});

// Helper function to get endpoint URL
export const getApiEndpoint = (endpoint: keyof typeof apiConfig.endpoints): string => {
  return apiConfig.endpoints[endpoint];
};

// Helper function to check if we should use local server
export const shouldUseLocalServer = (): boolean => {
  return apiConfig.isLocal;
};

// Helper function to check if we should use Netlify functions
export const shouldUseNetlifyFunctions = (): boolean => {
  return apiConfig.isProduction || !apiConfig.isLocal;
};
