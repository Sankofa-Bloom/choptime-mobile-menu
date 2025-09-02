// App Settings Component
// Comprehensive frontend application configuration management

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Bell, 
  Truck, 
  Smartphone, 
  Palette, 
  Globe, 
  Mail, 
  Info,
  Save,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { useAppSettings } from './hooks/useAppSettings';
import { useToast } from '@/hooks/use-toast';

const AppSettings: React.FC = () => {
  const {
    settings,
    loading,
    saving,
    updateSetting,
    updateMultipleSettings,
    resetToDefaults,
    refreshSettings
  } = useAppSettings();

  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  // Update local settings when props change
  React.useEffect(() => {
    setLocalSettings(settings);
    setHasUnsavedChanges(false);
  }, [settings]);

  // Handle setting change
  const handleSettingChange = <K extends keyof typeof localSettings>(
    key: K,
    value: typeof localSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // Save all changes
  const handleSaveAll = async () => {
    const changes = Object.keys(localSettings).reduce((acc, key) => {
      const k = key as keyof typeof localSettings;
      if (localSettings[k] !== settings[k]) {
        acc[k] = localSettings[k];
      }
      return acc;
    }, {} as Partial<typeof localSettings>);

    if (Object.keys(changes).length === 0) {
      toast({
        title: 'No Changes',
        description: 'No settings have been modified',
        variant: 'default'
      });
      return;
    }

    const success = await updateMultipleSettings(changes);
    if (success) {
      setHasUnsavedChanges(false);
    }
  };

  // Reset to current settings
  const handleReset = () => {
    setLocalSettings(settings);
    setHasUnsavedChanges(false);
    toast({
      title: 'Reset',
      description: 'Settings reset to current values',
      variant: 'default'
    });
  };

  // Reset to defaults
  const handleResetToDefaults = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all settings to defaults? This action cannot be undone.'
    );
    
    if (confirmed) {
      const success = await resetToDefaults();
      if (success) {
        setHasUnsavedChanges(false);
      }
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">App Settings</h2>
              <p className="text-sm text-gray-600">Configure frontend application settings</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading app settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">App Settings</h2>
              <p className="text-sm text-gray-600">Configure frontend application settings</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasUnsavedChanges || saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            
            <Button
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges || saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Delivery
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-blue-600" />
                    Push Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications">Enable Push Notifications</Label>
                    <Switch
                      id="push-notifications"
                      checked={localSettings.enablePushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('enablePushNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notification-sound">Notification Sound</Label>
                    <Switch
                      id="notification-sound"
                      checked={localSettings.notificationSound}
                      onCheckedChange={(checked) => handleSettingChange('notificationSound', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notification-vibration">Vibration</Label>
                    <Switch
                      id="notification-vibration"
                      checked={localSettings.notificationVibration}
                      onCheckedChange={(checked) => handleSettingChange('notificationVibration', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5 text-green-600" />
                    Email & SMS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <Switch
                      id="email-notifications"
                      checked={localSettings.enableEmailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('enableEmailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <Switch
                      id="sms-notifications"
                      checked={localSettings.enableSmsNotifications}
                      onCheckedChange={(checked) => handleSettingChange('enableSmsNotifications', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="h-5 w-5 text-orange-600" />
                    Delivery Fees
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="delivery-fees">Enable Delivery Fees</Label>
                    <Switch
                      id="delivery-fees"
                      checked={localSettings.enableDeliveryFees}
                      onCheckedChange={(checked) => handleSettingChange('enableDeliveryFees', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default-delivery-fee">Default Delivery Fee (FCFA)</Label>
                    <Input
                      id="default-delivery-fee"
                      type="number"
                      value={localSettings.defaultDeliveryFee}
                      onChange={(e) => handleSettingChange('defaultDeliveryFee', parseInt(e.target.value) || 0)}
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="free-delivery-threshold">Free Delivery Threshold (FCFA)</Label>
                    <Input
                      id="free-delivery-threshold"
                      type="number"
                      value={localSettings.freeDeliveryThreshold}
                      onChange={(e) => handleSettingChange('freeDeliveryThreshold', parseInt(e.target.value) || 0)}
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-delivery-distance">Max Delivery Distance (km)</Label>
                    <Input
                      id="max-delivery-distance"
                      type="number"
                      value={localSettings.maxDeliveryDistance}
                      onChange={(e) => handleSettingChange('maxDeliveryDistance', parseInt(e.target.value) || 0)}
                      placeholder="10"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="h-5 w-5 text-purple-600" />
                    App Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-pwa">Enable PWA</Label>
                    <Switch
                      id="enable-pwa"
                      checked={localSettings.enablePWA}
                      onCheckedChange={(checked) => handleSettingChange('enablePWA', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="offline-mode">Offline Mode</Label>
                    <Switch
                      id="offline-mode"
                      checked={localSettings.enableOfflineMode}
                      onCheckedChange={(checked) => handleSettingChange('enableOfflineMode', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="debug-mode">Debug Mode</Label>
                    <Switch
                      id="debug-mode"
                      checked={localSettings.enableDebugMode}
                      onCheckedChange={(checked) => handleSettingChange('enableDebugMode', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="analytics">Analytics</Label>
                    <Switch
                      id="analytics"
                      checked={localSettings.enableAnalytics}
                      onCheckedChange={(checked) => handleSettingChange('enableAnalytics', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette className="h-5 w-5 text-pink-600" />
                    Theme & Language
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={localSettings.theme}
                      onValueChange={(value: 'light' | 'dark' | 'auto') => handleSettingChange('theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={localSettings.language}
                      onValueChange={(value) => handleSettingChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={localSettings.currency}
                      onValueChange={(value) => handleSettingChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XAF">FCFA (XAF)</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={localSettings.timezone}
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                      placeholder="Africa/Douala"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={localSettings.adminEmail}
                      onChange={(e) => handleSettingChange('adminEmail', e.target.value)}
                      placeholder="admin@choptym.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-phone">Admin Phone</Label>
                    <Input
                      id="admin-phone"
                      value={localSettings.adminPhone}
                      onChange={(e) => handleSettingChange('adminPhone', e.target.value)}
                      placeholder="+237670416449"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      value={localSettings.supportEmail}
                      onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                      placeholder="support@choptym.com"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-green-600" />
                    App Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="app-name">App Name</Label>
                    <Input
                      id="app-name"
                      value={localSettings.appName}
                      onChange={(e) => handleSettingChange('appName', e.target.value)}
                      placeholder="ChopTym"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app-version">App Version</Label>
                    <Input
                      id="app-version"
                      value={localSettings.appVersion}
                      onChange={(e) => handleSettingChange('appVersion', e.target.value)}
                      placeholder="1.1.8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app-environment">Environment</Label>
                    <Select
                      value={localSettings.appEnvironment}
                      onValueChange={(value) => handleSettingChange('appEnvironment', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Separator className="my-8" />
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 mb-2">
                  Reset all settings to their default values. This action cannot be undone.
                </p>
                <p className="text-xs text-red-500">
                  This will affect all users of the application.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleResetToDefaults}
                disabled={saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default AppSettings; 