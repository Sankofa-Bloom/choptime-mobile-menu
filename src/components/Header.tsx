
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, MapPin, Download } from 'lucide-react';

interface HeaderProps {
  selectedTown: string;
  cart: any[];
  cartItemCount?: number;
  onTownChange: () => void;
  onCartClick: () => void;
  showPWAPrompt: boolean;
  onInstallPWA: () => void;
  onDismissPWA: () => void;
}

const Header: React.FC<HeaderProps> = ({
  selectedTown,
  cart,
  cartItemCount = 0,
  onTownChange,
  onCartClick,
  showPWAPrompt,
  onInstallPWA,
  onDismissPWA
}) => {
  const navigate = useNavigate();
  return (
    <>
      {/* PWA Install Banner */}
      {showPWAPrompt && (
        <div className="bg-choptime-orange text-white p-4 text-center relative animate-slide-up">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Download className="w-5 h-5" />
                    <span className="font-semibold">Install ChopTime App</span>
      </div>
      <p className="text-sm mb-3">Add ChopTime to your home screen for quick access!</p>
          <div className="flex gap-2 justify-center">
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={onInstallPWA}
              className="bg-white text-choptime-orange hover:bg-gray-100"
            >
              📲 Install Now
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onDismissPWA}
              className="text-white hover:bg-white/20"
            >
              Later
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white choptime-shadow sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <img 
                  src="/header-logo.svg" 
                  alt="ChopTime Logo" 
                  className="h-12 w-auto"
                />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm text-choptime-brown/70">
                  {selectedTown ? `Delivering in ${selectedTown}` : 'Authentic Cameroonian Cuisine'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedTown && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onTownChange}
                  className="text-choptime-orange hover:bg-choptime-orange/10"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Change Town
                </Button>
              )}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCartClick}
                  className="relative border-choptime-orange text-choptime-orange hover:bg-choptime-orange hover:text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-choptime-orange text-white text-xs">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
