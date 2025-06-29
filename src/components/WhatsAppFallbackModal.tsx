
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, MessageCircle, QrCode, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateQRCodeUrl } from '@/utils/whatsappUtils';

interface WhatsAppFallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  message: string;
}

const WhatsAppFallbackModal: React.FC<WhatsAppFallbackModalProps> = ({
  isOpen,
  onClose,
  phone,
  message
}) => {
  const { toast } = useToast();
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  const qrCodeUrl = generateQRCodeUrl(phone, message);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard.`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Please copy manually.",
        variant: "destructive"
      });
    }
  };

  const openDirectLink = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-choptime-brown text-lg font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Send Order via WhatsApp
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            WhatsApp didn't open automatically. Choose one of these options:
          </p>

          {/* Direct Link Button */}
          <Button
            onClick={openDirectLink}
            className="w-full choptime-gradient hover:opacity-90 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open WhatsApp Link
          </Button>

          {/* QR Code for Desktop */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-choptime-brown">
              Scan QR Code with your phone:
            </p>
            <div className="flex justify-center">
              <img 
                src={qrCodeUrl} 
                alt="WhatsApp QR Code" 
                className="border rounded-lg"
                width={150}
                height={150}
              />
            </div>
          </div>

          {/* Copy Options */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(whatsappUrl, 'WhatsApp link')}
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy WhatsApp Link
            </Button>
            
            <Button
              variant="outline"
              onClick={() => copyToClipboard(message, 'Order message')}
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Order Message
            </Button>
          </div>

          {/* Manual Instructions */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-choptime-brown mb-1">Manual Option:</p>
            <p className="text-gray-600">
              Send a message to <span className="font-mono bg-white px-1 rounded">+{phone}</span> on WhatsApp
            </p>
          </div>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppFallbackModal;
