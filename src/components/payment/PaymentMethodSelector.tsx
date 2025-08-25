import React from 'react';
import { Smartphone } from 'lucide-react';

interface PaymentMethodInfoProps {
  isCustomOrder?: boolean;
}

const PaymentMethodInfo: React.FC<PaymentMethodInfoProps> = ({ isCustomOrder = false }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-choptym-brown">Payment Method</h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Smartphone className="w-6 h-6 text-blue-600" />
          <div className="flex-1">
            <div className="font-medium text-blue-800">Swychr Payment Gateway</div>
            <div className="text-sm text-blue-700">
              Secure payment gateway supporting multiple payment methods in Cameroon
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="text-sm text-green-800">
          <p className="font-medium mb-1">How Swychr Payment Works:</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Enter your email and phone number</li>
            <li>You'll be redirected to a secure payment page</li>
            <li>Choose your preferred payment method (Mobile Money, Bank Transfer, etc.)</li>
            <li>Complete payment and return to confirm your order</li>
          </ul>
        </div>
      </div>

      {isCustomOrder && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm text-green-800">
            <p className="font-medium">Custom Order</p>
            <p className="text-xs">Payment will be processed based on your specified budget.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodInfo;