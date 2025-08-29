// Frontend Delivery Fee Settings Hook
// Check if delivery fees are enabled globally

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDeliveryFeeSettings = () => {
  const [isDeliveryFeeEnabled, setIsDeliveryFeeEnabled] = useState(true);
  const [loading, setLoading] = useState(false); // Start as false to avoid loading states
  const [error, setError] = useState<string | null>(null);

  const loadDeliveryFeeSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('delivery_fee_settings')
        .select('is_delivery_fee_enabled')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.warn('Could not load delivery fee settings, using default:', error);
        setError(error.message);
        // Default to enabled if we can't load settings
        setIsDeliveryFeeEnabled(true);
        return;
      }

      setIsDeliveryFeeEnabled(data?.is_delivery_fee_enabled ?? true);
    } catch (error) {
      console.warn('Error loading delivery fee settings:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsDeliveryFeeEnabled(true); // Default to enabled on error
    } finally {
      setLoading(false);
    }
  };

  // Load settings and subscribe to real-time changes
  useEffect(() => {
    loadDeliveryFeeSettings();

    // Subscribe to changes in delivery fee settings
    const channel = supabase
      .channel('delivery_fee_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_fee_settings'
        },
        (payload) => {
          console.log('Delivery fee settings changed:', payload);
          if (payload.new && typeof payload.new.is_delivery_fee_enabled === 'boolean') {
            setIsDeliveryFeeEnabled(payload.new.is_delivery_fee_enabled);
          } else {
            // Reload settings if we can't get the new value from the payload
            loadDeliveryFeeSettings();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    isDeliveryFeeEnabled,
    loading,
    error,
    refreshSettings: loadDeliveryFeeSettings
  };
};