
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, CreditCard } from 'lucide-react';
import { Restaurant } from '@/types/restaurant';

interface PaymentDetailsProps {
  paymentMethod: string;
  restaurants: Restaurant[];
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ paymentMethod, restaurants }) => {
  if (!paymentMethod || paymentMethod === 'pay-on-delivery') return null;

  const getPaymentNumbers = () => {
    const numbers = new Set<string>();
    restaurants.forEach(restaurant => {
      if (paymentMethod === 'mtn-money' && restaurant.mtn_number) {
        numbers.add(restaurant.mtn_number);
      } else if (paymentMethod === 'orange-money' && restaurant.orange_number) {
        numbers.add(restaurant.orange_number);
      }
    });
    return Array.from(numbers);
  };

  const paymentNumbers = getPaymentNumbers();
  
  if (paymentNumbers.length === 0) return null;

  const getPaymentMethodName = () => {
    return paymentMethod === 'mtn-money' ? 'MTN Mobile Money' : 'Orange Money';
  };

  return (
    <Card className="border-choptime-orange/30 bg-choptime-beige/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-choptime-brown text-sm">
          <CreditCard className="w-4 h-4" />
          Payment Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-choptime-orange text-choptime-orange">
            {getPaymentMethodName()}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-choptime-brown">Send payment to:</p>
          {paymentNumbers.map((number, index) => (
            <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border">
              <Phone className="w-4 h-4 text-choptime-orange" />
              <span className="font-mono text-choptime-brown">{number}</span>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-choptime-brown/70 bg-white/50 p-2 rounded">
          <p className="font-medium mb-1">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open your {getPaymentMethodName()} app</li>
            <li>Send money to the number(s) above</li>
            <li>Include your order reference in the transaction</li>
            <li>Screenshot the confirmation for verification</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentDetails;
