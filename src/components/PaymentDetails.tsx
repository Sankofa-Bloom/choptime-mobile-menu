
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, CreditCard } from 'lucide-react';

interface PaymentDetailsProps {
  paymentMethod: string;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ paymentMethod }) => {
  if (!paymentMethod || paymentMethod === 'pay-on-delivery') return null;

  const getPaymentMethodName = () => {
    return paymentMethod === 'mtn-money' ? 'MTN Mobile Money' : 'Orange Money';
  };

  // Single payment number for all orders
  const PAYMENT_NUMBER = '+237 6 70 41 64 49';
  const ACCOUNT_NAME = 'Ngwese Mpah';

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
          <div className="bg-white p-3 rounded border">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-choptime-orange" />
              <span className="font-mono text-choptime-brown font-medium">{PAYMENT_NUMBER}</span>
            </div>
            <p className="text-sm text-choptime-brown/70">Account Name: <span className="font-medium">{ACCOUNT_NAME}</span></p>
          </div>
        </div>
        
        <div className="text-xs text-choptime-brown/70 bg-white/50 p-2 rounded">
          <p className="font-medium mb-1">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open your {getPaymentMethodName()} app</li>
            <li>Send money to {PAYMENT_NUMBER}</li>
            <li>Include your order reference in the transaction</li>
            <li>Screenshot the confirmation for verification</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentDetails;
