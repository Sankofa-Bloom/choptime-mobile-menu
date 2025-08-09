
import React from 'react';
import { Phone, MapPin, Clock } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  contact_number: string;
  town: string;
  delivery_time_min?: number;
  delivery_time_max?: number;
}

interface RestaurantInfoProps {
  restaurant: Restaurant;
}

const RestaurantInfo: React.FC<RestaurantInfoProps> = ({ restaurant }) => {
  return (
    <div className="bg-choptym-beige/30 p-4 rounded-lg">
      <h3 className="font-semibold text-choptym-brown mb-2">{restaurant.name}</h3>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Phone className="w-4 h-4" />
          {restaurant.contact_number}
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {restaurant.town}
        </div>
        {restaurant.delivery_time_min && restaurant.delivery_time_max && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {restaurant.delivery_time_min}-{restaurant.delivery_time_max} mins
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantInfo;
