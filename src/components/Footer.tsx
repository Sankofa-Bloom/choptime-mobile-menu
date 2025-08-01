
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Phone, MessageCircle, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <footer className="bg-choptime-brown text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h5 className="font-bold text-lg mb-4">ChopTime</h5>
            <p className="text-white/80 text-sm">
              Bringing authentic Cameroonian flavors to your doorstep. 
              Experience the taste of home with every bite.
            </p>
          </div>
          
          <div>
            <h5 className="font-bold text-lg mb-4">Contact Us</h5>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+237 6 70 41 64 49</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>{import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Buea & Limbe, Cameroon</span>
              </div>
              <button
                onClick={() => navigate('/contact')}
                className="text-choptime-orange hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                Send us a message →
              </button>
            </div>
          </div>
          
          <div>
            <h5 className="font-bold text-lg mb-4">Delivery Info</h5>
            <div className="text-sm text-white/80 space-y-1">
              <p>🕐 Delivery: 30-60 minutes</p>
              <p>💳 Payment: MTN/Orange Money, Cash</p>
              <p>🚚 Delivery fees vary by town</p>
              <p>📧 Order tracking via email</p>
            </div>
          </div>
        </div>
        
        <Separator className="my-6 bg-white/20" />
        
        <div className="text-center text-sm text-white/60">
          <p>&copy; 2024 ChopTime. Made with ❤️ for Cameroon.</p>
                          <p className="mt-1">Support: {import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
