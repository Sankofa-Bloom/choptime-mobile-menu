
import React from 'react';
import { Clock, Star, MapPin } from 'lucide-react';

interface HeroSectionProps {
  selectedTown: string;
  deliveryFee: number;
  isDeliveryFeeEnabled: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ selectedTown, deliveryFee, isDeliveryFeeEnabled }) => {
  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  return (
    <section className="african-pattern py-12">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-choptym-brown mb-4 animate-fade-in">
          Taste of Cameroon 🇨🇲
        </h2>
                  <p className="text-lg text-choptym-brown/80 mb-6 animate-fade-in">
          {selectedTown 
            ? `Fresh dishes from restaurants in ${selectedTown}` 
            : 'Choose your favorite dish, then select your preferred restaurant'
          }
        </p>
                  <div className="flex items-center justify-center gap-6 text-sm text-choptym-brown/70">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>25-60 min delivery</span>
          </div>
          <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-choptym-orange text-choptym-orange" />
            <span>4.8 rating</span>
          </div>
          {selectedTown && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{selectedTown} • Delivery: {isDeliveryFeeEnabled ? formatPrice(deliveryFee) : 'FREE'}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
