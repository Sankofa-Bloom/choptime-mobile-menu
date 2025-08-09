import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Mail, CreditCard, Smartphone, DollarSign } from 'lucide-react';

interface PaymentMethodSelectorProps {
  paymentMethod: 'campay' | 'fapshi';
  setPaymentMethod: (method: 'campay' | 'fapshi') => void;
  isCustomOrder: boolean;
  momoNumber: string;
  setMomoNumber: (number: string) => void;
  adminEmail: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  setPaymentMethod,
  isCustomOrder,
  momoNumber,
  setMomoNumber,
  adminEmail
}) => {

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-choptym-brown">Order Method</h3>
      
      <div className="grid gap-3">
        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 bg-green-50 border-green-200">
          <input
            type="radio"
            name="paymentMethod"
            value="fapshi"
            checked={paymentMethod === 'fapshi'}
            onChange={(e) => setPaymentMethod(e.target.value as 'campay' | 'fapshi')}
            className="text-choptym-orange"
          />
          <Smartphone className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <div className="font-medium">Secure Online Payment</div>
            <div className="text-sm text-gray-600">
              MTN MoMo, Orange Money, Card Payment & Bank Transfer
            </div>
          </div>
        </label>
        
        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 bg-blue-50 border-blue-200">
          <input
            type="radio"
            name="paymentMethod"
            value="campay"
            checked={paymentMethod === 'campay'}
            onChange={(e) => setPaymentMethod(e.target.value as 'campay' | 'fapshi')}
            className="text-choptym-orange"
          />
          <Smartphone className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <div className="font-medium">Secure Online Payment</div>
            <div className="text-sm text-gray-600">
              MTN MoMo, Orange Money, Moov Money, Card Payment & Bank Transfer
            </div>
          </div>
        </label>
      </div>

      {paymentMethod === 'fapshi' && !isCustomOrder && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Secure Online Payment</p>
            <p className="text-sm">
              You'll be redirected to a secure payment page where you can choose between MTN MoMo, Orange Money, Card Payment, and Bank Transfer. 
              Your payment will be processed securely and you'll receive instant confirmation.
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      {paymentMethod === 'campay' && !isCustomOrder && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Secure Online Payment</p>
            <p className="text-sm">
              You'll be redirected to a secure payment page where you can choose between MTN MoMo, Orange Money, Moov Money, Card Payment, and Bank Transfer. 
              Your payment will be processed securely and you'll receive instant confirmation.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
