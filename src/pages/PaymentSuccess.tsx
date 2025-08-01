import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Home, Receipt, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fapshiService } from '@/utils/fapshiService';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { toast } = useToast();

  const reference = searchParams.get('reference');

  useEffect(() => {
    if (reference) {
      checkPaymentStatus(reference);
    } else {
      setPaymentStatus('failed');
    }
  }, [reference]);

  const checkPaymentStatus = async (ref: string) => {
    try {
      const response = await fapshiService.checkPaymentStatus(ref);
      
      if (response.success && response.data) {
        if (response.data.status === 'success') {
          setPaymentStatus('success');
          setOrderDetails(response.data);
          
          toast({
            title: "Payment Successful!",
            description: "Your payment has been processed successfully.",
          });
        } else {
          setPaymentStatus('failed');
          toast({
            title: "Payment Not Completed",
            description: "Your payment was not completed. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        setPaymentStatus('failed');
        toast({
          title: "Payment Status Unknown",
          description: "Unable to verify payment status. Please contact support.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('failed');
      toast({
        title: "Error",
        description: "There was an error checking your payment status.",
        variant: "destructive"
      });
    }
  };

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-choptime-orange mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-choptime-brown mb-2">
              Verifying Payment...
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your payment status.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-choptime-brown mb-2">
              Payment Not Completed
            </h2>
            <p className="text-gray-600 mb-6">
              Your payment was not completed successfully. Please try again or contact support if you need assistance.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full bg-choptime-orange hover:bg-choptime-orange/90">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Home
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/contact">
                  Contact Support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md mx-auto w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-choptime-brown">
            Payment Successful!
          </CardTitle>
          <p className="text-gray-600">
            Your order has been confirmed and payment processed successfully.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Payment Details */}
          {orderDetails && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Order Reference:</span>
                <Badge variant="secondary" className="font-mono">
                  {orderDetails.reference}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-choptime-brown">
                  XAF {orderDetails.amount?.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Method:</span>
                <span className="text-sm font-medium">Mobile Money</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge className="bg-green-100 text-green-800">
                  PAID
                </Badge>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              What's Next?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You'll receive an order confirmation email shortly</li>
              <li>• The restaurant will contact you to confirm delivery details</li>
              <li>• Your order will be prepared and delivered to your location</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full bg-choptime-orange hover:bg-choptime-orange/90">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/orders">
                <Receipt className="w-4 h-4 mr-2" />
                View My Orders
              </Link>
            </Button>
          </div>

          {/* Support Info */}
          <div className="text-center text-xs text-gray-500">
            <p>Need help? Contact us at support@choptime.app</p>
            <p>Order Reference: {reference}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess; 