
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Restaurant, CustomOrderItem } from '@/types/restaurant';
import { Plus, Minus } from 'lucide-react';

interface CustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  onAddToCart: (customOrder: CustomOrderItem) => void;
}

const CustomOrderModal: React.FC<CustomOrderModalProps> = ({
  isOpen,
  onClose,
  restaurants,
  onAddToCart
}) => {
  const [customDishName, setCustomDishName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(3000);

  const handleSubmit = () => {
    if (!customDishName.trim() || !selectedRestaurantId) return;

    const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
    if (!selectedRestaurant) return;

    const customOrderItem: CustomOrderItem = {
      customDishName: customDishName.trim(),
      restaurant: selectedRestaurant,
      quantity,
      estimatedPrice,
      specialInstructions: specialInstructions.trim() || undefined
    };

    onAddToCart(customOrderItem);
    
    // Reset form
    setCustomDishName('');
    setQuantity(1);
    setSpecialInstructions('');
    setSelectedRestaurantId('');
    setEstimatedPrice(3000);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-choptime-brown text-lg font-bold">
            📦 Custom Food Order
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="customDish">What would you like to order? *</Label>
            <Input
              id="customDish"
              placeholder="e.g., Kati Kati with Yams"
              value={customDishName}
              onChange={(e) => setCustomDishName(e.target.value)}
              className="border-choptime-orange/30"
            />
          </div>

          <div>
            <Label htmlFor="restaurant">Select Restaurant *</Label>
            <Select onValueChange={setSelectedRestaurantId}>
              <SelectTrigger className="border-choptime-orange/30">
                <SelectValue placeholder="Choose a restaurant" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity</Label>
            <div className="flex items-center gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="border-choptime-orange/30"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                className="border-choptime-orange/30"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="price">Estimated Price (FCFA)</Label>
            <Input
              id="price"
              type="number"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(Number(e.target.value))}
              className="border-choptime-orange/30"
              min="500"
              step="100"
            />
          </div>

          <div>
            <Label htmlFor="instructions">Special Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="Any special requests or modifications..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="border-choptime-orange/30"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-choptime-orange/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!customDishName.trim() || !selectedRestaurantId}
              className="flex-1 choptime-gradient hover:opacity-90 text-white"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomOrderModal;
