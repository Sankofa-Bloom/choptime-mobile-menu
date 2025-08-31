import { useState, useEffect } from 'react';

interface Locality {
  locality: string;
  zone_name: string;
  fee: number;
}

interface GroupedLocalities {
  [key: string]: Array<{
    locality: string;
    fee: number;
  }>;
}

interface UseLimbeLocalitiesReturn {
  localities: Locality[];
  groupedLocalities: GroupedLocalities;
  loading: boolean;
  error: string | null;
  getDeliveryFeeForLocality: (locality: string) => number;
}

export const useLimbeLocalities = (): UseLimbeLocalitiesReturn => {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [groupedLocalities, setGroupedLocalities] = useState<GroupedLocalities>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLimbeLocalities();
  }, []);

  const fetchLimbeLocalities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the Netlify function to get localities
      const response = await fetch('/.netlify/functions/limbe-localities');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setLocalities(result.data.localities || []);
        setGroupedLocalities(result.data.grouped || {});
      } else {
        throw new Error(result.error || 'Failed to fetch localities');
      }
    } catch (err) {
      console.error('Error fetching Limbe localities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch localities');
      
      // Fallback to hardcoded data if API fails
      const fallbackLocalities: Locality[] = [
        // Zone A - 1000 FCFA
        { locality: 'Ngueme', zone_name: 'Zone A', fee: 1000 },
        { locality: 'Isololo', zone_name: 'Zone A', fee: 1000 },
        { locality: 'Carata', zone_name: 'Zone A', fee: 1000 },
        { locality: 'Mile 4', zone_name: 'Zone A', fee: 1000 },
        { locality: 'Saker Junction', zone_name: 'Zone A', fee: 1000 },
        { locality: 'Down Beach', zone_name: 'Zone A', fee: 1000 },
        
        // Zone B - 800 FCFA
        { locality: 'Red Cross', zone_name: 'Zone B', fee: 800 },
        { locality: 'Bundes', zone_name: 'Zone B', fee: 800 },
        { locality: 'Middle Farms', zone_name: 'Zone B', fee: 800 },
        { locality: 'Church Street', zone_name: 'Zone B', fee: 800 },
        { locality: 'Busumbu', zone_name: 'Zone B', fee: 800 },
        { locality: 'Behind GHS', zone_name: 'Zone B', fee: 800 },
        
        // Zone C - 600 FCFA
        { locality: 'Mile 2', zone_name: 'Zone C', fee: 600 },
      ];

      const fallbackGrouped: GroupedLocalities = {
        'Zone A': fallbackLocalities.filter(l => l.zone_name === 'Zone A').map(l => ({ locality: l.locality, fee: l.fee })),
        'Zone B': fallbackLocalities.filter(l => l.zone_name === 'Zone B').map(l => ({ locality: l.locality, fee: l.fee })),
        'Zone C': fallbackLocalities.filter(l => l.zone_name === 'Zone C').map(l => ({ locality: l.locality, fee: l.fee })),
      };

      setLocalities(fallbackLocalities);
      setGroupedLocalities(fallbackGrouped);
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryFeeForLocality = (locality: string): number => {
    const localityData = localities.find(l => 
      l.locality.toLowerCase() === locality.toLowerCase()
    );
    return localityData?.fee || 800; // Default to Zone B fee if not found
  };

  return {
    localities,
    groupedLocalities,
    loading,
    error,
    getDeliveryFeeForLocality
  };
};

