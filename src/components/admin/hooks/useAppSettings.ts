// App Settings Hook
// Manage frontend application configuration and settings

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AppSettings {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  created_at: string;
  updated_at: string;
}

export interface AppConfiguration {
  // Notification Settings
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  notificationSound: boolean;
  notificationVibration: boolean;
  
  // Delivery Settings
  enableDeliveryFees: boolean;
  defaultDeliveryFee: number;
  freeDeliveryThreshold: number;
  maxDeliveryDistance: number;
  
  // App Features
  enablePWA: boolean;
  enableOfflineMode: boolean;
  enableDebugMode: boolean;
  enableAnalytics: boolean;
  
  // UI/UX Settings
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  timezone: string;
  
  // Contact Information
  adminEmail: string;
  adminPhone: string;
  supportEmail: string;
  
  // App Information
  appName: string;
  appVersion: string;
  appEnvironment: string;
}

const DEFAULT_SETTINGS: AppConfiguration = {
  // Notification Settings
  enablePushNotifications: true,
  enableEmailNotifications: true,
  enableSmsNotifications: false,
  notificationSound: true,
  notificationVibration: true,
  
  // Delivery Settings
  enableDeliveryFees: true,
  defaultDeliveryFee: 500,
  freeDeliveryThreshold: 5000,
  maxDeliveryDistance: 10,
  
  // App Features
  enablePWA: true,
  enableOfflineMode: true,
  enableDebugMode: false,
  enableAnalytics: false,
  
  // UI/UX Settings
  theme: 'light',
  language: 'en',
  currency: 'XAF',
  timezone: 'Africa/Douala',
  
  // Contact Information
  adminEmail: 'choptym237@gmail.com',
  adminPhone: '+237670416449',
  supportEmail: 'support@choptym.com',
  
  // App Information
  appName: 'ChopTym',
  appVersion: '1.1.8',
  appEnvironment: 'production'
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppConfiguration>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load settings from database
  const loadSettings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading app settings:', error);
        
        // If no settings exist, create defaults
        if (error.code === 'PGRST116') {
          await createDefaultSettings();
          return;
        }
        
        toast({
          title: 'Error',
          description: 'Failed to load app settings',
          variant: 'destructive'
        });
        return;
      }

      // Convert database settings to configuration object
      const config = { ...DEFAULT_SETTINGS };
      
      data.forEach((setting: AppSettings) => {
        const key = setting.setting_key as keyof AppConfiguration;
        if (key in config) {
          let value: any = setting.setting_value;
          
          // Parse value based on type
          switch (setting.setting_type) {
            case 'boolean':
              value = value === 'true';
              break;
            case 'number':
              value = parseFloat(value);
              break;
            case 'json':
              try {
                value = JSON.parse(value);
              } catch {
                value = setting.setting_value;
              }
              break;
            default:
              value = setting.setting_value;
          }
          
          config[key] = value;
        }
      });

      setSettings(config);
    } catch (error) {
      console.error('Error in loadSettings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load app settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create default settings in database
  const createDefaultSettings = async () => {
    try {
      const settingsToCreate = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
        setting_key: key,
        setting_value: String(value),
        setting_type: typeof value === 'boolean' ? 'boolean' : 
                     typeof value === 'number' ? 'number' : 'string',
        description: `Default setting for ${key}`
      }));

      const { error } = await supabase
        .from('system_settings')
        .insert(settingsToCreate);

      if (error) {
        console.error('Error creating default settings:', error);
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Default app settings created successfully'
      });
    } catch (error) {
      console.error('Error creating default settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to create default settings',
        variant: 'destructive'
      });
    }
  };

  // Update a single setting
  const updateSetting = async <K extends keyof AppConfiguration>(
    key: K,
    value: AppConfiguration[K]
  ) => {
    try {
      setSaving(true);

      const settingType = typeof value === 'boolean' ? 'boolean' : 
                         typeof value === 'number' ? 'number' : 'string';

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: String(value),
          setting_type: settingType,
          description: `Setting for ${key}`,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) {
        console.error('Error updating setting:', error);
        toast({
          title: 'Error',
          description: `Failed to update ${key}`,
          variant: 'destructive'
        });
        return false;
      }

      // Update local state
      setSettings(prev => ({ ...prev, [key]: value }));

      toast({
        title: 'Success',
        description: `${key} updated successfully`
      });

      return true;
    } catch (error) {
      console.error('Error in updateSetting:', error);
      toast({
        title: 'Error',
        description: `Failed to update ${key}`,
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Update multiple settings at once
  const updateMultipleSettings = async (updates: Partial<AppConfiguration>) => {
    try {
      setSaving(true);

      const updatePromises = Object.entries(updates).map(([key, value]) =>
        updateSetting(key as keyof AppConfiguration, value)
      );

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(Boolean).length;
      const totalCount = Object.keys(updates).length;

      if (successCount === totalCount) {
        toast({
          title: 'Success',
          description: 'All settings updated successfully'
        });
        return true;
      } else {
        toast({
          title: 'Partial Success',
          description: `${successCount}/${totalCount} settings updated successfully`,
          variant: 'default'
        });
        return false;
      }
    } catch (error) {
      console.error('Error in updateMultipleSettings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update multiple settings',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Reset settings to defaults
  const resetToDefaults = async () => {
    try {
      setSaving(true);

      // Delete all existing settings
      const { error: deleteError } = await supabase
        .from('system_settings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        console.error('Error deleting existing settings:', deleteError);
        throw deleteError;
      }

      // Create default settings
      await createDefaultSettings();
      
      // Reset local state
      setSettings(DEFAULT_SETTINGS);

      toast({
        title: 'Success',
        description: 'Settings reset to defaults successfully'
      });

      return true;
    } catch (error) {
      console.error('Error in resetToDefaults:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset settings to defaults',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    saving,
    updateSetting,
    updateMultipleSettings,
    resetToDefaults,
    refreshSettings: loadSettings
  };
}; 