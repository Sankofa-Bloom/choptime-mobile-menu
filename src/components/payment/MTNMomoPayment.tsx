import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import MTNMomoService from '@/utils/mtnMomoService';

interface MTNMomoPaymentProps {
  amount: number;
  currency: string;
  orderReference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  description: string;
  orderData: any;
  onPaymentSuccess: (data: any) => void;
  onPaymentFailure: (error: string) => void;
  onCancel: () => void;
}

type PaymentStatus = 'initializing' | 'pending' | 'success' | 'failed' | 'cancelled';

const MTNMomoPayment: React.FC<MTNMomoPaymentProps> = ({
  amount,
  currency,
  orderReference,
  customerName,
  customerPhone,
  customerEmail,
  description,
  orderData,
  onPaymentSuccess,
  onPaymentFailure,
  onCancel
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('initializing');
  const [momoNumber, setMomoNumber] = useState(customerPhone);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes timeout
  const { toast } = useToast();

  const momoService = new MTNMomoService();

  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Countdown timer
  useEffect(() => {
    if (paymentStatus === 'pending' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && paymentStatus === 'pending') {
      handleTimeout();
    }
  }, [timeRemaining, paymentStatus]);

  const handleTimeout = () => {
    setPaymentStatus('failed');
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    onPaymentFailure('Payment timeout. Please try again.');
    toast({
      title: "Payment Timeout",
      description: "Payment took too long to complete. Please try again.",
      variant: "destructive"
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateMomoNumber = (phone: string): boolean => {
    return momoService.isValidMTNNumber(phone);
  };

  const initializePayment = async () => {
    try {
      setPaymentStatus('initializing');
      
      if (!validateMomoNumber(momoNumber)) {
        throw new Error('Please enter a valid MTN MoMo number (format: 6XXXXXXXX)');
      }

      const formattedPhone = momoService.formatPhoneNumber(momoNumber);
      const externalId = momoService.generateExternalId();
      
      const paymentData = {
        amount: amount,
        currency: currency.toUpperCase(),
        externalId: externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: formattedPhone
        },
        payerMessage: `ChopTym Order Payment - ${orderReference}`,
        payeeNote: description
      };

      console.log('Initializing MTN MoMo payment:', { externalId, amount, phone: formattedPhone });

      // Store payment record first
      await momoService.storePaymentRecord(orderData, externalId);

      const response = await momoService.requestToPay(paymentData);

      if (response.success && response.data) {
        setPaymentReference(response.data.referenceId);
        setPaymentStatus('pending');
        setTimeRemaining(300); // Reset timer
        
        // Start polling for payment status
        startStatusPolling(response.data.referenceId);
        
        toast({
          title: "Payment Request Sent",
          description: `Please check your phone (${momoNumber}) and approve the payment request.`,
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
        description: error instanceof Error ? error.message : "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startStatusPolling = (referenceId: string) => {
    // Check status every 5 seconds
    const interval = setInterval(async () => {
      await checkPaymentStatus(referenceId);
    }, 5000);
    
    setStatusCheckInterval(interval);
  };

  const checkPaymentStatus = async (referenceId: string) => {
    try {
      const response = await momoService.checkPaymentStatus(referenceId);

      if (response.success && response.data) {
        const status = response.data.status;
        
        console.log('Payment status check:', { referenceId, status });

        if (status === 'SUCCESSFUL') {
          setPaymentStatus('success');
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
          }
          
          // Update payment status in database
          await momoService.updatePaymentStatus(referenceId, 'completed');
          
          // Send email notification
          await sendOrderNotification(referenceId);
          
          onPaymentSuccess({
            reference: referenceId,
            amount: response.data.amount,
            status: status
          });
          
          toast({
            title: "Payment Successful!",
            description: "Your order has been confirmed and the restaurant has been notified.",
          });
        } else if (status === 'FAILED') {
          setPaymentStatus('failed');
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
          }
          
          await momoService.updatePaymentStatus(referenceId, 'failed');
          
          const reason = response.data.reason || 'Payment was declined';
          onPaymentFailure(`Payment failed: ${reason}`);
          
          toast({
            title: "Payment Failed",
            description: reason,
            variant: "destructive"
          });
        }
        // For PENDING status, continue polling
      } else if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
      } else {
        // Too many failed status checks
        setPaymentStatus('failed');
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
        }
        onPaymentFailure('Unable to verify payment status. Please contact support.');
      }
    } catch (error) {
      console.error('Status check error:', error);
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
      }
    }
  };

  const sendOrderNotification = async (referenceId: string) => {
    try {
      const response = await fetch('/.netlify/functions/send-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData: {
            ...orderData,
            payment_reference: referenceId
          },
          referenceId: referenceId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send order notification');
      }

      console.log('Order notification sent successfully');
    } catch (error) {
      console.error('Error sending order notification:', error);
      // Don't fail the payment for email issues
    }
  };

  const handleCancel = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    setPaymentStatus('cancelled');
    onCancel();
  };

  const handleRetry = () => {
    setRetryCount(0);
    setTimeRemaining(300);
    initializePayment();
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'initializing':
        return <Clock className="w-6 h-6 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Smartphone className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'initializing':
        return 'Setting up your payment...';
      case 'pending':
        return `Please approve the payment on your phone. Time remaining: ${formatTime(timeRemaining)}`;
      case 'success':
        return 'Payment completed successfully!';
      case 'failed':
        return 'Payment failed. Please try again.';
      default:
        return 'Ready to process payment';
    }
  };

  if (paymentStatus === 'initializing') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-choptym-brown mb-4">MTN MoMo Payment</h3>
          
          <div className="flex flex-col items-center space-y-4">
            {getStatusIcon()}
            <p className="text-gray-600">{getStatusMessage()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-choptym-brown mb-4">MTN MoMo Payment</h3>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-6 h-6 text-yellow-600" />
            <div className="text-left">
              <p className="font-medium text-yellow-800">Amount to Pay</p>
              <p className="text-2xl font-bold text-yellow-900">{amount} {currency}</p>
            </div>
          </div>
        </div>

        {paymentStatus === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div className="text-left">
                <p className="font-medium text-blue-800">Payment in Progress</p>
                <p className="text-sm text-blue-600">{getStatusMessage()}</p>
                <p className="text-xs text-blue-500 mt-1">Reference: {paymentReference}</p>
              </div>
            </div>
          </div>
        )}

        {(paymentStatus === 'success' || paymentStatus === 'failed') && (
          <div className={`border rounded-lg p-4 mb-6 ${
            paymentStatus === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div className="text-left">
                <p className={`font-medium ${
                  paymentStatus === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {paymentStatus === 'success' ? 'Payment Successful' : 'Payment Failed'}
                </p>
                <p className={`text-sm ${
                  paymentStatus === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {getStatusMessage()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {paymentStatus !== 'success' && paymentStatus !== 'pending' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MTN MoMo Number
            </label>
            <Input
              type="tel"
              value={momoNumber}
              onChange={(e) => setMomoNumber(e.target.value)}
              placeholder="6XXXXXXXX"
              className="w-full"
              disabled={paymentStatus === 'pending'}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your MTN MoMo number (9 digits starting with 6)
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={initializePayment}
              disabled={!momoNumber || paymentStatus === 'pending'}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Pay with MTN MoMo
            </Button>
          </div>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="flex space-x-3">
          <Button
            onClick={handleRetry}
            variant="outline"
            className="flex-1"
          >
            Try Again
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      )}

      {paymentStatus === 'pending' && (
        <div className="flex justify-center">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Cancel Payment
          </Button>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="text-center">
          <p className="text-green-600 font-medium">
            Your order has been confirmed! You will be redirected shortly.
          </p>
        </div>
      )}
    </div>
  );
};

export default MTNMomoPayment;
