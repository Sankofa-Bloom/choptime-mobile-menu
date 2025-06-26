
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface TownSelectorProps {
  onTownSelect: (town: string) => void;
  selectedTown?: string;
}

const TOWNS = ['Douala', 'Yaoundé', 'Buea', 'Limbe', 'Bamenda', 'Bafoussam'];

const TownSelector: React.FC<TownSelectorProps> = ({ onTownSelect, selectedTown }) => {
  if (selectedTown) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-choptime-brown">
            <MapPin className="w-5 h-5 text-choptime-orange" />
            Select Your Town
          </CardTitle>
          <p className="text-sm text-choptime-brown/70">
            Choose your location to see available restaurants
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {TOWNS.map((town) => (
            <Button
              key={town}
              onClick={() => onTownSelect(town)}
              variant="outline"
              className="w-full justify-start border-choptime-orange/30 hover:bg-choptime-orange hover:text-white"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {town}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TownSelector;
