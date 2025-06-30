
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

  return encodeURIComponent(message);
};

export const openWhatsApp = (
  restaurantPhone: string,
  message: string
): void => {
  const whatsappUrl = `https://wa.me/${restaurantPhone.replace(/\+/g, '').replace(/\s/g, '')}?text=${message}`;
  
  // Try to open in WhatsApp app first, fallback to web
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Try WhatsApp app first
    const appUrl = `whatsapp://send?phone=${restaurantPhone.replace(/\+/g, '').replace(/\s/g, '')}&text=${message}`;
    window.location.href = appUrl;
    
    // Fallback to web WhatsApp after a short delay
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 1000);
  } else {
    // Desktop - open web WhatsApp
    window.open(whatsappUrl, '_blank');
  }
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

  return encodeURIComponent(message);
};
