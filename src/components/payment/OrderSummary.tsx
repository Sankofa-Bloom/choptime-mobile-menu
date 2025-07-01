
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { User, Truck, AlertCircle } from 'lucide-react';

interface OrderDetails {
  dishName: string;
  quantity: number;
  price: number;
  total: number;
  customerName: string;
  customerPhone: string;
  location: string;
}

interface CustomOrder {
  dishName: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  location: string;
  specialInstructions?: string;
}

interface DeliveryZone {
  id: string;
  zone_name: string;
  fee: number;
}

interface OrderSummaryProps {
  currentOrder: OrderDetails | CustomOrder;
  isCustomOrder: boolean;
  deliveryZone: DeliveryZone | null;
  deliveryFee: number;
  subtotal: number;
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  currentOrder,
  isCustomOrder,
  deliveryZone,
  deliveryFee,
  subtotal,
  total
}) => {
  const orderDetails = currentOrder as OrderDetails;
  const customOrder = currentOrder as CustomOrder;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-choptime-brown">Order Details</h3>
      
      <div className="bg-white border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-medium">{currentOrder.dishName}</h4>
            {isCustomOrder && customOrder.specialInstructions && (
              <p className="text-sm text-gray-600 mt-1">
                Special instructions: {customOrder.specialInstructions}
              </p>
            )}
          </div>
          <Badge variant="secondary">Qty: {currentOrder.quantity}</Badge>
        </div>
        
        {!isCustomOrder && (
          <div className="flex justify-between text-sm">
            <span>Price per item:</span>
            <span>{orderDetails.price.toLocaleString()} FCFA</span>
          </div>
        )}
      </div>

      {/* Customer Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <User className="w-4 h-4" />
          Customer Information
        </h4>
        <div className="space-y-1 text-sm">
          <p><strong>Name:</strong> {currentOrder.customerName}</p>
          <p><strong>Phone:</strong> {currentOrder.customerPhone}</p>
          <p><strong>Location:</strong> {currentOrder.location}</p>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-choptime-orange" />
          <span className="font-medium">Delivery Information</span>
        </div>
        {deliveryZone && (
          <p className="text-sm text-gray-600">
            Delivery Zone: {deliveryZone.zone_name}
          </p>
        )}
      </div>

      {/* Price Breakdown */}
      {!isCustomOrder && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{subtotal.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee:</span>
            <span>{deliveryFee.toLocaleString()} FCFA</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="text-choptime-orange">{total.toLocaleString()} FCFA</span>
          </div>
        </div>
      )}

      {isCustomOrder && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a custom order. The restaurant will provide pricing details when they contact you.
            Delivery fee: {deliveryFee.toLocaleString()} FCFA
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OrderSummary;
