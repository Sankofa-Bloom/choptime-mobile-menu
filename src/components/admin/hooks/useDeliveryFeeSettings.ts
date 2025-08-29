// Delivery Fee Settings Hook
// Manage global delivery fee activation/deactivation

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryFeeSettings {
  id: string;
  is_delivery_fee_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useDeliveryFeeSettings = () => {
  const [settings, setSettings] = useState<DeliveryFeeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load settings
  const loadSettings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('delivery_fee_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading delivery fee settings:', error);

        // If no settings exist, create default
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: createError } = await supabase
            .from('delivery_fee_settings')
            .insert([{ is_delivery_fee_enabled: true }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating default settings:', createError);
            toast({
              title: 'Error',
              description: 'Failed to create delivery fee settings',
              variant: 'destructive'
            });
            return;
          }

          setSettings(newSettings);
          return;
        }

        toast({
          title: 'Error',
          description: 'Failed to load delivery fee settings',
          variant: 'destructive'
        });
        return;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error in loadSettings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load delivery fee settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle delivery fee
  const toggleDeliveryFee = async () => {
    if (!settings) return false;

    try {
      setSaving(true);

      const newStatus = !settings.is_delivery_fee_enabled;

      const { data, error } = await supabase
        .from('delivery_fee_settings')
        .update({ is_delivery_fee_enabled: newStatus })
        .eq('id', settings.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating delivery fee settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to update delivery fee settings',
          variant: 'destructive'
        });
        return false;
      }

      setSettings(data);

      toast({
        title: 'Success',
        description: `Delivery fee ${newStatus ? 'enabled' : 'disabled'} successfully`
      });

      return true;
    } catch (error) {
      console.error('Error in toggleDeliveryFee:', error);
      toast({
        title: 'Error',
        description: 'Failed to update delivery fee settings',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Update delivery fee status
  const updateDeliveryFeeStatus = async (enabled: boolean) => {
    if (!settings) return false;

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('delivery_fee_settings')
        .update({ is_delivery_fee_enabled: enabled })
        .eq('id', settings.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating delivery fee status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update delivery fee settings',
          variant: 'destructive'
        });
        return false;
      }

      setSettings(data);

      toast({
        title: 'Success',
        description: `Delivery fee ${enabled ? 'enabled' : 'disabled'} successfully`
      });

      return true;
    } catch (error) {
      console.error('Error in updateDeliveryFeeStatus:', error);
      toast({
        title: 'Error',
        description: 'Failed to update delivery fee settings',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    saving,
    isDeliveryFeeEnabled: settings?.is_delivery_fee_enabled ?? true,
    toggleDeliveryFee,
    updateDeliveryFeeStatus,
    refreshSettings: loadSettings
  };
};