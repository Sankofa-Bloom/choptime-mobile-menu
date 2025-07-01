
export const generateWhatsAppMessage = (
  userName: string,
  userPhone: string,
  userLocation: string,
  dishName: string,
  restaurantName: string,
  quantity: number,
  price: number,
  totalAmount: number,
  orderReference?: string
): string => {
  const message = `🍽️ *ChopTime Order*

📋 *Order Details:*
• Dish: ${dishName}
• Restaurant: ${restaurantName}
• Quantity: ${quantity}
• Price: ${price.toLocaleString()} FCFA each
• Total: ${totalAmount.toLocaleString()} FCFA

👤 *Customer Info:*
• Name: ${userName}
• Phone: ${userPhone}
• Location: ${userLocation}

${orderReference ? `📄 *Order Reference:* ${orderReference}` : ''}

Please confirm this order and let me know the delivery time. Thank you! 🙏`;

  return message;
};

export const generateCustomOrderWhatsAppMessage = (
  userName: string,
  userPhone: string,
  userLocation: string,
  customDishName: string,
  restaurantName: string,
  quantity: number,
  specialInstructions?: string,
  orderReference?: string
): string => {
  const message = `🍽️ *ChopTime Custom Order*

📋 *Order Details:*
• Custom Dish: ${customDishName}
• Restaurant: ${restaurantName}
• Quantity: ${quantity}
${specialInstructions ? `• Special Instructions: ${specialInstructions}` : ''}

👤 *Customer Info:*
• Name: ${userName}
• Phone: ${userPhone}
• Location: ${userLocation}

${orderReference ? `📄 *Order Reference:* ${orderReference}` : ''}

Please provide the price and confirm availability for this custom order. Thank you! 🙏`;

  return message;
};

export const generateQRCodeUrl = (phone: string, message: string): string => {
  const whatsappUrl = `https://wa.me/${phone.replace(/\+/g, '').replace(/\s/g, '')}?text=${encodeURIComponent(message)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(whatsappUrl)}`;
};

export const openWhatsApp = (
  restaurantPhone: string,
  message: string,
  onFallback?: (phone: string, message: string) => void
): void => {
  const cleanPhone = restaurantPhone.replace(/\+/g, '').replace(/\s/g, '');
  
  // Try to open WhatsApp app directly first
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Mobile: Try WhatsApp app protocol first
    const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    // Create a hidden iframe to try opening WhatsApp app
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appUrl;
    document.body.appendChild(iframe);
    
    // Clean up iframe after attempt
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 100);
    
    // If WhatsApp app doesn't open (fallback after 2 seconds)
    setTimeout(() => {
      if (onFallback) {
        onFallback(cleanPhone, message);
      } else {
        // Fallback to web WhatsApp
        const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }
    }, 2000);
  } else {
    // Desktop: Try to open WhatsApp Web directly
    const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    const newWindow = window.open(webUrl, '_blank', 'noopener,noreferrer');
    
    // If popup was blocked or failed to open, show fallback
    setTimeout(() => {
      if (onFallback && (!newWindow || newWindow.closed)) {
        onFallback(cleanPhone, message);
      }
    }, 1000);
  }
};
