import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { campayService, CampayPaymentStatus } from '@/utils/campayService';

interface CampayPaymentProps {
  amount: number;
  currency: string;
  orderReference: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  description: string;
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentFailure: (error: string) => void;
  onCancel: () => void;
}

type PaymentStatus = 'initializing' | 'pending' | 'success' | 'failed' | 'cancelled';

const CampayPayment: React.FC<CampayPaymentProps> = ({
  amount,
  currency,
  orderReference,
  customerName,
  customerPhone,
  customerEmail,
  description,
  onPaymentSuccess,
  onPaymentFailure,
  onCancel
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('initializing');
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const { toast } = useToast();

  // Initialize payment when component mounts
  useEffect(() => {
    initializePayment();
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
    };
  }, []);

  const initializePayment = async () => {
    try {
      setPaymentStatus('initializing');
      
      const formattedPhone = campayService.formatPhoneNumber(customerPhone);
      
      const paymentData = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toUpperCase(),
        reference: orderReference,
        description: description,
        customer: {
          name: customerName,
          phone: formattedPhone,
          email: customerEmail
        },
        callback_url: import.meta.env.VITE_CAMPAY_CALLBACK_URL || `http://localhost:8080/api/payment-webhook`,
        return_url: import.meta.env.VITE_CAMPAY_RETURN_URL || `http://localhost:8080/payment-success?reference=${orderReference}`
      };

      const response = await campayService.initializePayment(paymentData);

      if (response.success && response.data) {
        setPaymentUrl(response.data.payment_url);
        setPaymentReference(response.data.reference);
        setPaymentStatus('pending');
        
        // Start polling for payment status
        startStatusPolling(response.data.reference);
        
        toast({
          title: "Payment Initialized",
          description: "Please complete your payment using MTN MoMo, Orange Money, or other supported methods",
        });
      } else {
        throw new Error(response.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      setPaymentStatus('failed');
      onPaymentFailure(error instanceof Error ? error.message : 'Payment initialization failed');
      
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : 'Failed to initialize payment',
        variant: "destructive",
      });
    }
  };

  const startStatusPolling = (reference: string) => {
    const interval = setInterval(() => {
      checkPaymentStatus(reference);
    }, 5000); // Check every 5 seconds
    
    setStatusCheckInterval(interval);
  };

  const checkPaymentStatus = async (reference: string) => {
    if (paymentProcessed) return;
    
    try {
      setIsCheckingStatus(true);
      const statusResponse = await campayService.checkPaymentStatus(reference);
      
      if (statusResponse.success && statusResponse.data) {
        const status = statusResponse.data.status;
        
        if (status === 'success') {
          setPaymentStatus('success');
          setPaymentProcessed(true);
          
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            setStatusCheckInterval(null);
          }
          
          onPaymentSuccess({
            reference: statusResponse.data.reference,
            amount: statusResponse.data.amount,
            currency: statusResponse.data.currency,
            transaction_id: statusResponse.data.transaction_id,
            customer: statusResponse.data.customer
          });
          
          toast({
            title: "Payment Successful!",
            description: "Your payment has been processed successfully.",
          });
        } else if (status === 'failed' || status === 'cancelled') {
          setPaymentStatus(status);
          setPaymentProcessed(true);
          
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            setStatusCheckInterval(null);
          }
          
          onPaymentFailure(`Payment ${status}`);
          
          toast({
            title: `Payment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            description: `Your payment was ${status}. Please try again.`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleManualStatusCheck = async () => {
    if (paymentReference) {
      await checkPaymentStatus(paymentReference);
    }
  };

  const handleOpenPaymentPage = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-orange-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'initializing':
        return 'Initializing payment...';
      case 'pending':
        return 'Payment pending - Please complete your payment';
      case 'success':
        return 'Payment successful!';
      case 'failed':
        return 'Payment failed';
      case 'cancelled':
        return 'Payment cancelled';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'pending':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Campay Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Status */}
          <Alert className={getStatusColor()}>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <AlertDescription className="font-medium">
                {getStatusText()}
              </AlertDescription>
            </div>
          </Alert>

          {/* Payment Details */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="font-medium">
                {currency} {(amount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Reference:</span>
              <span className="font-mono text-sm">{orderReference}</span>
            </div>
          </div>

          {/* Supported Payment Methods */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Supported Payment Methods:</h4>
            <div className="flex flex-wrap gap-2">
              {campayService.getSupportedPaymentMethods().map((method) => (
                <Badge key={method} variant="secondary" className="text-xs">
                  {method}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {paymentStatus === 'pending' && (
              <>
                <Button 
                  onClick={handleOpenPaymentPage}
                  className="flex-1"
                  disabled={!paymentUrl}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Pay Now
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleManualStatusCheck}
                  disabled={isCheckingStatus}
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                </Button>
              </>
            )}
            
            {(paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
              <Button 
                onClick={initializePayment}
                className="flex-1"
              >
                Try Again
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={paymentStatus === 'success'}
            >
              Cancel
            </Button>
          </div>

          {/* Payment Instructions */}
          {paymentStatus === 'pending' && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Payment Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Pay Now" to open the payment page</li>
                <li>Choose your preferred payment method</li>
                <li>Complete the payment on the secure page</li>
                <li>You'll be redirected back once payment is complete</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampayPayment; 