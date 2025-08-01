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
import { fapshiService, FapshiPaymentStatus } from '@/utils/fapshiService';

interface FapshiPaymentProps {
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

const FapshiPayment: React.FC<FapshiPaymentProps> = ({
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
      
      const formattedPhone = fapshiService.formatPhoneNumber(customerPhone);
      
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
        callback_url: import.meta.env.VITE_FAPSHI_CALLBACK_URL || `http://localhost:8080/api/payment-webhook`,
        return_url: import.meta.env.VITE_FAPSHI_RETURN_URL || `http://localhost:8080/payment-success?reference=${orderReference}`
      };

      const response = await fapshiService.initializePayment(paymentData);

      if (response.success && response.data) {
        setPaymentUrl(response.data.payment_url);
        setPaymentReference(response.data.reference);
        setPaymentStatus('pending');
        
        // Start polling for payment status
        startStatusPolling(response.data.reference);
        
        toast({
          title: "Payment Initialized",
          description: "Please complete your payment using MTN MoMo or Orange Money",
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
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startStatusPolling = (reference: string) => {
    // Check status every 5 seconds
    const interval = setInterval(async () => {
      await checkPaymentStatus(reference);
    }, 5000);
    
    setStatusCheckInterval(interval);
  };

  const checkPaymentStatus = async (reference: string) => {
    if (isCheckingStatus || paymentProcessed) return;
    
    setIsCheckingStatus(true);
    try {
      const response = await fapshiService.checkPaymentStatus(reference);
      
      if (response.success && response.data) {
        const status = response.data.status;
        
        if (status === 'success' && !paymentProcessed) {
          setPaymentStatus('success');
          setPaymentProcessed(true);
          
          // Clear the interval immediately
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            setStatusCheckInterval(null);
          }
          
          console.log('Payment success detected, calling onPaymentSuccess');
          onPaymentSuccess(response.data);
          
          toast({
            title: "Payment Successful!",
            description: "Your payment has been processed successfully.",
          });
        } else if (status === 'failed' || status === 'cancelled') {
          setPaymentStatus(status);
          
          // Clear the interval immediately
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            setStatusCheckInterval(null);
          }
          
          onPaymentFailure(`Payment ${status}`);
          
          toast({
            title: `Payment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            description: `Your payment was ${status}. Please try again.`,
            variant: "destructive"
          });
        }
        // If status is 'pending', continue polling
      } else {
        console.error('Status check failed:', response.error);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
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
      case 'initializing':
        return <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-orange-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'initializing':
        return 'Initializing Payment...';
      case 'pending':
        return 'Payment Pending';
      case 'success':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'initializing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-choptime-brown">
          <CreditCard className="w-5 h-5" />
          Mobile Money Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">{getStatusText()}</p>
              <p className="text-sm text-gray-600">Order: {orderReference}</p>
            </div>
          </div>
          <Badge className={getStatusColor()}>
            {paymentStatus.toUpperCase()}
          </Badge>
        </div>

        {/* Payment Amount */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Amount to Pay</p>
          <p className="text-2xl font-bold text-choptime-brown">
            {currency} {amount.toLocaleString()}
          </p>
        </div>

        {/* Payment Instructions */}
        {paymentStatus === 'pending' && (
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Complete your payment:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click "Pay Now" to open the payment page</li>
                <li>Choose MTN MoMo or Orange Money</li>
                <li>Enter your mobile money PIN</li>
                <li>Confirm the payment</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {paymentStatus === 'pending' && (
            <>
              <Button 
                onClick={handleOpenPaymentPage}
                className="w-full bg-choptime-orange hover:bg-choptime-orange/90"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Pay Now
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleManualStatusCheck}
                disabled={isCheckingStatus}
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                {isCheckingStatus ? 'Checking...' : 'Check Payment Status'}
              </Button>
            </>
          )}

          {(paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
            <Button 
              onClick={initializePayment}
              className="w-full bg-choptime-orange hover:bg-choptime-orange/90"
            >
              Try Again
            </Button>
          )}

          <Button 
            variant="outline" 
            onClick={onCancel}
            className="w-full"
          >
            Cancel Payment
          </Button>
        </div>

        {/* Supported Payment Methods */}
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-2">Supported Payment Methods:</p>
          <div className="flex justify-center gap-4">
            <Badge variant="secondary">MTN MoMo</Badge>
            <Badge variant="secondary">Orange Money</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FapshiPayment; 