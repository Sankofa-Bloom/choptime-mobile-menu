import React from 'react';
import { Smartphone } from 'lucide-react';

interface PaymentMethodInfoProps {
  isCustomOrder?: boolean;
}

const PaymentMethodInfo: React.FC<PaymentMethodInfoProps> = ({ isCustomOrder = false }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-choptym-brown">Payment Method</h3>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Smartphone className="w-6 h-6 text-yellow-600" />
          <div className="flex-1">
            <div className="font-medium text-yellow-800">MTN Mobile Money</div>
            <div className="text-sm text-yellow-700">
              Secure payment with MTN MoMo - The only payment method available
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">How MTN MoMo Payment Works:</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Enter your MTN MoMo number</li>
            <li>You'll receive a payment request on your phone</li>
            <li>Approve the payment with your MTN MoMo PIN</li>
            <li>Your order will be confirmed automatically</li>
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