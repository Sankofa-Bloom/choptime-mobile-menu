import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, CreditCard, CheckCircle } from 'lucide-react';

interface PaymentMethodSelectorProps {
  paymentMethod: 'whatsapp' | 'momo';
  setPaymentMethod: (method: 'whatsapp' | 'momo') => void;
  isCustomOrder: boolean;
  momoNumber: string;
  setMomoNumber: (number: string) => void;
  adminPhone: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  setPaymentMethod,
  isCustomOrder,
  momoNumber,
  setMomoNumber,
  adminPhone
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-choptime-brown">Order Method</h3>
      
      <div className="grid gap-3">
        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="paymentMethod"
            value="whatsapp"
            checked={paymentMethod === 'whatsapp'}
            onChange={(e) => setPaymentMethod(e.target.value as 'whatsapp' | 'momo')}
            className="text-choptime-orange"
          />
          <MessageCircle className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <div className="font-medium">WhatsApp Order</div>
            <div className="text-sm text-gray-600">
              Send order to ChopTime Admin: +{adminPhone}
            </div>
          </div>
        </label>

        {!isCustomOrder && (
          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="momo"
              checked={paymentMethod === 'momo'}
              onChange={(e) => setPaymentMethod(e.target.value as 'whatsapp' | 'momo')}
              className="text-choptime-orange"
            />
            <CreditCard className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <div className="font-medium">Mobile Money</div>
              <div className="text-sm text-gray-600">
                Pay with MTN Mobile Money or Orange Money
              </div>
            </div>
          </label>
        )}
      </div>

      {paymentMethod === 'momo' && !isCustomOrder && (
        <div className="space-y-2">
          <Label htmlFor="momoNumber">Mobile Money Number (Cameroon only)</Label>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-gray-50 text-gray-700 text-base select-none">+237</span>
            <Input
              id="momoNumber"
              type="tel"
              placeholder="6XX XXX XXX"
              value={momoNumber}
              onChange={(e) => setMomoNumber(e.target.value)}
              className="flex-1 rounded-l-none"
              pattern="[6][0-9]{8}"
              maxLength={9}
            />
          </div>
          <p className="text-xs text-gray-600">
            You'll receive a payment prompt on your Cameroon phone after submitting the order
          </p>
        </div>
      )}

      {paymentMethod === 'whatsapp' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your order will be sent directly to the restaurant via WhatsApp. 
            They will confirm availability and arrange payment upon delivery.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
