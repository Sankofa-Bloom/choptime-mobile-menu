// Delivery Fee Settings Section
// Admin toggle to enable/disable delivery fees globally

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Truck, Settings } from 'lucide-react';
import { useDeliveryFeeSettings } from '../hooks/useDeliveryFeeSettings';

const DeliveryFeeSettings: React.FC = () => {
  const {
    isDeliveryFeeEnabled,
    loading,
    saving,
    toggleDeliveryFee,
    updateDeliveryFeeStatus
  } = useDeliveryFeeSettings();

  const handleToggle = async () => {
    await toggleDeliveryFee();
  };

  const handleManualToggle = async (enabled: boolean) => {
    await updateDeliveryFeeStatus(enabled);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Delivery Fee Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
            <span className="ml-2">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Delivery Fee Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Delivery Fee Status</h3>
            <p className="text-sm text-gray-600">
              {isDeliveryFeeEnabled
                ? 'Delivery fees are currently enabled'
                : 'Delivery fees are currently disabled'
              }
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isDeliveryFeeEnabled
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {isDeliveryFeeEnabled ? 'ENABLED' : 'DISABLED'}
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="delivery-fee-toggle" className="text-sm font-medium">
              Enable Delivery Fees
            </Label>
            <p className="text-sm text-gray-600">
              When disabled, customers won't be charged delivery fees
            </p>
          </div>
          <Switch
            id="delivery-fee-toggle"
            checked={isDeliveryFeeEnabled}
            onCheckedChange={handleManualToggle}
            disabled={saving}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleToggle}
            disabled={saving}
            variant={isDeliveryFeeEnabled ? "destructive" : "default"}
            className="flex-1"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                {isDeliveryFeeEnabled ? 'Disabling...' : 'Enabling...'}
              </>
            ) : (
              <>
                <Truck className="w-4 h-4 mr-2" />
                {isDeliveryFeeEnabled ? 'Disable Delivery Fees' : 'Enable Delivery Fees'}
              </>
            )}
          </Button>
        </div>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-900">
                How Delivery Fee Toggle Works
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Enabled:</strong> Customers see and pay delivery fees based on their location</li>
                <li>• <strong>Disabled:</strong> Delivery fees are hidden and not charged</li>
                <li>• <strong>Real-time:</strong> Changes take effect immediately on the frontend</li>
                <li>• <strong>Persistent:</strong> Setting is saved and maintained across sessions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Affected Areas */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900 mb-2">
                Areas Affected by This Setting
              </h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• Customer cart and checkout process</p>
                <p>• Order total calculations</p>
                <p>• Delivery fee display in order summary</p>
                <p>• Restaurant menu pricing display</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryFeeSettings;