
interface WhatsAppOptions {
  phone: string;
  message: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const sendWhatsAppMessage = async ({ phone, message, onSuccess, onError }: WhatsAppOptions) => {
  const encodedMessage = encodeURIComponent(message);
  
  // Multiple WhatsApp URL formats for maximum compatibility
  const whatsappUrls = [
    `https://wa.me/${phone}?text=${encodedMessage}`,
    `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`,
    `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`,
    `whatsapp://send?phone=${phone}&text=${encodedMessage}`
  ];

  // Try each URL with proper error handling
  for (let i = 0; i < whatsappUrls.length; i++) {
    try {
      const url = whatsappUrls[i];
      console.log(`Attempting WhatsApp URL ${i + 1}:`, url);
      
      // For mobile devices, use window.location.href
      if (isMobileDevice()) {
        window.location.href = url;
        // Wait a bit to see if redirect worked
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSuccess?.();
        return true;
      } else {
        // For desktop, try opening in new window
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (newWindow) {
          onSuccess?.();
          return true;
        }
      }
    } catch (error) {
      console.error(`WhatsApp URL ${i + 1} failed:`, error);
      continue;
    }
  }

  // If all URLs fail, show fallback options
  onError?.('All WhatsApp options failed. Please copy the message and send it manually.');
  return false;
};

export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const generateQRCodeUrl = (phone: string, message: string): string => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappUrl)}`;
};
