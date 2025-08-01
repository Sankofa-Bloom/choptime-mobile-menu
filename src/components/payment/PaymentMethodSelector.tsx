import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Mail, CreditCard, Smartphone, DollarSign } from 'lucide-react';

interface PaymentMethodSelectorProps {
  paymentMethod: 'email' | 'cash' | 'momo' | 'fapshi';
  setPaymentMethod: (method: 'email' | 'cash' | 'momo' | 'fapshi') => void;
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
      <h3 className="font-semibold text-choptime-brown">Order Method</h3>
      
      <div className="grid gap-3">
        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="paymentMethod"
            value="fapshi"
            checked={paymentMethod === 'fapshi'}
            onChange={(e) => setPaymentMethod(e.target.value as 'email' | 'cash' | 'momo' | 'fapshi')}
            className="text-choptime-orange"
          />
          <Smartphone className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <div className="font-medium">Online Payment</div>
            <div className="text-sm text-gray-600">
              Secure online payment with MTN MoMo & Orange Money
            </div>
          </div>
        </label>

        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="paymentMethod"
            value="cash"
            checked={paymentMethod === 'cash'}
            onChange={(e) => setPaymentMethod(e.target.value as 'email' | 'cash' | 'momo' | 'fapshi')}
            className="text-choptime-orange"
          />
          <DollarSign className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <div className="font-medium">Cash on Delivery</div>
            <div className="text-sm text-gray-600">
              Pay with cash when your order is delivered
            </div>
          </div>
        </label>

        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="paymentMethod"
            value="momo"
            checked={paymentMethod === 'momo'}
            onChange={(e) => setPaymentMethod(e.target.value as 'email' | 'cash' | 'momo' | 'fapshi')}
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

        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="paymentMethod"
            value="email"
            checked={paymentMethod === 'email'}
            onChange={(e) => setPaymentMethod(e.target.value as 'email' | 'cash' | 'momo' | 'fapshi')}
            className="text-choptime-orange"
          />
          <Mail className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <div className="font-medium">Email Order</div>
            <div className="text-sm text-gray-600">
              Order will be sent to restaurant for confirmation and payment arrangement
            </div>
          </div>
        </label>
      </div>

      {paymentMethod === 'cash' && (
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            Pay with cash when your order is delivered. The delivery person will collect payment upon delivery.
          </AlertDescription>
        </Alert>
      )}

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

      {paymentMethod === 'fapshi' && !isCustomOrder && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Secure Online Payment</p>
            <p className="text-sm">
              You'll be redirected to a secure payment page where you can choose between MTN MoMo and Orange Money. 
              Your payment will be processed securely and you'll receive instant confirmation.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {paymentMethod === 'email' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your order will be submitted and sent to the restaurant for confirmation. 
            The restaurant will contact you to confirm availability and arrange payment.
            You'll also receive a confirmation email.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
